// https://docs.expo.dev/guides/using-eslint/
const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

// Module boundaries (see docs/architecture.md):
// - a feature never imports another feature; features talk through core events;
// - core, design-system and shared never import features;
// - only routes (src/app) use the app shell (src/shell).
// Zones below are resolved from the working directory, so this path is too.
const featuresDir = path.resolve('src/features');
const features = fs.existsSync(featuresDir)
  ? fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];

const boundaryZones = [
  ...features.map((feature) => ({
    target: `./src/features/${feature}`,
    from: './src/features',
    except: [`./${feature}`],
    message: 'Features must not import other features. Communicate through core events instead.',
  })),
  ...['core', 'design-system', 'shared'].map((layer) => ({
    target: `./src/${layer}`,
    from: './src/features',
    message: `${layer} must not depend on features.`,
  })),
  ...['core', 'design-system', 'shared', 'features'].map((layer) => ({
    target: `./src/${layer}`,
    from: './src/shell',
    message: `${layer} must not depend on the app shell; the shell composes them, not the reverse.`,
  })),
];

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    rules: {
      'import/no-restricted-paths': ['error', { zones: boundaryZones }],
    },
  },
  {
    // Colors come from design tokens only, so themes stay consistent and swappable.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/design-system/tokens/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message: 'Use a color token from @/design-system instead of a hex color.',
        },
        {
          selector: 'Literal[value=/^(rgb|hsl)a?\\(/]',
          message: 'Use a color token from @/design-system instead of an rgb/hsl color.',
        },
      ],
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts'],
  },
]);
