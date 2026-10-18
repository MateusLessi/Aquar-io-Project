// https://docs.expo.dev/guides/using-eslint/
const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

// Module boundaries (see docs/architecture.md):
// - a feature never imports another feature; features talk through core events;
// - core, design-system and shared never import features.
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
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts'],
  },
]);
