import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'

function createConfig({ name, dts } = {}) {
  return {
    input: `src/${name}.ts`,
    output: [
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
    ],
    plugins: [resolve(), esbuild()],
    external: ['vue-demi']
  }
}

export default ['index', 'wrappers', 'utils'].map((name) =>
  createConfig({ name })
)
