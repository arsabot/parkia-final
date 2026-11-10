type Level = 0 | 1 | 2 | 3;

/** Requisitos mínimos que se muestran como lista y se exigen al registrarse. */
export const PASSWORD_RULES = [
  { id: 'length', label: 'Entre 8 y 64 caracteres', test: (p: string) => p.length >= 8 && p.length <= 64 },
  { id: 'upper', label: 'Al menos una mayúscula', test: (p: string) => /\p{Lu}/u.test(p) },
  { id: 'lower', label: 'Al menos una minúscula', test: (p: string) => /\p{Ll}/u.test(p) },
  { id: 'number', label: 'Al menos un número', test: (p: string) => /\d/.test(p) },
  { id: 'symbol', label: 'Al menos un símbolo (# % & ! ...)', test: (p: string) => /[^\p{L}\p{N}\s]/u.test(p) },
] as const;

export const isPasswordValid = (password: string): boolean =>
  PASSWORD_RULES.every((rule) => rule.test(password));

const COMMON = ['password', 'contraseña', '123456', 'qwerty', 'parkia', 'abc123', '111111', 'admin'];

const hasLongRun = (password: string) => /(.)\1{3,}/.test(password);
const distinctChars = (password: string) => new Set(Array.from(password)).size;

/**
 * Puntaje simple y predecible (el backend igual valida con las reglas de Django).
 * 1 = Débil · 2 = Media · 3 = Fuerte
 */
export function scorePassword(password: string, email = ''): Level {
  if (!password) return 0;
  const lower = password.toLowerCase();
  const emailUser = email.split('@')[0]?.toLowerCase();

  if (
    !isPasswordValid(password) ||
    COMMON.some((w) => lower.includes(w)) ||
    (emailUser && emailUser.length > 2 && lower.includes(emailUser))
  ) {
    return 1;
  }

  // Fuerte = largo + variedad real (no solo la misma letra repetida).
  if (password.length >= 12 && distinctChars(password) >= 8 && !hasLongRun(password)) return 3;
  return 2;
}

/** Consejo corto: por qué no es Fuerte todavía (vacío si ya lo es). */
export function strengthAdvice(password: string, level: Level): string {
  if (level === 1) {
    return isPasswordValid(password) ? 'evitá palabras comunes o tu email' : 'completá la lista de abajo';
  }
  if (level === 2) {
    if (password.length < 12) return 'sumá 12+ caracteres';
    if (hasLongRun(password)) return 'evitá repetir el mismo carácter';
    return 'usá más caracteres distintos';
  }
  return '';
}