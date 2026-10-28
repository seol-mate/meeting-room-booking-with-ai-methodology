// E2E 시나리오의 @trace 주석 검증(6-TS-15 게이트 ts-15.P5) — REQ-ID가 거쳐 간 화면 명세서 §2 「근거 요구사항」에 실재하는지 본다.
// 실행: node scripts/e2e-trace-scan.mjs  → docs/evidence/6-TS-15/trace-scan.json
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const docs = join(root, "docs");
const e2eDir = join(root, "frontend", "e2e");

// screen_id → 화면 명세서 §2 근거 요구사항
const screenReqs = {};
for (const f of readdirSync(docs).filter((n) => n.startsWith("5-IM-13-O1") && n.endsWith(".md"))) {
  const text = readFileSync(join(docs, f), "utf8");
  const sid = f.match(/SCR-[A-Z]+-\d+/)[0];
  const cell = text.match(/\| 근거 요구사항 \| ([^\n]+) \|/)[1];
  screenReqs[sid] = cell.match(/REQ-[A-Z]+-\d+/g) ?? [];
}

const scenarios = [];
const invalid = [];
for (const f of readdirSync(e2eDir).filter((n) => n.endsWith(".spec.ts"))) {
  const lines = readFileSync(join(e2eDir, f), "utf8").split("\n");
  lines.forEach((line, i) => {
    const t = line.match(/\/\/\s*@trace\s+(.*?)\s*\|\s*(.*)$/);
    if (!t) return;
    const reqs = t[1].split(",").map((s) => s.trim());
    const screens = t[2].split(",").map((s) => s.trim());
    const title = (lines[i + 1].match(/test\("(.*?)"/) ?? [])[1] ?? "(제목 없음)";
    const problems = [];
    for (const s of screens) if (!screenReqs[s]) problems.push(`없는 화면 ${s}`);
    for (const r of reqs) {
      const known = screens.some((s) => (screenReqs[s] ?? []).includes(r));
      if (!known) problems.push(`${r}은(는) ${screens.join("·")}의 근거 요구사항이 아님`);
    }
    scenarios.push({ file: f, title, reqs, screens });
    if (problems.length) invalid.push({ file: f, title, problems });
  });
}

const testCount = readdirSync(e2eDir)
  .filter((n) => n.endsWith(".spec.ts"))
  .reduce((n, f) => n + (readFileSync(join(e2eDir, f), "utf8").match(/^\s*test\(/gm) ?? []).length, 0);

const result = { scenarios: scenarios.length, tests: testCount, untraced: testCount - scenarios.length, invalid: invalid.length, details: invalid, list: scenarios };
mkdirSync(join(docs, "evidence", "6-TS-15"), { recursive: true });
writeFileSync(join(docs, "evidence", "6-TS-15", "trace-scan.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ scenarios: result.scenarios, tests: result.tests, untraced: result.untraced, invalid: result.invalid }));
process.exit(result.invalid || result.untraced ? 1 : 0);
