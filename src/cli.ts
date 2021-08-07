import { promises as fs } from 'fs';
import { zConfigObject } from './config';
import { IoHook } from './hook';
import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';

const logger = process.stdout.isTTY ? pino(PrettyTransform.stream()) : pino();
logger.level = 'trace';

// Register and start hook
async function main(): Promise<void> {
  const configFile = process.argv[process.argv.length - 1];
  logger.info({ configFile }, 'Loading config');
  const configData = await fs.readFile(configFile);

  console.log(configData.toString());
  const config = zConfigObject.parse(JSON.parse(configData.toString()));

  logger.info({ map: [...config.map.entries()].join(', '), mouse: [...config.mouse.entries()].join(', ') }, 'Mappings');

  const hook = new IoHook(config);
  hook.start(logger);
}

main().catch((e) => console.error(e));
