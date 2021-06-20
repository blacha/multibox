import * as cp from 'child_process';
import type { Logger } from 'pino';
import { MemoizeExpiring } from 'typescript-memoize';

function exec(cmd: string): Promise<{ stdout: string; duration: number }> {
  const startTime = process.hrtime();
  return new Promise((resolve, reject) => {
    cp.exec(cmd, (err, stdout) => {
      const duration = Number((process.hrtime()[1] / 1e6 - startTime[1] / 1e6).toFixed(3));
      if (err) return reject(err);
      resolve({ stdout, duration });
    });
  });
}

class X11 {
  @MemoizeExpiring(1000)
  async activeWindow(logger: Logger): Promise<number> {
    const res = await exec(`xprop -root _NET_ACTIVE_WINDOW`);
    const windowId = Number(res.stdout.split('#').pop()?.trim());

    logger.info({ windowId, duration: res.duration }, 'x11:active');
    return windowId;
  }

  @MemoizeExpiring(10000)
  async listWindows(search: string, logger: Logger): Promise<number[]> {
    const res = await exec(`xwininfo -tree -root`);
    const searchStr = search.toLowerCase();

    const windowIds: number[] = [];

    for (const line of res.stdout.split('\n')) {
      if (!line.includes('+0+0')) continue;
      if (!line.toLowerCase().includes(searchStr)) continue;

      const lineT = line.trim();
      windowIds.push(Number(lineT.slice(0, lineT.indexOf(' '))));
    }
    logger.info({ windowIds, duration: res.duration }, 'x11:list');
    return windowIds;
  }

  async sendKey(windowId: number, char: string, logger: Logger): Promise<void> {
    const res = await exec(`xdotool key --window ${windowId} '${char}'`);
    logger.info({ char, duration: res.duration }, 'x11:key:' + char);
  }
}

export const x11 = new X11();
