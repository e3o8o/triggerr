module.exports = {
  root: true,
  // Inherit from the recommended Next.js configuration.
  // This preset includes the necessary parser, plugins, and rules for TypeScript and Next.js.
  extends: ["next/core-web-vitals"],

  // Define patterns for files and directories that ESLint should ignore.
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "**/dist/**",
    "build/",
    "**/build/**",
    ".next/",
    ".turbo/",
    "coverage/",
    "**/*.tsbuildinfo",
    "**/dist/**/*.d.ts",
    "**/dist/**/*.js",
    "**/dist/**/*.js.map",
    "**/dist/**/*.d.ts.map",
    // By default, all .d.ts files are ignored. We negate the pattern for our custom
    // types directory to ensure our hand-crafted declaration files are linted.
    "!**/types/**/*.d.ts",
  ],

  // Define custom rule configurations.
  rules: {
    // This rule is specific to the 'pages' directory and is not relevant for projects
    // using the 'app' router. Disabling it cleanly resolves the "Pages directory not found" warning.
    "@next/next/no-html-link-for-pages": "off",
  },

  // Provide settings to plugins.
  settings: {
    // This setting is crucial for monorepos. It tells the `eslint-plugin-next`
    // where the root of the Next.js application is located.
    next: {
      rootDir: "apps/web/",
    },
  },
};
