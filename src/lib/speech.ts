import * as Speech from 'expo-speech';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Voz de Bao (texto a voz del sistema). Android/iOS necesitan tener instalada
 * una voz china; si no la hay, `hasChineseVoice()` devuelve false para avisar.
 */
let chineseVoice: Promise<boolean> | null = null;

export function hasChineseVoice(): Promise<boolean> {
  chineseVoice ??= Speech.getAvailableVoicesAsync()
    .then((voices) => voices.length === 0 || voices.some((v) => /^(zh|cmn)/i.test(v.language)))
    .catch(() => true); // si no se puede consultar, no molestamos con el aviso
  return chineseVoice;
}

/** Habla en mandarín. `force` ignora el ajuste (cuando el usuario toca un 🔊 a propósito). */
export function speakChinese(text: string, opts: { rate?: number; force?: boolean; onDone?: () => void } = {}) {
  if (!opts.force && !useSettingsStore.getState().voice) return;
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', rate: opts.rate ?? 0.85, onDone: opts.onDone });
}

export const stopSpeaking = () => Speech.stop();
