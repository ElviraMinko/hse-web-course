import { el } from '../utils/dom.js';
import { getInitials } from '../utils/text.js';

export function createAvatar(member, { size, className, withTitle = false, emptyLabel = 'Не назначен' } = {}) {
  const classes = ['avatar', size && `avatar-${size}`, member ? `avatar-${member.tone}` : 'avatar-unassigned', className];
  return el(
    'span',
    {
      className: classes.filter(Boolean).join(' '),
      title: withTitle ? (member?.name ?? emptyLabel) : null,
    },
    member ? getInitials(member.name) : '—',
  );
}
