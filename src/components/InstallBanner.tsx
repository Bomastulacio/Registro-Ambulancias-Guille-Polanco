"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "install-banner-dismissed";

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem(DISMISS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 bg-surface-raised border border-nd-border-visible">
      <div className="flex items-start justify-between gap-6 px-5 pt-5 pb-4">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-label text-text-secondary uppercase tracking-widest">
            [ INSTALAR APP ]
          </span>
          <p className="font-grotesk text-text-primary text-sm leading-snug">
            Acceso directo desde tu pantalla de inicio.
            <br />
            <span className="text-text-secondary">Funciona sin conexión.</span>
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-text-disabled hover:text-text-primary transition-colors shrink-0 -mr-1 -mt-1 p-1"
          aria-label="Descartar"
        >
          <X size={16} />
        </button>
      </div>
      <div className="border-t border-nd-border-visible flex">
        <button
          onClick={install}
          className="flex-1 bg-text-display text-background font-mono text-xs uppercase tracking-widest py-3 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Download size={14} />
          INSTALAR
        </button>
      </div>
    </div>
  );
}
