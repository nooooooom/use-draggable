import { unref } from 'vue-demi'
import type { MaybeRef, Position, Wrapper } from '../useDraggable'

const PER_RADIANS = 180 / Math.PI

function getRadiansBetween(p: Position, q: Position) {
  return Math.atan2(p.y - q.y, p.x - q.x)
}

export function rotateWrapper(
  center: MaybeRef<Position>,
  interval: MaybeRef<number> = 1
): Wrapper<number> {
  let initRadians: number

  const getIncrementAngle = (position: Position) => {
    const rawCenter = unref(center)
    const rawInterval = unref(interval)

    const currentRadians = getRadiansBetween(position, rawCenter)
    const diffAngle = (currentRadians - initRadians) * PER_RADIANS

    const incrementAngle = Math.floor(diffAngle / rawInterval) * rawInterval

    return Math.floor(
      incrementAngle < 0 ? incrementAngle + 360 : incrementAngle
    )
  }

  return {
    onStart: (event, position) => {
      initRadians = getRadiansBetween(position, unref(center))
      return 0
    },
    onMove: (event, position) => getIncrementAngle(position),
    onEnd: (event, position) => getIncrementAngle(position)
  }
}
