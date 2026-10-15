import { describe, expect, test } from 'bun:test'
import { assistantPlanner, assistantProviderStatus } from './assistant-provider'

const context = {
  scene: { id: 'test', name: 'Test', version: 1 },
  selectedIds: [],
  nodes: [],
  assets: [],
  finishes: { floor: [], wall: [] },
}
const env = {
  PASCAL_AI_PROVIDER: 'openai',
  OPENAI_API_KEY: 'test-secret-never-live',
  PASCAL_AI_MODEL: 'configured-test-model',
}

describe('assistant provider boundary', () => {
  test('defaults to free mock and exposes no credential', () => {
    expect(assistantPlanner({}).mode).toBe('mock')
    expect(JSON.stringify(assistantProviderStatus(env))).not.toContain(env.OPENAI_API_KEY)
  })
  test('uses one strict Responses function call and validates its output', async () => {
    let sent: Record<string, unknown> | undefined
    const fakeFetch = (async (_url: unknown, options: RequestInit) => {
      sent = JSON.parse(options.body as string)
      return Response.json({
        status: 'completed',
        output: [
          {
            type: 'function_call',
            name: 'propose_scene_operation',
            arguments: JSON.stringify({ message: 'Which room?', operation: null }),
          },
        ],
      })
    }) as typeof fetch
    const result = await assistantPlanner(env, fakeFetch).plan(
      'change room',
      context,
      new AbortController().signal,
    )
    expect(result.operation).toBeNull()
    expect(sent).toMatchObject({
      store: false,
      parallel_tool_calls: false,
      model: 'configured-test-model',
    })
    expect((sent!.tools as Array<{ strict: boolean }>)[0]!.strict).toBe(true)
  })
  test('fails safely on API errors, invalid output and missing configuration', async () => {
    for (const response of [
      new Response('private provider error', { status: 500 }),
      Response.json({ status: 'incomplete', output: [] }),
      Response.json({
        status: 'completed',
        output: [{ type: 'function_call', name: 'shell', arguments: '{}' }],
      }),
    ]) {
      await expect(
        assistantPlanner(env, (async () => response) as typeof fetch).plan(
          'test',
          context,
          new AbortController().signal,
        ),
      ).rejects.toThrow()
    }
    await expect(
      assistantPlanner({ PASCAL_AI_PROVIDER: 'openai' }).plan(
        'test',
        context,
        new AbortController().signal,
      ),
    ).rejects.toThrow('configuration')
  })
})
