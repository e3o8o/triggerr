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
    console.log('✅ @triggerr/config built successfully');
  },
});
