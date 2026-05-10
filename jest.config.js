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
    testPathIgnorePatterns: ['<rootDir>/.agent/', '<rootDir>/.next/'],
    modulePathIgnorePatterns: ['<rootDir>/.agent/', '<rootDir>/.next/'],
}

module.exports = createJestConfig(customJestConfig)
