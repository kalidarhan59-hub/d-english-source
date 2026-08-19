import { SpeakEnglishButton } from "@/components/SpeakEnglishButton";
import { cn } from "@/lib/utils";
import { Mic, RotateCcw, Square, Volume2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type RecordingState = "idle" | "recording" | "ready" | "error";

function recordingError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Микрофон заблокирован. Разреши доступ к микрофону в настройках браузера и попробуй снова.";
  if (name === "NotFoundError") return "Микрофон не найден. Подключи гарнитуру или проверь настройки устройства.";
  return "Запись голоса недоступна в этом браузере. Попробуй открыть сайт в Chrome или Safari.";
}

export function PronunciationPractice({ phrase }: { phrase: string }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("Сначала послушай оригинал, затем запиши свой вариант.");

  const clearRecording = () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl(null);
    setState("idle");
    setMessage("Можно записать новую попытку и сравнить её с оригиналом.");
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => { stopTracks(); if (recordingUrl) URL.revokeObjectURL(recordingUrl); }, [recordingUrl]);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setMessage("Запись голоса недоступна. Открой сайт в Chrome или Safari и разреши доступ к микрофону.");
      return;
    }
    try {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stopTracks();
        if (!audio.size) { setState("error"); setMessage("Не удалось получить запись. Проверь микрофон и повтори попытку."); return; }
        setRecordingUrl(URL.createObjectURL(audio));
        setState("ready");
        setMessage("Готово. Прослушай свой вариант, затем ещё раз включи оригинал и сравни ритм и звуки.");
      };
      recorder.start();
      setState("recording");
      setMessage("Идёт запись. Произнеси фразу целиком, затем нажми «Остановить».");
    } catch (error) {
      stopTracks();
      setState("error");
      setMessage(recordingError(error));
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  return <section className="mt-6 rounded-2xl border border-primary/35 bg-primary/7 p-4" aria-label="Тренировка произношения"><div className="flex items-start gap-3"><span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl", state === "recording" ? "bg-destructive text-white animate-pulse" : "bg-primary text-primary-foreground")}><Mic size={18}/></span><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Сравни своё произношение</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Оригинал: <span className="font-bold text-foreground">{phrase}</span></p><p className="mt-2 text-xs leading-5 text-muted-foreground" role="status">{message}</p></div></div><div className="mt-4 flex flex-wrap items-center gap-2"><SpeakEnglishButton text={phrase} label="Прослушать оригинальное произношение" showLabel className="bg-foreground text-primary"/>{state !== "recording" && <button type="button" onClick={start} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.97]"><Mic size={16}/>{recordingUrl ? "Записать ещё раз" : "Записать голос"}</button>}{state === "recording" && <button type="button" onClick={stop} className="inline-flex h-10 items-center gap-2 rounded-xl bg-destructive px-3.5 text-sm font-extrabold text-white transition-transform active:scale-[0.97]"><Square size={15} fill="currentColor"/>Остановить</button>}{recordingUrl && <button type="button" onClick={clearRecording} className="icon-button bg-background" aria-label="Удалить запись и начать заново"><RotateCcw size={16}/></button>}</div>{recordingUrl && <div className="mt-3 flex items-center gap-2 rounded-xl bg-background p-3"><Volume2 size={18} className="text-primary"/><audio className="h-9 min-w-0 flex-1" controls src={recordingUrl}>Твой браузер не поддерживает воспроизведение записи.</audio></div>}</section>;
}
