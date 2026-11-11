// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Edge Functions janë kod Deno, kontrollohen veçmas.
    ignores: ["dist/*", "supabase/functions/*"],
  }
]);
