import { defineConfig } from 'tsup'
import { sassPlugin } from 'esbuild-sass-plugin'

export default defineConfig({
  entry: ['src/index.ts', 'src/editor-x/editor.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'lexical', '@lexical/react', 'next'],
  treeshake: true,
  sourcemap: true,
  splitting: false,
  silent: true,
  esbuildPlugins: [sassPlugin()],
})
