import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: [
    'stripe',
    '@triggerr/config',
    '@triggerr/core',
    '@triggerr/api-contracts',
    'drizzle-orm',
    'zod'
  ],
  esbuildOptions: (options) => {
    options.banner = {
      js: '"use client";',
    };
  },
  outDir: 'dist',
  target: 'es2020',
  platform: 'node',
  keepNames: true,
  treeshake: true,
  onSuccess: async () => {
    console.log('✅ @triggerr/stripe built successfully');
  },
});
