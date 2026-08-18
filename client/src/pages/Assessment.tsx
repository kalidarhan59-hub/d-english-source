import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { LearningState } from "@/components/LearningState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, Headphones, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Assessment() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const profileStatus = trpc.academy.profileStatus.useQuery(undefined, { enabled: isAuthenticated });
  const workspace = trpc.academy.workspace.useQuery(undefined, { enabled: isAuthenticated && profileStatus.data?.exists === true });
  const start = trpc.academy.startAssessment.useMutation();
  const answerAssessment = trpc.academy.answerAssessment.useMutation();
  const submit = trpc.academy.submitAssessment.useMutation();
  const [session, setSession] = useState<Awaited<ReturnType<typeof start.mutateAsync>> | null>(null);
  const [current, setCurrent] = useState<Awaited<ReturnType<typeof start.mutateAsync>>["questions"][number] | null>(null);
  const [servedCount, setServedCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState("");
  const [careerTrack, setCareerTrack] = useState("Engineering");
  const [result, setResult] = useState<Awaited<ReturnType<typeof submit.mutateAsync>> | null>(null);
  const [playing, setPlaying] = useState(false);
  const isDiagnosed = workspace.data?.profile?.diagnosticComplete === 1;
  const isIeltsWindow = workspace.data?.plan?.phase === "ielts";

  useEffect(() => {
    if (profileStatus.data && !profileStatus.data.exists) setLocation("/onboarding");
    else if (isDiagnosed && !isIeltsWindow && !session) setLocation("/academy");
  }, [isDiagnosed, isIeltsWindow, profileStatus.data, session, setLocation]);

  if (!isAuthenticated) return <AppShell><LearningState type="auth" title="Сначала нужен вход" description="Диагностика хранится в твоём защищённом учебном профиле." /></AppShell>;
  if (profileStatus.isLoading) return <AppShell><LearningState type="loading" title="Проверяем учебный профиль" description="D не создаёт профиль автоматически." /></AppShell>;
  if (profileStatus.data && !profileStatus.data.exists) return <AppShell><LearningState type="loading" title="Нужен явный старт обучения" description="Перенаправляем на подтверждение создания учебного профиля." /></AppShell>;
  if (workspace.isLoading) return <AppShell><LearningState type="loading" title="Подготавливаем оценку" description="D собирает вопросы разной сложности для точной стартовой точки." /></AppShell>;
  if (workspace.isError || !workspace.data) return <AppShell><LearningState type="error" title="Оценка недоступна" description="Попробуй обновить страницу и начать оценку ещё раз." /></AppShell>;

  const speak = () => {
    if (!current) return;
    if (!window.speechSynthesis) {
      toast.error("Озвучивание недоступно в этом браузере. Используй текстовый вариант задания.");
      return;
    }
    window.speechSynthesis.cancel();
    const phrase = current.id === "l2" ? "The data suggests a significant improvement." : "I study English every morning.";
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.78;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => { setPlaying(false); toast.error("Не удалось воспроизвести аудио. Используй текстовый вариант задания."); };
    window.speechSynthesis.speak(utterance);
  };
  const begin = async () => {
    const next = await start.mutateAsync({ type: isDiagnosed ? "ielts" : "diagnostic" });
    setSession(next);
    setCurrent(next.questions[0] ?? null);
    setServedCount(1);
    setAnswer("");
    setAnswers({});
  };
  const finish = async (finalAnswers: Record<string, string>) => {
    if (!session) return;
    const data = await submit.mutateAsync({ attemptId: session.id, answers: finalAnswers, careerTrack });
    setResult(data);
    setCurrent(null);
  };
  const continueAdaptive = async () => {
    if (!session || !current || !answer.trim()) return;
    const nextAnswers = { ...answers, [current.id]: answer };
    setAnswers(nextAnswers);
    const outcome = await answerAssessment.mutateAsync({ attemptId: session.id, questionId: current.id, answer });
    if (outcome.nextQuestion) {
      setCurrent(outcome.nextQuestion);
      setServedCount(outcome.servedCount);
      setAnswer("");
    } else {
      await finish(nextAnswers);
    }
  };

  if (result) {
    const isIelts = session?.type === "ielts";
    return <AppShell><div className="mx-auto max-w-3xl"><section className="relative overflow-hidden rounded-[2rem] bg-foreground p-7 text-background sm:p-10"><div className="relative z-10 max-w-xl"><span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-primary-foreground"><CheckCircle2 size={15}/>{isIelts ? "IELTS checkpoint" : "Диагностика завершена"}</span><h1 className="display-font mt-5 text-4xl font-extrabold tracking-[-.065em]">{isIelts ? `Твой IELTS ориентир — band ${result.ieltsBand}.` : `Твой стартовый уровень — ${result.level}.`}</h1><p className="mt-3 text-background/70">Точность: {result.score}%. {isIelts ? "Теперь D переключила долгосрочный план на профессиональный английский по выбранному направлению." : "D составила маршрут: Academic English, затем IELTS и профессиональный английский."}</p><Button onClick={() => setLocation("/academy")} className="mt-7 h-12 rounded-xl bg-primary px-5 font-extrabold text-primary-foreground">Открыть учебный кабинет <ChevronRight size={17}/></Button></div></section><div className="mt-6 space-y-2">{result.corrections.map((item) => <div key={item.id} className={cn("rounded-xl border p-4 text-sm", item.correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-surface")}><p className="font-extrabold">{item.correct ? "Верно" : "Нужно повторить"}</p>{!item.correct && <p className="mt-1 leading-6 text-muted-foreground">{item.explanation}</p>}</div>)}</div></div></AppShell>;
  }

  if (!session || !current) {
    const title = isDiagnosed ? "Academic English завершён. Проверь IELTS уровень." : "Сначала определим твой уровень.";
    const body = isDiagnosed ? "IELTS checkpoint выдаёт задания разной сложности и сохраняет ориентир по band score. После этого профессиональный трек становится основным." : "После каждого ответа D выбирает следующий вопрос: верный ответ повышает сложность, а сложный момент возвращает к проверке основы. Так стартовый уровень определяется точнее.";
    return <AppShell><div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-[2rem] bg-foreground p-7 text-background sm:p-10"><span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-primary-foreground"><Sparkles size={14}/>{isDiagnosed ? "IELTS checkpoint" : "Обязательная оценка"}</span><h1 className="display-font mt-5 text-4xl font-extrabold tracking-[-.065em]">{title}</h1><p className="mt-4 max-w-xl leading-7 text-background/70">{body}</p><Button onClick={begin} disabled={start.isPending} className="mt-8 h-13 rounded-xl bg-primary px-5 font-extrabold text-primary-foreground">{start.isPending ? "Собираем задания…" : isDiagnosed ? "Начать IELTS тест" : "Начать оценку"}<ChevronRight size={17}/></Button></section><section className="rounded-[2rem] border border-border bg-surface p-7"><p className="text-sm font-extrabold">{isDiagnosed ? "Твой текущий план" : "Твой будущий трек"}</p><h2 className="display-font mt-2 text-2xl font-extrabold tracking-[-.05em]">{isDiagnosed ? `Academic English · месяц ${Math.min(workspace.data.plan.monthsElapsed + 1, 5)}` : "Какая область тебе нужна после IELTS?"}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{isDiagnosed ? "На тесте оцениваются навыки, которые определяют ориентир band score. Он будет использоваться в профессиональном плане." : "Мы используем эту область, чтобы после Academic English и IELTS собрать профессиональные задания и кейсы."}</p>{!isDiagnosed && <><Input value={careerTrack} onChange={(event) => setCareerTrack(event.target.value)} className="mt-6 h-12 rounded-xl" placeholder="Например, Engineering или Biology"/><p className="mt-3 text-xs leading-5 text-muted-foreground">Примеры: Engineering, Chemistry & Biology, Design, Finance, IT, Medicine.</p></>}</section></div></AppShell>;
  }

  const canContinue = Boolean(answer.trim());
  return <AppShell><div className="mx-auto max-w-3xl"><div className="mb-5 flex items-center justify-between text-sm font-bold text-muted-foreground"><span>Адаптивная диагностика</span><span>Вопрос {servedCount} из {session.questions.length}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(servedCount / session.questions.length) * 100}%` }} /></div><section className="mt-6 rounded-[2rem] border border-border bg-surface p-6 shadow-[0_16px_38px_rgba(20,20,20,.05)] sm:p-8"><p className="text-xs font-black uppercase tracking-[.15em] text-primary">{current.skill} · {current.difficulty === "stretch" ? "сложный уровень" : "основа"}</p><h1 className="display-font mt-2 text-2xl font-extrabold tracking-[-.055em] sm:text-3xl">{current.prompt}</h1>{current.support && <p className="mt-3 text-sm leading-6 text-muted-foreground">{current.support}</p>}{current.skill === "listening" && <button onClick={speak} className="mt-6 inline-flex h-14 items-center gap-2 rounded-xl bg-foreground px-4 font-extrabold text-primary"><Headphones size={19}/>{playing ? "Воспроизводится…" : "Прослушать фразу"}<Play size={15}/></button>}{current.type === "choice" ? <div className="mt-7 grid gap-2">{current.options?.map((option) => <button key={option} onClick={() => setAnswer(option)} className={cn("min-h-14 rounded-xl border px-4 text-left text-sm font-bold transition-colors", answer === option ? "border-primary bg-primary/15" : "border-border hover:border-foreground/25")}>{option}</button>)}</div> : <Input value={answer} onChange={(event) => setAnswer(event.target.value)} className="mt-7 h-14 rounded-xl text-base" placeholder="Введи ответ на английском"/>}<div className="mt-8 flex justify-end"><Button onClick={continueAdaptive} disabled={!canContinue || answerAssessment.isPending || submit.isPending} className="h-12 rounded-xl bg-primary px-5 font-extrabold text-primary-foreground">{answerAssessment.isPending ? "D выбирает следующий уровень…" : servedCount === session.questions.length ? "Завершить оценку" : "Проверить и продолжить"}<ChevronRight size={17}/></Button></div></section></div></AppShell>;
}
