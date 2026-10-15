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
