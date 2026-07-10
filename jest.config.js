module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
        },
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-.*)/)',
  ],
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/services/scoring/**/*.ts',
    'src/services/llm/**/*.ts',
    'src/utils/**/*.ts',
  ],
};
