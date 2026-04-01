// Global teardown: stop mock WebSocket server after all tests

import { stopServer } from './mock-server/index'

export default async function globalTeardown() {
  await stopServer()
  console.log('Mock server stopped')
}
