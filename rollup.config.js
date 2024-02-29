import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    copy({
      targets: [
        { src: 'src/lisp', dest: 'dist' },
      ]
    }),
    nodeResolve(),
    commonjs(),
    typescript(),
    terser(),
  ],
};
