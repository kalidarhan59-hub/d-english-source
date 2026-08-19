import { useAuth } from "@/_core/hooks/useAuth";
import { MascotD } from "@/components/MascotD";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { AtSign, ChevronLeft, LockKeyhole, Moon, ShieldCheck, Sparkles, Sun, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); setLocation("/onboarding"); },
    onError: (error) => toast.error(error.message),
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); setLocation("/onboarding"); },
    onError: (error) => toast.error(error.message),
  });
  const pending = login.isPending || register.isPending;

  useEffect(() => { if (isAuthenticated) setLocation("/onboarding"); }, [isAuthenticated, setLocation]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register") {
      if (password !== confirmPassword) { toast.error("Пароли не совпадают"); return; }
      register.mutate({ username, email, password, confirmPassword });
    } else login.mutate({ username, password });
  };

  const isRegister = mode === "register";
  return <main className="app-grid grid min-h-screen place-items-center bg-background p-4 text-foreground sm:p-7"><section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_80px_rgba(15,15,15,.13)] lg:grid-cols-[.95fr_1.05fr]"><div className="relative min-h-[285px] overflow-hidden bg-foreground p-7 text-background sm:p-10"><div className="relative z-10"><div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1.5 text-xs font-extrabold text-background/80"><Sparkles size={14} className="text-primary"/>D-English · твой учебный кабинет</div><h1 className="display-font mt-5 max-w-sm text-4xl font-extrabold leading-tight tracking-[-.065em] sm:text-5xl">Английский требует системы, а не случайных уроков.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-background/65">Создай учётную запись — и D поможет построить путь от диагностики до профессионального английского.</p></div><MascotD size="lg" mood="proud" className="absolute bottom-[-80px] right-[-18px] sm:bottom-[-94px] sm:right-4"/></div><div className="flex min-h-[560px] flex-col justify-center p-7 sm:p-10"><div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-xl font-black text-primary-foreground">D</span><span className="text-lg font-extrabold tracking-[-.04em]">D-English</span></Link><button onClick={toggleTheme} className="icon-button" aria-label="Переключить тему">{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button></div><div className="mt-8"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">{isRegister ? "Новая учётная запись" : "Вход в систему"}</p><h2 className="display-font mt-2 text-3xl font-extrabold tracking-[-.055em]">{isRegister ? "Создай свой учебный профиль." : "Рады видеть тебя снова."}</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{isRegister ? "После регистрации D-English сохранит твой уровень, задания и историю обучения." : "Введи логин и пароль, чтобы продолжить своё обучение."}</p></div><form onSubmit={submit} className="mt-7 space-y-4"><label className="grid gap-2 text-sm font-extrabold">Логин<div className="relative"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17}/><Input required minLength={3} maxLength={32} autoComplete="username" value={username} onChange={(event)=>setUsername(event.target.value)} className="h-12 rounded-xl pl-10" placeholder="например, dasha_english" /></div></label>{isRegister && <label className="grid gap-2 text-sm font-extrabold">E-mail<div className="relative"><AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17}/><Input required type="email" autoComplete="email" value={email} onChange={(event)=>setEmail(event.target.value)} className="h-12 rounded-xl pl-10" placeholder="name@example.com" /></div></label>}<label className="grid gap-2 text-sm font-extrabold">Пароль<div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17}/><Input required type="password" minLength={8} maxLength={128} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event)=>setPassword(event.target.value)} className="h-12 rounded-xl pl-10" placeholder="не менее 8 символов" /></div></label>{isRegister && <label className="grid gap-2 text-sm font-extrabold">Повтори пароль<div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17}/><Input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value)} className="h-12 rounded-xl pl-10" placeholder="повтори пароль" /></div></label>}<button type="submit" disabled={pending} className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(245,196,0,.26)] transition-transform hover:-translate-y-0.5 active:scale-[.97] disabled:opacity-60">{pending ? "Проверяем…" : isRegister ? "Зарегистрироваться" : "Войти"}</button></form><p className="mt-5 text-center text-sm text-muted-foreground">{isRegister ? "Уже есть аккаунт?" : "Впервые в D-English?"} <Link href={isRegister ? "/login" : "/register"} className="font-extrabold text-foreground underline decoration-primary decoration-2 underline-offset-4">{isRegister ? "Войти" : "Зарегистрироваться"}</Link></p><div className="mt-5 flex gap-3 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary"/><p>Пароль не хранится в открытом виде: сервер сохраняет только защищённый хеш. E-mail нужен для учётной записи и пока не используется для рассылок.</p></div></div></section></main>;
}
