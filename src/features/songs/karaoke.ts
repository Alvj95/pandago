/**
 * Sincronización del karaoke: a partir del segundo de reproducción, qué línea
 * y qué sílaba se están cantando. Puro (sin audio ni UI) para poder probarlo.
 */
import type { Song } from '@/data/songs';

export const secondsPerBeat = (song: Song) => 60 / song.bpm;

export interface KaraokePosition {
  /** Índice de la línea actual (o la próxima, durante pausas y cuenta atrás). */
  line: number;
  /** Sílaba que suena ahora dentro de la línea (-1 si ninguna: cuenta atrás o silencio). */
  syllable: number;
  /** Números de la cuenta atrás (3, 2, 1…) o 0 si ya empezó. */
  countdown: number;
  /** 0..1 del total de la canción. */
  progress: number;
  finished: boolean;
}

export function positionAt(song: Song, seconds: number): KaraokePosition {
  const beat = seconds / secondsPerBeat(song);
  const progress = Math.min(1, Math.max(0, beat / song.totalBeats));
  if (beat < song.countIn) {
    return { line: 0, syllable: -1, countdown: Math.ceil(song.countIn - beat), progress, finished: false };
  }
  const last = song.lines[song.lines.length - 1];
  if (!last || beat >= last.end) {
    return { line: Math.max(0, song.lines.length - 1), syllable: -1, countdown: 0, progress, finished: beat >= song.totalBeats - 0.01 };
  }
  let line = song.lines.findIndex((l) => beat < l.end);
  if (line < 0) line = song.lines.length - 1;
  const syls = song.lines[line]?.syllables ?? [];
  const syllable = syls.findIndex((s) => beat >= s.start && beat < s.start + s.beats);
  return { line, syllable, countdown: 0, progress, finished: false };
}

/** Segundos donde empieza y termina una línea (para repetir solo esa línea). */
export function lineWindow(song: Song, line: number): [number, number] {
  const l = song.lines[line];
  const spb = secondsPerBeat(song);
  return l ? [l.start * spb, l.end * spb] : [0, 0];
}
