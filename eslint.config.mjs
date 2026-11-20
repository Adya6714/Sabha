import { defineConfig, globalIgnores } from "eslint/config";

/** Root ESLint config for shared packages. App-specific rules live in apps/web. */
export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/coverage/**",
    "apps/web/**",
  ]),
  {
    files: ["packages/**/*.{ts,tsx,js,mjs}", "*.{js,mjs,ts}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-undef": "off",
    },
  },
]);
