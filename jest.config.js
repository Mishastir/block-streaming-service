module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "@module/(.*)$": "<rootDir>/$1",
    "@config": "<rootDir>/config",
  },
  rootDir: "src",
  testRegex: ".*\\.(spec|test)\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  testTimeout: 10000,
  collectCoverage: false,
  coverageThreshold: {
    global: {
      functions: 79,
      lines: 79,
      statements: 79,
    },
  },
  collectCoverageFrom: [
    "**/*.{ts,js}",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/dist/**",
    "!jest.config.js",
    "!**/test/**",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/coverage/", "/dist/"],
};
