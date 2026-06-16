// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }),
}) as jest.Mock;
