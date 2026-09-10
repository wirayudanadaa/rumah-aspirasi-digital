import { type NextRequest } from "next/server";

export function isValidOriginString(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    
    if (url.origin === "https://rumah-aspirasi-digital-smoky.vercel.app") {
      return true;
    }

    if (process.env.NODE_ENV === "development") {
      if (url.origin === "http://localhost:3000" || url.origin === "http://127.0.0.1:3000") {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    return isValidOriginString(origin);
  }

  if (referer) {
    return isValidOriginString(referer);
  }

  return false;
}
