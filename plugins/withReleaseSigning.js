/**
 * Plugin de Expo: firma de las compilaciones release con la clave de subida
 * de Google Play. Los datos se leen de variables de entorno (secretos de
 * GitHub Actions), nunca del repositorio:
 *   ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
 * Sin esas variables, release se sigue firmando con la clave de depuración
 * (útil para probar el APK, pero Google Play lo rechazaría).
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const SIGNING = `
        release {
            if (System.getenv('ANDROID_KEYSTORE_PATH')) {
                storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes("System.getenv('ANDROID_KEYSTORE_PATH')")) return cfg;

    // 1) Añade signingConfigs.release justo después del bloque debug.
    const debugBlock = /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/m;
    if (!debugBlock.test(gradle)) throw new Error('withReleaseSigning: no se encontró signingConfigs.debug');
    gradle = gradle.replace(debugBlock, `$1${SIGNING}`);

    // 2) El buildType release usa la clave de subida si está disponible.
    const releaseUsesDebug = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/m;
    if (!releaseUsesDebug.test(gradle)) throw new Error('withReleaseSigning: no se encontró la firma de release');
    gradle = gradle.replace(
      releaseUsesDebug,
      "$1signingConfig System.getenv('ANDROID_KEYSTORE_PATH') ? signingConfigs.release : signingConfigs.debug",
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
