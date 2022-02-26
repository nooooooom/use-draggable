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

export function createMouseMoveActionsApi(
  target: HTMLElement,
  types: PointerType[] | undefined,
  actions: MouseActionHandles,
  defaultWindow: Window = window
) {
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

  // TODO it looks bad
  return {
    setup: () => {
      Events.forEach((evet) =>
        target.addEventListener(evet.start, onPointerDown as any)
      )
    },
    unsetup: () => {
      Events.forEach((evet) => {
        target.removeEventListener(evet.start, onPointerDown as any)
        defaultWindow.removeEventListener(evet.move, onPointerMove as any)
        defaultWindow.removeEventListener(evet.end, onPointerMove as any)
      })
    },
    registerMoveEvent: () => {
      Events.forEach((evet) => {
        defaultWindow.addEventListener(evet.move, onPointerMove as any)
        defaultWindow.addEventListener(evet.end, onPointerUp as any)
      })
    },
    turnOffMoveEvents: () => {
      Events.forEach((evet) => {
        defaultWindow.removeEventListener(evet.move, onPointerMove as any)
        defaultWindow.removeEventListener(evet.end, onPointerMove as any)
      })
    }
  }
}
