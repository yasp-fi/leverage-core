const config = {
  detectOpenHandles: true,
  errorOnDeprecated: true,
  testMatch: ["**/?(*.)+(e2e-test|unit-test).ts"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    ".*\\.(tsx?|js)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/*`", "node_modules/*"],
};

export default config;
