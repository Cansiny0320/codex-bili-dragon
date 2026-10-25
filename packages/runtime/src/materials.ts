import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Store } from './store.js';
import { redact } from './upstream.js';

export const materialInput = z
  .object({
    bvid: z.string().regex(/^BV[0-9A-Za-z]{10}$/),
    kind: z.enum(['subtitles', 'comments', 'frames', 'debrief']),
  })
  .strict();
export interface MaterialView {
  state: 'ready' | 'unread' | 'failed' | 'missing' | 'empty';
  message?: string;
  total?: number;
  subtitles?: { time: string; text: string }[];
  comments?: { id: string; author: string; text: string; likes: number; time: string }[];
  images?: { label: string; dataUrl: string }[];
  times?: string;
  text?: string;
}

// Only paths emitted by the frame reader inside its cache are eligible. The API accepts no path.
export function frameImages(dir: string, output: string) {
  const images: NonNullable<MaterialView['images']> = [];
  for (const match of output.matchAll(/^(SHEET|STRIP|SUBS):\s*(.+)$/gm)) {
    if (images.length >= 3) break;
    try {
      const cache = fs.realpathSync(path.join(dir, 'runtime/shots'));
      const cacheRelative = path.relative(fs.realpathSync(dir), cache);
      if (cacheRelative.startsWith('..') || path.isAbsolute(cacheRelative)) continue;
      const file = fs.realpathSync(path.resolve(match[2].trim()));
      const rel = path.relative(cache, file);
      if (rel.startsWith('..') || path.isAbsolute(rel) || !/\.(png|jpe?g)$/i.test(file)) continue;
      const stat = fs.statSync(file);
      if (!stat.isFile() || stat.size > 8 * 1024 * 1024) continue;
      const data = fs.readFileSync(file);
      const png = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
      if (!png && !jpeg) continue;
      images.push({
        label: match[1] === 'SUBS' ? '画面中的字幕' : '视频采样画面',
        dataUrl: `data:image/${png ? 'png' : 'jpeg'};base64,${data.toString('base64')}`,
      });
    } catch {
      /* Missing or invalid cache is reported by materialView. */
    }
  }
  return images;
}

export function materialView(
  store: Store,
  bvid: string,
  kind: z.infer<typeof materialInput>['kind'],
): MaterialView {
  materialInput.parse({ bvid, kind });
  const evidence = store.read('evidence', {})[bvid];
  const attempt = evidence?.attempts?.[kind];
  if (attempt?.state === 'failed')
    return { state: 'failed', message: attempt.error || '读取失败，未取得素材。' };
  const raw = evidence?.materials?.[kind];
  if (!raw) return { state: evidence?.actions.includes(kind) ? 'missing' : 'unread' };
  if (kind === 'debrief') {
    const start = raw.indexOf('══════════');
    const text = (start >= 0 ? raw.slice(start) : raw)
      .split(/═+\s*下一步/)[0]
      .split('\n')
      .filter(
        (line) =>
          !/^[A-Z]:\\|^\/(?:Users|home|tmp)\/|^\s*(SHEET|SUBS|STRIP|JSON|TXT|PLAIN):/.test(line),
      )
      .join('\n')
      .trim();
    return { state: text ? 'ready' : 'missing', text };
  }
  if (kind === 'frames') {
    const images = frameImages(store.dir, raw);
    return {
      state: images.length ? 'ready' : 'missing',
      images,
      times: raw.match(/^时间点\s*:\s*(.+)$/m)?.[1],
    };
  }
  if (kind === 'subtitles') {
    const subtitles = [...raw.matchAll(/^\[?(\d{1,3}:\d{2}(?::\d{2})?)\]?\s+(.+)$/gm)].map(
      (match) => ({ time: match[1], text: match[2] }),
    );
    const total = Number(raw.match(/字幕行数:\s*(\d+)/)?.[1]) || undefined;
    return {
      state: subtitles.length
        ? 'ready'
        : /没有可用字幕|没字幕|无字幕/.test(raw)
          ? 'empty'
          : 'missing',
      subtitles,
      total,
    };
  }
  try {
    const parsed = z
      .object({
        ok: z.literal(true),
        total: z.number().optional(),
        items: z.array(
          z.object({
            rpid: z.union([z.string(), z.number()]).optional(),
            user: z.string().optional(),
            text: z.string(),
            like: z.number().optional(),
            time: z.string().optional(),
          }),
        ),
      })
      .parse(JSON.parse(raw));
    return {
      state: parsed.items.length ? 'ready' : 'empty',
      total: parsed.total,
      comments: parsed.items.map((row, index) => ({
        id: String(row.rpid ?? index),
        author: row.user || '观众',
        text: row.text,
        likes: row.like ?? 0,
        time: row.time ?? '',
      })),
    };
  } catch {
    // Old plain-text fixtures or incomplete JSON must never appear as a developer log in the UI.
    return { state: 'missing', message: redact('这条历史记录未保存可展示的评论正文。', store.dir) };
  }
}
