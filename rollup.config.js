import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import ts from 'rollup-plugin-typescript2'

function createConfig({ name, dts } = {}) {
  return {
    input: `src/${name}.ts`,
    output: !dts
      ? [
          {
            file: `dist/${name}.mjs`,
            format: 'esm',
            exports: 'named'
          },
          {
            file: `dist/${name}.cjs`,
            format: 'cjs',
            exports: 'named'
          }
        ]
      : [
          {
            file: `dist/${name}.d.ts`,
            format: 'esm'
          }
        ],
    plugins: [!dts && resolve(), !dts && esbuild(), dts && ts()],
    external: ['vue-demi']
  }
}

export default ['index', 'wrappers', 'createMouseMoveActionsApi']
  .map((name) => [createConfig({ name }), createConfig({ name, dts: true })])
  .flat()
