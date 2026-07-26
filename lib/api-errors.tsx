const API_DOWN_MESSAGE =
  "No se pudo conectar con el servidor. Verifica que Spring Boot esté corriendo en el puerto 8080."

const GATEWAY_STATUSES = [502, 503, 504]

/** Error de red del navegador (fetch rechazado, API apagada, etc.) */
export function isNetworkOrApiDown(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (error instanceof Error) {
    return /failed to fetch|networkerror|load failed/i.test(error.message)
  }
  return false
}

/** Respuesta HTTP cuando el backend no responde (proxy Next → :8080 caído) */
export function isBackendUnreachableResponse(response: Response): boolean {
  if (response.status === 0 || GATEWAY_STATUSES.includes(response.status)) {
    return true
  }
  // El rewrite de Next suele devolver 500 cuando localhost:8080 no acepta conexión
  if (response.status >= 500) return true
  return false
}

async function readBackendMessage(response: Response): Promise<string | null> {
  try {
    const data = await response.json()
    if (typeof data === "string" && data.trim()) return data
    if (data && typeof data === "object") {
      const msg =
        data.message ?? data.error ?? data.detail ?? data.title
      if (typeof msg === "string" && msg.trim()) return msg
    }
  } catch {
    // cuerpo vacío o HTML del proxy
  }
  return null
}

export async function getLoginErrorMessage(response: Response): Promise<string> {
  if (isBackendUnreachableResponse(response)) return API_DOWN_MESSAGE
  if (response.status === 401 || response.status === 403) {
    return "Credenciales inválidas"
  }
  const backend = await readBackendMessage(response)
  if (backend) return backend
  return "No se pudo iniciar sesión. Inténtalo de nuevo."
}

export async function getRegisterErrorMessage(response: Response): Promise<string> {
  if (isBackendUnreachableResponse(response)) return API_DOWN_MESSAGE
  const backend = await readBackendMessage(response)
  if (backend) return backend
  if ([400, 409, 422].includes(response.status)) {
    return "Error en el registro. Verifica los datos ingresados."
  }
  return "Error en el registro. Inténtalo de nuevo."
}

export function getNetworkErrorMessage(): string {
  return API_DOWN_MESSAGE
}

import { toast } from "sonner"

/** Muestra una tarjeta roja en la parte superior derecha si Spring Boot no está corriendo */
export function triggerOfflineNotification(onRetry?: () => void) {
  toast.custom(
    (t) => {
      return (
        <div className="flex w-full max-w-sm gap-3 rounded-xl border border-red-500/20 bg-red-950/95 p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 pointer-events-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div className="flex-1 space-y-1.5">
            <h3 className="font-semibold text-red-200 text-sm">Servidor Desconectado</h3>
            <p className="text-xs text-red-300/80 leading-relaxed">
              No se pudo conectar con el servidor. Verifica que Spring Boot esté corriendo en el puerto 8080.
            </p>
            {onRetry && (
              <button
                onClick={() => {
                  toast.dismiss(t)
                  onRetry()
                }}
                className="mt-1 rounded bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/35 transition-colors cursor-pointer"
              >
                Reintentar
              </button>
            )}
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="h-5 w-5 shrink-0 rounded-md p-0.5 text-red-400/70 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
      )
    },
    {
      id: "spring-boot-offline-toast",
      duration: 10000,
      position: "top-right",
    }
  )
}
