module.exports = {
    // Use babel-jest for transformation, explicitly
    transform: {
        '^.+\\.(t|j)sx?$': 'babel-jest',
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Ignore component tests which need jsdom/next setup for now, focus on services
    testPathIgnorePatterns: ['checklist.test.tsx'],
};
