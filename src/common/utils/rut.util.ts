// Utilidades RUT Chile
// - Acepta formatos con puntos/guión y minúsculas (k)
// - Normaliza a "XXXXXXXX-DV" (sin puntos, DV en mayúscula)
// - Valida por módulo 11

export function cleanRut(input: string): string {
  return (input ?? '').toString().trim().replace(/[.\s]/g, '').toUpperCase();
}

export function splitRut(input: string): { body: string; dv: string } | null {
  const s = cleanRut(input);
  const m = s.match(/^(\d+)-?([0-9K])$/);
  if (!m) return null;
  return { body: m[1], dv: m[2] };
}

export function calcDv(body: string | number): string {
  const digits = body.toString().replace(/\D/g, '');
  let sum = 0;
  let mul = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += Number(digits[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  if (res === 11) return '0';
  if (res === 10) return 'K';
  return String(res);
}

export function validateRut(input: string): boolean {
  const parts = splitRut(input);
  if (!parts) return false;
  if (parts.body.length < 2) return false;
  const dv = calcDv(parts.body);
  return dv === parts.dv.toUpperCase();
}

export function normalizeRut(input: string): string | null {
  const parts = splitRut(input);
  if (!parts) return null;
  return `${parts.body}-${parts.dv.toUpperCase()}`;
}

// Opcional: formato con puntos para UI (no lo uses para persistir)
export function formatRut(input: string): string | null {
  const n = normalizeRut(input);
  if (!n) return null;
  const [body, dv] = n.split('-');
  // Inserta puntos cada 3 desde el final
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
}
