"use client";

// Browser-native speech: SpeechRecognition for STT, speechSynthesis for TTS.
// Both are Web Speech APIs, so nothing is sent to our own server.
// STT works in Chrome, Edge and Safari; Firefox has TTS only.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const LANG = "ko-KR";

/* ───────────── STT ───────────── */

// lib.dom does not ship SpeechRecognition types yet, so declare the part we use.
type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
type RecognitionEvent = { resultIndex: number; results: RecognitionResultList };
type RecognitionErrorEvent = { error: string };
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

/** False during SSR and the first client render, then the real value — avoids hydration mismatches. */
function useClientValue<T>(read: () => T, server: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => server);
}

const STT_ERRORS: Record<string, string> = {
  "not-allowed": "마이크 권한이 필요해요. 브라우저 주소창에서 마이크를 허용해 주세요.",
  "service-not-allowed": "이 브라우저에서는 음성 입력을 쓸 수 없어요.",
  "audio-capture": "마이크를 찾지 못했어요.",
  network: "네트워크 문제로 음성을 인식하지 못했어요.",
  "no-speech": "말씀을 듣지 못했어요. 다시 눌러 말해 주세요.",
};

/** Streams the transcript through onTranscript: live while speaking (final=false), then once more when done (final=true). */
export function useSpeechToText({ onTranscript }: { onTranscript: (text: string, final: boolean) => void }) {
  const supported = useClientValue(() => getRecognitionCtor() !== null, false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const cbRef = useRef(onTranscript);
  useEffect(() => { cbRef.current = onTranscript; });

  useEffect(() => () => rec.current?.abort(), []);

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || rec.current) return;
    stopSpeaking(); // don't transcribe our own TTS output
    const r = new Ctor();
    r.lang = LANG;
    r.interimResults = true;
    r.continuous = false; // one utterance per press, ends on silence
    r.maxAlternatives = 1;

    let finalText = "";
    let latest = ""; // final + in-progress words, kept if stopped before the browser finalizes
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else live += res[0].transcript;
      }
      latest = (finalText + live).trim();
      cbRef.current(latest, false);
    };
    r.onerror = (e) => {
      if (e.error !== "aborted") setError(STT_ERRORS[e.error] ?? "음성 인식 중 문제가 생겼어요.");
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
      cbRef.current(finalText.trim() || latest, true);
    };

    rec.current = r;
    setError(null);
    setListening(true);
    try {
      r.start();
    } catch {
      rec.current = null;
      setListening(false);
      setError("음성 인식을 시작하지 못했어요.");
    }
  }, []);

  return { supported, listening, error, start, stop, clearError: () => setError(null) };
}

/* ───────────── TTS ───────────── */

// Natural-sounding Korean voices across platforms: Google (Chrome), Yuna (Apple), Microsoft (Edge/Windows).
const PREFERRED_VOICE = /google|유나|yuna|sunhi|heami|injoon|hyunsu/i;
// Apple's character voices (Eddy, Grandma, Rocko…) also report ko-KR; never pick them by default.
const NOVELTY_VOICE = /eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i;

function pickKoreanVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").startsWith("ko"));
  return (
    voices.find((v) => PREFERRED_VOICE.test(v.name)) ??
    voices.find((v) => !NOVELTY_VOICE.test(v.name)) ??
    voices[0]
  );
}

// Chrome cuts utterances off after ~15s, so speak sentence by sentence.
function splitSentences(text: string): string[] {
  return text.match(/[^.!?。\n]+[.!?。]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export function speak(text: string, { rate = 1, onEnd }: { rate?: number; onEnd?: () => void } = {}) {
  if (!ttsSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = pickKoreanVoice();
  const parts = splitSentences(text);
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = LANG;
    u.rate = rate;
    if (voice) u.voice = voice;
    if (i === parts.length - 1 && onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    synth.speak(u);
  });
}

/** Tracks which message is being read aloud so its button can show a stop state. */
export function useTextToSpeech(rate: number) {
  const supported = useClientValue(ttsSupported, false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);

  useEffect(() => {
    if (!supported) return;
    // Voices load asynchronously in Chrome; touching getVoices() kicks off the load.
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  const say = useCallback((id: number, text: string) => {
    setSpeakingId(id);
    speak(text, { rate, onEnd: () => setSpeakingId((cur) => (cur === id ? null : cur)) });
  }, [rate]);

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeakingId(null);
  }, []);

  return { supported, speakingId, say, stop };
}
