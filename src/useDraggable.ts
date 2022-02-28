import { computed, Ref } from 'vue-demi'
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

export interface Wrapper<T = void> extends MouseMoveActions<void, T> {}

export type ExtractWrapped<T> = T extends Wrapper<infer T> ? T : never

export type Target = string /** Selector */ | DragStartTarget

export interface UseDraggableOptions<T>
  extends MouseMoveActions<ExtractWrapped<T>, void> {
  /**
   * Initial position of the pointer.
   *
   * @default { x: 0, y: 0 }
   */
  initialPostiion?: MaybeRef<Position>

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
    | NonNullable<Target>[]
    | ((
        event: TouchyEvent,
        target: NonNullable<Target> /** Element to which the `TouchStart` is bound */
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

export function useDraggable<T extends Wrapper<void>>(
  target: MaybeRef<Target>,
  options?: UseDraggableOptions<T>
): UseDraggableReturn

export function useDraggable(
  target: MaybeRef<Target>,
  options?: UseDraggableOptions<{}>
): UseDraggableReturn

export function useDraggable<T extends Wrapper<any>>(
  /**
   * event-started listener region - @default undefined
   */
  target: MaybeRef<Target>,
  options: UseDraggableOptions<T> = {}
): UseDraggableReturn {
  const targetRef = computed(() => normalizeTarget(unref(target)))
  const draggingRef = ref(false)
  const positionRef: Ref<Position> = ref(
    options.initialPostiion || { x: 0, y: 0 }
  )

  const { draggingTarget, contains, wrapper, onStart, onMove, onEnd } = options

  const allowTouchStart = !contains
    ? () => true // always
    : Array.isArray(contains)
    ? // Which I find more useful than the form of `exclude`,
      // because there are not many elements that usually trigger drag
      (event: TouchyEvent) => {
        const { target } = event
        return (
          target && contains.some((c) => matchesTarget(target as Element, c))
        )
      }
    : // If you want to exclude some specific factors, a Function may be more suitable,
      // because it gets the new context value and re-executes
      (event: TouchyEvent) => contains(event, targetRef.value!)

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

  const onTouchStart = (event: TouchyEvent) => {
    if (!allowTouchStart(event)) {
      return
    }

    draggingRef.value = true
    mouseMoveActionsApi.registerMoveEvent()

    const mousePosition = (initPosition = getMousePotision(event))
    positionRef.value = mousePosition

    const mouseActionPosition = getMoveActionPosition(mousePosition)
    const wrapped = wrapper?.onStart?.(event, mouseActionPosition)

    onStart?.(event, mouseActionPosition, wrapped)
  }

  const onTouchMove = (event: TouchyEvent) => {
    if (!draggingRef.value) {
      return
    }

    const mousePosition = getMousePotision(event)
    positionRef.value = mousePosition

    const mouseActionPosition = getMoveActionPosition(mousePosition)
    const wrapped = wrapper?.onMove?.(event, mouseActionPosition)

    onMove?.(event, mouseActionPosition, wrapped)
  }

  const onTouchEnd = (event: TouchyEvent) => {
    draggingRef.value = false
    mouseMoveActionsApi.turnOffMoveEvents()

    const mouseActionPosition = getMoveActionPosition(positionRef.value!)
    const wrapped = wrapper?.onEnd?.(event, mouseActionPosition)

    onEnd?.(event, mouseActionPosition, wrapped)
  }

  const setupMouseMoveAction = createMouseMoveActionsApi(options.pointerTypes, {
    onStart: onTouchStart,
    onMove: onTouchMove,
    onEnd: onTouchEnd
  })

  let mouseMoveActionsApi: MouseMoveActionsApi

  const stopWatch = watch(
    [targetRef, () => unref(draggingTarget)],
    ([target, draggingTarget]) => {
      mouseMoveActionsApi?.unsetup()
      mouseMoveActionsApi = setupMouseMoveAction(
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
      mouseMoveActionsApi?.unsetup()
      stopWatch()
    }
  }
}

type UseDraggableReturn = {
  position: Ref<Position>
  dragging: Ref<boolean>
  turnOff: () => void
}

function normalizeTarget(target: Target | null): DragStartTarget | null {
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target)
  }
  return target
}

function matchesTarget(target: Element, selectorOrElement: Target) {
  if (typeof selectorOrElement === 'string') {
    return target.matches(selectorOrElement)
  }
  return target === selectorOrElement
}
