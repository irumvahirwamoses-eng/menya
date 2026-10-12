import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { THEME_STORAGE_KEY } from "../lib/constants";

const DEFAULTS = {
  theme: "system",
  textSize: "md",
  highContrast: false,
  autoSpeak: true,
  reduceMotion: false,
};

const DisplayContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function applyToDocument(settings) {
  const root = document.documentElement;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = settings.theme === "dark" || (settings.theme === "system" && prefersDark);

  root.classList.toggle("dark", isDark);
  root.classList.toggle("hc", Boolean(settings.highContrast));
  root.classList.toggle("reduce-motion", Boolean(settings.reduceMotion));

  const sizes = { md: "16px", lg: "17.5px", xl: "19px" };
  root.style.setProperty("--root-size", sizes[settings.textSize] || sizes.md);
  root.style.fontSize = sizes[settings.textSize] || sizes.md;
}

export function DisplayProvider({ children }) {
  const [settings, setSettings] = useState(readStored);

  useEffect(() => {
    applyToDocument(settings);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage full or blocked */
    }
  }, [settings]);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => applyToDocument(settings);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplay() {
  const ctx = useContext(DisplayContext);
  if (!ctx) throw new Error("useDisplay must be used inside <DisplayProvider>");
  return ctx;
}
