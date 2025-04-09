module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Make sure this is last to override other configs
  ],
  rules: {
    // Avoid explicit any (per user guidelines)
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    
    // Enforce consistent code style
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    
    // Prevent null reference errors
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // Enforce proper promise handling
    '@typescript-eslint/no-floating-promises': 'warn',
    
    // Enforce import order
    '@typescript-eslint/consistent-type-imports': ['warn', {
      prefer: 'type-imports',
      disallowTypeAnnotations: false,
    }],
    
    // Enforce consistent naming
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      }
    ],
    
    // Allow certain patterns in test files
    'no-undef': 'off', // TypeScript already checks this
  },
  overrides: [
    {
      // Relax rules for test files
      files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  ignorePatterns: ['dist', 'node_modules', '*.js', '!.eslintrc.js'],
};
