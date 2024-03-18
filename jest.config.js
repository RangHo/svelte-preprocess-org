/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: "ts-jest/presets/default-esm",
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "^@/.*": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
