import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/assistant.js',
  output: [
    {
      file: 'dist/assistant.js',
      format: 'cjs',
      exports: 'named'
    },
    {
      file: 'dist/assistant.mjs',
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