export const AVATAR_EMOJIS = ['👨', '👩', '🧑', '🧔', '👱‍♂️', '👱‍♀️', '🤠', '😎', '🤓', '🥳', '🐱', '🦊', '🐼', '🍕', '☕', '🥑'];

export const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ef4444', // red
  '#6366f1', // indigo
];

export function getRandomAvatar(index: number = 0): { avatar: string; color: string } {
  const avatar = AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return { avatar, color };
}
