"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  getStoredUser,
  handleSessionExpired,
  isSessionExpired,
  touchSession,
} from "@/lib/auth/session";
import { usePathname, useRouter } from "next/navigation";

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

const CHECK_INTERVAL_MS = 60_000;

/**
 * Renueva la marca de actividad y cierra sesión si el JWT expiró
 * o superó el tiempo de inactividad configurado.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Si estamos en login, no validamos sesión para expulsar
    if (pathname === "/login") return;

    const expiredMsg = sessionStorage.getItem("biz-session-expired-msg");
    if (expiredMsg) {
      sessionStorage.removeItem("biz-session-expired-msg");
      toast.info(expiredMsg);
    }

    const user = getStoredUser();
    if (!user || !user.token) {
      handleSessionExpired("Debes iniciar sesión para continuar.");
      return;
    }

    if (isSessionExpired(user)) {
      handleSessionExpired("Tu sesión expiró. Inicia sesión de nuevo.");
      return;
    }

    touchSession();

    const onActivity = () => touchSession();

    const checkExpiry = () => {
      if (isSessionExpired()) {
        handleSessionExpired("Tu sesión expiró por inactividad. Inicia sesión de nuevo.");
      }
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true })
    );
    const interval = window.setInterval(checkExpiry, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", checkExpiry);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, onActivity)
      );
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, []);

  return <>{children}</>;
}
