const API_DOWN_MESSAGE =
  "No se pudo conectar con el servidor. Verifica que el backend esté en línea."

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
  // El rewrite de Next suele devolver 500 cuando el backend no acepta conexión
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

/** Muestra una tarjeta roja en la parte superior derecha si el backend no responde */
export function triggerOfflineNotification(onRetry?: () => void) {
  // Evita acumular toasts repetidos del mismo banner
  toast.dismiss()
  toast.error("Servidor Desconectado", {
    description: "No se pudo conectar con el servidor. Verifica que el backend esté en línea.",
    duration: 10000,
    action: onRetry ? { label: "Reintentar", onClick: onRetry } : undefined,
  })
}
