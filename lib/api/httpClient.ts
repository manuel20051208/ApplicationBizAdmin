import { toast } from "sonner";
import {
  getStoredUser,
  handleSessionExpired,
  isSessionExpired,
  touchSession,
} from "@/lib/auth/session";

/** Base vacía: las rutas usan prefijo `api/...` y Next rewrites a localhost:8080/api */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface FetchOptions extends RequestInit {
  /** Si true (default), envía Authorization: Bearer &lt;token&gt; */
  requireAuth?: boolean;
  /** Omite validación de sesión (login/register). */
  skipSessionCheck?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(endpoint: string): string {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${path}`;
}

function ensureValidSession(skipSessionCheck: boolean): void {
  if (skipSessionCheck || typeof window === "undefined") return;
  const user = getStoredUser();
  if (!user?.token) return;
  if (isSessionExpired(user)) {
    handleSessionExpired("Tu sesión expiró por inactividad. Inicia sesión de nuevo.");
    throw new ApiError("Sesión expirada", 401);
  }
}

export async function fetchClient(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    requireAuth = true,
    skipSessionCheck = false,
    ...customOptions
  } = options;

  if (requireAuth) {
    ensureValidSession(skipSessionCheck);
  }

  const headers = new Headers(customOptions.headers || {});

  if (
    !(customOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const user = getStoredUser();
    if (user?.token) {
      headers.set("Authorization", `Bearer ${user.token}`);
      touchSession(user.role);
    }
  }

  const config: RequestInit = {
    ...customOptions,
    headers,
  };

  const url = buildUrl(endpoint);

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401 && requireAuth) {
        handleSessionExpired();
      } else if (response.status === 403) {
        toast.error("No tienes permisos para realizar esta acción.");
      } else if (response.status >= 500) {
        toast.error("Ocurrió un error en el servidor. Inténtalo más tarde.");
      }
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw error;
    }
    toast.error("Error de conexión al servidor.");
    throw error;
  }
}

/** Parsea JSON y lanza si la respuesta no es ok (útil en servicios). */
export async function fetchJson<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const res = await fetchClient(endpoint, options);
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data === "object" && data && "message" in data) {
        message = String((data as { message: string }).message);
      }
    } catch {
      // sin cuerpo JSON
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}
