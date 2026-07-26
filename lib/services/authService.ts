export type {
  AccountType,
  AuthApiResponse,
  AuthRole,
  UserData,
} from "@/lib/auth/session";

export {
  clearAuthSession,
  getActiveRole,
  getLoginRedirectPath,
  getStoredUser,
  handleSessionExpired,
  isSessionExpired,
  logout,
  saveAuthSession,
  touchSession,
  updateStoredUser,
} from "@/lib/auth/session";

import { fetchClient } from "@/lib/api/httpClient";
import type { AuthApiResponse, AuthRole } from "@/lib/auth/session";
import { saveAuthSession } from "@/lib/auth/session";

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export async function login(
  role: AuthRole,
  credentials: LoginCredentials
): Promise<AuthApiResponse> {
  const endpoint = role === "admin" ? "api/user/login" : "api/client/login";
  const body = {
    email: credentials.identifier,
    password: credentials.password,
  };

  const res = await fetchClient(endpoint, {
    method: "POST",
    requireAuth: false,
    skipSessionCheck: true,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { getLoginErrorMessage } = await import("@/lib/api-errors");
    throw new Error(await getLoginErrorMessage(res));
  }
  return res.json();
}

export interface RegisterAdminPayload {
  password: string;
  fullName: string;
  email: string;
  phone: number;
  businessName: string;
}

export interface RegisterClientPayload {
  password: string;
  fullName: string;
  email: string;
  phone: number;
  businessName?: string;
}

export async function register(
  role: AuthRole,
  payload: RegisterAdminPayload | RegisterClientPayload
): Promise<AuthApiResponse> {
  const endpoint = role === "admin" ? "api/user/register" : "api/client/register";
  const res = await fetchClient(endpoint, {
    method: "POST",
    requireAuth: false,
    skipSessionCheck: true,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { getRegisterErrorMessage } = await import("@/lib/api-errors");
    throw new Error(await getRegisterErrorMessage(res));
  }
  return res.json();
}

/** Login + persistencia de sesión en un solo paso. */
export async function loginAndSave(
  role: AuthRole,
  credentials: LoginCredentials,
  formData?: Parameters<typeof saveAuthSession>[2]
): Promise<AuthApiResponse> {
  const data = await login(role, credentials);
  saveAuthSession(data, role, formData);
  return data;
}

export async function registerAndSave(
  role: AuthRole,
  payload: RegisterAdminPayload | RegisterClientPayload,
  formData?: Parameters<typeof saveAuthSession>[2]
): Promise<AuthApiResponse> {
  const data = await register(role, payload);
  saveAuthSession(data, role, formData);
  return data;
}
