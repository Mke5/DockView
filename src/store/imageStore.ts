// stores/imageStore.ts
import { create } from 'zustand';
import { DockerImage } from './types';

export type ImageSortKey = 'repository' | 'tag' | 'size' | 'created';
type ImageFilter = 'all' | 'in-use' | 'unused';

interface ImageState {
  images: DockerImage[];
  selectedId: string | null;
  filter: ImageFilter;
  sortKey: ImageSortKey;
  sortDir: 'asc' | 'desc';
  setImages: (images: DockerImage[]) => void;
  selectImage: (id: string | null) => void;
  setFilter: (filter: ImageFilter) => void;
  setSort: (key: ImageSortKey) => void;
  removeImage: (id: string) => void;
  pruneUnused: () => void;
  addImage: (image: DockerImage) => void;
}

export const useImageStore = create<ImageState>((set) => ({
  images: [],
  selectedId: null,
  filter: 'all',
  sortKey: 'repository',
  sortDir: 'asc',
  setImages: (images) => set({ images }),
  selectImage: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc',
    })),
  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((i) => i.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  pruneUnused: () =>
    set((state) => ({
      images: state.images.filter((i) => i.inUse),
      selectedId: null,
    })),
  addImage: (image) => set((state) => ({ images: [image, ...state.images] })),
}));
