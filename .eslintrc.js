module.exports = {
  extends: 'clarity/typescript',
  parserOptions: {
    project: 'tsconfig.eslint.json'
    // tsconfigRootDir: __dirname
  },
  rules: {
    'import/no-unassigned-import': ['error', { allow: ['jest'] }]
  }
};
