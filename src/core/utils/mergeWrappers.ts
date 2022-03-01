import type { ExtractWrapped, Wrapper } from '../../index'
import type { MouseMoveActions } from '../useDraggable'

export type WrapperMiddlewares<T> = T extends [Wrapper]
  ? [Wrapper]
  : T extends [infer A, infer B]
  ? [A, Wrapper<ExtractWrapped<B>, ExtractWrapped<A>>]
  : T extends [infer A, infer B, ...infer O]
  ? [
      A,
      ...WrapperMiddlewares<
        [Wrapper<ExtractWrapped<B>, ExtractWrapped<A>>, ...O]
      >
    ]
  : T

export type ExtractLastElement<Elements> = Elements extends [infer Element]
  ? Element
  : Elements extends [any, ...infer Laters]
  ? ExtractLastElement<Laters>
  : never

export type MergeWrappers<Wrappers> = Wrappers extends Wrapper[]
  ? MergeWrappers<ExtractLastElement<Wrappers>>
  : never

type HookName = keyof Wrapper

const mergeHookNames: Array<HookName> = ['onStart', 'onMove', 'onEnd']

export function mergeWrappers(): void
export function mergeWrappers<W1 extends Wrapper>(wrappers1: W1): W1
export function mergeWrappers<
  W1 extends Wrapper,
  W2 extends Wrapper<any, ExtractWrapped<W1>>
>(wrappers1: W1, wrappers2: W2): MergeWrappers<[W1, W2]>
export function mergeWrappers<
  W1 extends Wrapper,
  W2 extends Wrapper<any, ExtractWrapped<W1>>,
  W3 extends Wrapper<any, ExtractWrapped<W2>>
>(wrappers1: W1, wrappers2: W2, wrappers3: W3): MergeWrappers<[W1, W2, W3]>
export function mergeWrappers<
  W1 extends Wrapper,
  W2 extends Wrapper<any, ExtractWrapped<W1>>,
  W3 extends Wrapper<any, ExtractWrapped<W2>>,
  W4 extends Wrapper<any, ExtractWrapped<W3>>
>(
  wrappers1: W1,
  wrappers2: W2,
  wrappers3: W3,
  wrappers4: W4
): MergeWrappers<[W1, W2, W3, W4]>
export function mergeWrappers<
  W1 extends Wrapper,
  W2 extends Wrapper<any, ExtractWrapped<W1>>,
  W3 extends Wrapper<any, ExtractWrapped<W2>>,
  W4 extends Wrapper<any, ExtractWrapped<W3>>,
  W5 extends Wrapper<any, ExtractWrapped<W4>>
>(
  wrappers1: W1,
  wrappers2: W2,
  wrappers3: W3,
  wrappers4: W4,
  wrappers5: W5
): MergeWrappers<[W1, W2, W3, W4, W5]>
export function mergeWrappers<Wrappers extends WrapperMiddlewares<Wrapper[]>>(
  ...wrappers: Wrappers
) {
  if (!wrappers.length) {
    return
  }

  const departure = <T extends HookName>(
    hookName: T,
    ...args: Parameters<Required<MouseMoveActions<void>>[T]>
  ) =>
    wrappers.reduce((perviousReturn: any, wrapper) =>
      wrapper[hookName]?.apply(null, args.concat(perviousReturn) as any)
    )

  return mergeHookNames.reduce<Wrapper<any>>((wrapper, hookName) => {
    wrapper[hookName] = (event, position) =>
      departure(hookName, event, position)
    return wrapper
  }, {})
}
