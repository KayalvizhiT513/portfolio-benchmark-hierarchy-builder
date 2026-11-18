import express from "express";
import {MongoClient, ObjectId} from "mongodb";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs";
const app=express();
app.disable("x-powered-by");
app.use(express.json({limit:"3mb"}));
app.use((req,res,next)=>{res.setHeader("Cache-Control","no-store");next()});
const uri=process.env.MONGODB_URI;
const dbName=process.env.MONGODB_DB_NAME||"report_chart";
const editorKey=process.env.REPORT_CHART_EDITOR_KEY;
if(!uri)console.warn("MONGODB_URI is not configured. Persistence endpoints are unavailable.");
if(!editorKey)console.warn("REPORT_CHART_EDITOR_KEY is not configured. Database write endpoints will reject requests.");
let client;
async function collection(){
 if(!uri)throw new Error("MongoDB is not configured");
 if(!client)client=new MongoClient(uri,{serverSelectionTimeoutMS:7000});
 await client.connect();
 return client.db(dbName).collection("report_charts");
}
function authorized(req,res,next){
 if(!editorKey)return res.status(503).json({error:"Server editor key is not configured"});
 const provided=req.headers["x-report-chart-key"];
 if(typeof provided!=="string"||provided!==editorKey)return res.status(401).json({error:"Invalid editor key"});
 next();
}
function publicDocument(d){return {id:String(d._id),name:d.name,kind:d.kind,mode:d.mode,updatedAt:d.updatedAt,createdAt:d.createdAt}};
app.get("/api/health",(_req,res)=>res.json({ok:true,service:"report-chart",storageConfigured:!!uri}));
app.get("/api/report-charts",authorized,async(_req,res,next)=>{try{const col=await collection();const docs=await col.find({}).project({name:1,kind:1,mode:1,updatedAt:1,createdAt:1}).sort({updatedAt:-1}).limit(100).toArray();res.json(docs.map(publicDocument))}catch(err){next(err)}});
app.get("/api/report-charts/:id",authorized,async(req,res,next)=>{try{if(!ObjectId.isValid(req.params.id))return res.status(400).json({error:"Invalid id"});const col=await collection();const doc=await col.findOne({_id:new ObjectId(req.params.id)});if(!doc)return res.status(404).json({error:"Not found"});res.json({...publicDocument(doc),config:doc.config})}catch(err){next(err)}});
app.post("/api/report-charts",authorized,async(req,res,next)=>{try{const {name,kind,mode,config}=req.body||{};if(typeof name!=="string"||!name.trim()||name.length>120||!["Portfolio","Benchmark"].includes(kind)||!["Manual","Automatic","Hybrid"].includes(mode)||!config||!Array.isArray(config.nodes)||!Array.isArray(config.rows))return res.status(400).json({error:"Invalid report chart payload"});const now=new Date();const doc={name:name.trim(),kind,mode,config,createdAt:now,updatedAt:now};const col=await collection();const result=await col.insertOne(doc);res.status(201).json({...publicDocument({...doc,_id:result.insertedId}),config})}catch(err){next(err)}});
app.put("/api/report-charts/:id",authorized,async(req,res,next)=>{try{if(!ObjectId.isValid(req.params.id))return res.status(400).json({error:"Invalid id"});const {name,kind,mode,config}=req.body||{};if(typeof name!=="string"||!name.trim()||name.length>120||!["Portfolio","Benchmark"].includes(kind)||!["Manual","Automatic","Hybrid"].includes(mode)||!config||!Array.isArray(config.nodes)||!Array.isArray(config.rows))return res.status(400).json({error:"Invalid report chart payload"});const col=await collection();const result=await col.updateOne({_id:new ObjectId(req.params.id)},{$set:{name:name.trim(),kind,mode,config,updatedAt:new Date()}});if(!result.matchedCount)return res.status(404).json({error:"Not found"});res.json({id:req.params.id,updated:true})}catch(err){next(err)}});
app.delete("/api/report-charts/:id",authorized,async(req,res,next)=>{try{if(!ObjectId.isValid(req.params.id))return res.status(400).json({error:"Invalid id"});const col=await collection();const result=await col.deleteOne({_id:new ObjectId(req.params.id)});if(!result.deletedCount)return res.status(404).json({error:"Not found"});res.status(204).end()}catch(err){next(err)}});
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:"Server operation failed"})});
const dist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../dist");
if(fs.existsSync(dist)){app.use(express.static(dist));app.get("*",(_req,res)=>res.sendFile(path.join(dist,"index.html")))}
app.listen(Number(process.env.PORT||10000),"0.0.0.0",()=>console.log("Report Chart listening"));
