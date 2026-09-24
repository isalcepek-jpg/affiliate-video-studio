import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";

const app=express();
const PORT=process.env.PORT||8080;
const KEY=process.env.GEMINI_API_KEY;
const ai=KEY?new GoogleGenAI({apiKey:KEY}):null;
fs.mkdirSync("videos",{recursive:true});
app.use(express.json({limit:"20mb"}));
app.use(express.static("public"));
app.use("/videos",express.static("videos"));

app.get("/api/health",(req,res)=>res.json({ok:true,aiConfigured:!!KEY}));

app.post("/api/generate",async(req,res)=>{
 try{
  if(!ai) return res.status(500).json({error:"Backend belum memiliki GEMINI_API_KEY."});
  const {image,language="id-ID",style="UGC creator",idea=""}=req.body;
  const m=(image||"").match(/^data:(image\/[^;]+);base64,(.+)$/);
  if(!m)return res.status(400).json({error:"Foto produk tidak valid."});
  const voice={"id-ID":"Indonesian","ms-MY":"Malay","en-US":"English"}[language]||"Indonesian";
  const prompt=`Create a realistic vertical 9:16 affiliate product advertisement using the supplied product image as the product reference. Style: ${style}. Keep the product appearance recognizable and consistent. Show the product in a realistic lifestyle scene, with dynamic camera movement, useful product demonstration, attractive close-ups and a strong social-commerce ending. The video should include natural spoken voice-over in ${voice}, natural dialogue or narration, sound effects and suitable background music. Do not invent visible brand claims. Additional instruction: ${idea||"Make it persuasive but natural for short-form social commerce."}`;
  const op=await ai.models.generateVideos({
   model:"veo-3.1-generate-preview",
   prompt,
   image:{imageBytes:Buffer.from(m[2],"base64"),mimeType:m[1]},
   config:{aspectRatio:"9:16",resolution:"720p",durationSeconds:"8",personGeneration:"allow_adult"}
  });
  let operation=op;
  while(!operation.done){
   await new Promise(r=>setTimeout(r,10000));
   operation=await ai.operations.getVideosOperation({operation});
  }
  const generated=operation.response?.generatedVideos?.[0]?.video;
  if(!generated)throw Error("Veo tidak mengembalikan video.");
  const id=crypto.randomUUID(),dir=path.join("videos",id);
  fs.mkdirSync(dir,{recursive:true});
  const out=path.join(dir,"affiliate-video.mp4");
  await ai.files.download({file:generated,downloadPath:out});
  res.json({videoUrl:`/videos/${id}/affiliate-video.mp4`});
 }catch(e){console.error(e);res.status(500).json({error:e.message||"AI generation gagal."})}
});
app.get("*",(req,res)=>res.sendFile(path.resolve("public/index.html")));
app.listen(PORT,()=>console.log("Affiliate Video Studio Isal on "+PORT));