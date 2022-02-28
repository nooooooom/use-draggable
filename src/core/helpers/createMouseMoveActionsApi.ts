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
}

const touch = {
  start: 'touchstart',
  end: 'touchend',
  move: 'touchmove'
}

const pointers = {
  start: 'pointerdown',
  end: 'pointerup',
  move: 'pointermove'
}

function getMoveEvents() {
  // @ts-expect-error
  return window.navigator.pointerEnabled ? [pointers] : [mouse, touch]
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

    const draggingElement = draggingTarget ?? getDefaultWindow(target)

    Events.forEach((evet) =>
      target.addEventListener(evet.start, onPointerDown as any)
    )

    return {
      unsetup: () => {
        Events.forEach((evet) => {
          target.removeEventListener(evet.start, onPointerDown as any)
          draggingElement.removeEventListener(evet.move, onPointerMove as any)
          draggingElement.removeEventListener(evet.end, onPointerMove as any)
        })
      },
      registerMoveEvent: () => {
        Events.forEach((evet) => {
          draggingElement.addEventListener(evet.move, onPointerMove as any)
          draggingElement.addEventListener(evet.end, onPointerUp as any)
        })
      },
      turnOffMoveEvents: () => {
        Events.forEach((evet) => {
          draggingElement.removeEventListener(evet.move, onPointerMove as any)
          draggingElement.removeEventListener(evet.end, onPointerMove as any)
        })
      }
    }
  }

  return setup
}

function getDefaultWindow(target: any) {
  if (!target) {
    return window
  }
  const ownerDocument = target.ownerDocument
  return ownerDocument?.defaultView || window
}
