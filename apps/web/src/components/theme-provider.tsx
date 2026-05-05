"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = Exclude<Theme, "system">;
type Attribute = "class" | `data-${string}` | Array<"class" | `data-${string}`>;

type ThemeProviderProps = PropsWithChildren<{
  attribute?: Attribute;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  forcedTheme?: Theme | undefined;
}>;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  forcedTheme?: Theme | undefined;
};

const STORAGE_KEY_FALLBACK = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  if (theme === "system") return enableSystem ? getSystemTheme() : "light";
  return theme;
}

function applyThemeToDocument(params: {
  attribute: Attribute;
  enableColorScheme: boolean;
  theme: ResolvedTheme;
}) {
  if (typeof document === "undefined") return;

  const attributes = Array.isArray(params.attribute)
    ? params.attribute
    : [params.attribute];

  for (const attribute of attributes) {
    if (attribute === "class") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(params.theme);
      continue;
    }

    document.documentElement.setAttribute(attribute, params.theme);
  }

  if (params.enableColorScheme) {
    document.documentElement.style.colorScheme = params.theme;
  }
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  enableColorScheme = true,
  storageKey = STORAGE_KEY_FALLBACK,
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        return storedTheme;
      }
    } catch {}

    return defaultTheme;
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(MEDIA_QUERY);
    const updateSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light");
    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  const activeTheme = forcedTheme ?? theme;
  const resolvedTheme = resolveTheme(activeTheme, enableSystem);

  useEffect(() => {
    applyThemeToDocument({
      attribute,
      enableColorScheme,
      theme: resolvedTheme,
    });
  }, [attribute, enableColorScheme, resolvedTheme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {}
  }, [storageKey]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: activeTheme,
    setTheme,
    resolvedTheme,
    systemTheme,
    forcedTheme,
  }), [activeTheme, forcedTheme, resolvedTheme, setTheme, systemTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext) ?? {
    theme: "system" as Theme,
    setTheme: () => {},
    resolvedTheme: "light" as ResolvedTheme,
    systemTheme: "light" as ResolvedTheme,
    forcedTheme: undefined,
  };
}
