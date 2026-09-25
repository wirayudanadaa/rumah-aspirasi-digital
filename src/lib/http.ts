/**
 * Utility untuk parsing response JSON secara aman dan defensif.
 * Mencegah runtime exception (SyntaxError) saat menerima response body kosong,
 * HTML error page dari reverse proxy / CDN, plain text, atau JSON yang malformed.
 */
export async function parseSafeJsonResponse<T = Record<string, unknown>>(
  response: Response
): Promise<{
  data: T | null;
  isJson: boolean;
  isEmpty: boolean;
}> {
  let text = "";
  try {
    text = await response.text();
  } catch {
    return { data: null, isJson: false, isEmpty: true };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { data: null, isJson: false, isEmpty: true };
  }

  try {
    const data = JSON.parse(trimmed) as T;
    return { data, isJson: true, isEmpty: false };
  } catch {
    return { data: null, isJson: false, isEmpty: false };
  }
}
