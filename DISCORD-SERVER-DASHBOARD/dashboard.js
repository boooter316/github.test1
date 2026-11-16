(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const pages = [...document.querySelectorAll(".page")];
const nav = [...document.querySelectorAll(".nav-link")];
function go(name) {
  pages.forEach(p => p.classList.toggle("active", p.id === "page-" + name));
  nav.forEach(n => n.classList.toggle("active", n.dataset.page === name));
  const active = nav.find(n => n.dataset.page === name);
  $("pageCrumb").textContent = active ? active.textContent.trim() : name;
  $("sidebar").classList.remove("open"); $("scrim").classList.remove("show");
  window.scrollTo({top:0,behavior:"smooth"});
}
nav.forEach(n => n.addEventListener("click", () => go(n.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
$("menuButton").addEventListener("click", () => {$("sidebar").classList.add("open");$("scrim").classList.add("show");});
$("closeSidebar").addEventListener("click", () => {$("sidebar").classList.remove("open");$("scrim").classList.remove("show");});
$("scrim").addEventListener("click", () => {$("sidebar").classList.remove("open");$("scrim").classList.remove("show");});
$("showLanHelp").addEventListener("click", () => $("lanHelp").classList.toggle("hidden"));

let entries = [], selected = null, dirHandle = null, originalText = "";
const textExt = new Set([".txt",".md",".js",".mjs",".cjs",".ts",".tsx",".jsx",".html",".htm",".css",".json",".xml",".yml",".yaml",".toml",".ini",".cfg",".py",".pyw",".c",".cc",".cpp",".cxx",".h",".hpp",".c++",".bat",".cmd",".ps1",".sh",".sql",".log",".gitignore",".env.example"]);
function ext(name) { const i=name.lastIndexOf("."); return i<0?"":name.slice(i).toLowerCase(); }
function isText(name) { return textExt.has(ext(name)) || name.startsWith("."); }
function renderFiles(filter="") {
  const list=$("fileList"); list.replaceChildren();
  const matches=entries.filter(e=>e.path.toLowerCase().includes(filter.toLowerCase()));
  $("fileCount").textContent=entries.length+" files";
  if (!matches.length) {list.className="file-list empty-state";list.textContent=entries.length?"No files match this filter.":"Import a folder to see its files.";return;}
  list.className="file-list";
  matches.slice(0,1200).forEach(e=>{
    const b=document.createElement("button");b.type="button";b.className="file-item"+(selected===e?" selected":"");
    b.textContent=(isText(e.name)?"▤ ":"▣ ")+e.path;b.title=e.path;
    b.addEventListener("click",()=>openEntry(e));list.appendChild(b);
  });
  if(matches.length>1200){const p=document.createElement("p");p.className="muted";p.textContent="Showing first 1,200 matches. Use the filter to narrow the list.";list.appendChild(p);}
}
async function importFiles(files, handle) {
  entries=[];selected=null;dirHandle=handle||null;
  for(const f of files){entries.push({name:f.name,path:f.webkitRelativePath||f.name,file:f,handle:null});}
  entries.sort((a,b)=>a.path.localeCompare(b.path));
  $("importStatus").textContent="Imported "+entries.length+" file(s) locally. Nothing was uploaded.";
  $("projectName").textContent=handle?handle.name:(files[0]?.webkitRelativePath?.split("/")[0]||"Selected files");
  $("downloadProjectIndex").disabled=!entries.length;
  $("openSelected").disabled=true;
  $("sourceEditor").value="";$("sourceEditor").disabled=true;$("saveSource").disabled=true;$("discardEdit").disabled=true;
  renderFiles();
}
async function walkDirectory(dir, prefix="") {
  const out=[];
  for await (const [name,handle] of dir.entries()){
    const path=prefix?prefix+"/"+name:name;
    if(handle.kind==="directory") out.push(...await walkDirectory(handle,path));
    else {let file;try{file=await handle.getFile();}catch{continue;}out.push({name,path,file,handle});}
  }
  return out;
}
$("pickFolder").addEventListener("click",async()=>{
  if(!window.showDirectoryPicker){$("importStatus").textContent="Folder picker is not supported here. Use Choose files instead.";return;}
  try{const h=await window.showDirectoryPicker({mode:"readwrite"});const list=await walkDirectory(h);entries=list.sort((a,b)=>a.path.localeCompare(b.path));dirHandle=h;selected=null;$("projectName").textContent=h.name;$("importStatus").textContent="Opened "+entries.length+" file(s). Files remain on this device.";$("downloadProjectIndex").disabled=!entries.length;$("openSelected").disabled=true;renderFiles();}catch(e){if(e.name!=="AbortError")$("importStatus").textContent="Folder could not be opened: "+e.message;}
});
$("folderFallback").addEventListener("change",e=>importFiles([...e.target.files],null));
async function openEntry(entry) {
  selected=entry;renderFiles($("fileFilter").value);$("openSelected").disabled=false;
  if(!isText(entry.name)){ $("projectName").textContent=entry.path+" — binary or unsupported file";return; }
  if(entry.file.size>2*1024*1024){$("projectName").textContent=entry.path+" — larger than 2 MiB; not loaded into editor";return;}
  try{originalText=await entry.file.text();$("sourceEditor").value=originalText;$("sourceEditor").disabled=false;$("saveSource").disabled=false;$("discardEdit").disabled=false;$("editorFileName").textContent=entry.path;$("editorStatus").textContent="Loaded locally";$("projectName").textContent=entry.path;go("editor");}
  catch(e){$("projectName").textContent="Could not read file: "+e.message;}
}
$("openSelected").addEventListener("click",()=>{if(selected)openEntry(selected);});
$("fileFilter").addEventListener("input",e=>renderFiles(e.target.value));
$("discardEdit").addEventListener("click",()=>{$("sourceEditor").value=originalText;$("editorStatus").textContent="Changes reverted in the editor.";});
function download(name,content,type="text/plain;charset=utf-8"){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,"_");document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("saveSource").addEventListener("click",async()=>{
  if(!selected)return;const value=$("sourceEditor").value;
  if(selected.handle){try{const writable=await selected.handle.createWritable();await writable.write(value);await writable.close();selected.file=await selected.handle.getFile();originalText=value;$("editorStatus").textContent="Saved to the selected local file.";return;}catch(e){$("editorStatus").textContent="Direct save failed; downloading a copy instead.";}}
  download(selected.name,value);originalText=value;$("editorStatus").textContent="Downloaded edited copy. Original file was not overwritten.";
});
$("downloadProjectIndex").addEventListener("click",()=>download("project-file-list.txt",entries.map(e=>e.path).join("\n")));
$("downloadScratch").addEventListener("click",()=>download($("scratchName").value||"my-script.txt",$("scratchEditor").value));
$("clearScratch").addEventListener("click",()=>{$("scratchEditor").value="";});
})();