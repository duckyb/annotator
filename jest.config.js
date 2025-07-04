export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/utils/setup-jest.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    // Transform ES modules from node_modules
    '^.+\\.m?js$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    // Allow transformation of approx-string-match and other ES modules
    'node_modules/(?!(approx-string-match)/)',
  ],
  testMatch: [
    '**/*.spec.ts', // Unit tests
    'src/__tests__/integration/**/*.integration.spec.ts', // Integration tests
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/__tests__/utils/'],
};
