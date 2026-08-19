import { beginEnglishSpeech, extractEnglishText } from "../../../shared/speech";
import { getSpeechRate } from "@/lib/speechSettings";
import { Volume2, VolumeX } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SpeakEnglishButton({ text, className, label = "Озвучить по-английски", showLabel = false }: { text: string; className?: string; label?: string; showLabel?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const englishText = extractEnglishText(text);
  if (!englishText) return null;
  const speak = () => {
    const result = beginEnglishSpeech(englishText, window.speechSynthesis, (value) => new SpeechSynthesisUtterance(value), getSpeechRate());
    if (result.status === "unsupported") {
      toast.error("Озвучивание недоступно. Открой сайт в Chrome или Safari и проверь звук на устройстве.");
      return;
    }
    if (result.status === "empty") return;
    const utterance = result.utterance;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => { setPlaying(false); toast.error("Не удалось воспроизвести озвучку. Проверь звук или открой сайт в Chrome/Safari."); };
  };
  return <button type="button" onClick={speak} className={cn("inline-flex shrink-0 items-center justify-center gap-1 rounded-lg p-2 text-primary transition-colors hover:bg-primary/12 disabled:opacity-60", className)} aria-label={label} title={label} disabled={playing}>{playing ? <VolumeX size={16}/> : <Volume2 size={16}/>} {showLabel && <span className="text-xs font-extrabold">{playing ? "Играет…" : "Слушать"}</span>}</button>;
}
