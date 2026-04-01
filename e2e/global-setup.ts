// Global setup: start mock WebSocket server before all tests

import { startServer } from './mock-server/index'

export default async function globalSetup() {
  await startServer()
  console.log('Mock server started for e2e tests')
}
