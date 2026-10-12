import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Settings,
  Contrast,
  Type,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import UserAvatar from "../ui/UserAvatar";
import ModeBadge from "../ui/ModeBadge";
import { useAuth } from "../../context/AuthContext";
import { useDisplay } from "../../context/DisplayContext";
import { ACCESS_MODES } from "../../lib/constants";

const NAV_LINKS = [
  { to: "/lobby", label: "Conversations" },
  { to: "/settings", label: "Accessibility" },
];

function ThemeToggle() {
  const { settings, update } = useDisplay();
  const order = { system: "light", light: "dark", dark: "system" };
  const icons = { system: Monitor, light: Sun, dark: Moon };
  const labels = { system: "System theme", light: "Light theme", dark: "Dark theme" };
  const Icon = icons[settings.theme];

  return (
    <button
      className="icon-btn"
      onClick={() => update({ theme: order[settings.theme] })}
      aria-label={`${labels[settings.theme]} — click to change`}
      title={labels[settings.theme]}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { settings, update } = useDisplay();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const mode = ACCESS_MODES[user.accessMode] || ACCESS_MODES.standard;

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="flex items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-surface-2"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
      >
        <UserAvatar name={user.name} size="sm" />
        <span className="hidden text-sm font-semibold text-ink sm:block">{user.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="card animate-pop absolute right-0 top-13 z-50 w-72 overflow-hidden p-2"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <UserAvatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <div className="px-3 pb-3">
            <ModeBadge mode={mode} />
          </div>
          <hr className="divider" />

          <Link
            to="/settings"
            role="menuitem"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
            Accessibility settings
          </Link>

          <button
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2"
            onClick={() => {
              update({ highContrast: !settings.highContrast });
              setOpen(false);
            }}
          >
            <Contrast className="h-4 w-4 text-muted" aria-hidden="true" />
            High contrast: {settings.highContrast ? "On" : "Off"}
          </button>

          <button
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2"
            onClick={() => {
              const next = { md: "lg", lg: "xl", xl: "md" }[settings.textSize];
              update({ textSize: next });
              setOpen(false);
            }}
          >
            <Type className="h-4 w-4 text-muted" aria-hidden="true" />
            Text size: {settings.textSize.toUpperCase()}
          </button>

          <hr className="divider mt-1" />

          <button
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to="/lobby" aria-label="Sharinga home">
            <Logo />
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-soft text-brand-ink"
                      : "text-muted hover:bg-surface-2 hover:text-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <div className="hidden sm:block">
              <UserMenu />
            </div>
            <button
              className="icon-btn md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            className="animate-rise border-t border-line bg-surface px-4 py-3 md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold ${
                      isActive ? "bg-brand-soft text-brand-ink" : "text-ink hover:bg-surface-2"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 sm:hidden">
                <UserMenu />
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
