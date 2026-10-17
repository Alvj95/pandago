import Constants from 'expo-constants';

/**
 * Dirección del servidor de PandaGO! (tutor IA, voz de Bao y reconocimiento de voz).
 * EXPO_PUBLIC_API_URL se incrusta al compilar (web y móvil); en la web
 * `expoConfig.extra` no existe, así que no basta con app.config.
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL || (Constants.expoConfig?.extra?.apiUrl as string | undefined) || 'http://localhost:8787';

/** Hay un servidor configurado de verdad (no el de desarrollo local). */
export const hasServer = !API_URL.includes('localhost');

/** Comprueba si el móvil llega al servidor de Bao (para dar un motivo claro cuando algo falla). */
export async function checkServer(timeoutMs = 8000): Promise<{ ok: boolean; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    return res.ok ? { ok: true, detail: `el servidor responde (${Date.now() - t0} ms)` } : { ok: false, detail: `el servidor respondió con error HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: controller.signal.aborted ? `el servidor no respondió en ${timeoutMs / 1000} s` : `no se pudo conectar (${String(err).slice(0, 100)})` };
  } finally {
    clearTimeout(timer);
  }
}
