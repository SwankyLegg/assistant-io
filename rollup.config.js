import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/voice-io.js',
  output: [
    {
      file: 'dist/voice-io.js',
      format: 'umd',
      name: 'VoiceIO',
      exports: 'named'
    },
    {
      file: 'dist/voice-io.mjs',
      format: 'es'
    }
  ],
  plugins: [
    typescript({
      declaration: true,
      declarationDir: 'dist',
      rootDir: './src'
    })
  ]
}; 