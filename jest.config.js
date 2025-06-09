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
    '^.+\\.tsx?$': 'ts-jest',   // TS 系を ts-jest
    '^.+\\.jsx?$': 'babel-jest' // JS 系を babel-jest
  },

  // 扱う拡張子
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};