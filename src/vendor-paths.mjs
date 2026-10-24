import path from "node:path";
import { dataRoot } from "./paths.mjs";
export const home = dataRoot;
export const runtime = path.join(dataRoot, "runtime");
export const configFile = path.join(dataRoot, "upstream-config.json");
