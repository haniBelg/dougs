import * as path from 'path';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
export let container: StartedTestContainer;

function nodeContainer() {
  return new GenericContainer('node:20-slim')
    .withBindMounts([
      {
        source: path.resolve(__dirname, '../../'),
        target: '/home/node/app',
      },
    ])
    .withWorkingDir("/home/node/app")
    .withEnvironment({ NESTJS_PORT: '3000' })
    .withExposedPorts({
      container: 3000,
      host: 3000,
    })
    .withEntrypoint(['npm', 'run', 'start']);
}

beforeAll(async () => {
  container = await nodeContainer().start();
}, 70000);
afterAll(async () => {
  await container.stop();
}, 70000);