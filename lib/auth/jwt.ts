/** Devuelve la fecha de expiración del JWT en ms, o null si no se puede leer. */
export function getJwtExpirationMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewMs = 5_000): boolean {
  const exp = getJwtExpirationMs(token);
  if (exp === null) return true;
  return Date.now() >= exp - skewMs;
}
