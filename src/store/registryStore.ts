import { create } from 'zustand';
import {
  RegistryAccount,
  RegistryRepo,
  RegistryTag,
  RegistryStatus,
} from './types';

export type RegistryFilter = 'all' | 'connected' | 'disconnected';

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
  accounts: [],
  selectedAccountId: null,
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
