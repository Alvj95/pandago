import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extiende app.json con valores del entorno de compilación:
 * - EXPO_BASE_URL: subruta donde se sirve la web (GitHub Pages → "/pandago").
 * - EXPO_PUBLIC_API_URL: URL del backend del tutor IA.
 * - ANDROID_VERSION_CODE: versionCode del APK (lo pone el workflow de Android).
 * - APP_VERSION: versión visible (versionName).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  // Versión visible en Google Play (p.ej. 0.1.7); el workflow la pone con el número de compilación.
  version: process.env.APP_VERSION ?? config.version,
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL ?? '' },
  // En CI cada compilación sube el versionCode para que el APK nuevo se instale encima del anterior.
  android: {
    ...config.android,
    versionCode: Number(process.env.ANDROID_VERSION_CODE ?? config.android?.versionCode ?? 1),
  },
  extra: { ...config.extra, apiUrl: process.env.EXPO_PUBLIC_API_URL || config.extra?.apiUrl },
});
