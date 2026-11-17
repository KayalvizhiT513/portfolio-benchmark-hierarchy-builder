import React, {useEffect,useMemo,useState} from "react";
import {Activity,ArrowDownToLine,ArrowUpRight,Check,ChevronDown,ChevronRight,Copy,Database,FolderTree,GitBranch,GripVertical,Layers3,LayoutGrid,Plus,RotateCcw,Search,Settings2,Trash2,Undo2,Redo2,Upload, X} from "lucide-react";

type Kind="Portfolio"|"Benchmark";
type Mode="Manual"|"Automatic"|"Hybrid";
type RecordRow={date:string;assetId:string;assetName:string;assetClass:string;strategy?:string;region:string;style:string;sector?:string;fund?:string;manager:string;weight:number;source?:string};
type BenchmarkRule={method:"equal"|"source"|"custom";region:string;style:string;selectedAssetIds:string[];weights:Record<string,number>};
type Node={id:string;parent:string|null;name:string;origin:"manual"|"generated";independent?:boolean;scope?:string;assignedAssetIds?:string[];filters?:Record<string,string>;rule?:BenchmarkRule};
type Config={nodes:Node[];selected:string;dimensions:string[];rows:RecordRow[]};
const dims=["assetClass","strategy","region","style","sector","fund","manager"] as const;
const labels:Record<string,string>={assetClass:"Asset class",strategy:"Investment strategy",region:"Region",style:"Investment style",sector:"Sector",fund:"Fund",manager:"Manager"};
const defaultRule=():BenchmarkRule=>({method:"equal",region:"All",style:"All",selectedAssetIds:[],weights:{}});
function dimensionValue(r:RecordRow,k:string){return String((r as unknown as Record<string,unknown>)[k]||({strategy:r.region==="India"?"Regional Growth":"Global Growth",sector:r.assetId.endsWith("1")||r.assetId.endsWith("3")?"Technology":"Diversified",fund:"Fund "+r.manager.replace("Manager ","")} as Record<string,string>)[k]||"Unclassified")}
function enriched(rows:RecordRow[]):RecordRow[]{return rows.map(r=>({...r,strategy:dimensionValue(r,"strategy"),sector:dimensionValue(r,"sector"),fund:dimensionValue(r,"fund")}))}

