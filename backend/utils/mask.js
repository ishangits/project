// utils/mask.js
export const maskKey = (key, visibleChars = 4) => {
  if (!key) return '';
  const prefix = key.startsWith('sk-') ? 'sk-' : '';
  const suffix = key.slice(-visibleChars);
  const maskedLength = key.length - suffix.length - prefix.length;
  const masked = '*'.repeat(maskedLength > 0 ? maskedLength : 0);
  return `${prefix}${masked}${suffix}`;
};
