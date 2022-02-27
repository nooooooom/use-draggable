# use-draggable

A Vue hook that combines some common logic for dragging.

[![npm version](https://badge.fury.io/js/@nooooooom%2Fuse-draggable.svg)](https://badge.fury.io/js/@nooooooom%2Fuse-draggable)

## Install

```sh
yarn add @nooooooom/use-draggable --dev
# or
pnpm install @nooooooom/use-draggable --save-dev
```

## Options

| Option        | Type                                                                                            | Description                                                                                                | Default   |
| ------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------- |
| defaultWindow | Window                                                                                          | Window to bind `TouchMove` event, If undefined , it will get the window where the `container` is located。 | Window    |
| container     | MaybeRef<HTMLElement &#124; string &#124; null>                                                 | `TouchStart` listener region.                                                                              | Document  |
| containers    | Array<HTMLElement &#124; string> &#124; (container: HTMLElement, event: TouchyEvent) => boolean | Determine whether draggable should be started by whom.                                                     | undefined |
| pointerTypes  | ['mouse' &#124; 'pen' &#124; 'touch']                                                           | Specifies the pointer event type to use.                                                                   | undefined |
| wrapper       | Wrapper                                                                                         | Use wrapper to control the final output data.                                                              | undefined |
| onStart       | (event: TouchyEvent, position: MoveActionPosition, params: unknown) => void                     | A callback receiving the `TouchDown`.                                                                      | undefined |
| onMove        | (event: TouchyEvent, position: MoveActionPosition, params: unknown) => void                     | A callback receiving the `TouchMove`.                                                                      | undefined |
| onEnd         | (event: TouchyEvent, position: MoveActionPosition, params: unknown) => void                     | A callback receiving the `TouchEnd`.                                                                       | undefined |

## Response

| Name     | Type          | Description                         |
| -------- | ------------- | ----------------------------------- |
| position | Ref<Position> | The mouse position during dragging. |
| dragging | Ref<boolean>  | Whether it is dragging.             |
| turnOff  | () => void    | Turn off all event listener.        |

## Basic Usage

Basic drag.

<details>
<summary>Without</summary>

```html
<style>
  #box {
    position: fixed;
    width: 100px;
    height: 100px;
    background: #116dff;
  }
</style>

<div id="box"></div>
```

</details>

```ts
import { useDraggable } from '@nooooooom/use-draggable'

const boxEl = document.querySelector('#box')

let startRect

useDraggable(boxEl, {
  onStart: () => {
    startRect = boxEl.getBoundingClientRect()
  },
  onMove: (event, position) => {
    // Each dragging, it will return the current mouse position and the position that differ from start.
    // type position = { x: number; y: number; diff: { x: number; y: number } }
    boxEl.style.top = `${startRect.top + position.diff.y}px`
    boxEl.style.left = `${startRect.left + position.diff.x}px`
  }
})
```

`use-draggable` has a very interesting property - `wrapper` , which may be needed when you need to do some kind of calculation on mouse position, It is intended to separate your code logic.

For example, I want to put some constraints on the position of dragging:

```ts
import { useDraggable } from '@nooooooom/use-draggable'

const boxEl = document.querySelector('#box')

let startRect

useDraggable(boxEl, {
  wrapper: {
    onMove: (event, position) => {
      const top = startRect.top + position.diff.y
      const left = startRect.left + position.diff.x
      // We restrict the `box` to only move in the window.
      return {
        top: Math.max(0, Math.min(top, window.innerHeight - startRect.height)),
        left: Math.max(0, Math.min(left, window.innerWidth - startRect.width))
      }
    }
  },
  onStart: () => {
    startRect = boxEl.getBoundingClientRect()
  },
  onMove: (
    event,
    position,
    // The result returned by `wrapper` will be passed in the third argument.
    nextPosition
  ) => {
    boxEl.style.top = `${nextPosition.top}px`
    boxEl.style.left = `${nextPosition.left}px`
  }
})
```

So you can extract the core core logic and reuse it elsewhere.

`use-draggable` has some interesting built-in wrappers, such as `rotateWrapper`.

Some options of `rotateWrapper` can be found in the [source code](https://github.com/nooooooom/use-draggable/blob/main/src/wrappers/rotate.ts).

```ts
import { useDraggable, rotateWrapper } from '@nooooooom/use-draggable'

const boxEl = document.querySelector('#box')

let currentAngle = 0

useDraggable(boxEl, {
  wrapper: rotateWrapper(
    // Input in a position to tell `rotateWrapper` which point to use as the center point for angle calculations
    { x: 50, y: 50 }
  ),
  onMove: (event, position, incrementAngle) => {
    // Now the `box` will rotate around its own center.
    boxEl.style.transform = `rotateZ(${(currentAngle + incrementAngle)}deg)`
  },
  onEnd: (event, position, incrementAngle) => {
    currentAngle += incrementAngle
  }
})
```

Separating the logic of operations can help us better troubleshoot problems in our code, because in most cases we are just repeatedly calling some operation functions and then using their operation results.

## Feature

I'll keep populating some interesting built-in wrappers, I've enjoyed developing them, and I think they'll help draggable do a lot of interesting things.
  
![NT5AC(NZXG~Q(3CJ5@ OS2Q](https://user-images.githubusercontent.com/61452855/155855685-adcf6acb-ff97-4c95-a11b-e45eeddcc2d7.gif)

## License

MIT
