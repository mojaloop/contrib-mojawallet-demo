module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    modulePathIgnorePatterns: ["dist"],
    coverageThreshold: {
        global: {
          statements: 80,
          functions: 80,
          branches: 67,
          lines: 80
        }
      },
      collectCoverageFrom: [
        "src/**/*.ts",
        "!src/index.ts",
        "!src/apis/hydra.ts",
        "!src/controllers/oauth2Client.ts",
        "!src/controllers/refreshALS.ts",
        "!src/controllers/logout.ts",
        "!src/controllers/consent.ts",
        "!src/services/user-accounts-service.ts"
      ]
};
