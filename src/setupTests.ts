// Jest setup file for React Testing Library
import '@testing-library/jest-dom';

// Mock Tauri APIs for testing
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn(),
}));

jest.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: jest.fn(() => ({
    minimize: jest.fn(),
    maximize: jest.fn(),
    unmaximize: jest.fn(),
    close: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    setTitle: jest.fn(),
    center: jest.fn(),
  })),
}));

// Mock window.__TAURI__ for browser environment
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: jest.fn(),
    window: {
      getCurrent: jest.fn(),
    },
  },
  writable: true,
});

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});
