import { unref } from 'vue-demi'
import type { MaybeRef, Position, Wrapper } from '../useDraggable'

// ref https://www.wix.com/about/us

// TODO support ratio & simplify the code

export interface Layout extends Position {
  width: number
  height: number
}

const directions = [
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left'
] as const

export type Direction<T = typeof directions> = T extends (infer E)[]
  ? E
  : T extends readonly (infer E)[]
  ? E
  : never

const DIRECTION_POSITION = {
  TOP: -1,
  BOTTOM: 1,
  LEFT: -1,
  RIGHT: 1,
  NONE: 0
} as const

const DIRECTION_AXIS = {
  TOP: 'y',
  BOTTOM: 'y',
  LEFT: 'x',
  RIGHT: 'x'
} as const

type EuclidDirectionValue = -1 | 0 | 1
type EuclidDirection = Record<keyof Position, EuclidDirectionValue>
type EuclidDirectionMap = Record<Direction, EuclidDirection>

const euclidDirectionMap = directions.reduce((map, direction) => {
  map[direction] = direction.split('-').reduce<EuclidDirection>(
    (value, direction) => {
      const D_N = direction.toLocaleUpperCase() as keyof typeof DIRECTION_AXIS
      value[DIRECTION_AXIS[D_N]] = DIRECTION_POSITION[D_N]
      return value
    },
    { x: 0, y: 0 }
  )
  return map
}, {} as EuclidDirectionMap)

function getEuclidDirection(direction: Direction) {
  return euclidDirectionMap[direction]
}

function getValidMouseDiffToPreventSquash(
  direction: EuclidDirectionValue,
  layoutSize: number,
  desiredDiff: number
) {
  let validMouseDiff = 0

  if (direction === 1) {
    validMouseDiff = Math.max(-layoutSize, desiredDiff)
  } else if (direction === -1) {
    validMouseDiff = Math.min(layoutSize, desiredDiff)
  }

  return validMouseDiff
}

function getLayoutAfterHorizontalResize(
  layout: Layout,
  mouseDiff: Position,
  direction: EuclidDirection,
  /**
   * What aspect ratio should be used to adjust the layout size,
   * if it is `undefined`, only adjust the horizontal size
   */
  layoutAspectRatio?: number
) {
  const layoutAfterResize = { ...layout }

  let horizontalChange = getValidMouseDiffToPreventSquash(
    direction.x,
    layout.width,
    mouseDiff.x
  )

  if (direction.x === DIRECTION_POSITION.LEFT) {
    horizontalChange = -horizontalChange
    layoutAfterResize.x -= horizontalChange
  }
  layoutAfterResize.width += horizontalChange

  if (layoutAspectRatio !== undefined) {
    layoutAfterResize.height = layoutAfterResize.width / layoutAspectRatio
    layoutAfterResize.y -= layoutAfterResize.height - layoutAfterResize.height
  }

  return layoutAfterResize
}

function getLayoutAfterVerticalResize(
  layout: Layout,
  mouseDiff: Position,
  direction: EuclidDirection,
  /**
   * What aspect ratio should be used to adjust the layout size,
   * if it is `undefined`, only adjust the vertical size
   */
  layoutAspectRatio?: number
) {
  const layoutAfterResize = { ...layout }

  let verticalChange = getValidMouseDiffToPreventSquash(
    direction.y,
    layout.height,
    mouseDiff.y
  )

  if (direction.y === DIRECTION_POSITION.TOP) {
    verticalChange = -verticalChange
    layoutAfterResize.y -= verticalChange
  }

  layoutAfterResize.height += verticalChange

  if (layoutAspectRatio !== undefined) {
    layoutAfterResize.width = layoutAfterResize.height * layoutAspectRatio
    layoutAfterResize.x -= layoutAfterResize.width - layoutAfterResize.width
  }

  return layoutAfterResize
}

function isHorizontalResize(direction: EuclidDirection) {
  return (
    direction.x !== DIRECTION_POSITION.NONE &&
    direction.y === DIRECTION_POSITION.NONE
  )
}

function isVerticalResize(direction: EuclidDirection) {
  return (
    direction.y !== DIRECTION_POSITION.NONE &&
    direction.x === DIRECTION_POSITION.NONE
  )
}

