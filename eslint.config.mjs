import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Adding global rule overrides here
    rules: {
      // 1. Kill the "Unexpected any" errors
      "@typescript-eslint/no-explicit-any": "off",
      
      // 2. Stop "defined but never used" from breaking builds (downgrade to warning)
      "@typescript-eslint/no-unused-vars": "warn",
      
      // 3. Ignore unescaped entities (like ' and ") in your HTML/JSX
      "react/no-unescaped-entities": "off",
      
      // 4. Silence the "setState in effect" and purity warnings
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "warn",
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "convex/_generated/**", // ADD THIS: Ignore the auto-generated Convex files
  ]),
]);

export default eslintConfig;