import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  tsconfig: './tsconfig.json',
  target: 'es2017',
  skipNodeModulesBundle: true,
  minify: false,
});
