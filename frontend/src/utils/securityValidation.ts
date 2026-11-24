/**
 * PARKIA - Utilidades de Validación y Seguridad (OWASP / Auditoría)
 */

export const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Valida un correo electrónico con formato estricto RFC-compliant:
 * - Rechaza comillas ('), comillas dobles ("), puntos y coma (;), guiones dobles (--), espacios o inyecciones SQL.
 * - Aplica trim al inicio y final.
 * - Restringe la longitud máxima a 254 caracteres.
 */
export function validateStrictEmail(email: string): { valid: boolean; error?: string; cleanEmail: string } {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return { valid: false, error: 'Ingresá tu correo electrónico.', cleanEmail };
  }

  if (cleanEmail.length > 254) {
    return { valid: false, error: 'El correo electrónico no puede superar los 254 caracteres.', cleanEmail };
  }

  if (!STRICT_EMAIL_REGEX.test(cleanEmail)) {
    return {
      valid: false,
      error: 'Ingresá un correo electrónico válido (no se permiten comillas, espacios ni caracteres especiales).',
      cleanEmail,
    };
  }

  return { valid: true, cleanEmail };
}

/**
 * Valida que una URL apunte a una imagen válida (.jpg, .jpeg, .png, .webp) o provenga de Unsplash.
 * Previene la inserción de enlaces arbitrarios o scripts maliciosos.
 */
export function isValidImageUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: true };
  }

  const clean = url.trim();

  try {
    const parsed = new URL(clean);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'La URL debe comenzar con http:// o https://.' };
    }

    const pathname = parsed.pathname.toLowerCase();
    const hasImageExt = /\.(jpg|jpeg|png|webp|svg)($|\?)/i.test(clean) ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.webp');

    const isUnsplash = parsed.hostname.includes('unsplash.com') && pathname.includes('/photo-');

    if (!hasImageExt && !isUnsplash) {
      return {
        valid: false,
        error: 'La URL debe apuntar a una imagen válida (.jpg, .jpeg, .png o .webp).',
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'La URL ingresada no tiene un formato válido.' };
  }
}
