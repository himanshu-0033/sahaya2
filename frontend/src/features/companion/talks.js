// How a past conversation with DP is labelled, shared by the Talks page and
// the history list inside the chat panel so the two describe one conversation
// the same way.

export function when(iso) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function firstLine(session) {
  const said = session.turns.find((t) => t.role === 'user');
  if (!said) return 'You opened this one and did not say anything.';
  return said.content;
}
