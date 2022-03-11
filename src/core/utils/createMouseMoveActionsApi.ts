// https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType
const pointerTypes = ['mouse', 'pen', 'touch'] as const

export type PointerType<T = typeof pointerTypes> = T extends (infer E)[]
  ? E
  : T extends readonly (infer E)[]
  ? E
  : never

export type TouchyEvent = MouseEvent | TouchEvent | PointerEvent

function resolvePointerType(event: TouchyEvent) {
  return 'pointerType' in event
    ? (event.pointerType as PointerType)
    : 'touches' in event
    ? 'touch'
    : 'mouse'
}

type MouseActionHandles = Record<
  'onStart' | 'onMove' | 'onEnd',
  (event: TouchyEvent) => void
>

const mouse = {
  start: 'mousedown',
  end: 'mouseup',
  move: 'mousemove'
} as const

const touch = {
  start: 'touchstart',
  end: 'touchend',
  move: 'touchmove'
} as const

const pointer = {
  start: 'pointerdown',
  end: 'pointerup',
  move: 'pointermove'
} as const

function getMoveEvents() {
  // @ts-expect-error
  return window.navigator.pointerEnabled ? [pointer] : [mouse, touch]
}

export interface MouseMoveActionsApi {
  unsetup: () => void
  registerMoveEvent: () => void
  turnOffMoveEvents: () => void
}

const emptyMouseMoveActionApi: MouseMoveActionsApi = {
  unsetup: () => {},
  registerMoveEvent: () => {},
  turnOffMoveEvents: () => {}
} as const

export type DragStartTarget = HTMLElement | SVGElement | Document | null

export type DraggingTarget = HTMLElement | SVGElement | Window | Document | null

export type SetupMouseMoveActionsApi = (
  target: DragStartTarget,
  draggingTarget?: DraggingTarget
) => MouseMoveActionsApi

export function createMouseMoveActionsApi(
  types: PointerType[] | undefined,
  actions: MouseActionHandles
): SetupMouseMoveActionsApi {
  const { onStart, onMove, onEnd } = actions

  const filterEvent = (event: TouchyEvent) => {
    return !types || types.includes(resolvePointerType(event))
  }

  const onPointerDown = (event: TouchyEvent) => {
    if (filterEvent(event)) {
      onStart?.(event)
    }
  }

  const onPointerMove = (event: TouchyEvent) => {
    if (filterEvent(event)) {
      onMove?.(event)
    }
  }

  const onPointerUp = (event: TouchyEvent) => {
    if (filterEvent(event)) {
      onEnd?.(event)
    }
  }

  const Events = getMoveEvents()

  const setup: SetupMouseMoveActionsApi = (target, draggingTarget) => {
    if (!target) {
      return emptyMouseMoveActionApi
    }

    // To make the event type accurate
    const draggingArea = (draggingTarget ||
      getDefaultWindow(target)) as HTMLElement

    Events.forEach((evet) =>
      (target as HTMLElement).addEventListener(evet.start, onPointerDown)
    )

    return {
      unsetup: () => {
        Events.forEach((evet) => {
          ;(target as HTMLElement).removeEventListener(
            evet.start,
            onPointerDown
          )
          draggingArea.removeEventListener(evet.move, onPointerMove)
          draggingArea.removeEventListener(evet.end, onPointerMove)
        })
      },
      registerMoveEvent: () => {
        Events.forEach((evet) => {
          draggingArea.addEventListener(evet.move, onPointerMove)
          draggingArea.addEventListener(evet.end, onPointerUp)
        })
      },
      turnOffMoveEvents: () => {
        Events.forEach((evet) => {
          draggingArea.removeEventListener(evet.move, onPointerMove)
          draggingArea.removeEventListener(evet.end, onPointerMove)
        })
      }
    }
  }

  return setup
}

function getDefaultWindow(target: any): Window {
  if (!target) {
    return window
  }
  const ownerDocument = target.ownerDocument
  return ownerDocument?.defaultView || window
}
