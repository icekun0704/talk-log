import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const built = resolve(root, "dist/index.html");
const target = resolve(root, "line_chat_analyzer_web.html");

if (!existsSync(built)) {
  console.error("dist/index.html が見つかりません。先に vite build を実行してください。");
  process.exit(1);
}

copyFileSync(built, target);
console.log("dist/index.html を line_chat_analyzer_web.html にコピーしました");
