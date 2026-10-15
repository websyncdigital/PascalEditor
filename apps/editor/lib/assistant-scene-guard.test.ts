import { expect, test } from 'bun:test'
import { canApplyRemoteScene } from './assistant-scene-guard'

test('remote updates cannot replace local edits or an in-flight manual save', () => {
  expect(canApplyRemoteScene('saved', 'saved', 0)).toBe(true)
  expect(canApplyRemoteScene('manual edit', 'saved', 0)).toBe(false)
  expect(canApplyRemoteScene('saved', 'saved', 1)).toBe(false)
})
