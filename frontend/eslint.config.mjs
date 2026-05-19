import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Global ignores
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "snapshots/",
      "components/ui/",  // auto-generated shadcn components
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules (type-aware off for speed in CI)
  ...tseslint.configs.recommended,

  // Project-specific overrides
  {
    rules: {
      // Allow unused vars prefixed with underscore
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Allow explicit any for now (many components use it)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require imports (some config files use them)
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
