import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import ts from 'rollup-plugin-typescript2'

function createConfig({ dts, esm } = {}) {
  return {
    input: 'src/index.ts',
    output: {
      file: `dist/index.${dts ? 'd.ts' : `${esm ? 'esm' : 'cjs'}.js`}`,
      format: dts || esm ? 'esm' : 'cjs',
      exports: 'named'
    },
    plugins: [
      !dts && resolve(),
      !dts && esbuild(),
      dts &&
        ts({
          tsconfigOverride: {
            exclude: ['src/maybeNot.ts']
          }
        })
    ],
    external: ['vue-demi']
  }
}

export default [
  createConfig(),
  createConfig({ esm: true }),
  createConfig({ dts: true })
]
