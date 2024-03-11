const config = {
  testEnvironment: 'node',
  testMatch: ['test/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      }
    ],
  },
};

export default config;
