import { defineConfig } from 'vite';
import { resolve } from 'path';
import typescript from '@rollup/plugin-typescript';

export default defineConfig(({ mode }) => ({
  // This ensures assets are loaded correctly on GitHub Pages
  base: './',
  resolve: {
    alias: {
      // @ts-expect-error
      '@': resolve(__dirname, 'src')
    },
    extensions: ['.ts', '.js', '.d.ts']
  },
  ...(mode === 'demo' ? {
    // Demo build configuration
    root: 'demo',
    build: {
      outDir: '../dist-demo',
      emptyOutDir: true
    }
  } : {
    // Library build configuration
    build: {
      lib: {
        entry: resolve(__dirname, 'src/voice-io.ts'),
        name: 'VoiceIO',
        fileName: 'voice-io',
        formats: ['es', 'umd']
      },
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        external: [],
        output: {
          globals: {}
        }
      }
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist/types',
        include: ['src/**/*.ts', 'src/**/*.d.ts'],
        exclude: ['node_modules', 'dist', 'demo'],
        rootDir: 'src'
      })
    ]
  })
})); 