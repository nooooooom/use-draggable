import type { Ref } from 'vue-demi'
import { ref, unref, watch } from 'vue-demi'
import { createMouseMoveActionsApi } from './createMouseMoveActionsApi'
import type {
  TouchyEvent,
  PointerType,
  MouseMoveActionsApi,
  DragStartTarget,
  DraggingTarget
} from './createMouseMoveActionsApi'

export type MaybeRef<T> = T | Ref<T>

export interface Position {
  x: number
  y: number
}

export interface MoveActionPosition extends Position {
  /**
   * Deviation from initial position
   */
  diff: Position
}

export interface MouseMoveActions<P = unknown, T = unknown> {
  onStart?: (event: TouchyEvent, position: MoveActionPosition, params: P) => T
  onMove?: (event: TouchyEvent, position: MoveActionPosition, params: P) => T
  onEnd?: (event: TouchyEvent, position: MoveActionPosition, params: P) => T
}

function getMousePotision(event: TouchyEvent): Position {
  if ('touches' in event) {
    const touch = event.touches[0]
    return {
      x: touch.pageX,
      y: touch.pageY
    }
  }
  return {
    x: event.pageX,
    y: event.pageY
  }
}

export interface Wrapper<T = unknown> extends MouseMoveActions<void, T> {}

export type ExtractWrapped<T> = T extends Wrapper<infer T> ? T : never

export type Target = string /** Selector */ | DragStartTarget

export interface UseDraggableOptions<T extends Wrapper = Wrapper>
  extends MouseMoveActions<ExtractWrapped<T>, void> {
  /**
   * Element to attach `TouchMove` and `TouchEnd` events to.
   *
   * @default window
   */
  draggingTarget?: MaybeRef<DraggingTarget>

  /**
   * Determine whether draggable should be started by whom,
   * or whether it should be started at this time
   *
   * If you don't want to bind the new dom every time, you can use this property
   *
   * @example
   * ```ts
   * // Hopefully #knobs on #header started
   * useDraggable('#header', { ..., contains: ['#knobs'] })
   *
   * // Or do not want the right button to started
   * useDraggable('#header', { ..., contains: ({ button }) => button !== 2 })
   * ```
   */
  contains?:
    | NonNullable<DragStartTarget>[]
    | ((
        target: NonNullable<DragStartTarget> /** Element to which the `TouchStart` is bound */,
        event: TouchyEvent
      ) => boolean)

  /**
   * Specifies the pointer event type to use - @default ['mouse' | 'pen' | 'touch']
   */
  pointerTypes?: PointerType[]

  /**
   * Use wrapper to control the final output data, It is intended to separate your code logic
   *
   * I wanted to write it in the form of middleware, but I can't figure out the type!!!
   * So if you want to split the code block, you can handle it yourself
   */
  wrapper?: T
}

export function useDraggable(
  /**
   * event-started listener region - @default undefined
   */
  target: MaybeRef<Target>,
  options: UseDraggableOptions
) {
  const draggingRef = ref(false)
  const positionRef = ref<Position>()

  let initPosition: Position

  const getMoveActionPosition = (mousePosition: Position) => {
    return {
      ...mousePosition,
      diff: {
        x: mousePosition.x - initPosition.x,
        y: mousePosition.y - initPosition.y
      }
    }
  }

  const { draggingTarget, contains, wrapper, onStart, onMove, onEnd } = options

  const containsIsArray = Array.isArray(contains)
  const allowTouchStart =
    !contains || (containsIsArray && !contains.length)
      ? () => true // always
      : containsIsArray
      ? // Which I find more useful than the form of `exclude`,
        // because there are not many elements that usually trigger drag
        (event: TouchyEvent) => {
          const { target } = event
          return contains.some((c) => normalizeTarget(c) === target)
        }
      : // If you want to exclude some specific factors, a Function may be more suitable,
        // because it gets the new context value and re-executes
        (event: TouchyEvent) => contains(normalizeTarget(unref(target))!, event)

  const onTouchStart = (event: TouchyEvent) => {
    if (!allowTouchStart(event)) {
      return
    }

    draggingRef.value = true
    mouseMoveActionsApi.registerMoveEvent()

    const mousePosition = (initPosition = getMousePotision(event))
    positionRef.value = mousePosition

    const mouseActionPosition = getMoveActionPosition(mousePosition)
    const wrapperParams = wrapper?.onStart?.(event, mouseActionPosition)

    onStart?.(event, mouseActionPosition, wrapperParams)
  }

  const onTouchMove = (event: TouchyEvent) => {
    if (!draggingRef.value) {
      return
    }

    const mousePosition = getMousePotision(event)
    positionRef.value = mousePosition

    const mouseActionPosition = getMoveActionPosition(mousePosition)
    const wrapperParams = wrapper?.onMove?.(event, mouseActionPosition)

    onMove?.(event, mouseActionPosition, wrapperParams)
  }

  const onTouchEnd = (event: TouchyEvent) => {
    draggingRef.value = false
    mouseMoveActionsApi.turnOffMoveEvents()

    const mouseActionPosition = getMoveActionPosition(positionRef.value!)
    const wrapperParams = wrapper?.onEnd?.(event, mouseActionPosition)

    onEnd?.(event, mouseActionPosition, wrapperParams)
  }

  const setupMuoseMoveAction = createMouseMoveActionsApi(options.pointerTypes, {
    onStart: onTouchStart,
    onMove: onTouchMove,
    onEnd: onTouchEnd
  })

  let mouseMoveActionsApi: MouseMoveActionsApi

  watch(
    [() => unref(target), () => unref(draggingTarget)],
    ([target, draggingTarget]) => {
      if (mouseMoveActionsApi) {
        mouseMoveActionsApi.unsetup()
      }
      mouseMoveActionsApi = setupMuoseMoveAction(
        normalizeTarget(target),
        draggingTarget
      )
    },
    {
      immediate: true,
      flush: 'post'
    }
  )

  return {
    position: positionRef,
    dragging: draggingRef,
    turnOff: () => {
      mouseMoveActionsApi.unsetup()
    }
  }
}

function normalizeTarget(target: Target | null): DragStartTarget | null {
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target)
  }
  return target
}
