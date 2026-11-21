// gta6-meme-x-01 v4 — "Boarding Pass" (Leonida Airlines).
//
// The entry itself lives on X: the boarding-pass meme plus its caption,
// which the house reads straight from the post. This program only carries
// the post's address to the grader. It loads POST.json from the same
// directory as this file, makes sure the address is a real X/Twitter
// status link, and writes the file out to the output directory.
// The output directory is left alone otherwise — in the grader /output
// is a mount point, and deleting it would crash the whole run.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourceDir = process.env.MAKEFUN_BOT_DIR ?? scriptDir;
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// An X status address looks like https://x.com/<handle>/status/<digits>.
// twitter.com works too, as do www./mobile. prefixes and the /i/web/
// form; a query string or fragment after the id is tolerated.
const STATUS_LINK = new RegExp(
  "^https://(?:www\\.|mobile\\.)?(?:x\\.com|twitter\\.com)/" +
    "(?:[A-Za-z0-9_]+/status/\\d+|i/web/status/\\d+)(?:[?#].*)?$",
);

function die(why: string): never {
  throw new Error(`boarding pass hand-in failed: ${why}`);
}

function run(): void {
  const postFile = join(sourceDir, "POST.json");
  if (!existsSync(postFile)) {
    die(`no POST.json next to the entry in ${sourceDir}`);
  }
  const text = readFileSync(postFile, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    die("POST.json is not valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null) {
    die("POST.json is not a JSON object");
  }
  const url = (parsed as { url?: unknown }).url;
  if (typeof url !== "string" || url === "") {
    die('POST.json needs a "url" string field');
  }
  if (!STATUS_LINK.test(url)) {
    die(
      `not an X/Twitter status link: ${url} ` +
        "(want https://x.com/<handle>/status/<digits>)",
    );
  }

  mkdirSync(targetDir, { recursive: true });
  const destFile = join(targetDir, "POST.json");
  writeFileSync(destFile, text);

  // Confirm the hand-in round-trips: a half-written file or a wrong
  // directory has to fail loudly here, not at the gate.
  const handed = JSON.parse(readFileSync(destFile, "utf8")) as {
    url?: unknown;
  };
  if (handed.url !== url) {
    die(`handed-in POST.json changed the url: ${String(handed.url)}`);
  }
  console.log(`boarding pass post handed in: ${url}`);
}

run();
