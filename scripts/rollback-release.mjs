import { execFileSync } from "node:child_process";
const arg = (name) => process.argv.find((x)=>x.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const tag = arg("tag"); if(!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error("--tag=vX.Y.Z zorunlu.");
execFileSync("git",["rev-parse","--verify",`refs/tags/${tag}`],{stdio:"ignore"});
const branch = arg("branch") || `rollback/${tag}-${Date.now()}`;
console.log(`Rollback plani: ${tag} -> ${branch}`);
console.log("Not: veritabani migration'lari otomatik geri alinmaz; expand/contract ve restore runbook uygulanir.");
if(!process.argv.includes("--execute")) { console.log("Dry-run tamamlandi. Uygulamak icin --execute --confirm=ROLLBACK kullanin."); process.exit(0); }
if(arg("confirm")!=="ROLLBACK") throw new Error("--confirm=ROLLBACK zorunludur.");
execFileSync("git",["branch",branch,tag],{stdio:"inherit"});
if(process.argv.includes("--push")) execFileSync("git",["push","origin",branch],{stdio:"inherit"});
console.log(`Rollback dali hazir: ${branch}`);
