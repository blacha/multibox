import ioHook from 'iohook';
import { Logger } from 'pino';
import { MultiConfig } from './config';
import * as K from './key';
import { KeyC } from './key.code';
import { x11 } from './x11';

export interface KeyEvent {
  ctrlKey: boolean;
  shiftKey: boolean;
  keycode: number;
}
export interface MouseEvent {
  button: 1 | 2 | 3 | 4 | 5;
  x: number;
  y: number;
  clicks: number;
}

export class IoHook {
  isEnabled: boolean;
  config: MultiConfig;

  constructor(config: MultiConfig) {
    this.config = config;
    this.isEnabled = true;
  }

  start(logger: Logger): void {
    ioHook.on('mousedown', async (event: MouseEvent) => {
      if (this.isEnabled === false) {
        logger.debug({ button: event.button, enabled: false }, 'Disabled:Skip');
        return;
      }

      const map = this.config.mouse.get(event.button.toString());
      if (map) return this.sendKey(map, logger);
    });

    ioHook.on('keydown', async (event: KeyEvent) => {
      const enabled = this.isEnabled;
      const key = K.code(event.keycode);
      if (key == null) {
        logger.trace({ key: event.keycode, enabled }, 'Key:Skip');
        return;
      }

      if (key.char === this.config.toggle) {
        this.isEnabled = !enabled;
        logger.warn({ enabled }, 'Enabled:' + enabled);
        return;
      }

      if (enabled === false) {
        logger.debug({ key: event.keycode, enabled }, 'Disabled:Skip');
        return;
      }

      const keys = [];
      if (event.shiftKey) keys.push('shift');
      if (event.ctrlKey) keys.push('ctrl');

      if (!keys.includes(key.char)) keys.push(key.char);
      const keyChar = keys.join('+');

      const map = this.config.map.get(keyChar);

      if (map) await this.sendKey(map, logger);
      else console.log(keyChar);
    });

    ioHook.start(false);
  }

  async sendKey(key: string, logger: Logger): Promise<void> {
    const [allWindows, activeWindowId] = await Promise.all([
      x11.listWindows('warcraft', logger),
      x11.activeWindow(logger),
    ]);

    if (!allWindows.includes(activeWindowId)) {
      logger.debug({ activeWindowId, warcraftWindows: allWindows, char: key }, 'Key:Skipping');
      return;
    }

    for (const windowId of allWindows) {
      if (windowId === activeWindowId) continue;
      x11.sendKey(windowId, key, logger);
    }
  }
}
