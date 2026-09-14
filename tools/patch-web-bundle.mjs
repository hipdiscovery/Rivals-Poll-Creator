import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(process.argv[2] ?? "src/RivalsPollCreator/www");
const assets = path.join(webRoot, "assets");
const bundleName = fs.readdirSync(assets).find((name) => /^index-.*\.js$/.test(name));
if (!bundleName) throw new Error("Could not find the Rivals Poll Creator JavaScript bundle.");

const bundlePath = path.join(assets, bundleName);
let code = fs.readFileSync(bundlePath, "utf8");

if (!code.includes("__rpcNativeOcr")) {
  const marker = "async function or(){await Wn()}async function sr(e,t){let n=Zn(e,t),r=await Wn();";
  const replacement = `const __rpcOcrPending=new Map;let __rpcOcrSequence=0;if(window.chrome?.webview){window.chrome.webview.addEventListener(\`message\`,event=>{let data=event.data;if(typeof data===\`string\`){try{data=JSON.parse(data)}catch{return}}if(data?.cmd!==\`ocr-result\`)return;let pending=__rpcOcrPending.get(data.requestId);if(!pending)return;__rpcOcrPending.delete(data.requestId);clearTimeout(pending.timer);pending.resolve(data.error?null:String(data.text??\`\`))})}function __rpcNativeOcr(canvas){if(!window.chrome?.webview||!canvas?.toDataURL)return Promise.resolve(null);let requestId=\`ocr-\${Date.now()}-\${++__rpcOcrSequence}\`;return new Promise(resolve=>{let timer=setTimeout(()=>{__rpcOcrPending.delete(requestId);resolve(null)},12e3);__rpcOcrPending.set(requestId,{resolve,timer});try{window.chrome.webview.postMessage({cmd:\`ocr\`,requestId,dataUrl:canvas.toDataURL(\`image/png\`)})}catch{clearTimeout(timer);__rpcOcrPending.delete(requestId);resolve(null)}})}function __rpcTitleCase(value){let small=new Set([\`a\`,\`an\`,\`and\`,\`of\`,\`the\`]);return value.replace(/[^A-Za-z0-9 &'’.-]+/g,\` \`).trim().toLowerCase().split(/\\s+/).map((word,index)=>{if(index&&small.has(word))return word;return word.split(\`-\`).map(part=>part?part[0].toUpperCase()+part.slice(1):part).join(\`-\`)}).join(\` \`).replace(/\\bX Men\\b/g,\`X-Men\`)}async function or(){if(!window.chrome?.webview)await Wn()}async function sr(e,t){let n=Zn(e,t),nativeText=await __rpcNativeOcr(n);if(nativeText&&nativeText.trim())return{text:nativeText.trim(),crop:n};let r=await Wn();`;
  if (!code.includes(marker)) throw new Error("OCR function marker did not match the shipped bundle.");
  code = code.replace(marker, replacement);
}

if (!code.includes("__rpcNativeOcrValidated")) {
  const nativeReturn = "if(nativeText&&nativeText.trim())return{text:nativeText.trim(),crop:n};";
  const validatedReturn = "if(nativeText&&nativeText.trim()){let __rpcNativeOcrValidated=In(nativeText),parsed=Vn(nativeText);if(__rpcNativeOcrValidated||parsed.character&&parsed.outfit&&/costume[\\s.:-]/i.test(nativeText))return{text:nativeText.trim(),crop:n}}";
  if (!code.includes(nativeReturn)) throw new Error("Native OCR validation marker did not match.");
  code = code.replace(nativeReturn, validatedReturn);
}

if (!code.includes("AWDAZE")) {
  const normalizationMarker = "replace(/PA\\s*TEL\\s*PEAC/gi,`PASTEL PEACE`)";
  const normalizationReplacement = "replace(/PA\\s*TEL\\s*PEAC|TEL\\s*PEAC/gi,`PASTEL PEACE`).replace(/AWDAZE|D[\\s._-]*AWDAZE/gi,`DREAMY DAZE`).replace(/D[\\s._-]*AWDLIO|AWDLIO/gi,`DREAMY DUO`)";
  if (!code.includes(normalizationMarker)) throw new Error("Colorway normalization marker did not match.");
  code = code.replace(normalizationMarker, normalizationReplacement);
}

