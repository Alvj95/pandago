import generated from './songs.generated.json';

export interface SongSyllable {
  hanzi: string;
  pinyin: string;
  tone: 1 | 2 | 3 | 4 | 5;
  /** Pulso (desde el inicio del audio) en que empieza la sílaba. */
  start: number;
  beats: number;
}

export interface SongLine {
  es: string;
  start: number;
  end: number;
  syllables: SongSyllable[];
}

export interface Song {
  id: string;
  title: string;
  pinyin: string;
  es: string;
  origin: 'traditional' | 'original';
  originNote: string;
  bpm: number;
  meter: number;
  emoji: string;
  color: 'primary' | 'success' | 'info' | 'league';
  /** Pulsos de cuenta atrás antes de la primera sílaba. */
  countIn: number;
  totalBeats: number;
  durationSec: number;
  lines: SongLine[];
}

/** Canciones generadas por scripts/songs/build.py (letra + tiempos exactos de cada sílaba). */
export const SONGS = generated as unknown as Song[];

export const findSong = (id: string) => SONGS.find((s) => s.id === id);
