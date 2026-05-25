import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';
import { getState, setState } from '../store/store.js';
import { getSessionItems } from '../logic/scheduler.js';
import { checkAnswer } from '../logic/fuzzy.js';
import { initItemState } from '../logic/srs.js';
import { AnswerInput } from '../components/AnswerInput.js';
import { MnemonicHint } from '../components/MnemonicHint.js';
import { NotesBlock } from '../components/NotesBlock.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { RankUpScreen } from '../components/RankUpScreen.js';

const LESSON_BATCH = 5;

export function LessonView({ session }) {
  const items = session.items;

  // steal focus from whatever launched the session (e.g. the "Start lessons" button)
  useEffect(() => { document.activeElement?.blur(); }, []);

  // study phase: browse all items first
  const [studyIndex, setStudyIndex] = useState(0);

  // quiz phase
  const [phase,      setPhase]      = useState('study'); // study | answer | feedback | summary
  const [quizIndex,  setQuizIndex]  = useState(0);
  const [feedback,   setFeedback]   = useState(null);
  const [showRankUp, setShowRankUp] = useState(false);
  const [passed,     setPassed]     = useState(0);
  const [failed,     setFailed]     = useState(0);

  const studyItem = items[studyIndex];
  const quizItem  = items[quizIndex];
  const item      = phase === 'study' ? studyItem : quizItem;
  const deckName  = getState().loadedDecks.find(d => (d.items || []).some(it => it.id === item?.id))?.name;

  function effectiveNote(it) {
    const notes = getState().progress.userNotes || {};
    return it.id in notes ? notes[it.id] : (it.notes || '');
  }

  function saveNote(it, text) {
    const s     = getState();
    const notes = { ...(s.progress.userNotes || {}) };
    if (text) notes[it.id] = text; else delete notes[it.id];
    setState({ progress: { ...s.progress, userNotes: notes } });
  }

  // ── Study phase ──────────────────────────────────────────────
  function nextStudy() {
    if (studyIndex + 1 >= items.length) {
      setPhase('answer');
    } else {
      setStudyIndex(i => i + 1);
    }
  }

  const nextStudyRef = useRef(nextStudy);
  useEffect(() => { nextStudyRef.current = nextStudy; });

  useEffect(() => {
    if (phase !== 'study') return;
    const onKey = (e) => { if (e.key === 'Enter') nextStudyRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // ── Quiz phase ───────────────────────────────────────────────
  function advance() {
    setShowRankUp(false);
    if (feedback === 'correct') {
      if (quizIndex + 1 >= items.length) {
        setPhase('summary');
      } else {
        setQuizIndex(i => i + 1);
        setPhase('answer');
        setFeedback(null);
      }
    } else {
      setPhase('answer');
      setFeedback(null);
    }
  }

  const advanceRef = useRef(advance);
  useEffect(() => { advanceRef.current = advance; });

  useEffect(() => {
    if (phase !== 'feedback' || showRankUp) return;
    const onKey = (e) => { if (e.key === 'Enter') advanceRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, showRankUp]);

  function handleAnswer(value) {
    const { correct } = checkAnswer(value, quizItem.answers);
    setFeedback(correct ? 'correct' : 'incorrect');
    setPhase('feedback');
    if (correct) {
      const s = getState();
      setState({
        progress: {
          ...s.progress,
          items: {
            ...s.progress.items,
            [quizItem.id]: initItemState(),
          },
        },
      });
      setPassed(p => p + 1);
      setShowRankUp(true);
    } else {
      setFailed(f => f + 1);
    }
  }

  function exit() { setState({ activeSession: null }); }

  // ── Summary ──────────────────────────────────────────────────
  if (phase === 'summary') {
    const s = getState();
    const allItems = (s.loadedDecks || []).flatMap(d => d.items || []);
    const { lessons: remaining } = getSessionItems(s.progress, allItems);

    function startNextBatch() {
      const batch = remaining.slice(0, LESSON_BATCH);
      setState({ activeSession: { type: 'lesson', items: batch, id: Date.now() } });
    }

    return html`
      <div class="session-overlay">
        <div class="summary">
          <span class="summary-icon">🎓</span>
          <h2>Lesson Complete!</h2>
          <p><strong>${passed}</strong> items learned</p>
          ${failed > 0 && html`<p class="muted-note">${failed} answer(s) needed more than one try.</p>`}
          <div class="summary-actions">
            ${remaining.length > 0 && html`
              <button type="button" onClick=${startNextBatch}>Next batch</button>
            `}
            <button type="button" class="summary-done-btn" onClick=${exit}>Done</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Study phase render ────────────────────────────────────────
  if (phase === 'study') {
    const isLast = studyIndex === items.length - 1;
    return html`
      <div class="session-overlay">
        <header class="session-header">
          <button type="button" class="outline secondary exit-btn" onClick=${exit}>✕ Exit</button>
          <${ProgressBar} value=${(studyIndex + 1) / items.length} label="${studyIndex + 1} / ${items.length}" />
        </header>
        <div class="session-content">
          <span class="session-phase-label">Study</span>
          ${deckName && html`<span class="deck-tag">${deckName}</span>`}
          ${studyItem.image && html`<img class="question-image" src=${studyItem.image} alt="" />`}
          <h2 class="question-title">${studyItem.title}</h2>
          <div class="study-answer">${studyItem.answers[0]}</div>
          <${MnemonicHint} text=${studyItem.mnemonic} />
          <${NotesBlock} key=${studyItem.id} text=${effectiveNote(studyItem)} onSave=${t => saveNote(studyItem, t)} />
          <button type="button" onClick=${nextStudy}>
            ${isLast ? 'Start quiz' : 'Next'}
          </button>
          <p class="hint-enter">or press Enter</p>
        </div>
      </div>
    `;
  }

  // ── Quiz phase render ─────────────────────────────────────────
  return html`
    <div class="session-overlay">
      <header class="session-header">
        <button type="button" class="outline secondary exit-btn" onClick=${exit}>✕ Exit</button>
        <${ProgressBar} value=${quizIndex / items.length} label="${quizIndex + 1} / ${items.length}" />
      </header>
      <div class="session-content">
        <span class="session-phase-label">Quiz</span>
        ${deckName && html`<span class="deck-tag">${deckName}</span>`}
        ${quizItem.image && html`<img class="question-image" src=${quizItem.image} alt="" />`}
        <h2 class="question-title">${quizItem.title}</h2>

        ${phase === 'answer' && html`
          <${AnswerInput} onSubmit=${handleAnswer} />
        `}

        ${phase === 'feedback' && showRankUp && html`
          <${RankUpScreen} stage=${1} answer=${quizItem.answers[0]} onContinue=${advance} />
          <${NotesBlock} key=${quizItem.id} text=${effectiveNote(quizItem)} onSave=${t => saveNote(quizItem, t)} />
        `}

        ${phase === 'feedback' && !showRankUp && html`
          <div class="feedback-banner incorrect">✗ Not quite</div>
          <p class="correct-answer">Answer: <strong>${quizItem.answers[0]}</strong></p>
          <${MnemonicHint} text=${quizItem.mnemonic} />
          <${NotesBlock} key=${quizItem.id} text=${effectiveNote(quizItem)} onSave=${t => saveNote(quizItem, t)} />
          <button type="button" onClick=${advance}>Try again</button>
          <p class="hint-enter">or press Enter</p>
        `}
      </div>
    </div>
  `;
}
