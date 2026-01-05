import { startVitest } from 'vitest/node'

const vitest = await startVitest('test', [], {
  watch: false,
  run: true,
  reporters: ['verbose'],
  coverage: {
    enabled: true,
    reporter: ['text', 'json-summary', 'json'],
  },
})

await vitest?.close()
process.exit(vitest?.state.getCountOfFailedTests() === 0 ? 0 : 1)
