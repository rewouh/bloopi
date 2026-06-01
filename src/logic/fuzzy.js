function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function checkAnswer(userInput, acceptedAnswers) {
  const normalized = userInput.trim().toLowerCase();

  for (const answer of acceptedAnswers) {
    const target = answer.toLowerCase();
    if (normalized === target) return { correct: true };
    const maxDist = target.length > 8 ? 3 : 2;
    if (levenshtein(normalized, target) <= maxDist) return { correct: true };
  }

  return { correct: false };
}