const mkid=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2);
const DATA:RecordRow[]=[
["2026-01-01","SEC001","Apple Inc.","Equity","US","Large Cap","Manager A",.16],
["2026-01-01","SEC002","Microsoft","Equity","US","Large Cap","Manager A",.12],
["2026-01-01","SEC003","Nvidia","Equity","US","Large Cap","Manager B",.12],
["2026-01-01","SEC004","Amazon","Equity","US","Mid Cap","Manager C",.09],
["2026-01-01","SEC005","Infosys","Equity","India","Large Cap","Manager D",.15],
["2026-01-01","SEC006","HDFC Bank","Equity","India","Large Cap","Manager D",.12],
["2026-01-01","SEC007","TSMC","Equity","Non-US","Large Cap","Manager E",.14],
["2026-01-01","SEC008","ASML","Equity","Non-US","Mid Cap","Manager F",.10],
["2026-02-01","SEC001","Apple Inc.","Equity","US","Large Cap","Manager B",.14],
["2026-02-01","SEC002","Microsoft","Equity","US","Large Cap","Manager A",.16],
["2026-02-01","SEC003","Nvidia","Equity","US","Large Cap","Manager B",.13],
["2026-02-01","SEC009","Alphabet","Equity","US","Mid Cap","Manager C",.08],
["2026-02-01","SEC005","Infosys","Equity","India","Large Cap","Manager D",.15],
["2026-02-01","SEC006","HDFC Bank","Equity","India","Mid Cap","Manager E",.11],
["2026-02-01","SEC007","TSMC","Equity","Non-US","Large Cap","Manager E",.13],
["2026-02-01","SEC008","ASML","Equity","Non-US","Mid Cap","Manager F",.10]
].map(([date,assetId,assetName,assetClass,region,style,manager,weight])=>({date:String(date),assetId:String(assetId),assetName:String(assetName),assetClass:String(assetClass),region:String(region),style:String(style),manager:String(manager),weight:Number(weight)}));
const BENCH:RecordRow[]=[
["2026-01-01","IDX001","S&P Basket 1","Equity","US","Large Cap","Index",.40],
["2026-01-01","IDX002","S&P Basket 2","Equity","US","Large Cap","Index",.35],
["2026-01-01","IDX003","S&P Basket 3","Equity","India","Large Cap","Index",.25],
["2026-02-01","IDX001","S&P Basket 1","Equity","US","Large Cap","Index",.45],
["2026-02-01","IDX002","S&P Basket 2","Equity","US","Large Cap","Index",.30],
["2026-02-01","IDX003","S&P Basket 3","Equity","India","Large Cap","Index",.25]
].map(([date,assetId,assetName,assetClass,region,style,manager,weight])=>({date:String(date),assetId:String(assetId),assetName:String(assetName),assetClass:String(assetClass),region:String(region),style:String(style),manager:String(manager),weight:Number(weight)}));
function initial(kind:Kind,mode:Mode):Config{
 const rows=enriched(kind==="Portfolio"?DATA:BENCH);
 const root:Node={id:"root",parent:null,name:kind,origin:mode==="Automatic"?"generated":"manual",independent:kind==="Benchmark"&&mode!=="Automatic",rule:kind==="Benchmark"?defaultRule():undefined};
 if(mode==="Automatic")return {nodes:[root],selected:"root",rows,dimensions:[...dims]};
 const nodes:Node[]=[root],known=new Set(["root"]);
 // Root is level 1, followed by seven classification levels.
 const count=mode==="Hybrid"?3:7;
 for(const r of rows){let parent="root",filters:Record<string,string>={};for(let i=0;i<count;i++){const d=dims[i],value=dimensionValue(r,d);filters={...filters,[d]:value};const id=parent+"/"+d+":"+value;if(!known.has(id)){nodes.push({id,parent,name:value,origin:"manual",filters:{...filters}});known.add(id)}parent=id}}
 if(kind==="Benchmark")nodes.push({id:"custom",parent:"root",name:"Custom US benchmark",origin:"manual",independent:true,rule:{...defaultRule(),region:"US"}});
 return {nodes,selected:"root",rows,dimensions:[...dims]};
}
function generate(rows:RecordRow[],date:string,keys:string[],rootParent:string,scope?:string):Node[]{
 const subset=rows.filter(r=>r.date===date&&(!scope||r.region===scope));
 const result:Node[]=[];const ids=new Set<string>();
 subset.forEach(r=>{let parent=rootParent;keys.forEach((key,i)=>{const val=dimensionValue(r,key);const id=parent+"/"+key+":"+val;if(!ids.has(id)){result.push({id,parent,name:val,origin:"generated",scope:i===0&&key==="region"?val:undefined});ids.add(id)}parent=id})});
 return result;
}
function descendants(nodes:Node[],id:string):string[]{const children=nodes.filter(n=>n.parent===id);return [id,...children.flatMap(n=>descendants(nodes,n.id))]}
function previewRows(node:Node,nodes:Node[],rows:RecordRow[],date:string,kind:Kind):RecordRow[]{
 const subset=rows.filter(r=>r.date===date);
 const directChildren=nodes.filter(n=>n.parent===node.id);
 if(directChildren.length&&!(kind==="Benchmark"&&node.independent)){
  const union=directChildren.flatMap(child=>previewRows(child,nodes,rows,date,kind));
  const seen=new Set<string>();return union.filter(r=>{const k=r.date+"|"+r.assetId+"|"+r.manager+"|"+r.region+"|"+r.style;if(seen.has(k))return false;seen.add(k);return true});
 }
 if(kind==="Benchmark"&&node.independent){
 const rule=node.rule||defaultRule();
 const positions=subset.filter(r=>(rule.region==="All"||r.region===rule.region)&&(rule.style==="All"||r.style===rule.style)&&(rule.selectedAssetIds.length===0||rule.selectedAssetIds.includes(r.assetId)));
 const totalWeight=positions.reduce((sum,r)=>sum+r.weight,0);
 return positions.map(r=>({...r,weight:rule.method==="custom"?(rule.weights[r.assetId]||0)/100:rule.method==="equal"?(positions.length?1/positions.length:0):(totalWeight?r.weight/totalWeight:0)}));
}
 const chain:Node[]=[];let current:Node|undefined=node;
 while(current){chain.unshift(current);current=nodes.find(n=>n.id===current?.parent)}
 let filtered=subset;
 for(const c of chain){
  if(c.scope)filtered=filtered.filter(r=>r.region===c.scope);
  if(c.id.includes("/")){const seg=c.id.slice(c.id.lastIndexOf("/")+1);const idx=seg.indexOf(":");if(idx>0){const k=seg.slice(0,idx),v=seg.slice(idx+1);filtered=filtered.filter(r=>String((r as unknown as Record<string,unknown>)[k])===v)}}
 }
 // Manual manager leaves represent their assigned managers, but ancestor nodes include all managers.
 if(node.filters)filtered=filtered.filter(r=>Object.entries(node.filters!).every(([key,value])=>dimensionValue(r,key)===value));
 if(node.origin==="manual"&&node.assignedAssetIds)filtered=filtered.filter(r=>node.assignedAssetIds!.includes(r.assetId));
 else if(node.origin==="manual"&&node.name.startsWith("Manager "))filtered=filtered.filter(r=>r.manager===node.name);
 else if(node.origin==="manual"&&node.id!=="root"&&!node.filters&&node.scope===undefined)filtered=[];
 return filtered;
}
function csv(rows:RecordRow[]){const cols=["date","assetId","assetName","assetClass","strategy","region","style","sector","fund","manager","weight"];return [cols.join(","),...rows.map(r=>cols.map(c=>JSON.stringify((r as unknown as Record<string,unknown>)[c]??"")).join(","))].join("\n")}
function saveFile(name:string,text:string,type="application/json"){const a=document.createElement("a");const url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function parseCsv(text:string):RecordRow[]{const lines=text.trim().split(/\r?\n/);if(lines.length<2)throw Error("CSV must contain a header and records");const h=lines.shift()!.split(",").map(v=>v.trim().replace(/^"|"$/g,""));const required=["date","assetId","assetName","assetClass","region","style","manager","weight"];if(required.some(k=>!h.includes(k)))throw Error("Missing required columns: "+required.filter(k=>!h.includes(k)).join(", "));return lines.map((line,i)=>{const fields=line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)?.map(s=>s.replace(/,$/,"").replace(/^"|"$/g,"").replace(/""/g,'"'))??[];const raw=Object.fromEntries(h.map((k,j)=>[k,fields[j]??""]));if(!raw.date||!raw.assetId||!Number.isFinite(Number(raw.weight)))throw Error("Invalid row "+(i+2));return {...raw,weight:Number(raw.weight)} as RecordRow})}
function fmt(n:number){return (n*100).toFixed(1)+"%"}
export default function App(){
 const [kind,setKind]=useState<Kind>("Portfolio"),[mode,setMode]=useState<Mode>("Manual"),[date,setDate]=useState("2026-01-01");
 const key=kind+":"+mode;
 const STORAGE_KEY="hierarchy-studio:v2",DAY=24*60*60*1000;
 const [configs,setConfigs]=useState<Record<string,Config>>(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return {};const saved=JSON.parse(raw);if(!saved.savedAt||Date.now()-saved.savedAt>=DAY){localStorage.removeItem(STORAGE_KEY);return {}}return saved.configs||{}}catch{return {}}});
 const [selection,setSelection]=useState<string>("equity");
 const [expanded,setExpanded]=useState<Set<string>>(new Set(["root"]));
 const [tab,setTab]=useState<"Holdings"|"Source data"|"Validation">("Holdings");
 const [side,setSide]=useState<"Data"|"Configure">("Data");
 const [search,setSearch]=useState("");
 const [toast,setToast]=useState("");
 const [history,setHistory]=useState<Record<string,{past:Config[];future:Config[]}>>({});
 const config=configs[key]||initial(kind,mode);
 const {nodes:manual,rows,dimensions}=config;
 const dates=[...new Set(rows.map(r=>r.date))].sort();
 const effectiveDate=dates.includes(date)?date:dates[0]||date;
 const generated=useMemo(()=>mode==="Automatic"?generate(rows,effectiveDate,dimensions,"root"):mode==="Hybrid"?manual.filter(n=>n.origin==="manual"&&n.filters&&Object.keys(n.filters).length===3).flatMap(n=>{
 const subset=rows.filter(r=>Object.entries(n.filters!).every(([key,value])=>dimensionValue(r,key)===value));
 return generate(subset,effectiveDate,dimensions.slice(3,7),n.id);
}):[],[mode,manual,rows,effectiveDate,dimensions]);
 const nodes=mode==="Automatic"?[...manual.filter(n=>n.id==="root"),...generated]:[...manual.filter(n=>n.origin==="manual"),...generated];
 const active=nodes.find(n=>n.id===selection)||nodes.find(n=>n.id===config.selected)||nodes[0];
 const holdings=active?previewRows(active,nodes,rows,effectiveDate,kind):[];
 const total=rows.filter(r=>r.date===effectiveDate);
 const issues:string[]=[];
 if(total.length===0)issues.push("No holdings are available for this effective date.");
 const dup=new Set<string>();total.forEach(r=>{const k=r.assetId;if(dup.has(k))issues.push("Duplicate security at selected date: "+k);dup.add(k)});
 const missing=total.filter(r=>dimensions.some(k=>!String((r as unknown as Record<string,unknown>)[k]??"").trim()));
 if(missing.length)issues.push(missing.length+" records contain missing hierarchy labels.");
 if(kind==="Portfolio"&&mode==="Manual"){const leaves=nodes.filter(n=>!nodes.some(c=>c.parent===n.id));const unassigned=total.filter(r=>!leaves.some(l=>previewRows(l,nodes,rows,effectiveDate,kind).some(s=>s.assetId===r.assetId)));if(unassigned.length)issues.push(unassigned.length+" positions are not assigned to a terminal manager node.")}
 if(kind==="Benchmark")issues.push("Independent benchmark definitions may differ from the union of their children; this is intentional.");
 useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);const stored=raw?JSON.parse(raw):null;const savedAt=stored?.savedAt&&Date.now()-stored.savedAt<DAY?stored.savedAt:Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify({savedAt,configs}))}catch{setToast("Browser storage unavailable. Export a copy.")}},[configs]);
 function notify(message:string){setToast(message);window.setTimeout(()=>setToast(""),3500)}
 function commit(fn:(c:Config)=>Config){const next=fn(config);setHistory(h=>({...h,[key]:{past:[...(h[key]?.past||[]),config].slice(-30),future:[]}}));setConfigs(c=>({...c,[key]:next}))}
 function undo(){const h=history[key];if(!h?.past.length)return;const prev=h.past[h.past.length-1];setConfigs(c=>({...c,[key]:prev}));setHistory(s=>({...s,[key]:{past:h.past.slice(0,-1),future:[config,...h.future]}}))}
 function redo(){const h=history[key];if(!h?.future.length)return;const next=h.future[0];setConfigs(c=>({...c,[key]:next}));setHistory(s=>({...s,[key]:{past:[...h.past,config],future:h.future.slice(1)}}))}
 function add(parent:string|null){if(mode==="Automatic"){notify("Switch to Manual or Hybrid to add nodes.");return}
 if(mode==="Hybrid"&&parent&&Object.keys(nodes.find(n=>n.id===parent)?.filters||{}).length>=3){notify("Levels 5–8 are generated from source data.");return}const name=window.prompt("Name the new node","New category");if(!name?.trim())return;const id=mkid();commit(c=>({...c,nodes:[...c.nodes,{id,parent,name:name.trim(),origin:"manual"}],selected:id}));setSelection(id);setExpanded(s=>new Set([...s,parent||"root",id]))}
 function rename(n:Node){if(n.origin==="generated"){notify("Generated labels come from the dataset. Edit the source data or dimension mapping.");return}const name=window.prompt("Rename node",n.name);if(!name?.trim())return;commit(c=>({...c,nodes:c.nodes.map(x=>x.id===n.id?{...x,name:name.trim()}:x)}))}
 function remove(n:Node){if(n.id==="root")return;const all=descendants(nodes,n.id);const promote=window.confirm("Delete "+n.name+"?\nOK: promote direct children to this node's parent.\nCancel: abort deletion.");if(!promote)return;commit(c=>({...c,nodes:c.nodes.filter(x=>x.id!==n.id).map(x=>x.parent===n.id?{...x,parent:n.parent}:x),selected:n.parent||"root"}));setSelection(n.parent||"root")}
 function move(id:string,target:string){if(id===target||id==="root")return;const n=nodes.find(x=>x.id===id),to=nodes.find(x=>x.id===target);if(!n||!to)return;if(n.origin==="generated"||to.origin==="generated"){notify("Generated nodes are recreated from source data. Edit a manual node instead.");return}if(descendants(nodes,id).includes(target)){notify("A node cannot be moved inside its own descendant.");return}commit(c=>({...c,nodes:c.nodes.map(x=>x.id===id?{...x,parent:target}:x)}));setExpanded(s=>new Set([...s,target]));notify("Moved "+n.name+" under "+to.name)}
 function duplicate(n:Node){if(n.origin!=="manual"){notify("Generated nodes cannot be duplicated.");return}const id=mkid();commit(c=>({...c,nodes:[...c.nodes,{...n,id,name:n.name+" copy"}],selected:id}));setSelection(id)}
 function toggle(id:string){setExpanded(s=>{const t=new Set(s);t.has(id)?t.delete(id):t.add(id);return t})}
 function loadSample(name:string){const picked=name==="benchmark"?BENCH:DATA;const next=initial(kind,mode);next.rows=enriched(picked);commit(()=>next);setSelection(next.selected);setDate("2026-01-01");notify("Loaded "+name+" sample dataset")}
 function exportConfig(){saveFile("hierarchy-"+kind.toLowerCase()+"-"+mode.toLowerCase()+".json",JSON.stringify({kind,mode,date:effectiveDate,config},null,2))}
 function fileUpload(file:File|null){if(!file)return;file.text().then(t=>{try{if(file.name.endsWith(".json")){const data=JSON.parse(t);if(data.config?.nodes&&data.config?.rows){commit(()=>data.config);setSelection(data.config.selected||"root");notify("Imported hierarchy configuration");return}if(Array.isArray(data)){commit(c=>({...c,rows:enriched(data)}));notify("Imported JSON dataset");return}throw Error("Unsupported JSON format")}const parsed=enriched(parseCsv(t));commit(c=>({...c,rows:parsed}));setDate(parsed[0].date);notify("Loaded "+parsed.length+" source rows")}catch(e){notify(e instanceof Error?e.message:"Could not read file")}})}
 function row(n:Node):React.ReactNode{
  const children=nodes.filter(c=>c.parent===n.id);
  const isOpen=expanded.has(n.id);
  const holdingsAtNode=previewRows(n,nodes,rows,effectiveDate,kind);
  const count=new Set(holdingsAtNode.map(r=>r.assetId)).size;
  const draggable=n.origin==="manual"&&n.id!=="root";
  return <li className="diagram-branch" key={n.id}>
    <div className={"diagram-card "+(active?.id===n.id?"selected ":"")+(n.origin==="generated"?"generated ":"")+(n.independent?"independent":"")}
      draggable={draggable}
      onDragStart={e=>{e.stopPropagation();e.dataTransfer.setData("text/node-id",n.id);e.dataTransfer.effectAllowed="move"}}
      onDragOver={e=>{if(n.origin==="manual"){e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect="move"}}}
      onDrop={e=>{e.preventDefault();e.stopPropagation();const id=e.dataTransfer.getData("text/node-id");if(id)move(id,n.id)}}>
      <button className="diagram-main" onClick={()=>setSelection(n.id)} title={"Inspect "+n.name}>
        <span className="diagram-icon"><Layers3 size={15}/></span>
        <span className="diagram-text"><strong>{n.name}</strong><small>{n.independent?"Independent benchmark":n.origin==="generated"?"Data generated":"Manual definition"}</small></span>
      </button>
      <span className="diagram-stat" title={count+" distinct securities"}>{count} <small>assets</small></span>
      <div className="diagram-actions">
        {draggable&&<span className="drag-hint" title="Drag card onto another parent"><GripVertical size={14}/></span>}
        {mode!=="Automatic"&&n.origin==="manual"&&<button title="Add child" onClick={()=>add(n.id)}><Plus size={14}/></button>}
        {children.length>0&&<button title={isOpen?"Collapse descendants":"Expand descendants"} onClick={()=>toggle(n.id)}>{isOpen?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>}
      </div>
    </div>
    {children.length>0&&isOpen&&<ul className="diagram-children">{children.map(c=>row(c))}</ul>}
    {children.length>0&&!isOpen&&<button className="collapsed-count" onClick={()=>toggle(n.id)}>{children.length} hidden branches <ChevronDown size={13}/></button>}
  </li>
}
 return <div className="app">
  <aside className="rail"><div className="mark"><GitBranch size={21}/></div><button className="rail-active" title="Hierarchy builder"><FolderTree size={20}/></button><button title="Dataset workspace" onClick={()=>setSide("Data")}><Database size={20}/></button><button title="Configuration" onClick={()=>setSide("Configure")}><Settings2 size={20}/></button><div className="rail-bottom"><div className="avatar">H</div></div></aside>
  <div className="main"><header className="top"><div className="crumb">WORKSPACE <ChevronRight size={13}/> HIERARCHY STUDIO</div><div className="top-right"><span className="saved"><span/> Browser cache · 24 hours</span><button className="secondary" onClick={()=>document.getElementById("config-import")?.click()}><Upload size={15}/> Import</button><button className="primary" onClick={exportConfig}><ArrowDownToLine size={15}/> Export configuration</button><input id="config-import" type="file" accept=".csv,.json" hidden onChange={e=>fileUpload(e.target.files?.[0]||null)}/></div></header>
  <main className="content"><div className="heading"><div><div className="eyebrow">PORTFOLIO CONSTRUCTION / STRUCTURE</div><h1>Hierarchy builder <span className="beta">BETA</span></h1><p>Design, organize and explore multi-level investment structures.</p></div><div className="top-actions"><button className="icon-button" title="Undo" onClick={undo} disabled={!history[key]?.past.length}><Undo2 size={17}/></button><button className="icon-button" title="Redo" onClick={redo} disabled={!history[key]?.future.length}><Redo2 size={17}/></button><button className="secondary" onClick={()=>{if(window.confirm("Reset this configuration?")){commit(()=>initial(kind,mode));setSelection("root")}}}><RotateCcw size={15}/> Reset</button></div></div>
   <section className="options"><div className="field"><label>STRUCTURE TYPE</label><div className="segmented">{(["Portfolio","Benchmark"] as Kind[]).map(k=><button key={k} className={kind===k?"on":""} onClick={()=>{setKind(k);setSelection("root")}}>{k}</button>)}</div></div><div className="field approach"><label>CONSTRUCTION APPROACH</label><div className="segmented">{(["Manual","Automatic","Hybrid"] as Mode[]).map(m=><button key={m} className={mode===m?"on":""} onClick={()=>{setMode(m);setSelection("root")}}>{m}</button>)}</div></div><div className="field date-field"><label>EFFECTIVE DATE</label><select value={effectiveDate} onChange={e=>setDate(e.target.value)}>{dates.map(d=><option key={d}>{d}</option>)}</select></div></section>
   <div className="retention-note"><span><Database size={17}/> Temporary browser storage: your imported data and edits expire 24 hours after they were first saved. Export to your device to keep a permanent copy. Browser cleanup may remove them sooner.</span><button onClick={exportConfig}><ArrowDownToLine size={15}/> Export to my device</button></div>
   <div className="level-strip"><b>Eight hierarchy levels</b><span>{mode==="Hybrid"?"Levels 1–4 manually defined · Levels 5–8 generated from source data":mode==="Manual"?"All eight levels manually editable":"All eight levels generated from source data"}</span></div>
   <div className="mode-note"><div className="note-icon"><Layers3 size={18}/></div><div><b>{mode==="Manual"?"Build freely, organize visually.":mode==="Automatic"?"Your data defines the structure.":"Blend curated strategy with data-driven detail."}</b><p>{mode==="Manual"?"Create, rename, duplicate or move nodes across levels by dragging them onto another parent.":mode==="Automatic"?"Choose ordered dimensions. Nodes are generated from source records for the selected date.":"Manual upper levels remain editable while source data generates lower branches automatically."} {kind==="Benchmark"?"Independent benchmark nodes can contain holdings beyond their children.":"Portfolio holdings roll up from source records through their classification paths."}</p></div></div>
   <div className="workspace"><section className="panel left"><div className="panel-title"><div><Database size={17}/> Data sources</div><button onClick={()=>setSide(side==="Data"?"Configure":"Data")} title="Switch panel"><Settings2 size={16}/></button></div>{side==="Data"?<><div className="subhead">SAMPLE DATASETS <span>02</span></div><label className="dataset"><input type="checkbox" checked={rows===DATA} onChange={()=>loadSample("portfolio")}/><span className="dataset-icon"><LayoutGrid size={16}/></span><span><b>Multi-region portfolio</b><small>2 dates · 9 securities · 6 managers</small></span></label><label className="dataset"><input type="checkbox" checked={rows===BENCH} onChange={()=>loadSample("benchmark")}/><span className="dataset-icon purple"><Activity size={16}/></span><span><b>Custom benchmark</b><small>2 dates · independently composed</small></span></label><label className="upload"><Upload size={18}/><b>Upload your dataset</b><span>CSV or JSON · mapped columns</span><input type="file" accept=".csv,.json" hidden onChange={e=>fileUpload(e.target.files?.[0]||null)}/></label><div className="subhead">AVAILABLE DIMENSIONS</div><div className="dimensions">{dims.map(d=><div key={d} className="dimension"><Layers3 size={14}/>{labels[d]}<span>{new Set(rows.map(r=>(r as unknown as Record<string,unknown>)[d])).size}</span></div>)}</div><button className="text-button" onClick={()=>saveFile("sample-data.csv",csv(rows),"text/csv")}><ArrowDownToLine size={14}/> Download source data</button></>:<><div className="subhead">HIERARCHY DIMENSIONS</div><p className="hint">Use arrows to change the generation order. Changes apply to Automatic and Hybrid views.</p>{dimensions.map((d,i)=><div className="dimension order" key={d}><span className="order-num">{i+1}</span>{labels[d]}<div><button disabled={i===0} onClick={()=>commit(c=>{const a=[...c.dimensions];[a[i],a[i-1]]=[a[i-1],a[i]];return {...c,dimensions:a}})}>↑</button><button disabled={i===dimensions.length-1} onClick={()=>commit(c=>{const a=[...c.dimensions];[a[i],a[i+1]]=[a[i+1],a[i]];return {...c,dimensions:a}})}>↓</button></div></div>)}<p className="hint">Hybrid mode has four manual levels including root; style, sector, fund and manager are generated from the data.</p></>}</section>
   <section className="panel canvas"><div className="panel-title"><div><GitBranch size={17}/> Structure explorer <span className="live">LIVE</span></div><div className="canvas-tools"><span>{nodes.length} nodes</span><button title="Expand all" onClick={()=>setExpanded(new Set(nodes.map(n=>n.id)))}><Plus size={16}/></button><button title="Collapse all" onClick={()=>setExpanded(new Set(["root"]))}><X size={16}/></button></div></div><div className="tree-head"><span>HIERARCHY / {kind.toUpperCase()}</span><span>DRAG A CARD ONTO ANOTHER CARD TO MOVE IT</span></div><div className="tree-scroll diagram-scroll"><div className="diagram-stage"><ul className="diagram-root">{nodes.filter(n=>n.parent===null).map(n=>row(n))}</ul>{mode!=="Automatic"&&<button className="add-root" onClick={()=>add("root")}><Plus size={15}/> Add top-level node</button>}</div></div><div className="legend"><span><i className="dot manual"/> Manually defined</span><span><i className="dot automatic"/> Data generated</span>{kind==="Benchmark"&&<span><i className="dot independent"/> Independent</span>}</div></section>
   <section className="panel inspector"><div className="panel-title"><div><Settings2 size={17}/> Node inspector</div><span className="muted">DETAILS</span></div>{active&&<><div className="inspector-main"><div className="inspector-icon"><FolderTree size={23}/></div><div className="inspector-title">{active.name}</div><span className={"tag "+(active.origin==="generated"?"generated":"")}>{active.independent?"Independent definition":active.origin==="generated"?"Auto-generated node":"Manual node"}</span><div className="metrics"><div><small>SECURITIES</small><b>{new Set(holdings.map(r=>r.assetId)).size}</b></div><div><small>POSITIONS</small><b>{holdings.length}</b></div><div><small>WEIGHT TOTAL</small><b>{fmt(holdings.reduce((s,r)=>s+r.weight,0))}</b></div></div><div className="detail"><span>Node ID</span><code title={active.id}>{active.id.slice(0,17)}</code></div><div className="detail"><span>Parent</span><b>{nodes.find(n=>n.id===active.parent)?.name||"None (root)"}</b></div><div className="detail"><span>Children</span><b>{nodes.filter(n=>n.parent===active.id).length}</b></div><div className="detail"><span>Source</span><b>{active.independent?"Independent benchmark":active.origin==="manual"?"Visual editor":"Data labels"}</b></div></div>{active.origin==="manual"&&nodes.every(n=>n.parent!==active.id)&&kind==="Portfolio"&&<div className="assignments"><div className="assign-title">ASSIGN SECURITIES <span>{active.assignedAssetIds?.length??"Auto"}</span></div><p>Pick source securities for this leaf. Assignments are used for every effective date where the security exists.</p><div className="assign-list">{total.map(r=><label key={r.assetId}><input type="checkbox" checked={active.assignedAssetIds?active.assignedAssetIds.includes(r.assetId):active.name===r.manager} onChange={e=>{const existing=active.assignedAssetIds??total.filter(x=>x.manager===active.name).map(x=>x.assetId);const next=e.target.checked?[...new Set([...existing,r.assetId])]:existing.filter(x=>x!==r.assetId);commit(c=>({...c,nodes:c.nodes.map(n=>n.id===active.id?{...n,assignedAssetIds:next}:n)}))}}/>{r.assetName}<code>{r.assetId}</code></label>)}</div></div>}<div className="inspector-buttons"><button onClick={()=>add(active.id)} disabled={mode==="Automatic"||active.origin==="generated"||(mode==="Hybrid"&&Object.keys(active.filters||{}).length>=3)}><Plus size={15}/> Child</button><button onClick={()=>rename(active)} disabled={active.origin==="generated"}>Rename</button><button title="Duplicate" onClick={()=>duplicate(active)} disabled={active.origin==="generated"}><Copy size={15}/></button><button title="Delete" onClick={()=>remove(active)} disabled={active.id==="root"||active.origin==="generated"}><Trash2 size={15}/></button></div>{kind==="Benchmark"&&active.origin==="manual"&&<label className="benchmark-option"><input type="checkbox" checked={!!active.independent} onChange={e=>commit(c=>({...c,nodes:c.nodes.map(n=>n.id===active.id?{...n,independent:e.target.checked}:n)}))}/> Independent benchmark definition</label>}<div className="inspector-foot"><b>About this node</b><p>{active.independent?"This benchmark's constituents are independently defined and need not match its children.":active.origin==="generated"?"Created from distinct combinations of labeled source records.":"This node is editable. Drag it onto another manual node to change its parent."}</p></div></>}</section></div>
   <section className="table-panel"><div className="table-tabs">{(["Holdings","Source data","Validation"] as const).map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}{t==="Validation"&&<span className="issue-count">{issues.length}</span>}</button>)}</div><div className="table-info"><div><b>{tab==="Holdings"?"Underlying positions":tab==="Source data"?"Source data records":"Data quality & validation"}</b><span>{tab==="Holdings"?active?.name:tab==="Source data"?"All effective dates":"Current configuration"}</span></div><div className="table-actions"><Search size={16}/><input placeholder="Filter securities..." value={search} onChange={e=>setSearch(e.target.value)}/><button onClick={()=>saveFile(tab==="Source data"?"source.csv":"holdings.csv",csv(tab==="Source data"?rows:holdings),"text/csv")}><ArrowDownToLine size={15}/></button></div></div>{tab==="Validation"?<div className="validation">{issues.length?issues.map((s,i)=><div className="warning" key={i}><Activity size={16}/>{s}</div>):<div className="clean"><Check size={18}/> No validation issues found for this view.</div>}</div>:<div className="table-overflow"><table><thead><tr><th>EFFECTIVE DATE</th><th>SECURITY ID</th><th>SECURITY NAME</th><th>REGION</th><th>STYLE</th><th>MANAGER</th><th className="right">WEIGHT</th></tr></thead><tbody>{(tab==="Source data"?rows:holdings).filter(r=>JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map((r,i)=><tr key={r.date+r.assetId+i}><td>{r.date}</td><td><code>{r.assetId}</code></td><td><b>{r.assetName}</b></td><td>{r.region}</td><td>{r.style}</td><td>{r.manager}</td><td className="right">{fmt(r.weight)}</td></tr>)}</tbody></table></div>}</section>
   <footer><span>HIERARCHY STUDIO · DEMONSTRATION ENVIRONMENT</span><span>Local-only prototype · No server required <ArrowUpRight size={13}/></span></footer>
  </main></div>{toast&&<div className="toast">{toast}</div>}</div>
}
