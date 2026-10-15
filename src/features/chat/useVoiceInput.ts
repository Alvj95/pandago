import { useRef, useState } from 'react';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { getAuthToken } from '@/lib/auth';
import { stopSpeaking } from '@/lib/speech';
import { assessPronunciation, type PronunciationResult } from './engine/aiClient';

export type VoiceResult = { ok: true; result: PronunciationResult } | { ok: false; message: string };

/**
 * Micrófono de «toca para hablar, toca para terminar» con mensajes claros para
 * cada fallo (permiso, demasiado corto, sin servicio, no se oyó chino).
 * Lo usan la llamada con Bao y la práctica de pronunciación.
 */
export function useVoiceInput() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const startedAt = useRef(0);

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
      setRecording(true);
      return null;
    } catch {
      return '🎙️ No he podido abrir el micrófono. Cierra otras apps que lo estén usando y vuelve a intentarlo.';
    }
  };

  /** Termina, sube la grabación y devuelve lo que se entendió (comparado con `expected` si se da). */
  const stop = async (expected = ''): Promise<VoiceResult> => {
    const seconds = (Date.now() - startedAt.current) / 1000;
    setRecording(false);
    try {
      await recorder.stop();
    } catch {
      // si ya estaba parado, seguimos con lo grabado
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    if (seconds < 0.8) return { ok: false, message: '🎙️ Ha sido muy corto. Toca el micrófono, habla y vuelve a tocar para terminar.' };
    let result: PronunciationResult;
    try {
      result = await assessPronunciation(recorder.uri ?? '', expected, await getAuthToken());
    } catch {
      return { ok: false, message: '🎙️ El reconocimiento de voz no está disponible ahora mismo (sin conexión o se acabó la cuota del día).' };
    }
    if (!/\p{Script=Han}/u.test(result.transcript)) return { ok: false, message: '🙉 No he oído nada en chino. Habla más cerca del micrófono y un poco más alto.' };
    return { ok: true, result };
  };

  /** Para sin evaluar (al salir de la pantalla). */
  const cancel = () => {
    if (!recording) return;
    setRecording(false);
    void recorder.stop().catch(() => undefined);
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
  };

  return { recording, start, stop, cancel };
}
