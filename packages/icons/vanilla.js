import paths, { EMOJI_TO_NAME } from './index.js';

export { EMOJI_TO_NAME };

export function getEmojiSvg(emoji, className = "w-6 h-6 inline-block") {
  const cleanEmoji = typeof emoji === 'string' ? emoji.replace(/\uFE0F/g, '') : emoji;
  const iconName = (emoji ? EMOJI_TO_NAME[emoji] : null) || (cleanEmoji ? EMOJI_TO_NAME[cleanEmoji] : null);
  const content = iconName ? paths[iconName] : null;
  if (!content) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="currentColor" fill-opacity="0.15" /></svg>`;
  }
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${content}</svg>`;
}
