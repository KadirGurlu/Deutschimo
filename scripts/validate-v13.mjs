import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
let ts;
try { ts = require("typescript"); } catch { ts = require(path.join(execSync("npm root -g").toString().trim(), "typescript")); }

const root = process.cwd();
const required = [
  "app/skills/page.tsx", "app/listening/page.tsx", "app/speaking/page.tsx", "app/reading/page.tsx", "app/writing/page.tsx",
  "components/skills/listening-lab.tsx", "components/skills/speaking-lab.tsx", "components/skills/reading-lab.tsx", "components/skills/writing-lab.tsx",
  "app/api/skills/attempts/route.ts", "app/api/skills/overview/route.ts", "app/api/skills/vocabulary/route.ts",
  "data/skill-labs.ts", "types/skills.ts", "lib/skills/evaluation.ts",
];
const errors = [];
for (const file of required) if (!fs.existsSync(path.join(root,file))) errors.push(`Eksik dosya: ${file}`);

const schema = fs.readFileSync(path.join(root,"prisma/schema.prisma"),"utf8");
for (const model of ["SkillLabAttempt","VocabularyNotebookItem"]) if (!schema.includes(`model ${model}`)) errors.push(`Eksik Prisma modeli: ${model}`);
const pkg = JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if (pkg.version !== "13.0.0") errors.push(`package.json sürümü 13.0.0 değil: ${pkg.version}`);

let syntaxCount=0;
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(["node_modules",".next",".git"].includes(entry.name)) continue;
      walk(full);
    } else if(/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")){
      syntaxCount++;
      const source=fs.readFileSync(full,"utf8");
      const result=ts.transpileModule(source,{fileName:full,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,isolatedModules:true}});
      for(const diagnostic of result.diagnostics??[]) errors.push(`${path.relative(root,full)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText," ")}`);
    }
  }
}
walk(root);

const dataSource = fs.readFileSync(path.join(root,"data/skill-labs.ts"),"utf8");
for (const expected of ["listen-a1-kennenlernen","listen-b2-akademisch","read-a1-nachricht","read-b2-unternehmen","speak-a1-intro","speak-b2-loesung","write-a1-form","write-b2-bericht"]) {
  if (!dataSource.includes(expected)) errors.push(`Görev bankası öğesi eksik: ${expected}`);
}
const ids = [...dataSource.matchAll(/\bid:\s*"((?:listen|read|speak|write)-[^"]+)"/g)].map((match)=>match[1]);
const duplicates = ids.filter((id,index)=>ids.indexOf(id)!==index);
if (duplicates.length) errors.push(`Yinelenen görev kimliği: ${[...new Set(duplicates)].join(", ")}`);
if (ids.length < 48) errors.push(`Görev bankası beklenenden küçük: ${ids.length}`);

if (errors.length) {
  console.error(`V13 doğrulaması başarısız (${errors.length} hata):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`V13 doğrulaması başarılı: ${required.length} kritik dosya, ${ids.length} görev ve ${syntaxCount} TypeScript/TSX dosyası kontrol edildi.`);
