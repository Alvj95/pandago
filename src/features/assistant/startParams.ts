import type { AssistantStart } from './AssistantPanel';

/**
 * Cómo se abrió el asistente: `pandago-bao://assistant?voice=1`, `?camera=1`,
 * `?text=…` (widget, ajustes rápidos, atajos) o con lo compartido desde otra app.
 */
export function startFrom(props: { uri?: string; text?: string; image?: string }): AssistantStart {
  const query = (props.uri ?? '').split('?')[1] ?? '';
  const params = new Map(
    query
      .split('&')
      .filter(Boolean)
      .map((kv) => {
        const [k, v = ''] = kv.split('=');
        return [decodeURIComponent(k ?? ''), decodeURIComponent(v.replace(/\+/g, ' '))] as const;
      }),
  );
  const text = (props.text || params.get('text') || '').trim();
  return {
    voice: params.get('voice') === '1' && !text && !props.image,
    camera: params.get('camera') === '1',
    text: text || undefined,
    imageUri: props.image || undefined,
  };
}
