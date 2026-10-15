import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { freshPet, type PetState, tick } from '@/features/pet/pet';

interface PetStore {
  pet: PetState;
  /** Aplica el tiempo pasado desde la última vez. */
  refresh: (now?: number) => void;
  update: (fn: (p: PetState) => PetState) => void;
  /** Comida ganada al terminar una lección. */
  addFood: (n: number) => void;
}

export const usePetStore = create<PetStore>()(
  persist(
    (set) => ({
      pet: freshPet(Date.now()),
      refresh: (now = Date.now()) => set((s) => ({ pet: tick(s.pet, now) })),
      update: (fn) => set((s) => ({ pet: fn(tick(s.pet, Date.now())) })),
      addFood: (n) => set((s) => ({ pet: { ...s.pet, food: Math.min(20, s.pet.food + n) } })),
    }),
    { name: 'pandago-pet', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
