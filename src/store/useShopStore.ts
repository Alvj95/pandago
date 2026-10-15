import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { itemById, type Outfit, type Slot } from '@/features/shop/items';
import { useProgressStore } from './useProgressStore';

interface ShopState {
  owned: string[];
  outfit: Outfit;
  /** Compra (o reclama, si es gratis) una prenda; false si no hay gemas. */
  buy: (id: string) => boolean;
  /** Pone una prenda (o quita la del hueco con `null`). */
  wear: (slot: Slot, id: string | null) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      owned: [],
      outfit: {},
      buy: (id) => {
        const item = itemById(id);
        if (!item || get().owned.includes(id)) return false;
        if (item.price > 0 && !useProgressStore.getState().spendGems(item.price)) return false;
        // Al comprar, Bao se la pone directamente.
        set((s) => ({ owned: [...s.owned, id], outfit: { ...s.outfit, [item.slot]: id } }));
        return true;
      },
      wear: (slot, id) =>
        set((s) => {
          if (id && !s.owned.includes(id)) return s;
          const outfit = { ...s.outfit };
          if (id) outfit[slot] = id;
          else delete outfit[slot];
          return { outfit };
        }),
    }),
    { name: 'pandago-shop', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
