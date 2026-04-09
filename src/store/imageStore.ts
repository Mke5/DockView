// stores/imageStore.ts
import { create } from "zustand";
import { DockerImage } from "./types";

export type ImageSortKey = "repository" | "tag" | "size" | "created";
type ImageFilter = "all" | "in-use" | "unused";

interface ImageState {
  images: DockerImage[];
  selectedId: string | null;
  filter: ImageFilter;
  sortKey: ImageSortKey;
  sortDir: "asc" | "desc";
  setImages: (images: DockerImage[]) => void;
  selectImage: (id: string | null) => void;
  setFilter: (filter: ImageFilter) => void;
  setSort: (key: ImageSortKey) => void;
  removeImage: (id: string) => void;
  pruneUnused: () => void;
  addImage: (image: DockerImage) => void;
}

const MOCK_IMAGES: DockerImage[] = [
  {
    id: "sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    shortId: "a1b2c3d4",
    repository: "nginx",
    tag: "alpine",
    size: "23.5 MB",
    sizeBytes: 23500000,
    created: "2026-03-01",
    inUse: true,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:a1b2…f0a1b2",
    containers: ["nginx-proxy"],
  },
  {
    id: "sha256:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    shortId: "c3d4e5f6",
    repository: "postgres",
    tag: "15",
    size: "379 MB",
    sizeBytes: 379000000,
    created: "2026-02-20",
    inUse: true,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:c3d4…c3d4",
    containers: ["postgres-db"],
  },
  {
    id: "sha256:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    shortId: "e5f6a7b8",
    repository: "redis",
    tag: "7-alpine",
    size: "31.2 MB",
    sizeBytes: 31200000,
    created: "2026-03-05",
    inUse: true,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:e5f6…e5f6",
    containers: ["redis-cache"],
  },
  {
    id: "sha256:g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8",
    shortId: "g7h8i9j0",
    repository: "node",
    tag: "20-slim",
    size: "188 MB",
    sizeBytes: 188000000,
    created: "2026-03-10",
    inUse: true,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:g7h8…k7l8",
    containers: ["api-server"],
  },
  {
    id: "sha256:i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0",
    shortId: "i9j0k1l2",
    repository: "python",
    tag: "3.11",
    size: "921 MB",
    sizeBytes: 921000000,
    created: "2026-02-15",
    inUse: false,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:i9j0…m9n0",
    containers: [],
  },
  {
    id: "sha256:k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2",
    shortId: "k1l2m3n4",
    repository: "alpine",
    tag: "3.19",
    size: "7.8 MB",
    sizeBytes: 7800000,
    created: "2026-01-30",
    inUse: false,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:k1l2…o1p2",
    containers: [],
  },
  {
    id: "sha256:m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4",
    shortId: "m3n4o5p6",
    repository: "ubuntu",
    tag: "22.04",
    size: "77.9 MB",
    sizeBytes: 77900000,
    created: "2026-02-01",
    inUse: false,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:m3n4…q3r4",
    containers: [],
  },
  {
    id: "sha256:o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6",
    shortId: "o5p6q7r8",
    repository: "traefik",
    tag: "v3.0",
    size: "154 MB",
    sizeBytes: 154000000,
    created: "2026-03-12",
    inUse: false,
    architecture: "amd64",
    os: "linux",
    digest: "sha256:o5p6…s5t6",
    containers: [],
  },
];

export const useImageStore = create<ImageState>((set) => ({
  images: MOCK_IMAGES,
  selectedId: null,
  filter: "all",
  sortKey: "repository",
  sortDir: "asc",
  setImages: (images) => set({ images }),
  selectImage: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc",
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