if (!code.includes("SAVAGESWIRREL")) {
  const normalizationMarker = "replace(/PA\\s*TEL\\s*PEAC|TEL\\s*PEAC/gi,`PASTEL PEACE`).replace(/AWDAZE|D[\\s._-]*AWDAZE/gi,`DREAMY DAZE`).replace(/D[\\s._-]*AWDLIO|AWDLIO/gi,`DREAMY DUO`)";
  const normalizationReplacement = normalizationMarker + ".replace(/SAVAGE\\s*SWIRREL/gi,`SAVAGE SQUIRREL`).replace(/FORE\\s*R/gi,`GLITTERING GODDESS`).replace(/GO\\s*TEMPLE/gi,`GOLDEN GRACE`).replace(/COSTW\\s*COLOR\\s*UTTERING\\s*COUESS|UTTERING\\s*COUESS/gi,`DARK DIAMOND`)";
  if (!code.includes(normalizationMarker)) throw new Error("Extended colorway normalization marker did not match.");
  code = code.replace(normalizationMarker, normalizationReplacement);
}

if (!code.includes("__rpcEmmaAlias")) {
  const ownerMarker = "function Fn(e){let t=z(e);if(!t)return null;";
  const ownerReplacement = "function Fn(e){let t=z(e);if(!t)return null;if((t.includes(`enni`)&&t.includes(`frost`))||t===`cmm`){let __rpcEmmaAlias=!0;return`Emma Frost`}";
  if (!code.includes(ownerMarker)) throw new Error("Owner alias marker did not match.");
  code = code.replace(ownerMarker, ownerReplacement);
}

if (!code.includes("z(o).startsWith(z(r))")) {
  const defaultMarker = "o&&r&&z(o)===z(r)&&(r=`Default`)";
  const defaultReplacement = "o&&r&&(z(o)===z(r)||z(o).startsWith(z(r))||z(r).startsWith(z(o)))&&(r=`Default`)";
  if (!code.includes(defaultMarker)) throw new Error("Default outfit marker did not match.");
  code = code.replace(defaultMarker, defaultReplacement);
}

if (!code.includes("__rpcFutureCatalog")) {
  const start = "function Vn(e){let t=e.split(/\\n+/).filter(e=>!/celestial messenger|temple protectors|pajama party|savage land|year one|first appears|inspired by|requires luxury/i.test(e)).join(`\n`),n=z(t),r=In(t);";
  const replacement = "function Vn(e){let t=e.split(/\\n+/).filter(e=>!/celestial messenger|temple protectors|pajama party|savage land|year one|first appears|inspired by|requires luxury/i.test(e)).join(`\n`),__rpcFutureCatalog=!0,n=z(t),r=In(t);";
  if (!code.includes(start)) throw new Error("Future catalog marker did not match the shipped bundle.");
  code = code.replace(start, replacement);

  const catalogFallback = "r=e}let i=t.match(/costume";
  const catalogReplacement = "r=e}if(!r){let lines=t.split(/\\n+/).map(e=>e.trim()).filter(e=>dr(e)&&!/costume/i.test(e));r=lines.sort((e,t)=>t.replace(/[^A-Za-z]/g,``).length-e.replace(/[^A-Za-z]/g,``).length)[0]||null;r&&(r=__rpcTitleCase(r))}let i=t.match(/costume";
  if (!code.includes(catalogFallback)) throw new Error("Generic outfit fallback marker did not match.");
  code = code.replace(catalogFallback, catalogReplacement);

  const ownerFallback = "return a&&(o=Fn(a[1])),o||=Fn(t),r&&!o&&(o=Rn(r)),{character:o||``,outfit:r||``}}";
  const ownerReplacement = "return a&&(o=Fn(a[1])||__rpcTitleCase(a[1])),o||=Fn(t),r&&!o&&(o=Rn(r)),o&&r&&(z(o)===z(r)||z(o).startsWith(z(r))||z(r).startsWith(z(o)))&&(r=`Default`),{character:o||``,outfit:r||``}}";
  if (!code.includes(ownerFallback)) throw new Error("Generic owner fallback marker did not match.");
  code = code.replace(ownerFallback, ownerReplacement);
}

code = code.replaceAll("3.9.0", "4.0.0");
fs.writeFileSync(bundlePath, code);
console.log(`Patched ${bundlePath}`);
