# Publicar PandaGO! en Google Play — paso a paso

Todo lo técnico ya está preparado en el repositorio. Esta guía es lo que se hace **a mano en Play Console** (unos 45-60 min la primera vez).

## 0. Antes de empezar (una sola vez)

1. **Secretos de firma en GitHub.** En https://github.com/Alvj95/pandago/settings/secrets/actions añade los 4 secretos del archivo `SECRETOS-GITHUB.txt` (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Guarda ese archivo y `pandago-upload.keystore` en un lugar seguro; **nunca** los subas al repositorio.
2. **Generar el AAB.** En https://github.com/Alvj95/pandago/actions → *Build Android* → **Run workflow** (o haz cualquier cambio en `main`). Al terminar (~15 min), la Release nueva incluye **`PandaGO.aab`**: ese es el archivo para Google Play.
   - El APK de esa Release ya va firmado con tu clave de subida: si tenías instalado un APK anterior, desinstálalo una vez antes de instalar el nuevo.

## 1. Crear la app

Play Console → **Crear aplicación**:
- Nombre: `PandaGO! Aprende chino` · Idioma predeterminado: **Español (España) – es-ES**
- Tipo: **Aplicación** · Gratuita o de pago: **Gratuita**
- Acepta las declaraciones y pulsa **Crear aplicación**.

## 2. Configurar la app (menú "Panel" → "Configura tu aplicación")

| Sección | Qué responder |
| --- | --- |
| **Política de privacidad** | `https://alvj95.github.io/pandago/privacidad.html` |
| **Acceso a la aplicación** | *Todas las funciones están disponibles sin restricciones de acceso* (no hay inicio de sesión). |
| **Anuncios** | *No, mi aplicación no contiene anuncios.* |
| **Clasificación de contenido** | Categoría **Educación / Referencia**. Responde **No** a violencia, sexo, lenguaje, drogas, juego. A "¿los usuarios pueden interactuar o intercambiar contenido?": **No** (el chat es con el tutor, no con otras personas). Resultado esperado: PEGI 3 / Para todos. |
| **Público objetivo** | Recomendado **13 años o más** (13-15, 16-17, 18+). Incluir menores de 13 activa la política de Familias, más estricta con el chat con IA. |
| **Aplicación de noticias / COVID / gobierno / finanzas / salud** | No |
| **Seguridad de los datos** | Ver la sección 3. |

## 3. Seguridad de los datos (Data safety)

Respuestas que corresponden a la versión actual:

- **¿Tu app recoge o comparte alguno de los tipos de datos de usuario requeridos?** → **Sí** (por el micrófono y el chat, aunque solo se usan si el tutor de IA está activo).
  - **Audio → Grabaciones de voz o sonido**: *Recogidos*, **no compartidos**, *procesamiento efímero* ✔, **opcional** (el usuario decide grabar), finalidad: **Funcionalidad de la app**.
  - **Mensajes de la app → Otros mensajes en la app** (lo que se escribe en el chat con Bao): *Recogidos*, **no compartidos**, *procesamiento efímero* ✔, opcional, finalidad: **Funcionalidad de la app**.
- **¿Los datos se cifran en tránsito?** → **Sí** (HTTPS).
- **¿Los usuarios pueden pedir que se borren sus datos?** → **Sí**: el progreso está en el dispositivo y se borra desinstalando o borrando los datos de la app; los mensajes y audios no se conservan.

> Mientras el servidor del tutor de IA no esté publicado, en la práctica no sale nada del móvil. Si más adelante se añaden cuentas, analítica o se guardan conversaciones, hay que actualizar esta sección y la política de privacidad.

## 4. Ficha de la tienda

Copia los textos de **`store/listing-es.md`** y sube los gráficos de **`store/graphics/`** y **`store/screenshots/`** (Crecimiento → Presencia en Google Play → Ficha principal).

## 5. Subir la primera versión (prueba cerrada)

> ⚠️ **Cuentas personales creadas después de noviembre de 2023:** Google exige una **prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de poder pedir acceso a Producción. Las cuentas de organización no tienen este requisito.

1. **Pruebas → Prueba cerrada → Crear canal** (o usa el canal *Alpha*).
2. **Testers**: crea una lista de correos (Gmail) con 12+ personas, o usa un Grupo de Google.
3. **Crear versión** → acepta **Firma de aplicaciones de Play** (Google guarda la clave final; la tuya es solo de subida) → sube **`PandaGO.aab`**.
4. Nombre de la versión: el que propone (p. ej. `9 (0.1.9)`). Notas de la versión, por ejemplo:
   ```
   <es-ES>
   Primera versión de PandaGO!: HSK 1 y 2 completos, escritura de trazos, conversaciones con Bao, ligas y cofres.
   </es-ES>
   ```
5. **Revisar versión → Iniciar el lanzamiento**. La primera revisión de Google suele tardar entre unas horas y 7 días.
6. Comparte con los testers el **enlace de inscripción** (Prueba cerrada → Testers → *Copiar enlace*). Deben aceptar y **mantener la app instalada** los 14 días.

## 6. Pasar a Producción

Pasados los 14 días con 12+ testers: **Panel → Solicitar acceso a producción** (responde el breve cuestionario sobre la prueba). Cuando lo aprueben: **Producción → Crear versión →** *Añadir desde la biblioteca* el mismo AAB (o uno más nuevo) → enviar a revisión.

## 7. Actualizaciones

Cada push a `main` genera una Release con un `versionCode` mayor (Google lo exige). Para publicar una actualización: descarga el nuevo `PandaGO.aab` de la última Release y súbelo en el canal correspondiente (Crear versión nueva).

## Problemas frecuentes

| Mensaje en Play Console | Solución |
| --- | --- |
| *"El APK o Android App Bundle se ha firmado en modo de depuración"* | Faltan los secretos de GitHub (paso 0.1). Añádelos y vuelve a ejecutar *Build Android*. |
| *"El código de versión X ya se ha utilizado"* | Sube el AAB de una Release más nueva. |
| *"El nombre de paquete app.pandago ya existe"* | Otro desarrollador lo usa: hay que cambiar `android.package` en `app.json` (p. ej. `com.alvj95.pandago`) y volver a compilar. |
| Permiso `RECORD_AUDIO` | Está declarado en la ficha de seguridad de datos (Audio) y en la política de privacidad. |
