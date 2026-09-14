import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(process.argv[2] ?? "src/RivalsPollCreator/www");
const assets = path.join(webRoot, "assets");
const bundleName = fs.readdirSync(assets).find((name) => /^index-.*\.js$/.test(name));
if (!bundleName) throw new Error("Could not find the Rivals Poll Creator JavaScript bundle.");

const bundlePath = path.join(assets, bundleName);
let code = fs.readFileSync(bundlePath, "utf8");

// A versioned key prevents stale learned OCR results from surviving app upgrades.
code = code.replace("rivals-poll-creator.memory.v1", "rivals-poll-creator.memory.v2");

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

if (!code.includes("ENNI.*?FROST")) {
  const normalizationMarker = "replace(/PA\\s*TEL\\s*PEAC|TEL\\s*PEAC/gi,`PASTEL PEACE`).replace(/AWDAZE|D[\\s._-]*AWDAZE/gi,`DREAMY DAZE`).replace(/D[\\s._-]*AWDLIO|AWDLIO/gi,`DREAMY DUO`)";
  const normalizationReplacement = normalizationMarker + ".replace(/SAVAGE\\s*SWIRREL/gi,`SAVAGE SQUIRREL`).replace(/FORE\\s*R/gi,`GLITTERING GODDESS`).replace(/GO\\s*TEMPLE/gi,`GOLDEN GRACE`).replace(/COSTW.*?COU(?:ESS|OESS)|UTTERING.*?COU(?:ESS|OESS)/gi,`DARK DIAMOND`).replace(/ENNI.*?FROST/gi,`EMMA FROST`).replace(/\\bCMM\\b/gi,`EMMA FROST`)";
  if (!code.includes(normalizationMarker)) throw new Error("Extended colorway normalization marker did not match.");
  code = code.replace(normalizationMarker, normalizationReplacement);
}

if (!code.includes("Check detected name")) {
  const thumbMarker = "type:`button`,onClick:()=>s(n),\"aria-label\":e.backgroundOnly?`Cover background`:e.character||e.fileName";
  const thumbReplacement = "type:`button`,onClick:()=>s(n),title:e.character&&e.outfit?`${e.character} — ${e.outfit}`:e.character||e.fileName,\"aria-label\":e.backgroundOnly?`Cover background`:e.character||e.fileName";
  if (!code.includes(thumbMarker)) throw new Error("Thumbnail tooltip marker did not match.");
  code = code.replace(thumbMarker, thumbReplacement);
  const panelMarker = "n.notCostume?(0,R.jsx)(`p`,{className:`mb-3 rounded-xl bg-surface-2 px-4 py-3 text-sm ring-1 ring-border`,children:`This is not a costume (emote / gift / MVP). Skip it or delete the screenshot.`}):null,(0,R.jsxs)(`label`";
  const panelReplacement = "n.notCostume?(0,R.jsx)(`p`,{className:`mb-3 rounded-xl bg-surface-2 px-4 py-3 text-sm ring-1 ring-border`,children:`This is not a costume (emote / gift / MVP). Skip it or delete the screenshot.`}):null,n.status===`ready`&&!n.confirmed&&!n.backgroundOnly&&!n.notCostume?(0,R.jsx)(`p`,{className:`mb-3 rounded-xl bg-accent/15 px-4 py-3 text-sm text-accent ring-1 ring-accent/30`,children:`Check detected name before continuing.`}):null,(0,R.jsxs)(`label`";
  if (!code.includes(panelMarker)) throw new Error("Review cue marker did not match.");
  code = code.replace(panelMarker, panelReplacement);
}

if (!code.includes("__rpcEmmaAlias")) {
  const ownerMarker = "function Fn(e){let t=z(e);if(!t)return null;";
  const ownerReplacement = "function Fn(e){let t=z(e);if(!t)return null;if((t.includes(`enni`)&&t.includes(`frost`))||t===`cmm`){let __rpcEmmaAlias=!0;return`Emma Frost`}";
  if (!code.includes(ownerMarker)) throw new Error("Owner alias marker did not match.");
  code = code.replace(ownerMarker, ownerReplacement);
}

if (!code.includes("__rpcNormalizeOwnerLine")) {
  const ownerLineMarker = "r&&(r=__rpcTitleCase(r))";
  const ownerLineReplacement = "r&&(r=__rpcTitleCase(r),r=Fn(r)||r);let __rpcNormalizeOwnerLine=!0";
  if (!code.includes(ownerLineMarker)) throw new Error("Owner line normalization marker did not match.");
  code = code.replace(ownerLineMarker, ownerLineReplacement);
}

