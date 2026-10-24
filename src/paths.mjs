import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
if (
  process.env.BILI_DRAGON_DATA &&
  !path.isAbsolute(process.env.BILI_DRAGON_DATA)
)
  throw Error("BILI_DRAGON_DATA 必须是绝对路径");
export const dataRoot = path.resolve(
  process.env.BILI_DRAGON_DATA || path.join(root, "data"),
);
export const vendor = path.join(root, "vendor/upstream");
