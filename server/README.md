# Tutor IA de PandaGO! (servidor)

La app nunca habla directamente con la IA: llama a este servidor, que valida
cada respuesta y aplica el guardián de nivel HSK. Si el servidor no responde
(o se acaba la cuota gratis del día), la app sigue con su tutor sin conexión.

## Motores

| Motor | Coste | Cuándo se usa |
|---|---|---|
| **Cloudflare Workers AI** (Qwen3 / Llama 3.3) | Gratis: 10.000 «neuronas» al día (≈ 100–200 respuestas) | Por defecto en Cloudflare |
| Claude (Anthropic) | De pago por uso | Si se configura el secreto `ANTHROPIC_API_KEY` |

El reconocimiento de voz (`/v1/speech/assess`) usa Whisper de Workers AI. No
mide el contorno de los tonos: da por buena una sílaba si el reconocedor entiende
el carácter correcto (un tono equivocado suele cambiar la palabra).

## Publicarlo gratis (desde GitHub, sin instalar nada)

1. Crea una cuenta gratis en <https://dash.cloudflare.com/sign-up>.
2. En el panel, abre **Workers & Pages** una vez (así Cloudflare crea tu
   subdominio `*.workers.dev`).
3. Copia tu **Account ID** (aparece en la columna derecha de *Workers & Pages*).
4. Crea un token: **My Profile → API Tokens → Create Token → «Edit Cloudflare
   Workers»**, añade el permiso **Account · Workers AI · Edit** y créalo.
5. En GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**: `CLOUDFLARE_API_TOKEN` (el token) y `CLOUDFLARE_ACCOUNT_ID`.
6. **Actions → Deploy tutor → Run workflow**. Al terminar, el resumen muestra la
   dirección del tutor (`https://pandago-tutor.<tu-subdominio>.workers.dev`).
7. Guárdala en **Settings → Secrets and variables → Actions → Variables** como
   `TUTOR_URL`. Las siguientes compilaciones de la APK y de la web ya la usan.

## Desarrollo local

```bash
npm ci
npx wrangler login      # una vez
npm run cf:dev          # tutor gratis en http://localhost:8787 (usa Workers AI remoto)
# o, con Claude:
ANTHROPIC_API_KEY=... npm run dev
npm test                # pruebas del servidor
```

Los modelos se cambian en `wrangler.toml` (`TUTOR_MODELS`, en orden de preferencia).
