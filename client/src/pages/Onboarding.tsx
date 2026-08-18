import { useAuth } from "@/_core/hooks/useAuth";
import { MascotD } from "@/components/MascotD";
import { Button } from "@/components/ui/button";
import { LearningState } from "@/components/LearningState";
import { trpc } from "@/lib/trpc";
import { ChevronRight, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const status = trpc.academy.profileStatus.useQuery(undefined, { enabled: isAuthenticated });
  const create = trpc.academy.createProfile.useMutation({ onSuccess: () => setLocation("/assessment") });

  useEffect(() => {
    if (status.data?.exists) setLocation(status.data.diagnosticComplete ? "/academy" : "/assessment");
  }, [status.data, setLocation]);

  if (!isAuthenticated) return <main className="app-grid grid min-h-screen place-items-center bg-background p-4"><LearningState type="auth" title="Сначала войди в D-English" description="Учебный профиль можно создать только после защищённого входа." /></main>;
  if (status.isLoading) return <main className="app-grid grid min-h-screen place-items-center bg-background p-4"><LearningState type="loading" title="Проверяем учебный профиль" description="Мы ничего не создаём до твоего подтверждения." /></main>;
  if (status.isError) return <main className="app-grid grid min-h-screen place-items-center bg-background p-4"><LearningState type="error" title="Не удалось проверить профиль" description="Обнови страницу и попробуй снова." /></main>;

  return <main className="app-grid grid min-h-screen place-items-center bg-background p-4 text-foreground sm:p-7"><section className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_80px_rgba(15,15,15,.12)] sm:p-10"><MascotD size="lg" mood="proud" className="absolute bottom-[-88px] right-[-10px] hidden sm:block"/><div className="relative z-10 max-w-xl"><span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-primary-foreground"><Sparkles size={14}/>Подтверждение старта</span><h1 className="display-font mt-5 text-4xl font-extrabold tracking-[-.065em]">Начать обучение как {user?.name ?? "этот пользователь"}?</h1><p className="mt-4 max-w-lg leading-7 text-muted-foreground">Профиль, результаты диагностики, словарь и история появятся только после твоего подтверждения. До этого D-English не создаёт учебные данные для этой учётной записи.</p><div className="mt-7 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground"><LockKeyhole size={18} className="mb-2 text-primary"/><p>После подтверждения откроется обязательная диагностика. Её результат станет стартовой точкой персонального маршрута.</p></div><Button onClick={() => create.mutate()} disabled={create.isPending} className="mt-7 h-13 rounded-xl bg-primary px-5 font-extrabold text-primary-foreground">{create.isPending ? "Создаём профиль…" : "Создать учебный профиль и начать"}<ChevronRight size={17}/></Button><button onClick={() => setLocation("/")} className="ml-4 text-sm font-extrabold text-muted-foreground underline-offset-4 hover:underline">Вернуться ко входу</button></div></section></main>;
}
