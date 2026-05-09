const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
    },
    // Ensure we don't ignore node_modules that need transforming (none usually for standard deps, but good to be clean)
    testPathIgnorePatterns: ['<rootDir>/.agent/'],
}

module.exports = createJestConfig(customJestConfig)
