/** Clave legacy; se migra automáticamente a las claves por rol. */
export const LEGACY_USER_STORAGE_KEY = "biz-user-data";

export const ADMIN_SESSION_KEY = "biz-admin-session";
export const CLIENT_SESSION_KEY = "biz-client-session";
export const ACTIVE_ROLE_KEY = "biz-active-role";

export const ADMIN_COOKIE = "biz-admin-token";
export const CLIENT_COOKIE = "biz-customer-token";

/** Tiempo sin actividad antes de cerrar sesión (30 minutos). */
export const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

/** Duración de las cookies de ruta (alineada con inactividad). */
export const SESSION_COOKIE_MAX_AGE_SEC = Math.floor(SESSION_INACTIVITY_MS / 1000);
