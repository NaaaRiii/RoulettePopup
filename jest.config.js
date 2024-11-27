module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^next/image$': '<rootDir>/__mocks__/next/image.js',
  },
};
