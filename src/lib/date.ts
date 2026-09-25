import { format, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface FormatSafeDateOptions {
  fallback?: string;
  useLocale?: boolean;
}

/**
 * Format string tanggal, timestamp number, atau objek Date secara aman.
 * Menjamin tidak pernah melempar runtime exception (seperti RangeError: Invalid time value)
 * jika input bernilai null, undefined, string kosong, atau invalid date.
 *
 * @param dateInput - Nilai tanggal (ISO string, Date object, timestamp, null, undefined)
 * @param formatPattern - Pola format date-fns (contoh: "dd MMMM yyyy, HH:mm")
 * @param options - Konfigurasi opsional (fallback string, penggunaan lokal Indonesia)
 * @returns String tanggal terformat atau nilai fallback jika input tidak valid
 */
export function formatSafeDate(
  dateInput: string | number | Date | null | undefined,
  formatPattern: string,
  options?: FormatSafeDateOptions
): string {
  const fallback = options?.fallback ?? "-";

  if (dateInput === null || dateInput === undefined) {
    return fallback;
  }

  if (typeof dateInput === "string" && dateInput.trim() === "") {
    return fallback;
  }

  if (typeof dateInput === "number" && (!Number.isFinite(dateInput) || isNaN(dateInput))) {
    return fallback;
  }

  try {
    const parsedDate =
      typeof dateInput === "object" && dateInput instanceof Date
        ? dateInput
        : new Date(dateInput);

    if (!isValid(parsedDate) || isNaN(parsedDate.getTime())) {
      return fallback;
    }

    return format(parsedDate, formatPattern, {
      locale: options?.useLocale !== false ? idLocale : undefined,
    });
  } catch {
    return fallback;
  }
}
