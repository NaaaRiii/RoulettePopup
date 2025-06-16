/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  coverageProvider: 'v8',
  collectCoverage: false,

  // CSS / 画像などをスタブ
  moduleNameMapper: {
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    '^next/image$': '<rootDir>/__mocks__/next/image.js',
  },

  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },

  // 扱う拡張子
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};