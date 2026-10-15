import { useState } from 'react';
import { CallScreen } from '@/features/call/CallScreen';

export default function CallRoute() {
  // «Llamar otra vez» vuelve a montar la pantalla desde cero.
  const [n, setN] = useState(0);
  return <CallScreen key={n} onAgain={() => setN((x) => x + 1)} />;
}
