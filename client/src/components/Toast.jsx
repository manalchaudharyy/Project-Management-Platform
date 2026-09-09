import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

const STYLES = {
  success: { bg: "bg-emerald-600", icon: "✓" },
  error: { bg: "bg-rose-600", icon: "✕" },
  info: { bg: "bg-blueprint", icon: "ℹ" },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => {
          const style = STYLES[t.type] || STYLES.info;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-panel ${style.bg} animate-[fadeIn_0.2s_ease-out]`}
            >
              <span>{style.icon}</span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};