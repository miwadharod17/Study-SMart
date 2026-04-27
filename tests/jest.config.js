module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./setup.js'],
    testMatch: [
        '**/unit/**/*.test.js',
        '**/integration/**/*.test.js'
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/fixtures/',
        '/tests/utils/'
    ],
    verbose: true,
    testTimeout: 30000,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};