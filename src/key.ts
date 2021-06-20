import * as AllKeys from './key.code';

export interface Key {
  code: number;
  char: string;
}

const KeyCharMap = new Map<string, Key>();
const KeyCodeMap = new Map<number, Key>();

for (const c of Object.values(AllKeys)) {
  if (c.char == null) continue;
  KeyCharMap.set(c.char, c);
  KeyCodeMap.set(c.code, c);
}

export function char(c: string): Key {
  const key = KeyCharMap.get(c);
  if (key == null) {
    throw new Error('Failed to lookup code: ' + c);
  }
  return key;
}

export function code(c: number): Key | undefined {
  return KeyCodeMap.get(c);
}
