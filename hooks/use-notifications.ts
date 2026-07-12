"use client"

import { useState, useEffect } from "react"
import { getStoredUser } from "@/lib/auth/session"

export interface Notification {
  id: string
  tipo: "VENTA_NUEVA" | "STOCK_BAJO" | "CLIENTE_NUEVO"
  mensaje: string
  leida: boolean
  timestamp: Date
}

const STORAGE_KEY = "biz-notifications"

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    tipo: "VENTA_NUEVA",
    mensaje: "Nueva venta registrada: #V-1024 por $1,250.00 MXN",
    leida: false,
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // Hace 10 min
  },
  {
    id: "2",
    tipo: "STOCK_BAJO",
    mensaje: "Stock crítico: Producto 'Laptop Pro' tiene 2 unidades disponibles",
    leida: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
  },
  {
    id: "3",
    tipo: "CLIENTE_NUEVO",
    mensaje: "Nuevo cliente registrado: María López (maria@example.com)",
    leida: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hace 1 día
  },
]

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Función para cargar notificaciones de localStorage de forma segura
  const loadNotifications = () => {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as any[]
        const loaded = parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
        setNotifications(loaded)
      } catch {
        setNotifications(DEFAULT_NOTIFICATIONS)
      }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS))
    }
  }

  // Carga inicial
  useEffect(() => {
    loadNotifications()
  }, [])

  // Sincronización entre pestañas y componentes en el cliente
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadNotifications()
      }
    }

    const handleSync = () => {
      loadNotifications()
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("notifications-sync", handleSync)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("notifications-sync", handleSync)
    }
  }, [])

  // Conexión SSE en tiempo real usando fetch y ReadableStream (soporta cabecera Authorization)
  useEffect(() => {
    if (typeof window === "undefined") return

    let active = true
    let controller = new AbortController()
    let reconnectTimeout: NodeJS.Timeout

    const connectSSE = async () => {
      const user = getStoredUser("admin")
      if (!user?.token) {
        return
      }

      try {
        const url = `http://localhost:8080/api/notification/stream`
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${user.token}`,
            "Accept": "text/event-stream",
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            // El token puede no ser válido para este endpoint aún.
            // No forzamos logout aquí — el SessionProvider global
            // se encarga de manejar sesiones expiradas.
            console.warn("SSE Notificaciones: sin autorización (401). Conexión cancelada.")
            return
          }
          console.error("SSE Error Debug - URL:", url, "Status:", response.status)
          throw new Error(`SSE HTTP error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("No readable stream in response body")
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (active) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const normalized = buffer.replace(/\r\n/g, "\n")
          const parts = normalized.split("\n\n")
          buffer = parts.pop() || ""

          for (const part of parts) {
            if (!part.trim()) continue

            const lines = part.split("\n")
            let eventName = ""
            let dataStr = ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith("event:")) {
                eventName = trimmed.substring(6).trim()
              } else if (trimmed.startsWith("data:")) {
                dataStr = trimmed.substring(5).trim()
              }
            }

            if (!dataStr) continue

            try {
              const payload = JSON.parse(dataStr)

              // Filtrar por adminId si está presente en el evento y en el usuario autenticado
              if (payload.adminId !== undefined && payload.adminId !== null && user.id !== null && user.id !== undefined) {
                if (String(payload.adminId) !== String(user.id)) {
                  continue
                }
              }

              // Determinar el tipo de evento normalizado
              let mappedTipo: "VENTA_NUEVA" | "STOCK_BAJO" | "CLIENTE_NUEVO" = "VENTA_NUEVA"
              const rawTipo = String(eventName || payload.tipo || payload.type || "").toUpperCase()
              if (rawTipo.includes("VENTA") || rawTipo.includes("SALE")) {
                mappedTipo = "VENTA_NUEVA"
              } else if (rawTipo.includes("STOCK") || rawTipo.includes("BAJO") || rawTipo.includes("LOW")) {
                mappedTipo = "STOCK_BAJO"
              } else if (rawTipo.includes("CLIENTE") || rawTipo.includes("USER") || rawTipo.includes("CUSTOMER")) {
                mappedTipo = "CLIENTE_NUEVO"
              }

              const newNotif: Notification = {
                id: String(payload.id || Math.random().toString(36).substring(2, 9)),
                tipo: mappedTipo,
                mensaje: payload.mensaje || payload.message || dataStr,
                leida: false,
                timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
              }

              setNotifications(prev => {
                // Evitar duplicados por ID
                if (prev.some(n => n.id === newNotif.id)) return prev
                const updated = [newNotif, ...prev]
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
                return updated
              })

              window.dispatchEvent(new Event("notifications-sync"))
            } catch {
              // Si no es un JSON válido, procesar como texto plano
              let mappedTipo: "VENTA_NUEVA" | "STOCK_BAJO" | "CLIENTE_NUEVO" = "VENTA_NUEVA"
              const rawTipo = String(eventName).toUpperCase()
              if (rawTipo.includes("VENTA") || rawTipo.includes("SALE")) {
                mappedTipo = "VENTA_NUEVA"
              } else if (rawTipo.includes("STOCK") || rawTipo.includes("BAJO") || rawTipo.includes("LOW")) {
                mappedTipo = "STOCK_BAJO"
              } else if (rawTipo.includes("CLIENTE") || rawTipo.includes("USER") || rawTipo.includes("CUSTOMER")) {
                mappedTipo = "CLIENTE_NUEVO"
              }

              const newNotif: Notification = {
                id: Math.random().toString(36).substring(2, 9),
                tipo: mappedTipo,
                mensaje: dataStr,
                leida: false,
                timestamp: new Date(),
              }

              setNotifications(prev => {
                const updated = [newNotif, ...prev]
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
                return updated
              })

              window.dispatchEvent(new Event("notifications-sync"))
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError" || !active) {
          return
        }
        console.error("Error en conexión SSE (Notificaciones):", err)
        // Intentar reconectar en 5 segundos con un nuevo controlador
        if (active) {
          controller = new AbortController()
          reconnectTimeout = setTimeout(connectSSE, 5000)
        }
      }
    }

    connectSSE()

    return () => {
      active = false
      controller.abort()
      clearTimeout(reconnectTimeout)
    }
  }, [])

  const saveNotifications = (newNotifs: Notification[]) => {
    setNotifications(newNotifs)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifs))
      window.dispatchEvent(new Event("notifications-sync"))
    }
  }

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, leida: true }))
    saveNotifications(updated)
  }

  const clearAll = () => {
    saveNotifications([])
  }

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, leida: true } : n
    )
    saveNotifications(updated)
  }

  const addNotification = (tipo: Notification["tipo"], mensaje: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      tipo,
      mensaje,
      leida: false,
      timestamp: new Date(),
    }
    const updated = [newNotif, ...notifications]
    saveNotifications(updated)
  }

  const unreadCount = notifications.filter(n => !n.leida).length

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
    markAsRead,
    addNotification,
  }
}
