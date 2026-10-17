/* Widgets de Bao para la pantalla de inicio de Android (react-native-android-widget). */
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { VocabItem } from '@/data/hsk/types';
import { baoSvg } from './baoSvg';
import { ASSIST, type WidgetMood } from './widgetData';

const BG = '#FFF4EA';
const BRAND = '#FF6B2C';
const INK = '#1B1F2A';
const MUTED = '#5B6275';

export interface WidgetProps {
  mood: WidgetMood;
  streak: number;
  word: VocabItem;
}

function Button({ label, uri, primary }: { label: string; uri: string; primary?: boolean }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        flex: 1,
        height: 'match_parent',
        backgroundColor: primary ? BRAND : '#FFFFFF',
        borderRadius: 14,
        borderWidth: primary ? 0 : 2,
        borderColor: '#FFD5C2',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget text={label} style={{ fontSize: 13, fontWeight: 'bold', color: primary ? '#FFFFFF' : BRAND }} />
    </FlexWidget>
  );
}

/** Widget grande (4×2): Bao, racha, palabra del día y botones del asistente. */
export function BaoWidget({ mood, streak, word }: WidgetProps) {
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: BG, borderRadius: 22, padding: 10, flexDirection: 'column', flexGap: 8 }}>
      <FlexWidget style={{ flex: 1, width: 'match_parent', flexDirection: 'row', alignItems: 'center', flexGap: 10 }}>
        <SvgWidget svg={baoSvg(mood)} clickAction="OPEN_APP" style={{ height: 72, width: 72 }} />
        <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: ASSIST.word(word.hanzi) }} style={{ flex: 1, flexDirection: 'column' }}>
          <TextWidget text={`PALABRA DEL DÍA${streak ? `  ·  🔥 ${streak}` : ''}`} style={{ fontSize: 10, fontWeight: 'bold', color: BRAND }} />
          <TextWidget text={word.hanzi} style={{ fontSize: 30, fontWeight: 'bold', color: INK }} />
          <TextWidget text={`${word.pinyin} · ${word.meaning}`} maxLines={1} truncate="END" style={{ fontSize: 12, color: MUTED }} />
        </FlexWidget>
      </FlexWidget>
      <FlexWidget style={{ height: 38, width: 'match_parent', flexDirection: 'row', flexGap: 6 }}>
        <Button label="🎙️ Hablar" uri={ASSIST.voice} primary />
        <Button label="📷 Foto" uri={ASSIST.camera} />
        <Button label="💬 Escribir" uri={ASSIST.write} />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Widget pequeño (2×2): Bao y la racha; al tocarlo, Bao te escucha. */
export function BaoMiniWidget({ mood, streak }: WidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: ASSIST.voice }}
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: BG, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}
    >
      <SvgWidget svg={baoSvg(mood)} style={{ height: 70, width: 70 }} />
      <TextWidget text={streak ? `🎙️  ·  🔥 ${streak}` : '🎙️ Hablar'} style={{ fontSize: 12, fontWeight: 'bold', color: BRAND }} />
    </FlexWidget>
  );
}
