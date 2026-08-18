import { useAuth } from "@/_core/hooks/useAuth";
import { DMark, StreakPill } from "@/components/AppShell";
import { LearningState } from "@/components/LearningState";
import { MascotD } from "@/components/MascotD";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BookOpen, CheckCircle2, ChevronRight, Flame, GraduationCap, LockKeyhole, Sparkles, Target, Trophy } from "lucide-react";
import { Link } from "wouter";
import { getLevelProgress, getNextLesson, lessons, levelMeta, type LevelCode } from "../../../shared/learning";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const summary = trpc.learning.summary.useQuery(undefined, { enabled: isAuthenticated });
  if (!isAuthenticated) return <LearningState type="auth" title="Сохрани свой учебный путь" description="Войди через Manus OAuth, чтобы видеть статистику, открывать уроки и сохранять каждый шаг." />;
  if (summary.isLoading) return <LearningState type="loading" title="Собираем твою статистику" description="D готовит маршрут и проверяет твой учебный прогресс." />;
  if (summary.isError || !summary.data?.profile) return <LearningState type="error" title="Не удалось загрузить прогресс" description="Попробуй обновить страницу. Твои сохранённые уроки останутся на месте." />;
  const profile = summary.data?.profile;
  const completedIds = summary.data?.progress.filter((item) => item.completed === 1).map((item) => item.lessonId) ?? [];
  const xp = profile.xp;
  const level = profile.currentLevel as LevelCode;
  const streak = profile.streak;
  const completed = profile.completedLessons;
  const isNewLearner = completed === 0;
  const next = getNextLesson(completedIds) ?? lessons[0];
  const progress = getLevelProgress(xp, level);
  const name = user?.name?.split(" ")[0] ?? "Друг";

  return <div className="space-y-6 lg:space-y-8">
    <section className="appear grid gap-6 rounded-[2rem] border border-border bg-surface p-5 shadow-[0_14px_35px_rgba(20,20,20,0.05)] sm:p-7 lg:grid-cols-[1.25fr_.75fr] lg:p-9">
      <div><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-muted-foreground">Твоя учебная база</p><h1 className="display-font mt-1 text-3xl font-extrabold tracking-[-.055em] sm:text-4xl">Привет, {name}.</h1></div><StreakPill streak={streak} /></div><div className="mt-7 rounded-2xl bg-foreground p-5 text-background sm:p-6"><div className="flex items-start justify-between gap-3"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-black uppercase tracking-[.12em] text-primary-foreground">Рекомендуем</span><h2 className="mt-3 text-xl font-extrabold">{next.title}</h2><p className="mt-1 text-sm text-background/65">{next.subtitle} · {next.duration} минут</p></div><BookOpen className="shrink-0 text-primary" size={28} /></div><Link href={`/lesson/${next.id}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.97]">Начать урок <ChevronRight size={17} /></Link></div></div>
      <div className="relative min-h-[240px] overflow-hidden rounded-[1.6rem] bg-primary p-5 text-primary-foreground sm:min-h-[270px]"><div className="relative z-10"><p className="text-xs font-black uppercase tracking-[.15em] opacity-70">Состояние D</p><p className="mt-2 text-lg font-extrabold">Спокойно. Собранно. Вперёд.</p><DMark /></div><MascotD size="md" mood="proud" className="absolute bottom-[-12px] right-2 scale-125 sm:right-8" /></div>
    </section>

    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">{[{label:"Опыт", value:xp, suffix:"XP", icon:Sparkles, tone:"bg-primary/18 text-primary-foreground"},{label:"Серия", value:streak, suffix:"дня", icon:Flame, tone:"bg-orange-500/15 text-orange-700 dark:text-orange-300"},{label:"Уроки", value:completed, suffix:"пройдено", icon:CheckCircle2, tone:"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"},{label:"Уровень", value:level, suffix:levelMeta[level].name, icon:GraduationCap, tone:"bg-violet-500/15 text-violet-700 dark:text-violet-300"}].map(({label,value,suffix,icon:Icon,tone}, i)=><article key={label} className={cn("metric-card appear", `delay-${i}`)}><div className={cn("grid h-9 w-9 place-items-center rounded-xl",tone)}><Icon size={17}/></div><p className="mt-4 text-2xl font-black tracking-[-.05em]">{value}</p><p className="mt-0.5 text-xs font-bold text-muted-foreground">{label} · {suffix}</p></article>)}</section>

    {isNewLearner && <section className="flex flex-col gap-4 rounded-[1.5rem] border border-dashed border-primary/50 bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles size={18}/></span><div><h2 className="text-base font-extrabold">Твоя история начнётся с первого урока.</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Здесь появятся XP, завершённые темы и достижения. Начни с короткой практики — D будет рядом.</p></div></div><Link href={`/lesson/${next.id}`} className="shrink-0 rounded-xl bg-primary px-4 py-3 text-center text-sm font-extrabold text-primary-foreground">Открыть урок</Link></section>}

    <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-[1.6rem] border border-border bg-surface p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-muted-foreground">Текущий уровень</p><h2 className="display-font mt-1 text-2xl font-extrabold tracking-[-.05em]">{level} · {levelMeta[level].name}</h2></div><Link href="/journey" className="icon-button bg-muted"><ArrowUpRight size={18}/></Link></div><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{levelMeta[level].description}. Продолжай в комфортном ритме — новый этап откроется сам.</p><div className="mt-6"><div className="mb-2 flex items-center justify-between text-xs font-bold"><span>До следующего этапа</span><span>{progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{width:`${progress}%`}}/></div></div><div className="mt-5 flex items-center justify-between rounded-2xl bg-muted p-4"><div><p className="text-xs font-bold text-muted-foreground">Следующая цель</p><p className="mt-1 text-sm font-extrabold">Завершить 2 коротких урока</p></div><Target className="text-primary" size={23}/></div></article>
      <article className="rounded-[1.6rem] border border-border bg-surface p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-muted-foreground">Ближайшие уроки</p><h2 className="mt-1 text-xl font-extrabold">На твоём пути</h2></div><Trophy className="text-primary" size={23}/></div><div className="mt-5 space-y-2">{lessons.slice(0,3).map((lesson, index)=>{const done=completedIds.includes(lesson.id); const locked=index>1&&!done; return <Link href={locked?"/journey":`/lesson/${lesson.id}`} key={lesson.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted"><span className={cn("grid h-9 w-9 place-items-center rounded-xl text-xs font-black", done?"bg-emerald-500/15 text-emerald-600":locked?"bg-muted text-muted-foreground":"bg-primary text-primary-foreground")}>{done?<CheckCircle2 size={17}/>:locked?<LockKeyhole size={15}/>:lesson.level}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{lesson.title}</span><span className="block truncate text-xs text-muted-foreground">{lesson.skill} · {lesson.duration} мин</span></span><ChevronRight size={17} className="text-muted-foreground"/></Link>})}</div></article>
    </section>
  </div>;
}
