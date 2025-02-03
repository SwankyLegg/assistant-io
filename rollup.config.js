import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import { mkdir, cp } from 'fs/promises';

const config = {
  input: 'src/voice-io.ts',
  output: [
    {
      file: 'dist/voice-io.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/voice-io.mjs',
      format: 'es',
      sourcemap: true,
      exports: 'named'
    }
  ],
  plugins: [
    {
      name: 'copy-files',
      async buildStart() {
        await mkdir('dist/types', { recursive: true });
        await cp('src/types/web-speech-api.d.ts', 'dist/types/web-speech-api.d.ts');
        await cp('src/types/voice-io.d.ts', 'dist/types/voice-io.d.ts');
        await cp('src/types/index.d.ts', 'dist/types/index.d.ts');
      }
    },
    nodeResolve(),
    typescript()
  ],
  external: [/\.d\.ts$/],
  preserveEntrySignatures: 'strict'
};

export default config; 