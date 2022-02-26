import { unref } from 'vue-demi'
import type { MaybeRef, Position, Wrapper } from '../useDraggable'

const PRE_RADIANS = 180 / Math.PI

function getRadiansBetween(p: Position, q: Position) {
  return Math.atan2(p.y - q.y, p.x - q.x)
}

export function rotateWrapper(
  center: MaybeRef<Position>,
  interval = 1
): Wrapper<number> {
  let initRadians: number
  return {
    onStart: (event, position) => {
      initRadians = getRadiansBetween(position, unref(center))
      return 0
    },
    onMove: (event, position) => {
      const currentRadians = getRadiansBetween(position, unref(center))
      const diffAngle = (currentRadians - initRadians) * PRE_RADIANS
      const incrementAngle = Math.floor(diffAngle / interval) * interval
      return Math.floor(
        incrementAngle < 0 ? incrementAngle + 360 : incrementAngle
      )
    }
  }
}
