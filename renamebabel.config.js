module.exports = {
  presets: [
    // 現在の Node バージョンに合わせて ES2020 などへ変換
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // JSX を変換
    '@babel/preset-react',
    // ts-jest で TS は動くが、.tsx も Babel 側で読めるようにしておくと便利
    '@babel/preset-typescript',
  ],
};