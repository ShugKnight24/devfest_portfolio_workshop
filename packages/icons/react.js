import React from 'react';
import paths, { EMOJI_TO_NAME } from './index.js';

export { EMOJI_TO_NAME };

export const EmojiIcon = ({ emoji, name, className = "w-5 h-5", style }) => {
  const cleanEmoji = typeof emoji === 'string' ? emoji.replace(/\uFE0F/g, '') : emoji;
  const iconName = name || (emoji ? EMOJI_TO_NAME[emoji] : null) || (cleanEmoji ? EMOJI_TO_NAME[cleanEmoji] : null);
  const svgContent = iconName ? paths[iconName] : null;

  if (!svgContent) {
    // Fallback to neutral vector circle/dot icon — never render raw text emojis
    return React.createElement('svg', {
      className,
      style,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.5',
      xmlns: 'http://www.w3.org/2000/svg',
      role: 'img',
      'aria-hidden': 'true',
    }, React.createElement('circle', { cx: '12', cy: '12', r: '6', fill: 'currentColor', fillOpacity: '0.15' }));
  }

  return React.createElement('svg', {
    className,
    style,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    role: 'img',
    'aria-hidden': 'true',
    dangerouslySetInnerHTML: { __html: svgContent }
  });
};

export const EmojiLabel = ({
  emoji,
  name,
  children,
  iconClassName = "w-5 h-5 inline-block align-text-bottom",
  className = "",
}) => (
  React.createElement('span', { className: `inline-flex items-center gap-1.5 ${className}` },
    React.createElement(EmojiIcon, { emoji, name, className: iconClassName }),
    children
  )
);

export default EmojiIcon;
