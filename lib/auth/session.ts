import {
  ACTIVE_ROLE_KEY,
  ADMIN_COOKIE,
  ADMIN_SESSION_KEY,
  CLIENT_COOKIE,
  CLIENT_SESSION_KEY,
  LEGACY_USER_STORAGE_KEY,
  SESSION_COOKIE_MAX_AGE_SEC,
  SESSION_INACTIVITY_MS,
} from "@/lib/auth/constants";
import { isJwtExpired } from "@/lib/auth/jwt";

export type AccountType = "ADMIN" | "CLIENT";
export type AuthRole = "admin" | "customer";

export interface UserData {
  id: number | null;
  username: string;
  fullName: string;
  email: string;
  phone: number | string;
  businessName: string | null;
  accountType: AccountType;
  role: AuthRole;
  token?: string;
  lastActivityAt?: number;
  profilePhoto?: string;
  fotoPerfil?: string;
  photo?: string;
  address?: string;
}

/** Sub-objeto que devuelve el backend en respuestas de registro */
export interface AuthApiUsuario {
  id?: number;
  usuario?: string;    // username en español
  nombre?: string;     // fullName en español
  email?: string;
  username?: string;
  fullName?: string;
  name?: string;
}

export interface AuthApiResponse {
  // Campos de nivel superior (login y register)
  id?: number;
  username?: string;
  fullName?: string;
  nombre?: string;     // alias español de fullName
  email?: string;
  phone?: number | string;
  businessName?: string | null;
  accountType?: string;
  token: string;
  message?: string;
  mensaje?: string;    // alias español de message
  profilePhoto?: string;
  fotoPerfil?: string;
  photo?: string;
  address?: string;
  // Objeto anidado que devuelve el backend en registro
  usuario?: AuthApiUsuario;
}

function sessionKeyForRole(role: AuthRole): string {
  return role === "admin" ? ADMIN_SESSION_KEY : CLIENT_SESSION_KEY;
}

function cookieForRole(role: AuthRole): string {
  return role === "admin" ? ADMIN_COOKIE : CLIENT_COOKIE;
}

function normalizeAccountType(
  raw: string | undefined,
  role: AuthRole
): AccountType {
  let accountType = raw || (role === "admin" ? "ADMIN" : "CLIENT");
  if (accountType === "USER") accountType = "ADMIN";
  return accountType === "CLIENT" ? "CLIENT" : "ADMIN";
}

function migrateLegacySession(): void {
  if (typeof window === "undefined") return;
  const legacy = localStorage.getItem(LEGACY_USER_STORAGE_KEY);
  if (!legacy) return;
  try {
    const parsed = JSON.parse(legacy) as UserData;
    const role: AuthRole =
      parsed.role ?? (parsed.accountType === "CLIENT" ? "customer" : "admin");
    if (!parsed.lastActivityAt) parsed.lastActivityAt = Date.now();
    localStorage.setItem(sessionKeyForRole(role), JSON.stringify(parsed));
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  } catch {
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  }
}

function readSession(role: AuthRole): UserData | null {
  if (typeof window === "undefined") return null;
  migrateLegacySession();
  try {
    const stored = localStorage.getItem(sessionKeyForRole(role));
    if (stored) return JSON.parse(stored) as UserData;
  } catch (e) {
    console.error("Error parsing session", e);
  }
  return null;
}

function writeSession(role: AuthRole, user: UserData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKeyForRole(role), JSON.stringify(user));
  localStorage.setItem(ACTIVE_ROLE_KEY, role);
  localStorage.setItem(LEGACY_USER_STORAGE_KEY, JSON.stringify(user));
}

