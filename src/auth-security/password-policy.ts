export interface PasswordPolicyResult {
  ok: boolean;
  reasons: string[];
}

export interface PasswordPolicyOptions {
  minLength?: number;          // default 10
  minUppercase?: number;       // default 1
  minLowercase?: number;       // default 1
  minDigits?: number;          // default 1
  minSymbols?: number;         // default 1
  forbidWhitespace?: boolean;  // default true
}

export function checkPasswordPolicy(
  password: string,
  opts: PasswordPolicyOptions = {},
): PasswordPolicyResult {
  const {
    minLength = 10,
    minUppercase = 1,
    minLowercase = 1,
    minDigits = 1,
    minSymbols = 1,
    forbidWhitespace = true,
  } = opts;

  const reasons: string[] = [];
  if (typeof password !== 'string' || password.length < minLength) {
    reasons.push(`Debe tener al menos ${minLength} caracteres.`);
  }

  const upper = (password.match(/[A-Z]/g) || []).length;
  const lower = (password.match(/[a-z]/g) || []).length;
  const digits = (password.match(/[0-9]/g) || []).length;
  const symbols = (password.match(/[^A-Za-z0-9]/g) || []).length;

  if (upper < minUppercase) reasons.push(`Debe incluir al menos ${minUppercase} mayúscula(s).`);
  if (lower < minLowercase) reasons.push(`Debe incluir al menos ${minLowercase} minúscula(s).`);
  if (digits < minDigits) reasons.push(`Debe incluir al menos ${minDigits} dígito(s).`);
  if (symbols < minSymbols) reasons.push(`Debe incluir al menos ${minSymbols} símbolo(s).`);
  if (forbidWhitespace && /\s/.test(password)) reasons.push('No debe contener espacios en blanco.');

  return { ok: reasons.length === 0, reasons };
}
