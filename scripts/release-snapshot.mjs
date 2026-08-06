import { execFileSync } from "node:child_process";
import fs from "node:fs";
const arg = (name) => process.argv.find((x)=>x.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const tag = arg("tag") || `v${JSON.parse(fs.readFileSync("package.json","utf8")).version}`;
if(!/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error(`Gecersiz semver tag: ${tag}`);
const status = execFileSync("git",["status","--porcelain"],{encoding:"utf8"}).trim(); if(status) throw new Error("Release etiketi icin working tree temiz olmali.");
try { execFileSync("git",["rev-parse","--verify",`refs/tags/${tag}`],{stdio:"ignore"}); throw new Error(`${tag} zaten var; tag uzerine yazilmaz.`); } catch(error) { if(error instanceof Error && error.message.includes("zaten var")) throw error; }
execFileSync("git",["tag","-a",tag,"-m",`Deutschimo ${tag} release snapshot`],{stdio:"inherit"});
if(process.argv.includes("--push")) execFileSync("git",["push","origin",tag],{stdio:"inherit"});
fs.mkdirSync(".release",{recursive:true}); fs.writeFileSync(`.release/${tag}.json`,JSON.stringify({tag,commit:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),createdAt:new Date().toISOString()},null,2)+"\n");
console.log(`Release snapshot olusturuldu: ${tag}`);
