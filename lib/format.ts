const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
})

export function formatCurrency(amount: number): string {
  return mxn.format(amount)
}

export function formatDate(dateValue: unknown): string {
  if (!dateValue) return "—"
  try {
    let dateObj: Date

    if (Array.isArray(dateValue)) {
      const [year, month, day] = dateValue
      dateObj = new Date(year, month - 1, day || 1)
    } else {
      const dateStr = String(dateValue)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-")
        dateObj = new Date(Number(year), Number(month) - 1, Number(day))
      } else {
        dateObj = new Date(dateValue as string)
      }
    }

    if (isNaN(dateObj.getTime())) return String(dateValue)

    const dd = String(dateObj.getDate()).padStart(2, "0")
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0")
    const yyyy = dateObj.getFullYear()
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return String(dateValue)
  }
}

export function formatRelativeDate(dateValue: unknown): string {
  if (!dateValue || dateValue === "—") return "—"
  try {
    let dateObj: Date

    if (Array.isArray(dateValue)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue
      dateObj = new Date(year, month - 1, day || 1, hour, minute, second)
    } else {
      const dateStr = String(dateValue)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-")
        dateObj = new Date(Number(year), Number(month) - 1, Number(day))
      } else {
        dateObj = new Date(dateValue as string)
      }
    }

    if (isNaN(dateObj.getTime())) return String(dateValue)

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours >= 0 && diffHours < 24) {
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        if (diffMins <= 1) return "Hace un momento"
        return `Hace ${diffMins} minutos`
      }
      return diffHours === 1 ? "Hace 1 hora" : `Hace ${diffHours} horas`
    }

    const dd = String(dateObj.getDate()).padStart(2, "0")
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0")
    const yyyy = dateObj.getFullYear()
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return String(dateValue)
  }
}
