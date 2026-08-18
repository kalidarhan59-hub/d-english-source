import { useAuth } from "@/_core/hooks/useAuth";
import { MascotD } from "@/components/MascotD";
import { LearningState } from "@/components/LearningState";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, LockKeyhole, Map as MapIcon, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { getLevelFromXp, lessons, levels, levelMeta } from "../../../shared/learning";

export default function Journey() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const profileStatus = trpc.academy.profileStatus.useQuery(undefined, { enabled: isAuthenticated });
  const summary = trpc.learning.summary.useQuery(undefined, { enabled: isAuthenticated && profileStatus.data?.exists === true });
  useEffect(() => { if (profileStatus.data && !profileStatus.data.exists) setLocation("/onboarding"); }, [profileStatus.data, setLocation]);
  if (!isAuthenticated) return <LearningState type="auth" title="Твой путь ждёт" description="Войди через Manus OAuth, чтобы открыть персональную карту уровней A0–C2." />;
  if (profileStatus.isLoading || (profileStatus.data && !profileStatus.data.exists)) return <LearningState type="loading" title="Нужен явный старт обучения" description="Проверяем учебный профиль и не создаём его автоматически." />;
  if (summary.isLoading) return <LearningState type="loading" title="Строим карту пути" description="D отмечает твой текущий этап и доступные уроки." />;
  if (summary.isError || !summary.data?.profile) return <LearningState type="error" title="Карта пока недоступна" description="Попробуй обновить страницу — сохранённый прогресс не потеряется." />;
  const xp = summary.data.profile.xp;
  const current = getLevelFromXp(xp);
  const currentIndex = levels.indexOf(current);
  const completed = summary.data?.progress.filter((item)=>item.completed===1).map((item)=>item.lessonId) ?? [];
  const isNewLearner = completed.length === 0;
  return <div className="mx-auto max-w-5xl space-y-6"><section className="appear relative overflow-hidden rounded-[2rem] bg-foreground p-6 text-background sm:p-8"><div className="relative z-10 max-w-xl"><span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-primary-foreground"><MapIcon size={14}/>Карта обучения</span><h1 className="display-font mt-4 text-3xl font-extrabold tracking-[-.06em] sm:text-4xl">От первого “Hello” к собственному голосу.</h1><p className="mt-3 leading-7 text-background/65">Каждая точка — короткая практика с понятной целью. Ты находишься на этапе {current}.</p></div><MascotD size="md" className="absolute bottom-[-18px] right-3 scale-110 sm:right-12" /></section>{isNewLearner&&<section className="rounded-[1.5rem] border border-dashed border-primary/50 bg-primary/10 p-5"><p className="text-sm font-extrabold">Карта готова. Первый узел ждёт твоего шага.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">После первого завершённого урока D начнёт отмечать твой путь на этой карте.</p></section>}<section className="relative space-y-5 before:absolute before:bottom-10 before:left-[26px] before:top-10 before:w-px before:bg-border sm:before:left-1/2">{levels.map((level,index)=>{ const open=index<=currentIndex; const levelLessons=lessons.filter((lesson)=>lesson.level===level); const first=levelLessons[0]; const done=first?completed.includes(first.id):false; return <article key={level} className={cn("appear relative grid gap-4 rounded-[1.5rem] border p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-6", open?"border-border bg-surface":"border-border/70 bg-muted/35 opacity-75")}><div className={cn("sm:text-right", index%2===0?"sm:col-start-1":"sm:col-start-3")}><p className="text-xs font-black uppercase tracking-[.14em] text-muted-foreground">{levelMeta[level].name}</p><h2 className="display-font mt-1 text-2xl font-extrabold tracking-[-.055em]">{level} · {levelMeta[level].description}</h2></div><div className="relative z-10 flex justify-center sm:col-start-2 sm:row-start-1"><span className={cn("grid h-14 w-14 place-items-center rounded-2xl border-4 text-sm font-black",open?"border-background bg-primary text-primary-foreground shadow-[0_0_0_5px_var(--primary)]":"border-background bg-muted text-muted-foreground")}>{done?<CheckCircle2 size={22}/>:open?<Sparkles size={21}/>:<LockKeyhole size={19}/>}</span></div><div className={cn(index%2===0?"sm:col-start-3":"sm:col-start-1 sm:row-start-1")}><div className="rounded-xl bg-muted/70 p-3"><p className="text-sm font-extrabold">{first?.title ?? "Скоро откроется"}</p><p className="mt-0.5 text-xs text-muted-foreground">{open?`${first?.skill ?? "Практика"} · ${first?.duration ?? 0} мин`:`Откроется после этапа ${levels[Math.max(index-1,0)]}`}</p>{open&&first?<Link href={`/lesson/${first.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-foreground underline decoration-primary decoration-2 underline-offset-4">Открыть урок <ChevronRight size={14}/></Link>:null}</div></div></article>})}</section></div>;
}
