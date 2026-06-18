import { create } from 'zustand';
import {
  RegistryAccount,
  RegistryRepo,
  RegistryTag,
  RegistryStatus,
} from './types';

export type RegistryFilter = 'all' | 'connected' | 'disconnected';

const MOCK_ACCOUNTS: RegistryAccount[] = [
  {
    id: 'reg-dockerhub',
    name: 'Docker Hub',
    namespace: 'docker.io',
    username: 'mke5',
    status: 'connected',
    lastSync: '5 min ago',
    isDefault: true,
    repos: [
      {
        id: 'dh-r1',
        name: 'dock',
        fullName: 'mke5/dock',
        description: 'Docker desktop app',
        isPrivate: false,
        stars: 12,
        pulls: '1.2k',
        lastPushed: '2h ago',
        tags: [
          {
            name: 'latest',
            digest: 'sha256:abc123',
            size: '48 MB',
            pushed: '2h ago',
            platform: 'linux/amd64',
          },
          {
            name: '0.1.0',
            digest: 'sha256:def456',
            size: '48 MB',
            pushed: '2h ago',
            platform: 'linux/amd64',
          },
        ],
      },
      {
        id: 'dh-r2',
        name: 'nginx-proxy',
        fullName: 'mke5/nginx-proxy',
        description: 'Custom nginx proxy',
        isPrivate: false,
        stars: 3,
        pulls: '342',
        lastPushed: '1d ago',
        tags: [
          {
            name: 'latest',
            digest: 'sha256:aaa111',
            size: '23 MB',
            pushed: '1d ago',
            platform: 'linux/amd64',
          },
        ],
      },
      {
        id: 'dh-r3',
        name: 'worker',
        fullName: 'mke5/worker',
        description: 'Background job worker',
        isPrivate: true,
        stars: 0,
        pulls: '—',
        lastPushed: '3d ago',
        tags: [
          {
            name: 'latest',
            digest: 'sha256:bbb222',
            size: '110 MB',
            pushed: '3d ago',
            platform: 'linux/amd64',
          },
          {
            name: 'staging',
            digest: 'sha256:ccc333',
            size: '112 MB',
            pushed: '4d ago',
            platform: 'linux/amd64',
          },
        ],
      },
    ],
  },
  {
    id: 'reg-ghcr',
    name: 'GitHub Container Registry',
    namespace: 'ghcr.io',
    username: 'mke5',
    status: 'connected',
    lastSync: '12 min ago',
    repos: [
      {
        id: 'gh-r1',
        name: 'actions-runner',
        fullName: 'mke5/actions-runner',
        description: 'GitHub Actions self-hosted runner',
        isPrivate: true,
        lastPushed: '6h ago',
        tags: [
          {
            name: 'latest',
            digest: 'sha256:ddd444',
            size: '220 MB',
            pushed: '6h ago',
            platform: 'linux/amd64',
          },
        ],
      },
    ],
  },
  {
    id: 'reg-custom',
    name: 'Local Registry',
    namespace: 'localhost:5000',
    status: 'disconnected',
    lastSync: 'never',
    repos: [],
  },
];

interface RegistryState {
  accounts: RegistryAccount[];
  selectedAccountId: string | null;
  selectedRepoId: string | null;
  filter: RegistryFilter;
  searchQuery: string;
  selectAccount: (id: string | null) => void;
  selectRepo: (id: string | null) => void;
  setFilter: (filter: RegistryFilter) => void;
  setSearchQuery: (q: string) => void;
  disconnectAccount: (id: string) => void;
  connectAccount: (id: string) => void;
  deleteRepo: (accountId: string, repoId: string) => void;
  addAccount: (account: RegistryAccount) => void;
  addRepo: (accountId: string, repo: RegistryRepo) => void;
  addTag: (accountId: string, repoId: string, tag: RegistryTag) => void;
}

export const useRegistryStore = create<RegistryState>((set) => ({
  accounts: MOCK_ACCOUNTS,
  selectedAccountId: 'reg-dockerhub',
  selectedRepoId: null,
  filter: 'all',
  searchQuery: '',
  selectAccount: (id) => set({ selectedAccountId: id, selectedRepoId: null }),
  selectRepo: (id) => set({ selectedRepoId: id }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  disconnectAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, status: 'disconnected' as RegistryStatus } : a
      ),
    })),
  connectAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'connected' as RegistryStatus,
              lastSync: 'just now',
            }
          : a
      ),
    })),
  deleteRepo: (accountId, repoId) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId
          ? { ...a, repos: a.repos.filter((r) => r.id !== repoId) }
          : a
      ),
      selectedRepoId:
        state.selectedRepoId === repoId ? null : state.selectedRepoId,
    })),
  addAccount: (account) =>
    set((state) => ({ accounts: [...state.accounts, account] })),
  addRepo: (accountId, repo) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId ? { ...a, repos: [...a.repos, repo] } : a
      ),
    })),
  addTag: (accountId, repoId, tag) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId
          ? {
              ...a,
              repos: a.repos.map((r) =>
                r.id === repoId
                  ? { ...r, tags: [tag, ...r.tags], lastPushed: tag.pushed }
                  : r
              ),
            }
          : a
      ),
    })),
}));
