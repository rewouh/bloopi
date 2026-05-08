import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';
import { getState, setState } from '../store/store.js';
import { checkAnswer } from '../logic/fuzzy.js';
import { AnswerInput } from '../components/AnswerInput.js';
import { MnemonicHint } from '../components/MnemonicHint.js';
import { NotesBlock } from '../components/NotesBlock.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { RankUpScreen } from '../components/RankUpScreen.js';

export function LessonView({ session }) {
  const items = session.items;

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
      const today = new Date().toISOString().split('T')[0];
      setState({
        progress: {
          ...s.progress,
          items: {
            ...s.progress.items,
            [quizItem.id]: { ...s.progress.items[quizItem.id], level: 1, streak: 0, nextReview: today, failedToday: false },
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
    return html`
      <div class="session-overlay">
        <div class="summary">
          <span class="summary-icon">🎓</span>
          <h2>Lesson Complete!</h2>
          <p><strong>${passed}</strong> items learned</p>
          ${failed > 0 && html`<p class="muted-note">${failed} answer(s) needed more than one try.</p>`}
          <button type="button" onClick=${exit}>Done</button>
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
          <h2 class="question-title">${studyItem.title}</h2>
          <div class="study-answer">${studyItem.answers[0]}</div>
          <${MnemonicHint} text=${studyItem.mnemonic} />
          <${NotesBlock} text=${studyItem.notes} />
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
        <h2 class="question-title">${quizItem.title}</h2>

        ${phase === 'answer' && html`
          <${AnswerInput} onSubmit=${handleAnswer} />
        `}

        ${phase === 'feedback' && showRankUp && html`
          <${RankUpScreen} level=${1} onContinue=${advance} />
          <${NotesBlock} text=${quizItem.notes} />
        `}

        ${phase === 'feedback' && !showRankUp && html`
          <div class="feedback-banner incorrect">✗ Not quite</div>
          <p class="correct-answer">Answer: <strong>${quizItem.answers[0]}</strong></p>
          <${MnemonicHint} text=${quizItem.mnemonic} />
          <${NotesBlock} text=${quizItem.notes} />
          <button type="button" onClick=${advance}>Try again</button>
          <p class="hint-enter">or press Enter</p>
        `}
      </div>
    </div>
  `;
}
