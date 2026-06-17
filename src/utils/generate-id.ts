export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function generateTimestampId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}
