import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect, useRef } from 'https://esm.sh/preact/hooks';
import { getState, setState } from '../store/store.js';
import { checkAnswer } from '../logic/fuzzy.js';
import { processAnswer } from '../logic/srs.js';
import { AnswerInput } from '../components/AnswerInput.js';
import { MnemonicHint } from '../components/MnemonicHint.js';
import { NotesBlock } from '../components/NotesBlock.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { RankUpScreen } from '../components/RankUpScreen.js';

export function ReviewView({ session }) {
  useEffect(() => { document.activeElement?.blur(); }, []);

  const total = session.items.length;
  const [queue, setQueue]       = useState([...session.items]);
  const [current, setCurrent]   = useState(0);
  const [phase, setPhase]       = useState('question'); // question | feedback | summary
  const [feedback, setFeedback] = useState(null);
  const [rankUpStage, setRankUpStage] = useState(null);
  const [stats, setStats]       = useState({ correct: 0, failed: 0, leveledUp: 0 });

  // Tracks how many times each item was answered incorrectly this session
  const incorrectCounts = useRef({});

  const item     = queue[current];
  const deckName = getState().loadedDecks.find(d => (d.items || []).some(it => it.id === item?.id))?.name;

  function next() {
    setRankUpStage(null);
    const nextIdx = current + 1;
    if (nextIdx >= queue.length) {
      setPhase('summary');
    } else {
      setCurrent(nextIdx);
      setPhase('question');
      setFeedback(null);
    }
  }

  const nextRef = useRef(next);
  useEffect(() => { nextRef.current = next; });

  useEffect(() => {
    if (phase !== 'feedback' || rankUpStage) return;
    const onKey = (e) => { if (e.key === 'Enter') nextRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, rankUpStage]);

  function handleAnswer(value) {
    const { correct } = checkAnswer(value, item.answers);
    setFeedback(correct ? 'correct' : 'incorrect');
    setPhase('feedback');

    if (correct) {
      const s = getState();
      const prevState  = s.progress.items[item.id] || { stage: 1, nextReview: null };
      const prevStage  = prevState.stage;
      const newState   = processAnswer(prevState, incorrectCounts.current[item.id] || 0);
      const leveledUp  = newState.stage > prevStage;

      setState({ progress: { ...s.progress, items: { ...s.progress.items, [item.id]: newState } } });
      if (leveledUp) setRankUpStage(newState.stage);
      setStats(st => ({
        correct:   st.correct + 1,
        failed:    st.failed,
        leveledUp: st.leveledUp + (leveledUp ? 1 : 0),
      }));
    } else {
      incorrectCounts.current[item.id] = (incorrectCounts.current[item.id] || 0) + 1;
      setQueue(q => [...q, item]);
      setStats(st => ({ ...st, failed: st.failed + 1 }));
    }
  }

  function complete() {
    const s = getState();
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const last      = s.progress.lastReviewDate;
    const streak    = s.progress.reviewStreak || 0;
    const newStreak = last === today ? streak : last === yesterday ? streak + 1 : 1;
    setState({ activeSession: null, progress: { ...s.progress, lastReviewDate: today, reviewStreak: newStreak } });
  }

  function exit() { setState({ activeSession: null }); }

  if (phase === 'summary') {
    return html`
      <div class="session-overlay">
        <div class="summary">
          <span class="summary-icon">🏆</span>
          <h2>Review Complete!</h2>
          <p><strong>${stats.correct}</strong> correct</p>
          <p><strong>${stats.failed}</strong> failed</p>
          ${stats.leveledUp > 0 && html`<p class="leveled-up">⬆ ${stats.leveledUp} item(s) leveled up!</p>`}
          <button type="button" onClick=${complete}>Done</button>
        </div>
      </div>
    `;
  }

  if (!item) return null;

  const displayIndex = Math.min(current, total - 1);
  const progressVal  = Math.min(current / total, 1);

  return html`
    <div class="session-overlay">
      <header class="session-header">
        <button type="button" class="outline secondary exit-btn" onClick=${exit}>✕ Exit</button>
        <${ProgressBar} value=${progressVal} label="${displayIndex + 1} / ${total}" />
      </header>
      <div class="session-content">
        ${deckName && html`<span class="deck-tag">${deckName}</span>`}
        <h2 class="question-title">${item.title}</h2>

        ${phase === 'question' && html`
          <${AnswerInput} onSubmit=${handleAnswer} />
        `}

        ${phase === 'feedback' && rankUpStage && html`
          <${RankUpScreen} stage=${rankUpStage} answer=${item.answers[0]} onContinue=${next} />
          <${NotesBlock} text=${item.notes} />
        `}

        ${phase === 'feedback' && !rankUpStage && html`
          <div class=${feedback === 'correct' ? 'feedback-banner correct' : 'feedback-banner incorrect'}>
            ${feedback === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
          </div>
          ${feedback === 'correct' && html`
            <p class="answer-reveal"><strong>Answer</strong> : ${item.answers[0]}</p>
          `}
          ${feedback === 'incorrect' && html`
            <p class="correct-answer">Answer: <strong>${item.answers[0]}</strong></p>
            <${MnemonicHint} text=${item.mnemonic} />
          `}
          <${NotesBlock} text=${item.notes} />
          <button type="button" onClick=${next}>Next →</button>
          <p class="hint-enter">or press Enter</p>
        `}
      </div>
    </div>
  `;
}
