import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageCircle, Send, Sparkles, Volume2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MascotD } from "./MascotD";
import { toast } from "sonner";
import { canUseSpeechSynthesis } from "../../../shared/speech";

type Message = { role: "user" | "d"; text: string };

export function DChat() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "d", text: "Я D. Нужна подсказка по уроку или короткое объяснение?" }]);
  const ask = trpc.dChat.ask.useMutation({
    onSuccess: (data) => setMessages((items) => [...items, { role: "d", text: data.reply }]),
    onError: () => setMessages((items) => [...items, { role: "d", text: "Я рядом, но сейчас не могу ответить. Попробуй ещё раз через минуту." }]),
  });

  const submit = () => {
    const message = text.trim();
    if (!message || ask.isPending) return;
    setText("");
    setMessages((items) => [...items, { role: "user", text: message }]);
    ask.mutate({ message });
  };

  const speak = (text: string) => {
    if (!canUseSpeechSynthesis(window.speechSynthesis)) {
      toast.error("Озвучивание D недоступно в этом браузере. Продолжай с текстовой подсказкой.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[а-яё]/i.test(text) ? "ru-RU" : "en-US";
    utterance.rate = 0.9;
    utterance.onerror = () => toast.error("Не удалось озвучить ответ D. Текст ответа остаётся доступным в чате.");
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <section className="mb-3 flex h-[420px] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_22px_60px_rgba(8,8,8,0.25)]" aria-label="Чат с помощником D">
          <header className="flex items-center gap-3 border-b border-border bg-foreground px-4 py-3 text-background">
            <MascotD size="sm" className="-my-2" alt="" />
            <div className="min-w-0 flex-1"><p className="font-extrabold">D, твой помощник</p><p className="text-xs text-background/65">Подсказки и объяснения</p></div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 transition-colors hover:bg-background/10" aria-label="Закрыть чат"><X size={18} /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!isAuthenticated && <div className="rounded-2xl bg-primary/15 p-3 text-sm leading-5 text-foreground"><Sparkles size={15} className="mb-1 text-primary" />Войди через Manus, чтобы задать D свой вопрос и сохранить прогресс.</div>}
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={cn("max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-5", message.role === "d" ? "bg-muted text-foreground" : "ml-auto bg-primary text-primary-foreground")}><div className="flex items-start gap-2"><span className="flex-1">{message.text}</span>{message.role === "d" && <button onClick={() => speak(message.text)} className="mt-0.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground" aria-label="Озвучить ответ D"><Volume2 size={15}/></button>}</div></div>)}
            {ask.isPending && <div className="w-fit rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">D подбирает пример…</div>}
          </div>
          <form className="flex gap-2 border-t border-border p-3" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <Input value={text} onChange={(event) => setText(event.target.value)} placeholder={isAuthenticated ? "Спроси D…" : "Войди, чтобы написать"} disabled={!isAuthenticated || ask.isPending} className="h-10 rounded-xl bg-background" />
            <Button type="submit" size="icon" className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/85" disabled={!isAuthenticated || !text.trim() || ask.isPending}><Send size={17} /></Button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen(!open)} className="group flex h-14 items-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-extrabold text-background shadow-[0_12px_28px_rgba(8,8,8,0.28)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]" aria-label="Открыть чат с D"><MessageCircle size={18} className="text-primary" /><span className="hidden sm:inline">Спроси D</span></button>
    </div>
  );
}