if (!code.includes("__rpcEmmaOutfitOwner")) {
  const resultMarker = "{character:o||``,outfit:r||``}}";
  const resultReplacement = "{character:(/glittering goddess|dark diamond|golden grace/i.test(r)?`Emma Frost`:o)||``,outfit:r||``};let __rpcEmmaOutfitOwner=!0}";
  if (!code.includes(resultMarker)) throw new Error("Final recognition result marker did not match.");
  code = code.replace(resultMarker, resultReplacement);
}

if (!code.includes("__rpcNormalizeLearnedEmma")) {
  const cacheMarker = "return Array.isArray(t)?t:[]";
  const cacheReplacement = "return Array.isArray(t)?t.map(e=>/glittering goddess|dark diamond|golden grace/i.test(e.outfit)?{...e,character:`Emma Frost`}:e):[];let __rpcNormalizeLearnedEmma=!0";
  if (!code.includes(cacheMarker)) throw new Error("Learned OCR storage marker did not match.");
  code = code.replace(cacheMarker, cacheReplacement);
}

if (!code.includes("function __rpcNormalizeShot")) {
  const mergeMarker = "function ii(e,t){return e.edited?{...t,character:e.character,outfit:e.outfit,rating:e.rating,backgroundOnly:e.backgroundOnly,confirmed:e.confirmed,edited:!0}:{...t,rating:e.rating,confirmed:e.confirmed,backgroundOnly:e.backgroundOnly||t.backgroundOnly}}";
  const mergeReplacement = "function __rpcNormalizeShot(e){return/^(glittering goddess|dark diamond|golden grace)$/i.test((e.outfit||``).trim())?{...e,character:`Emma Frost`}:e}function ii(e,t){return __rpcNormalizeShot(e.edited?{...t,character:e.character,outfit:e.outfit,rating:e.rating,backgroundOnly:e.backgroundOnly,confirmed:e.confirmed,edited:!0}:{...t,rating:e.rating,confirmed:e.confirmed,backgroundOnly:e.backgroundOnly||t.backgroundOnly})}";
  if (!code.includes(mergeMarker)) throw new Error("Shot merge normalization marker did not match.");
  code = code.replace(mergeMarker, mergeReplacement);

  const editMarker = "return{...n,...t,edited:r}}))";
  const editReplacement = "return __rpcNormalizeShot({...n,...t,edited:r})}))";
  if (!code.includes(editMarker)) throw new Error("Shot edit normalization marker did not match.");
  code = code.replace(editMarker, editReplacement);
}

if (!code.includes("function __rpcCoverCrop")) {
  const coverMarker = "async function Zr(e){await Br();let t=document.createElement(`canvas`);t.width=br,t.height=xr;let n=t.getContext(`2d`);if(!n)throw Error(`Canvas is not available`);let r=Gr(e.background,`inspect`);n.drawImage(r,0,0),";
  const coverReplacement = "function __rpcCoverCrop(e){let t=document.createElement(`canvas`);t.width=br,t.height=xr;let n=t.getContext(`2d`);if(!n)return e;let r=Math.min(e.width,Math.max(1,Math.round(e.height*br/xr))),i=Math.min(e.height,Math.max(1,Math.round(e.width*xr/br)));return r<e.width?n.drawImage(e,0,0,r,e.height,0,0,br,xr):n.drawImage(e,0,0,e.width,i,0,0,br,xr),t}async function Zr(e){await Br();let t=document.createElement(`canvas`);t.width=br,t.height=xr;let n=t.getContext(`2d`);if(!n)throw Error(`Canvas is not available`);let r=__rpcCoverCrop(e.background);n.drawImage(r,0,0),";
  if (!code.includes(coverMarker)) throw new Error("Cover crop marker did not match.");
  code = code.replace(coverMarker, coverReplacement);
}

if (!code.includes("`cutouts/${Qr(c[e],e)}`")) {
  const exportMarker = "for(let e=0;e<r.length;e++)n.file(Qr(r[e],e+1),await ei(r[e].pageUrl));let i=e.shots.filter(e=>!e.backgroundOnly&&e.pollUrl);";
  const exportReplacement = "for(let e=0;e<r.length;e++)n.file(Qr(r[e],e+1),await ei(r[e].pageUrl));let c=e.shots.filter(e=>!e.backgroundOnly&&e.cutoutUrl);for(let e=0;e<c.length;e++)n.file(`cutouts/${Qr(c[e],e)}`,await ei(c[e].cutoutUrl));let i=e.shots.filter(e=>!e.backgroundOnly&&e.pollUrl);";
  if (!code.includes(exportMarker)) throw new Error("Cutout export marker did not match.");
  code = code.replace(exportMarker, exportReplacement);
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
