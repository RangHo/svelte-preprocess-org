import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "es",
  },
  plugins: [
    copy({
      targets: [
        // Copy the ox-svelte.el file to the dist directory.
        { src: "node_modules/ox-svelte/ox-svelte.el", dest: "dist/" },
      ],
    }),
    nodeResolve(),
    commonjs(),
    typescript(),
    terser(),
  ],
};
