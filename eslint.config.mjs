import eslint           from "@eslint/js";
import tseslint         from "typescript-eslint";
import { defineConfig } from "eslint/config";

const files = [
  "*ts",
];

export default defineConfig(
  {
    files,
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.strict.map(config => ({
    files,
    ...config,
  })),
  ...tseslint.configs.stylistic.map(config => ({
    files,
    ...config,
  })),
  {
    files,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project        : "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Browser globals
        window          : "readonly",
        document        : "readonly",
        console         : "readonly",
        addEventListener: "readonly",
        structuredClone : "readonly",
        localStorage    : "readonly",
        setTimeout      : "readonly",
      },
    },
    rules: {
      "comma-dangle"        : ["error", "always-multiline"],
      "eol-last"            : ["error", "always"],
      "eqeqeq"              : ["error", "always"],
      "linebreak-style"     : ["error", "unix"],
      "no-alert"            : "error",
      "no-debugger"         : "error",
      "no-duplicate-imports": "error",
      "no-eval"             : "error",
      "no-implied-eval"     : "error",
      "no-trailing-spaces"  : "error",
      "no-undef"            : "error",
      "no-var"              : "error",
      "no-with"             : "error",
      "prefer-const"        : "error",
      "no-cond-assign"      : "off",
      "quotes"              : ["error", "double", { avoidEscape: true }],
      "semi"                : ["error", "always"],

      // TypeScript-specific recommended rules
      "@typescript-eslint/array-type"                   : ["error", { "default": "array-simple" }],
      "@typescript-eslint/await-thenable"               : "error",
      "@typescript-eslint/consistent-type-definitions"  : ["error", "interface"],
      "@typescript-eslint/consistent-type-imports"      : ["error", { "prefer": "type-imports" }],
      "@typescript-eslint/explicit-function-return-type": ["error", { "allowExpressions": true }],
      "@typescript-eslint/no-dynamic-delete"            : "off",
      "@typescript-eslint/no-empty-function"            : "off",
      "@typescript-eslint/no-explicit-any"              : "off",
      "@typescript-eslint/no-floating-promises"         : "error",
      "@typescript-eslint/no-inferrable-types"          : "off",
      "@typescript-eslint/no-non-null-assertion"        : "warn",
      "@typescript-eslint/no-shadow"                    : "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unused-vars"               : ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-use-before-define"         : ["error", { "functions": false, "classes": true, "variables": true }],
      "@typescript-eslint/prefer-as-const"              : "error",
      "@typescript-eslint/prefer-nullish-coalescing"    : "error",
      "@typescript-eslint/prefer-optional-chain"        : "error",
      "@typescript-eslint/prefer-readonly"              : "warn",
      "@typescript-eslint/unified-signatures"           : "off",

      // Turn off base ESLint rules that are covered by TypeScript equivalents
      "no-shadow"           : "off",
      "no-unused-vars"      : "off",
      "no-use-before-define": "off",
    }
  },
  {
    files: ["tests/*.ts"],
    rules: {
      // Relax floating promises rule for test files where event listeners are common
      "@typescript-eslint/no-floating-promises": "off",
    }
  }
);