function setAuthCookie(role: AuthRole): void {
  if (typeof document === "undefined") return;
  const name = cookieForRole(role);
  document.cookie = `${name}=authenticated; path=/; max-age=${SESSION_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

function clearAuthCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getActiveRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  migrateLegacySession();
  const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
  if (stored === "admin" || stored === "customer") return stored;
  return null;
}

export function getStoredUser(role?: AuthRole): UserData | null {
  if (typeof window === "undefined") return null;
  migrateLegacySession();

  if (role) return readSession(role);

  const active = getActiveRole();
  if (active) return readSession(active);

  return readSession("admin") ?? readSession("customer");
}

export function touchSession(role?: AuthRole): void {
  const user = getStoredUser(role);
  if (!user) return;
  const r = role ?? user.role;
  const updated: UserData = { ...user, lastActivityAt: Date.now() };
  writeSession(r, updated);
}

export function isSessionInactive(user: UserData): boolean {
  const last = user.lastActivityAt ?? 0;
  if (!last) return false;
  return Date.now() - last > SESSION_INACTIVITY_MS;
}

export function isSessionExpired(user?: UserData | null): boolean {
  if (!user) user = getStoredUser();
  if (!user?.token) return !user;
  if (isJwtExpired(user.token)) return true;
  if (isSessionInactive(user)) return true;
  return false;
}

export function updateStoredUser(updates: Partial<UserData>): void {
  const user = getStoredUser();
  if (!user) return;
  const updatedUser = { ...user, ...updates, lastActivityAt: Date.now() };
  writeSession(user.role, updatedUser);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(CLIENT_SESSION_KEY);
  localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  localStorage.removeItem(ACTIVE_ROLE_KEY);
  clearAuthCookie(ADMIN_COOKIE);
  clearAuthCookie(CLIENT_COOKIE);
}

export function logout(role?: AuthRole): void {
  if (typeof window === "undefined") return;
  if (role) {
    localStorage.removeItem(sessionKeyForRole(role));
    clearAuthCookie(cookieForRole(role));
    const active = getActiveRole();
    if (active === role) {
      localStorage.removeItem(ACTIVE_ROLE_KEY);
      localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    }
    return;
  }
  clearAuthSession();
}

export function saveAuthSession(
  data: AuthApiResponse,
  role: AuthRole,
  formData?: {
    userName?: string;
    name?: string;
    email?: string;
    phone?: string;
    nameBusiness?: string;
    address?: string;
  }
): void {
  if (typeof window === "undefined") return;

  // Normalizar: el backend puede devolver los datos dentro de `usuario` (registro)
  // o directamente en la raíz (login)
  const u = data.usuario ?? {};

  const resolvedId: number | null = data.id ?? u.id ?? null;
  const rawUsername = data.username || u.usuario || u.username || formData?.userName || data.email || formData?.email || "";
  const resolvedUsername: string = rawUsername.trim() || "No especificado";

  const rawFullName = data.fullName || data.nombre || u.nombre || u.fullName || u.name || formData?.name || formData?.userName || "";
  const resolvedFullName: string = rawFullName.trim() || "No especificado";

  const rawEmail = data.email || u.email || formData?.email || formData?.userName || "";
  const resolvedEmail: string = rawEmail.trim() || "No especificado";

  const rawPhone = (data.phone ?? formData?.phone ?? "").toString();
  const resolvedPhone = rawPhone.trim() && rawPhone.trim() !== "0" ? rawPhone.trim() : "No especificado";

  const rawBusinessName = (data.businessName || formData?.nameBusiness || "").toString();
  const resolvedBusinessName = rawBusinessName.trim() || "No especificado";

  const accountType = normalizeAccountType(data.accountType, role);
  const now = Date.now();
  const photo = data.photo ?? data.profilePhoto ?? data.fotoPerfil;
  const profilePhoto = data.profilePhoto ?? data.fotoPerfil ?? data.photo;
  const fotoPerfil = data.fotoPerfil ?? data.profilePhoto ?? data.photo;

  const userData: UserData = {
    id: resolvedId,
    username: resolvedUsername,
    fullName: resolvedFullName,
    email: resolvedEmail,
    phone: resolvedPhone,
    businessName: resolvedBusinessName,
    accountType,
    role,
    token: data.token,
    lastActivityAt: now,
    profilePhoto,
    fotoPerfil,
    photo,
    address: (data.address || formData?.address || "").trim() || "No especificado",
  };

  writeSession(role, userData);
  setAuthCookie(role);

  if (role === "admin") {
    localStorage.removeItem(CLIENT_SESSION_KEY);
    clearAuthCookie(CLIENT_COOKIE);
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    clearAuthCookie(ADMIN_COOKIE);
  }
}

export function getLoginRedirectPath(): string {
  return "/login";
}

export function handleSessionExpired(message?: string): void {
  clearAuthSession();
  if (typeof window === "undefined") return;
  if (message) {
    sessionStorage.setItem("biz-session-expired-msg", message);
  }
  window.location.href = getLoginRedirectPath();
}
