/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // CSS / 画像などをスタブ
  moduleNameMapper: {
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    '^next/image$': '<rootDir>/__mocks__/next/image.js',
  },

  transform: {
    // .ts / .tsx → ts-jest
    '^.+\\.(ts|tsx)$': 'ts-jest',
    // .js / .jsx → babel-jest  ★追加
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // 扱う拡張子
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};