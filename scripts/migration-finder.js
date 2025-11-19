// scripts/migration-finder.js
// Usage: node scripts/migration-finder.js
const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();
const GLOB = ["src/**/*.ts*", "src/**/*.tsx*"];

const DRY_RUN = true; // set to false to allow auto patch (careful)
const patterns = [
  { find: /\.get\(\s*['"]?([A-Za-z0-9\-]+)['"]?\s*\)\.connect\(/g, replace: (m, sym) => `MarketDataService.startFeed("${sym.replace("-", "").toUpperCase()}", "1m")` },
  { find: /\.get\(\s*MarketDataService\)/g, replace: () => `MarketDataService` },
];

const glob = (dir, exts = [".ts", ".tsx", ".js", ".jsx"]) => {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) results = results.concat(glob(p, exts));
    else if (exts.includes(path.extname(p))) results.push(p);
  }
  return results;
};

const files = glob(path.join(ROOT, "src"));
let totalMatches = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let newText = text;
  let matched = false;
  patterns.forEach((pat) => {
    const re = pat.find;
    let m;
    if (re instanceof RegExp) {
      const matches = text.match(re);
      if (matches) {
        matched = true;
        totalMatches += matches.length;
        if (!DRY_RUN) {
          newText = newText.replace(re, function () {
            const args = Array.from(arguments);
            return pat.replace.apply(null, args);
          });
        }
      }
    }
  });
  if (matched) {
    console.log("Potential legacy patterns found in:", file);
    if (!DRY_RUN) {
      fs.writeFileSync(file, newText, "utf8");
      console.log("Patched:", file);
    }
  }
}
console.log("Scan complete. Matches:", totalMatches, "DRY_RUN:", DRY_RUN);
