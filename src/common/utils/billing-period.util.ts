// src/common/utils/billing-period.util.ts

const CHILE_TZ = 'America/Santiago';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD (fecha local Chile) desde un Date (timestamptz en DB) */
export function toChileLocalISODate(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHILE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = Number(parts.find(p => p.type === 'year')?.value ?? '1970');
  const m = Number(parts.find(p => p.type === 'month')?.value ?? '01');
  const day = Number(parts.find(p => p.type === 'day')?.value ?? '01');
  return `${y}-${pad2(m)}-${pad2(day)}`;
}

/** Suma días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD */
export function addDaysISO(isoDate: string, days: number): string {
  const [Y, M, D] = isoDate.split('-').map(Number);
  const base = new Date(Date.UTC(Y, M - 1, D));
  base.setUTCDate(base.getUTCDate() + days);
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}`;
}

/**
 * Suma meses a una fecha YYYY-MM-DD con regla:
 * - Si el día no existe en el mes destino, usa el último día del mes destino.
 * - Devuelve YYYY-MM-DD.
 */
export function addMonthsClamp(isoDate: string, months: number): string {
  const [Y, M, D] = isoDate.split('-').map(Number);
  const targetMonthIndex = (Y * 12 + (M - 1) + months);
  const TY = Math.floor(targetMonthIndex / 12);
  const TM = targetMonthIndex % 12; // 0..11

  // Último día del mes destino
  const lastDay = new Date(Date.UTC(TY, TM + 1, 0)).getUTCDate();
  const day = Math.min(D, lastDay);
  return `${TY}-${pad2(TM + 1)}-${pad2(day)}`;
}

/**
 * Calcula endDate INCLUSIVA:
 * - Por meses: end = start + N meses (misma regla clamp).
 * - Por días:  end = start + (N - 1) días.
 */
export function computeEndDateInclusive(startDateISO: string, durationMonths: number | null, durationDays: number | null): string {
  if (durationMonths && durationDays) {
    throw new Error('El plan no puede tener meses y días a la vez.');
  }
  if (!durationMonths && !durationDays) {
    throw new Error('El plan debe tener duración en meses o en días.');
  }
  if (durationMonths) {
    return addMonthsClamp(startDateISO, durationMonths);
  }
  // days
  return addDaysISO(startDateISO, (durationDays as number) - 1);
}
