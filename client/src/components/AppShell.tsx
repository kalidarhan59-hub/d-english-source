import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { BookOpen, Flame, Home, LogOut, Map, Menu, Moon, Sparkles, Sun, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { DChat } from "./DChat";

const links = [
  { href: "/academy", label: "Учебный день", icon: Home },
  { href: "/assessment", label: "Оценка", icon: Map },
  { href: "/academy", label: "Задачи", icon: BookOpen },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/academy" className="group flex items-center gap-2.5" aria-label="D-English, учебный кабинет">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-xl font-black text-primary-foreground shadow-[0_8px_18px_rgba(245,196,0,0.26)] transition-transform duration-200 group-hover:rotate-[-8deg]">D</span>
            <span className="text-lg font-extrabold tracking-[-0.04em]">D-English</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
            {links.map((link) => {
              const Icon = link.icon;
              const active = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
              return <Link key={link.label} href={link.href} className={cn("nav-link", active && "nav-link-active")}><Icon size={16} />{link.label}</Link>;
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button className="icon-button" onClick={toggleTheme} aria-label="Переключить тему">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/profile" className="flex max-w-40 items-center gap-2 rounded-full bg-surface px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-muted">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-xs font-black text-background">{user?.name?.slice(0, 1).toUpperCase() ?? "D"}</span>
                  <span className="truncate">{user?.name ?? "Ученик"}</span>
                </Link>
                <button className="icon-button" onClick={() => logout()} aria-label="Выйти"><LogOut size={17} /></button>
              </div>
            ) : (
              <button className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground shadow-sm transition-transform active:scale-[0.97] sm:inline-flex" onClick={() => startLogin()}>Войти</button>
            )}
            <button className="icon-button md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Открыть меню">
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <nav className="mx-auto grid max-w-[1440px] grid-cols-2 gap-2" aria-label="Мобильная навигация">
              {links.map((link) => {
                const Icon = link.icon;
                return <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-3 text-sm font-bold"><Icon size={17} />{link.label}</Link>;
              })}
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto min-h-[calc(100vh-64px)] max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-30 flex h-[60px] items-center justify-around rounded-2xl border border-border/70 bg-surface/95 px-2 shadow-[0_16px_40px_rgba(8,8,8,0.18)] backdrop-blur md:hidden" aria-label="Быстрые разделы">
        {links.map((link) => {
          const Icon = link.icon;
          const active = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
          return <Link key={link.label} href={link.href} className={cn("flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-bold text-muted-foreground", active && "bg-primary text-primary-foreground")}><Icon size={18} />{link.label}</Link>;
        })}
      </nav>
      <DChat />
    </div>
  );
}

export function StreakPill({ streak }: { streak: number }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-extrabold text-foreground"><Flame size={15} className="text-primary" />{streak} дней подряд</span>;
}

export function DMark() {
  return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Sparkles size={14} className="text-primary" />С тобой D</span>;
}
