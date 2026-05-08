import Fuse from 'https://esm.sh/fuse.js@7';

export function checkAnswer(userInput, acceptedAnswers) {
  const normalized = userInput.trim().toLowerCase();

  for (const answer of acceptedAnswers) {
    if (normalized === answer.toLowerCase()) return { correct: true };
  }

  const fuse = new Fuse(acceptedAnswers, { threshold: 0.35, includeScore: true });
  const results = fuse.search(normalized);
  return { correct: results.length > 0 };
}
