import { useCallback, useEffect, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { SONG_AUDIO } from '@/data/songs/audio';

/**
 * Reproductor de una canción con dos pistas (con voz guía / solo música) que
 * comparten posición. El tiempo se lee en cada frame para que el karaoke vaya
 * exacto; `playSegment` reproduce solo un tramo (una línea de la letra).
 */
export function useSongPlayer(songId: string) {
  const audio = SONG_AUDIO[songId];
  const guide = useAudioPlayer(audio?.guide);
  const karaoke = useAudioPlayer(audio?.karaoke);
  const [withGuide, setWithGuideState] = useState(true);
  const [time, setTime] = useState(0);
  const segmentEnd = useRef<number | null>(null);
  /** Tramo que suena con playSegment (para resaltar esa línea en la UI). */
  const [segment, setSegment] = useState<[number, number] | null>(null);
  const active = withGuide ? guide : karaoke;
  const status = useAudioPlayerStatus(active);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Bucle de sincronización mientras suena.
  useEffect(() => {
    if (!status.playing) return;
    let raf = 0;
    const loop = () => {
      const t = active.currentTime;
      setTime(t);
      if (segmentEnd.current !== null && t >= segmentEnd.current) {
        active.pause();
        segmentEnd.current = null;
        setSegment(null);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status.playing, active]);

  const seek = useCallback(
    async (seconds: number) => {
      await active.seekTo(seconds);
      setTime(seconds);
    },
    [active],
  );

  const play = useCallback(() => {
    segmentEnd.current = null;
    setSegment(null);
    active.play();
  }, [active]);

  const pause = useCallback(() => active.pause(), [active]);

  const restart = useCallback(async () => {
    segmentEnd.current = null;
    setSegment(null);
    await active.seekTo(0);
    setTime(0);
    active.play();
  }, [active]);

  /** Cambia de pista sin perder la posición (p. ej. quitar la voz guía a mitad de canción). */
  const setWithGuide = useCallback(
    async (on: boolean) => {
      if (on === withGuide) return;
      const from = on ? karaoke : guide;
      const to = on ? guide : karaoke;
      const wasPlaying = from.playing;
      const t = from.currentTime;
      from.pause();
      await to.seekTo(t);
      setWithGuideState(on);
      if (wasPlaying) to.play();
    },
    [withGuide, guide, karaoke],
  );

  /** Reproduce solo [start, end) con la voz guía (para escuchar una línea). */
  const playSegment = useCallback(
    async (start: number, end: number) => {
      karaoke.pause();
      setWithGuideState(true);
      await guide.seekTo(start);
      setTime(start);
      segmentEnd.current = end;
      setSegment([start, end]);
      guide.play();
    },
    [guide, karaoke],
  );

  // Al salir de la pantalla, que no siga sonando.
  useEffect(
    () => () => {
      try {
        guide.pause();
        karaoke.pause();
      } catch {
        // el reproductor ya se liberó
      }
    },
    [guide, karaoke],
  );

  return {
    time,
    playing: status.playing,
    finished: status.didJustFinish,
    duration: status.duration || 0,
    withGuide,
    setWithGuide,
    play,
    pause,
    restart,
    seek,
    playSegment,
    segment,
  };
}
