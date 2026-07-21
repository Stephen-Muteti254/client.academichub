export const formatChatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

export const groupMessagesByDate = <T extends { sent_at?: string; created_at?: string }>(
  messages: T[]
) => {
  const groups: Record<string, T[]> = {};

  messages.forEach(msg => {
    const rawDate = msg.sent_at || msg.created_at;
    if (!rawDate) return;

    const key = new Date(rawDate).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  });

  return groups;
};
