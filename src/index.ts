import ioHook from 'iohook';
import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';
import * as config from './config';
import * as K from './key';
import { x11 } from './x11';

const logger = process.stdout.isTTY ? pino(PrettyTransform.stream()) : pino();
logger.level = 'trace';

export interface KeyEvent {
  ctrlKey: boolean;
  shiftKey: boolean;
  keycode: number;
}

let enabled = true;
ioHook.on('keydown', async (event: KeyEvent) => {
  const key = K.code(event.keycode);
  if (key == null) {
    logger.trace({ key: event.keycode }, 'Key:Skip');
    return;
  }
  if (key.char === config.EnableDisable) {
    enabled = !enabled;
    logger.warn({ enabled }, 'Enabled:' + enabled);
  }

  if (enabled === false) return;
  let mapping: string | undefined;
  if (event.shiftKey || event.ctrlKey) mapping = config.Mapping.get(key.char);
  else if (config.Direct.has(key.char)) mapping = key.char;
  if (mapping == null) return;

  const [allWindows, activeWindowId] = await Promise.all([
    x11.listWindows('warcraft', logger),
    x11.activeWindow(logger),
  ]);

  if (!allWindows.includes(activeWindowId)) {
    logger.debug({ activeWindowId, warcraftWindows: allWindows, char: key.char }, 'Key:Skipping');
    return;
  }

  for (const windowId of allWindows) {
    if (windowId === activeWindowId) continue;
    x11.sendKey(windowId, mapping, logger);
  }
});

// Register and start hook
async function main(): Promise<void> {
  ioHook.start(false);
}

main().catch((e) => console.error(e));
