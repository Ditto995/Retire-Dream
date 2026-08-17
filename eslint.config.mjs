import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [".next/**", ".test-dist/**", "node_modules/**", "next-env.d.ts"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
)
