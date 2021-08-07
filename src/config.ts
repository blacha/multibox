import * as z from 'zod';
import { TypeOf } from 'zod';
import { char } from './key';

export const Mapping = new Map<string, string>();
export const Mouse = new Map<number, string>();

export const Direct = new Set<string>();

export const EnableDisable = '`';

const zKeyCode = z.string().refine((f) => char(f));

export const zConfigObject = z.object({
  toggle: zKeyCode,
  map: z.record(zKeyCode).transform((f) => new Map(Object.entries(f))),
  mouse: z.record(zKeyCode).transform((f) => new Map(Object.entries(f))),
});

export type MultiConfig = TypeOf<typeof zConfigObject>;
