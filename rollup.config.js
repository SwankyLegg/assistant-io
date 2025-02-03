import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/voice-io.ts',
  output: [
    {
      file: 'dist/voice-io.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/voice-io.mjs',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
    })
  ],
  external: []
}; 