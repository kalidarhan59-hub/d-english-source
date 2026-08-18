import { startLogin } from "@/const";
import { AlertCircle, Loader2, LogIn } from "lucide-react";

export function LearningState({ type, title, description }: { type: "loading" | "error" | "auth"; title: string; description: string }) {
  return <section className="grid min-h-[340px] place-items-center rounded-[2rem] border border-border bg-surface p-8 text-center"><div className="max-w-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">{type === "loading" ? <Loader2 className="animate-spin" size={22}/> : type === "error" ? <AlertCircle size={22}/> : <LogIn size={22}/>}</span><h1 className="display-font mt-5 text-2xl font-extrabold tracking-[-.05em]">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{type === "auth" && <button onClick={() => startLogin()} className="mt-5 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground">Войти через Manus</button>}</div></section>;
}
