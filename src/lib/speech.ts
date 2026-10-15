import { type AudioPlayer, createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { API_URL, hasServer } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Voz de Bao. Por defecto, una voz china natural generada en el servidor
 * (MeloTTS en Cloudflare Workers AI); sin internet, o si el usuario lo elige,
 * la voz del sistema (Android/iOS necesitan tener instalada una voz china).
 */
let chineseVoice: Promise<boolean> | null = null;

export function hasChineseVoice(): Promise<boolean> {
  chineseVoice ??= Speech.getAvailableVoicesAsync()
    .then((voices) => voices.length === 0 || voices.some((v) => /^(zh|cmn)/i.test(v.language)))
    .catch(() => true); // si no se puede consultar, no molestamos con el aviso
  return chineseVoice;
}

/** El móvil necesita voz china instalada solo si Bao usa la voz del sistema. */
export const needsDeviceVoice = () => useSettingsStore.getState().voiceStyle === 'device' || !hasServer;

/** Velocidad de la voz del sistema (0.85 ≈ normal) → velocidad de reproducción del audio natural. */
export const playbackRateFor = (rate: number, slow: boolean) => Math.max(0.5, Math.min(1, rate / 0.85)) * (slow ? 0.8 : 1);

export const ttsUrl = (text: string) => `${API_URL}/v1/speech/tts?text=${encodeURIComponent(text)}`;

let player: AudioPlayer | null = null;
let session = 0;
/** Si el servidor falla, durante un rato se usa directamente la voz del móvil. */
let naturalBrokenUntil = 0;

function stopPlayer() {
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // ya estaba liberado
  }
  player = null;
}

function speakDevice(text: string, rate: number, slow: boolean, onDone?: () => void) {
  Speech.speak(text, { language: 'zh-CN', rate: rate * (slow ? 0.75 : 1), onDone });
}

/** Habla en mandarín. `force` ignora el ajuste (cuando el usuario toca un 🔊 a propósito). */
export function speakChinese(text: string, opts: { rate?: number; force?: boolean; onDone?: () => void } = {}) {
  const { voice, voiceStyle, slowVoice } = useSettingsStore.getState();
  if (!opts.force && !voice) return;
  const rate = opts.rate ?? 0.85;
  const id = ++session;
  Speech.stop();
  stopPlayer();
  if (voiceStyle === 'device' || !hasServer || Date.now() < naturalBrokenUntil || !text.trim() || text.length > 200) {
    speakDevice(text, rate, slowVoice, opts.onDone);
    return;
  }
  let finished = false;
  const fallback = () => {
    if (finished || id !== session) return;
    finished = true;
    naturalBrokenUntil = Date.now() + 60_000;
    stopPlayer();
    speakDevice(text, rate, slowVoice, opts.onDone);
  };
  try {
    const p = createAudioPlayer({ uri: ttsUrl(text) });
    player = p;
    const playbackRate = playbackRateFor(rate, slowVoice);
    let rateSet = false;
    p.setPlaybackRate(playbackRate, 'high');
    // Si en 6 s no ha empezado a sonar (sin red, cuota agotada…), habla la voz del móvil.
    const timer = setTimeout(() => {
      if (!p.playing && !p.currentTime) fallback();
    }, 6000);
    p.addListener('playbackStatusUpdate', (status) => {
      if (id !== session || finished) return;
      // En Android la velocidad solo se aplica de verdad una vez cargado el audio.
      if (status.isLoaded && !rateSet && playbackRate !== 1) {
        rateSet = true;
        p.setPlaybackRate(playbackRate, 'high');
      }
      if (status.didJustFinish) {
        finished = true;
        clearTimeout(timer);
        stopPlayer();
        opts.onDone?.();
      }
    });
    p.play();
  } catch {
    fallback();
  }
}

export function stopSpeaking() {
  session++;
  Speech.stop();
  stopPlayer();
}
