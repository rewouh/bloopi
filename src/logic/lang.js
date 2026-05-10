export function langFlagUrl(code) {
  if (!code || code.length !== 2) return null;
  return `https://flagcdn.com/16x12/${code.toLowerCase()}.png`;
}
