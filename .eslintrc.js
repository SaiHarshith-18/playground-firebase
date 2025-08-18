module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  plugins: ['react', 'react-native', 'import'],
  rules: {
    // Customize your lint rules
    'react/react-in-jsx-scope': 'off',
    'react-native/no-inline-styles': 'off',
    'prettier/prettier': 'error',
    'react/prop-types': 'off',
    'react-native/no-color-literals': 'off',
  },
  env: {
    browser: true,
    es6: true,
  },
};
