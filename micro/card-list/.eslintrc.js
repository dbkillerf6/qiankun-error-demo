module.exports = {
  root: true,
  overrides: [
    {
      files: 'src/**/*',
      extends: ['react-app', 'plugin:prettier/recommended'],
      plugins: ['prettier'],
    },
    {
      files: 'config/**/*.js',
      env: {
        node: true,
      },
      extends: ['eslint:recommended', 'plugin:prettier/recommended'],
      plugins: ['prettier'],
      parserOptions: { ecmaVersion: 6 },
    },
  ],
};