function projectMouseProportionally(
  mouseDiff: Position,
  layout: Layout,
  direction: EuclidDirection
) {
  // The points that make up the line for projection:
  // ('from' is the static handle, 'to' is the used handle)
  const fromPoint = {
    x: direction.x > 0 ? layout.x : layout.x + layout.width,
    y: direction.y > 0 ? layout.y : layout.y + layout.height
  }

  const toPoint = {
    x: direction.x < 0 ? layout.x : layout.x + layout.width,
    y: direction.y < 0 ? layout.y : layout.y + layout.height
  }

  // get slope:
  const m = (toPoint.y - fromPoint.y) / (toPoint.x - fromPoint.x)

  // get standard form: ax + by + c = 0
  const a = m
  const b = -1
  const c = fromPoint.y - m * fromPoint.x

  //absolute mouse location:
  const mouse = {
    x: toPoint.x + mouseDiff.x,
    y: toPoint.y + mouseDiff.y
  }

  return {
    x: (b * (b * mouse.x - a * mouse.y) - a * c) / (a * a + b * b) - toPoint.x,
    y: (a * (a * mouse.y - b * mouse.x) - b * c) / (a * a + b * b) - toPoint.y
  }
}

function updateLayoutForVerticalResize(
  layout: Layout,
  mouseDiff: Position,
  yDirection: EuclidDirectionValue
) {
  const validMouseYDiff = getValidMouseDiffToPreventSquash(
    yDirection,
    layout.height,
    mouseDiff.y
  )
  if (yDirection === 1) {
    layout.height += validMouseYDiff
  } else if (yDirection === -1) {
    layout.y += validMouseYDiff
    layout.height -= validMouseYDiff
  }
}

function updateLayoutForHorizontalResize(
  layout: Layout,
  mouseDiff: Position,
  xDirection: EuclidDirectionValue
) {
  const validMouseXDiff = getValidMouseDiffToPreventSquash(
    xDirection,
    layout.width,
    mouseDiff.x
  )
  if (xDirection === 1) {
    layout.width += validMouseXDiff
  } else if (xDirection === -1) {
    layout.x += validMouseXDiff
    layout.width -= validMouseXDiff
  }
}

function getLayoutAfterStandardResize(
  layout: Layout,
  mouseDiff: Position,
  direction: EuclidDirection
) {
  const layoutAfterResize = { ...layout }

  if (direction.x) {
    updateLayoutForHorizontalResize(layoutAfterResize, mouseDiff, direction.x)
  }

  if (direction.y) {
    updateLayoutForVerticalResize(layoutAfterResize, mouseDiff, direction.y)
  }

  return layoutAfterResize
}

function getLayoutAspectRatio(layout: Layout) {
  return layout.width / layout.height
}

export function resizeWrapper(
  layout: MaybeRef<Layout>,
  direction: MaybeRef<Direction>,
  /** whether to maintain the aspect ratio of the layout */
  proportional?: MaybeRef<boolean>
): Wrapper<Layout> {
  let initLayout: Layout

  const getLayout = (mouseDiff: Position) => {
    const euclidDirection = getEuclidDirection(unref(direction))
    if (isHorizontalResize(euclidDirection)) {
      return getLayoutAfterHorizontalResize(
        initLayout,
        { ...mouseDiff },
        euclidDirection,
        proportional ? getLayoutAspectRatio(initLayout) : undefined
      )
    } else if (isVerticalResize(euclidDirection)) {
      return getLayoutAfterVerticalResize(
        initLayout,
        { ...mouseDiff },
        euclidDirection,
        proportional ? getLayoutAspectRatio(initLayout) : undefined
      )
    } else {
      let proportionallyMouseDiff = { ...mouseDiff }
      if (proportional) {
        proportionallyMouseDiff = projectMouseProportionally(
          proportionallyMouseDiff,
          initLayout,
          euclidDirection
        )
      }
      return getLayoutAfterStandardResize(
        { ...initLayout },
        proportionallyMouseDiff,
        euclidDirection
      )
    }
  }

  return {
    onStart: () => (initLayout = { ...unref(layout) }),
    onMove: (event, position) => getLayout(position.diff),
    onEnd: (event, position) => getLayout(position.diff)
  }
}
