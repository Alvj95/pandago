import { useEffect, useRef, useState } from 'react';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { getAuthToken } from '@/lib/auth';
import { stopSpeaking } from '@/lib/speech';
import { assessPronunciation, type PronunciationResult } from './engine/aiClient';

export type VoiceResult = { ok: true; result: PronunciationResult; level: number } | { ok: false; message: string; level?: number };

/** Voz: AAC mono (más ligero de subir) y con medidor de volumen para detectar un micrófono mudo. */
export const VOICE_PRESET = { ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, bitRate: 96000, isMeteringEnabled: true };

/** Por debajo de este volumen máximo (dB) la grabación está prácticamente en silencio. */
export const SILENT_DB = -50;

/**
 * Micrófono de «toca para hablar, toca para terminar» con mensajes claros para
 * cada fallo (permiso, demasiado corto, silencio, sin servicio, no se oyó chino).
 */
export function useVoiceInput() {
  const recorder = useAudioRecorder(VOICE_PRESET);
  const state = useAudioRecorderState(recorder, 120);
  const [recording, setRecording] = useState(false);
  const startedAt = useRef(0);
  const peak = useRef(-160);

  // Guarda el volumen más alto mientras se graba.
  useEffect(() => {
    if (recording && typeof state.metering === 'number') peak.current = Math.max(peak.current, state.metering);
  }, [recording, state.metering]);

  /** Empieza a grabar; devuelve un mensaje si no se pudo. */
  const start = async (): Promise<string | null> => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return '🎙️ Necesito permiso para usar el micrófono. Actívalo en Ajustes → Aplicaciones → PandaGO! → Permisos.';
      stopSpeaking();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = Date.now();
      peak.current = -160;
      setRecording(true);
      return null;
    } catch (err) {
      return `🎙️ No he podido abrir el micrófono. Cierra otras apps que lo estén usando y vuelve a intentarlo. (${String(err).slice(0, 80)})`;
    }
  };

  /** Termina, sube la grabación y devuelve lo que se entendió (comparado con `expected` si se da). */
  /** `lang: 'auto'` (asistente) acepta español o chino. */
  const stop = async (expected = '', opts: { lang?: 'zh' | 'auto' } = {}): Promise<VoiceResult> => {
    const lang = opts.lang ?? 'zh';
    const seconds = (Date.now() - startedAt.current) / 1000;
    setRecording(false);
    try {
      await recorder.stop();
    } catch {
      // si ya estaba parado, seguimos con lo grabado
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    const level = peak.current;
    if (seconds < 0.8) return { ok: false, level, message: '🎙️ Ha sido muy corto. Toca el micrófono, habla y vuelve a tocar para terminar.' };
    // -160 = el medidor no informó (algunos móviles): no lo tomamos como silencio.
    if (level > -160 && level < SILENT_DB) {
      return { ok: false, level, message: `🎙️ El micrófono no capta tu voz (volumen ${Math.round(level)} dB). Habla más cerca, revisa que no esté tapado o prueba en Perfil → «Probar micrófono».` };
    }
    let result: PronunciationResult;
    try {
      result = await assessPronunciation(recorder.uri ?? '', expected, await getAuthToken(), lang);
    } catch (err) {
      return { ok: false, level, message: `🎙️ El reconocimiento de voz no ha respondido (${err instanceof Error ? err.message : String(err)}). Puedes escribir tu respuesta.` };
    }
    if (lang === 'auto' ? !result.transcript.trim() : !/\p{Script=Han}/u.test(result.transcript)) {
      return { ok: false, level, message: `🙉 No he oído nada en chino${result.transcript.trim() ? ` (entendí «${result.transcript.trim().slice(0, 40)}»)` : ''}. Habla más cerca del micrófono y un poco más alto.` };
    }
    return { ok: true, result, level };
  };

  /** Para sin evaluar (al salir de la pantalla). */
  const cancel = () => {
    if (!recording) return;
    setRecording(false);
    void recorder.stop().catch(() => undefined);
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  };

  return { recording, start, stop, cancel, recorder, metering: state.metering };
}
