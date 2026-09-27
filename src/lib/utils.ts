export function generateTicketNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${randomStr}`;
}

export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(' ');
}
