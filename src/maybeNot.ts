import { ExtractWrapped, Wrapper } from './index'

export type WrapperMiddlewares<Wrappers> = Wrappers extends Wrapper[]
  ? Wrappers extends [Wrapper]
    ? [Wrapper]
    : Wrappers extends [infer Wrapper1, infer Wrapper2, ...infer Others]
    ? [
        Wrapper1,
        ...WrapperMiddlewares<[Wrapper<ExtractWrapped<Wrapper1>>, ...Others]>
      ]
    : Wrapper[]
  : never

export function createWrappers(): Wrapper[]
export function createWrappers<S1 extends Wrapper>(wrappers1: S1): [S1]
export function createWrappers<
  S1 extends Wrapper,
  S2 extends Wrapper<ExtractWrapped<S1>>
>(wrappers1: S1, wrappers2: S2): [S1, S2]
export function createWrappers<
  S1 extends Wrapper,
  S2 extends Wrapper<ExtractWrapped<S1>>,
  S3 extends Wrapper<ExtractWrapped<S2>>
>(wrappers1: S1, wrappers2: S2, wrappers3: S3): [S1, S2, S3]
export function createWrappers<
  S1 extends Wrapper,
  S2 extends Wrapper<ExtractWrapped<S1>>,
  S3 extends Wrapper<ExtractWrapped<S2>>,
  S4 extends Wrapper<ExtractWrapped<S3>>
>(wrappers1: S1, wrappers2: S2, wrappers3: S3, wrappers4: S4): [S1, S2, S3, S4]
export function createWrappers<
  S1 extends Wrapper,
  S2 extends Wrapper<ExtractWrapped<S1>>,
  S3 extends Wrapper<ExtractWrapped<S2>>,
  S4 extends Wrapper<ExtractWrapped<S3>>,
  S5 extends Wrapper<ExtractWrapped<S4>>
>(
  wrappers1: S1,
  wrappers2: S2,
  wrappers3: S3,
  wrappers4: S4,
  wrappers5: S5
): [S1, S2, S3, S4, S5]
export function createWrappers(...wrappers: Wrapper[]): Wrapper[]
export function createWrappers(...wrappers: Wrapper[]) {
  return wrappers
}
