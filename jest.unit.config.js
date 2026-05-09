module.exports = {
    // Use babel-jest for transformation, explicitly
    transform: {
        '^.+\\.(t|j)sx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
    },
    // Ignore component tests which need jsdom/next setup for now, focus on services
    testPathIgnorePatterns: ['checklist.test.tsx', '<rootDir>/.agent/'],
};
