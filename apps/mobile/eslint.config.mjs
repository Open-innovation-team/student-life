import reactNativeConfig from '@student-life/eslint-config/react-native';

export default [
  ...reactNativeConfig,
  {
    // Fichiers de config Metro/Expo : CommonJS execute par Node.
    files: ['metro.config.js', '*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
