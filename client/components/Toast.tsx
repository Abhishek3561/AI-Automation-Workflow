"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CircleCheck, CircleX } from "lucide-react";

type ToastType = "success" | "error";
type ToastItem = { id: number; message: string; type: ToastType };

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, message, type }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg"
          >
            {t.type === "success" ? (
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}