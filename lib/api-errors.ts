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
