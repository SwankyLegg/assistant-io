import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    extensions: ['.ts', '.js', '.d.ts']
  },
  ...(mode === 'demo' ? {
    root: 'demo',
    build: {
      outDir: '../dist-demo',
      emptyOutDir: true
    }
  } : {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/voice-io.ts'),
        name: 'VoiceIO',
        fileName: (format) => `voice-io.${format === 'es' ? 'mjs' : 'js'}`,
        formats: ['es', 'cjs']
      },
      outDir: 'dist',
      emptyOutDir: true
    }
  })
}));