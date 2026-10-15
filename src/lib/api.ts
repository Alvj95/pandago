import Constants from 'expo-constants';

/** Dirección del servidor de PandaGO! (tutor IA, voz de Bao y reconocimiento de voz). */
export const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8787';

/** Hay un servidor configurado de verdad (no el de desarrollo local). */
export const hasServer = !API_URL.includes('localhost');
