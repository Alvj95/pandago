import { useLocalSearchParams, useRouter } from 'expo-router';
import { AssistantPanel } from '@/features/assistant/AssistantPanel';
import { exitTo } from '@/lib/navigation';

/** El asistente dentro de la app (web, o enlaces pandago://assistant). */
export default function AssistantRoute() {
  const router = useRouter();
  const { voice, camera, text } = useLocalSearchParams<{ voice?: string; camera?: string; text?: string }>();
  return (
    <AssistantPanel
      start={{ voice: voice === '1', camera: camera === '1', text: text || undefined }}
      onClose={() => exitTo(router)}
      onOpenChat={() => router.replace('/free-chat')}
    />
  );
}
