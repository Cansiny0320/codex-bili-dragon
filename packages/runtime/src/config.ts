import { z } from 'zod';
import { DateTime } from 'luxon';
import type { Store } from './store.js';
import { defaultPersona, legacyPersona } from './prompts.js';
const text = z.string().max(2000),
  uid = z.string().regex(/^\d*$/),
  clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/);
export const configSchema = z
  .object({
    enabled: z.boolean().default(false),
    // Older configurations are resolved after the login identity is verified.
    accountMode: z.enum(['single', 'dual']).optional(),
    timezone: z
      .string()
      .refine((v) => DateTime.now().setZone(v).isValid)
      .default('Asia/Shanghai'),
    persona: z
      .object({
        name: text.default('小白龙'),
        ownerTitle: text.default('你'),
        selfClaim: text.default('我'),
        diaryTitle: text.default('给你的信'),
        body: z.string().max(20000).default(defaultPersona),
      })
      .strict()
      .prefault({}),
    preferences: z
      .object({
        like: z.array(text).max(20).default(['科技', '有趣的知识']),
        dislike: z.array(text).max(20).default(['标题党', '引战']),
      })
      .strict()
      .prefault({}),
    owner: z
      .object({ mid: uid.default(''), name: text.default('') })
      .strict()
      .prefault({}),
    permissions: z
      .object({
        comments: z.boolean().default(false),
        dm: z.boolean().default(true),
        live: z.boolean().default(false),
        favorites: z.boolean().default(false),
      })
      .strict()
      .prefault({}),
    share: z
      .object({
        enabled: z.boolean().default(false),
        via: z.enum(['comment', 'dm']).default('comment'),
        minScore: z.number().min(0).max(20).default(13),
        silentAfterDays: z.number().int().min(1).max(30).default(3),
      })
      .strict()
      .prefault({}),
    quota: z
      .object({ shareDaily: z.number().int().min(0).max(3).default(3) })
      .strict()
      .prefault({}),
    listen: z
      .object({
        comment: z.boolean().default(false),
        dm: z.boolean().default(false),
        live: z.boolean().default(false),
        allDay: z.boolean().default(false),
        commentIntervalSec: z.number().int().min(60).max(3600).default(60),
        dmIntervalSec: z.number().int().min(60).max(3600).default(60),
        liveRoom: uid.default(''),
        liveScope: z.enum(['owner', 'mention']).default('owner'),
        oncePerPerson: z.boolean().default(true),
      })
      .strict()
      .prefault({}),
    night: z
      .object({
        windows: z
          .array(
            z
              .object({
                start: clock.refine((v) => v !== '24:00'),
                end: clock,
                wakes: z.number().int().min(0).max(3),
              })
              .strict(),
          )
          .min(1)
          .max(4)
          .default([{ start: '20:00', end: '24:00', wakes: 1 }]),
        skipChance: z.number().min(0).max(1).default(0.3),
        minGapMin: z.number().int().min(10).max(1440).default(10),
        maxVideos: z.number().int().min(1).max(10).default(5),
      })
      .strict()
      .prefault({}),
    model: z.string().max(100).default(''),
    codexPath: z.string().max(1000).default(''),
  })
  .strict();
export type Config = z.infer<typeof configSchema>;
export const validateConfig = (value: unknown) => {
  const config = configSchema.parse(value);
  if (config.persona.body === legacyPersona) config.persona.body = defaultPersona;
  return config;
};
export const defaults = validateConfig({});
export const readConfig = (store: Store) => validateConfig(store.read('config', {}));
