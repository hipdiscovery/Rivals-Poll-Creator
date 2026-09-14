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

// High-quality cutout acceleration, persistent cache, learned framing editor, and reference-locked output geometry.
if (!code.includes('__rpcPlacementKey')) {
  const marker = 'async function Pr(e)';
  const insertion = "\nconst __rpcPlacementKey='rivals-poll-creator.placement.v1';\nfunction __rpcPlacementStore(){try{return JSON.parse(localStorage.getItem(__rpcPlacementKey)||'{\"exact\":{},\"templates\":{}}')}catch{return{exact:{},templates:{}}}}\nfunction __rpcPlacementId(e,t){return t+':'+(e.fingerprint||((e.fileName||e.id||'image')+':'+(e.width||0)+'x'+(e.height||0)))}\nfunction __rpcPlacementClamp(e){let t=Math.max(1,Math.min(1.8,Number(e?.scale)||1)),n=540*(t-1),r=960*(t-1);return{x:Math.max(-n,Math.min(n,Number(e?.x)||0)),y:Math.max(-r,Math.min(r,Number(e?.y)||0)),scale:t}}\nfunction __rpcPlacementGet(e,t){let n=__rpcPlacementStore(),r=n.exact?.[__rpcPlacementId(e,t)]||n.templates?.[t+':'+(e.layout||'unknown')];return __rpcPlacementClamp(r||{x:0,y:0,scale:1})}\nfunction __rpcPlacementSave(e,t,n){let r=__rpcPlacementStore(),i=__rpcPlacementClamp(n),a=t+':'+(e.layout||'unknown'),o=r.templates?.[a];r.exact={...(r.exact||{}),[__rpcPlacementId(e,t)]:i};r.templates={...(r.templates||{}),[a]:o?{x:o.x*.35+i.x*.65,y:o.y*.35+i.y*.65,scale:o.scale*.35+i.scale*.65}:i};try{localStorage.setItem(__rpcPlacementKey,JSON.stringify(r))}catch{}return i}\nfunction __rpcDrawPlacement(e,t,n,r,i){let a=__rpcPlacementClamp(i||__rpcPlacementGet(n,r));e.save();e.translate(br/2+a.x,xr/2+a.y);e.scale(a.scale,a.scale);e.drawImage(t,-br/2,-xr/2,br,xr);e.restore()}\nasync function __rpcOpenPlacementEditor(e,t){let n=await Zt(e.sourceUrl),r=t==='cover'?__rpcCoverCrop(n):Gr(n,e.layout),i=r.toDataURL('image/jpeg',.9),a={...__rpcPlacementGet(e,t)};return await new Promise(o=>{let s=document.createElement('div');Object.assign(s.style,{position:'fixed',inset:'0',zIndex:'10000',background:'rgba(5,7,11,.9)',display:'grid',placeItems:'center',padding:'20px'});let c=document.createElement('div');Object.assign(c.style,{width:'min(92vw,780px)',maxHeight:'94vh',overflow:'auto',background:'#151922',color:'#f5f7fb',border:'1px solid #343b49',borderRadius:'18px',padding:'18px',fontFamily:'system-ui,sans-serif',boxShadow:'0 24px 80px rgba(0,0,0,.55)'});let l=document.createElement('div');l.textContent=t==='cover'?'Adjust cover background':'Adjust costume framing';Object.assign(l.style,{fontSize:'20px',fontWeight:'700',marginBottom:'4px'});let u=document.createElement('div');u.textContent='Drag to move. Zoom only changes the photo; labels, title and logo stay locked. Saving also teaches future '+(e.layout||'similar')+' screenshots this framing.';Object.assign(u.style,{fontSize:'13px',color:'#aab2c0',marginBottom:'14px',lineHeight:'1.45'});let d=document.createElement('div');Object.assign(d.style,{position:'relative',width:'min(360px,72vw)',aspectRatio:'9 / 16',margin:'0 auto',overflow:'hidden',borderRadius:'12px',background:'#07090d',border:'1px solid #394151',touchAction:'none',cursor:'grab'});let f=document.createElement('img');f.src=i;f.draggable=false;Object.assign(f.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'fill',transformOrigin:'50% 50%',userSelect:'none',pointerEvents:'none'});d.appendChild(f);let p=document.createElement('div');Object.assign(p.style,{position:'absolute',pointerEvents:'none',boxSizing:'border-box',border:'2px dashed rgba(255,255,255,.5)',left:t==='cover'?'3%':'5%',right:t==='cover'?'3%':'5%',top:t==='cover'?'41%':'47.5%',height:t==='cover'?'23%':'11%'});d.appendChild(p);let m=document.createElement('div');Object.assign(m.style,{display:'flex',alignItems:'center',gap:'12px',marginTop:'14px'});let h=document.createElement('span');h.textContent='Zoom';Object.assign(h.style,{fontSize:'13px',color:'#cbd1db'});let g=document.createElement('input');g.type='range';g.min='1';g.max='1.8';g.step='.01';g.value=String(a.scale);Object.assign(g.style,{flex:'1'});let _=document.createElement('span');Object.assign(_.style,{width:'48px',textAlign:'right',fontSize:'12px',color:'#aab2c0'});m.append(h,g,_);let v=document.createElement('div');Object.assign(v.style,{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'16px',flexWrap:'wrap'});let y=(e,t)=>{let n=document.createElement('button');n.type='button';n.textContent=e;Object.assign(n.style,{border:'1px solid #3b4454',borderRadius:'10px',padding:'10px 14px',fontWeight:'650',cursor:'pointer',background:t?'#f4f6fa':'#222833',color:t?'#0d1118':'#f3f5f8'});return n},b=y('Reset',false),x=y('Cancel',false),S=y('Save framing',true);v.append(b,x,S);c.append(l,u,d,m,v);s.append(c);document.body.append(s);let C=()=>{a=__rpcPlacementClamp(a);let e=d.clientWidth/1080,t=d.clientHeight/1920;f.style.transform='translate('+(a.x*e)+'px,'+(a.y*t)+'px) scale('+a.scale+')';g.value=String(a.scale);_.textContent=Math.round(a.scale*100)+'%'};C();g.addEventListener('input',()=>{a.scale=Number(g.value);C()});d.addEventListener('wheel',e=>{e.preventDefault();a.scale=Math.max(1,Math.min(1.8,a.scale+(e.deltaY<0?.04:-.04)));C()},{passive:false});let w=null;d.addEventListener('pointerdown',e=>{w={x:e.clientX,y:e.clientY,px:a.x,py:a.y};d.setPointerCapture(e.pointerId);d.style.cursor='grabbing'});d.addEventListener('pointermove',e=>{if(!w)return;a.x=w.px+(e.clientX-w.x)*1080/d.clientWidth;a.y=w.py+(e.clientY-w.y)*1920/d.clientHeight;C()});let T=()=>{w=null;d.style.cursor='grab'};d.addEventListener('pointerup',T);d.addEventListener('pointercancel',T);b.onclick=()=>{a={x:0,y:0,scale:1};C()};x.onclick=()=>{s.remove();o(false)};S.onclick=()=>{__rpcPlacementSave(e,t,a);s.remove();o(true)};s.addEventListener('click',e=>{if(e.target===s){s.remove();o(false)}})})}\nlet __rpcCutoutDbPromise=null;\nfunction __rpcCutoutDb(){if(typeof indexedDB==='undefined')return Promise.resolve(null);return __rpcCutoutDbPromise||=(new Promise(e=>{let t=indexedDB.open('rivals-poll-creator-cutouts',1);t.onupgradeneeded=()=>{t.result.objectStoreNames.contains('cutouts')||t.result.createObjectStore('cutouts',{keyPath:'key'})};t.onsuccess=()=>e(t.result);t.onerror=()=>e(null)}))}\nfunction __rpcCutoutCacheKey(e){return 'isnet-quint8-1.7:'+String(e.fingerprint||e.fileName||e.id||'image')+':'+String(e.width||0)+'x'+String(e.height||0)+':'+String(e.layout||'unknown')}\nasync function __rpcCutoutCacheGet(e){try{let t=await __rpcCutoutDb();if(!t)return null;let n=await new Promise(e=>{let n=t.transaction('cutouts','readonly').objectStore('cutouts').get(__rpcCutoutCacheKey(e));n.onsuccess=()=>e(n.result||null);n.onerror=()=>e(null)});return n?.cutout&&n?.poll?{cutoutUrl:URL.createObjectURL(n.cutout),pollUrl:URL.createObjectURL(n.poll)}:null}catch{return null}}\nasync function __rpcCutoutCachePut(e,t){try{if(!t?.cutoutUrl||!t?.pollUrl)return;let n=await __rpcCutoutDb();if(!n)return;let r=await fetch(t.cutoutUrl).then(e=>e.blob()),i=await fetch(t.pollUrl).then(e=>e.blob()),a={key:__rpcCutoutCacheKey(e),cutout:r,poll:i,at:Date.now()};await new Promise(e=>{let t=n.transaction('cutouts','readwrite');t.objectStore('cutouts').put(a);t.oncomplete=()=>e();t.onerror=()=>e()});let o=await new Promise(e=>{let t=n.transaction('cutouts','readonly').objectStore('cutouts').getAll();t.onsuccess=()=>e(t.result||[]);t.onerror=()=>e([])});if(o.length>120){o.sort((e,t)=>(e.at||0)-(t.at||0));await new Promise(e=>{let t=n.transaction('cutouts','readwrite'),r=t.objectStore('cutouts');for(let e of o.slice(0,o.length-120))r.delete(e.key);t.oncomplete=()=>e();t.onerror=()=>e()})}}catch{}}\nasync function __rpcMapLimit(e,t,n){let r=Array(e.length),i=0,a=Math.max(1,Math.min(t,e.length||1));async function o(){for(;;){let t=i++;if(t>=e.length)return;r[t]=await n(e[t],t)}}await Promise.all(Array.from({length:a},()=>o()));return r}\nfunction __rpcRefTag(e,t,n,r,i,a,o){e.save();e.font='800 italic '+o+'px Montserrat';let s=Jr(e,t,430,2),c=o+4,l=Math.max(...s.map(t=>e.measureText(t).width)),u=Math.min(500,Math.max(82,l+30)),d=s.length*c+18-4,f=i==='left'?n:n-u;e.shadowColor='rgba(0,0,0,.32)';e.shadowBlur=12;Wr(e,f,r,u,d,14);e.fillStyle=a.fill;e.fill();e.shadowBlur=0;e.fillStyle=a.text;e.textBaseline='middle';e.textAlign=i;let p=i==='left'?f+15:f+u-15;s.forEach((t,n)=>e.fillText(t,p,r+9+c*n+c/2-2));e.restore();return d}\n";
  if (!code.includes(marker)) throw new Error('Placement/cache helper marker did not match.');
  code = code.replace(marker, insertion + marker);
}
function __rpcPatchBetween(startNeedle, endNeedle, replacement) { const start=code.indexOf(startNeedle); const end=code.indexOf(endNeedle,start); if(start<0||end<0) throw new Error('Patch marker did not match: '+startNeedle); code=code.slice(0,start)+replacement+code.slice(end); }
if (!code.includes('await __rpcCutoutCacheGet(e)')) __rpcPatchBetween('async function Fr(e)','function Ir(e)',"async function Fr(e){if(e.backgroundOnly)return null;if(e.cutoutUrl&&e.pollUrl)return{cutoutUrl:e.cutoutUrl,pollUrl:e.pollUrl};let cached=await __rpcCutoutCacheGet(e);if(cached)return cached;let t=await Zt(e.sourceUrl);try{let n;try{n=await hn(t,e.layout)}catch{n=mn(t,e.layout)}let r={cutoutUrl:await rn(n),pollUrl:await rn(gn(n))};await __rpcCutoutCachePut(e,r);return r}catch{return null}}");
if (!code.includes("__rpcRefTag(a,'Rating',66,932")) __rpcPatchBetween('async function Xr(e)','function __rpcCoverCrop',"async function Xr(e){await Br();let{img:t,shot:n}=e,r=e.palette??Ur(t,n.layout),i=document.createElement('canvas');i.width=br;i.height=xr;let a=i.getContext('2d');if(!a)throw Error('Canvas is not available');let o=Gr(t,n.layout);__rpcDrawPlacement(a,o,n,'rating',e.placement);__rpcRefTag(a,'Rating',66,932,'left',r,50);__rpcRefTag(a,String(n.rating)+'/10',104,1029,'left',r,40);__rpcRefTag(a,n.character||'Character',986,932,'right',r,50);__rpcRefTag(a,n.outfit||'Outfit',986,1029,'right',r,32);return rn(i)}");
if (!code.includes('function __rpcCoverTitle')) __rpcPatchBetween('function __rpcCoverCrop','function Qr(e,t)',"function __rpcCoverCrop(e){let t=document.createElement('canvas');t.width=br;t.height=xr;let n=t.getContext('2d');if(!n)return e;let r=Math.min(e.width,Math.max(1,Math.round(e.height*br/xr))),i=Math.min(e.height,Math.max(1,Math.round(e.width*xr/br))),a=Math.max(0,Math.round((e.width-r)/2)),o=Math.max(0,Math.round((e.height-i)/2));return r<e.width?n.drawImage(e,a,0,r,e.height,0,0,br,xr):n.drawImage(e,0,o,e.width,i,0,0,br,xr),t}function __rpcCoverTitle(e){e.save();Wr(e,255,438,570,345,38);e.fillStyle='rgba(246,246,242,.90)';e.fill();e.lineWidth=8;e.strokeStyle='#2f6ca8';e.stroke();e.textAlign='center';e.textBaseline='middle';e.font=\"400 104px 'Bebas Neue'\";e.lineJoin='round';e.lineWidth=7;e.strokeStyle='#1463b2';e.fillStyle='#fff';e.strokeText('RATING NEW',540,555);e.fillText('RATING NEW',540,555);e.strokeText('COSTUMES',540,706);e.fillText('COSTUMES',540,706);e.restore()}function __rpcCoverLogo(e){e.save();e.fillStyle='#f51f23';e.fillRect(424,1230,232,93);e.fillStyle='#fff';e.textAlign='center';e.textBaseline='middle';e.font=\"400 78px 'Bebas Neue'\";e.fillText('MARVEL',540,1278);e.font=\"400 154px 'Bebas Neue'\";e.lineJoin='round';e.lineWidth=20;e.strokeStyle='#f5f5f2';e.fillStyle='#080a0e';e.strokeText('RIVALS',540,1397);e.fillText('RIVALS',540,1397);Wr(e,405,1467,245,41,10);e.fillStyle='#eee';e.fill();e.lineWidth=3;e.strokeStyle='#17191d';e.stroke();e.fillStyle='#111';e.font='700 23px Oswald';e.fillText('SWIPE FOR MORE >>>',527.5,1488);e.restore()}async function Zr(e){await Br();let t=document.createElement('canvas');t.width=br;t.height=xr;let n=t.getContext('2d');if(!n)throw Error('Canvas is not available');let r=__rpcCoverCrop(e.background);__rpcDrawPlacement(n,r,e.backgroundShot||{},'cover',e.placement);n.fillStyle='rgba(4,7,12,.13)';n.fillRect(0,0,br,xr);__rpcCoverTitle(n);let i=await Promise.all(e.cutouts.map(async e=>({...e,img:await Zt(e.url)}))),a=i.length;if(a){let o=7,s=Math.max(1,Math.ceil(a/o)),c=805,l=1218,u=(l-c)/s;for(let e=0;e<s;e++){let t=e*o,n=i.slice(t,Math.min(a,t+o)),r=n.length,d=1020/r,f=(br-d*r)/2,p=c+(e+1)*u-8;for(let e=0;e<r;e++){let t=n[e],r=Math.min((d-10)/t.img.width,(u-10)/t.img.height),i=t.img.width*r,a=t.img.height*r,o=f+e*d+(d-i)/2;n.save();n.shadowColor='rgba(0,0,0,.48)';n.shadowBlur=12;n.shadowOffsetY=7;n.drawImage(t.img,o,p-a,i,a);n.restore()}}}__rpcCoverLogo(n);return rn(t)}");
if (!code.includes('let u=Math.max(1,a.length*2+1)')) __rpcPatchBetween('re=async e=>{',',ie=async e=>',"re=async e=>{let i=(e??n).map(e=>(Ir(e),{...e,confirmed:!0}));r(i);let a=i.filter(e=>!e.backgroundOnly&&!e.notCostume),o=i.find(e=>e.backgroundOnly)??a[0]??i[0];if(!a.length||!o){p('Add at least one costume screenshot.');return}let u=Math.max(1,a.length*2+1),done=0;try{let e=await __rpcMapLimit(a,4,async(n,r)=>{let i=await Xr({img:await Zt(n.sourceUrl),shot:n});done++;s({label:'Making rating pages '+done+' / '+a.length,progress:done/u});return{...n,pageUrl:i}});let cutDone=0,packed=await __rpcMapLimit(e,3,async(t,index)=>{let e=await Fr(t);cutDone++;done++;s({label:'Cutting costumes '+cutDone+' / '+a.length,progress:done/u});return{shot:{...t,...(e||{})},cover:{url:e?.cutoutUrl??t.sourceUrl,name:t.character}}});let f=packed.map(e=>e.shot),cuts=packed.map(e=>e.cover);s({label:'Making the cover',progress:done/u});let cover=await Zr({background:await Zt(o.sourceUrl),backgroundShot:o,cutouts:cuts});done++;s({label:'Finishing',progress:done/u});on(c);l(cover);r(i.map(e=>f.find(t=>t.id===e.id)??e));d(0);t('review')}catch(e){p(e instanceof Error?e.message:'Could not make the pages')}finally{s(null)}}");
code = code.replace('function ai(e){on(e.sourceUrl),on(e.pageUrl),on(e.cutoutUrl)}','function ai(e){on(e.sourceUrl),on(e.pageUrl),on(e.cutoutUrl),on(e.pollUrl)}');
if (!code.includes('onAdjust:e=>void le(e)')) {
  const handlerMarker="ae=async(e,t)=>{S(e.id,{rating:t}),await ie({...e,rating:t})},oe=async()=>";
  const handlerReplacement="ae=async(e,t)=>{S(e.id,{rating:t}),await ie({...e,rating:t})},le=async e=>{if(e.id==='cover'){let t=n.find(e=>e.backgroundOnly)??n.find(e=>!e.notCostume);if(!t)return;if(await __rpcOpenPlacementEditor(t,'cover')){s({label:'Updating cover',progress:.5});try{let e=n.filter(e=>!e.backgroundOnly&&!e.notCostume).map(e=>({url:e.cutoutUrl??e.sourceUrl,name:e.character})),r=await Zr({background:await Zt(t.sourceUrl),backgroundShot:t,cutouts:e});on(c);l(r)}finally{s(null)}}return}if(e.shot&&await __rpcOpenPlacementEditor(e.shot,'rating')){s({label:'Updating page',progress:.5});try{await ie(e.shot)}finally{s(null)}}},oe=async()=>";
  if (!code.includes(handlerMarker)) throw new Error('Adjust handler marker did not match.');
  code=code.replace(handlerMarker,handlerReplacement);
  code=code.replace('costumes:b,onRating:(e,t)=>void ae(e,t),onDownload:()=>void oe()','costumes:b,onRating:(e,t)=>void ae(e,t),onAdjust:e=>void le(e),onDownload:()=>void oe()');
  code=code.replace('function di({pages:e,reviewIndex:t,setReviewIndex:n,costumes:r,onRating:i,onDownload:a})','function di({pages:e,reviewIndex:t,setReviewIndex:n,costumes:r,onRating:i,onAdjust:__rpcAdjust,onDownload:a})');
  const downloadMarker='(0,R.jsxs)(It,{className:`mt-6 w-full`,size:`lg`,onClick:a,children:[(0,R.jsx)(oe,{className:`size-4`}),`Download ZIP`]})';
  const downloadReplacement='(0,R.jsx)(It,{className:`mt-6 w-full`,variant:`secondary`,size:`lg`,onClick:()=>__rpcAdjust(o),children:`Adjust framing`}),(0,R.jsxs)(It,{className:`mt-3 w-full`,size:`lg`,onClick:a,children:[(0,R.jsx)(oe,{className:`size-4`}),`Download ZIP`]})';
  if (!code.includes(downloadMarker)) throw new Error('Adjust button marker did not match.');
  code=code.replace(downloadMarker,downloadReplacement);
}
code = code.replaceAll('4.0.0', '4.1.0');
fs.writeFileSync(bundlePath, code);
console.log(`Patched ${bundlePath}`);
