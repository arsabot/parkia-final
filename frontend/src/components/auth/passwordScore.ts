type Level = 0 | 1 | 2 | 3;

const COMMON = ['password', 'contraseña', '123456', 'qwerty', 'parkia', 'abc123', '111111', 'admin'];

/**
 * Puntaje simple y predecible (el backend igual valida con las reglas de Django).
 * 1 = Débil · 2 = Media · 3 = Alta
 */
export function scorePassword(password: string, email = ''): Level {
  if (!password) return 0;
  const lower = password.toLowerCase();
  const emailUser = email.split('@')[0]?.toLowerCase();

  if (password.length < 8 || COMMON.some((w) => lower.includes(w)) || (emailUser && emailUser.length > 2 && lower.includes(emailUser))) {
    return 1;
  }

  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const repeated = /(.)\1{2,}/.test(password);

  if (password.length >= 12 && variety >= 3 && !repeated) return 3;
  if (variety >= 3 || (password.length >= 12 && variety >= 2)) return 2;
  return 1;
}
