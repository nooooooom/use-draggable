import { unref } from 'vue-demi'
import type { MaybeRef, Position, Wrapper } from '../useDraggable'

const PER_RADIANS = 180 / Math.PI

function getRadiansBetween(p: Position, q: Position) {
  return Math.atan2(p.y - q.y, p.x - q.x)
}

function normalizeDegrees(degrees: number) {
  return Math.floor(degrees < 0 ? degrees + 360 : degrees)
}

export function rotateWrapper(
  center: MaybeRef<Position>,
  interval: MaybeRef<number> = 1
): Wrapper<number> {
  let initInterval: number | undefined
  let initRotationInDegrees: number
  let startRotationInDegrees: number
  let lastIncrementDegrees: number

  const getIncrementDegrees = (position: Position) => {
    const rawCenter = unref(center)
    const rawInterval = unref(interval)
    // When the interval changes,
    // use the last radians as a new anchor to reset the processing logic of interval
    if (initInterval !== interval) {
      initInterval = rawInterval
      initRotationInDegrees = lastIncrementDegrees
    }

    const newRotationInDegrees = normalizeDegrees(
      getRadiansBetween(position, rawCenter) * PER_RADIANS
    )
    const degreesDiff = newRotationInDegrees - initRotationInDegrees
    const incrementDegreesDiff =
      Math.floor(degreesDiff / rawInterval) * rawInterval
    const newIncrementDegrees = initRotationInDegrees + incrementDegreesDiff

    lastIncrementDegrees = newIncrementDegrees

    return newIncrementDegrees - startRotationInDegrees
  }

  return {
    onStart: (event, position) => {
      startRotationInDegrees = initRotationInDegrees = normalizeDegrees(
        getRadiansBetween(position, unref(center)) * PER_RADIANS
      )
      lastIncrementDegrees = 0
      return 0
    },
    onMove: (event, position) => getIncrementDegrees(position),
    onEnd: (event, position) => getIncrementDegrees(position)
  }
}
