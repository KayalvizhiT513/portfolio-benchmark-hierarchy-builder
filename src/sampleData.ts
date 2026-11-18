// Deterministic synthetic data: 200 securities x 5 effective dates = 1,000 positions.
// All eight classification attributes are populated. Desk changes across dates
// for selected securities; a few also switch managers.
export type EightAttributeRow={
 date:string;assetId:string;assetName:string;assetClass:string;strategy:string;
 region:string;style:string;sector:string;fund:string;manager:string;desk:string;weight:number;
};
export const SAMPLE_DATES=["2026-01-31","2026-02-28","2026-03-31","2026-04-30","2026-05-31"];
const assets=[
 ["SEC101","Apple","US","Technology"],["SEC102","Microsoft","US","Technology"],
 ["SEC103","Nvidia","US","Technology"],["SEC104","Alphabet","US","Communication"],
 ["SEC105","Amazon","US","Consumer"],["SEC106","Visa","US","Financials"],
 ["SEC107","JPMorgan","US","Financials"],["SEC108","Procter & Gamble","US","Consumer"],
 ["SEC109","Infosys","India","Technology"],["SEC110","TCS","India","Technology"],
 ["SEC111","HDFC Bank","India","Financials"],["SEC112","Reliance Industries","India","Energy"],
 ["SEC113","ICICI Bank","India","Financials"],["SEC114","Bharti Airtel","India","Communication"],
 ["SEC115","Toyota","Non-US","Consumer"],["SEC116","SAP","Non-US","Technology"],
 ["SEC117","ASML","Non-US","Technology"],["SEC118","Nestle","Non-US","Consumer"],
 ["SEC119","Novo Nordisk","Non-US","Healthcare"],["SEC120","Siemens","Non-US","Industrials"]
] as const;
const extraAssets: Array<readonly [string,string,string,string]> = Array.from({length:180},(_,i)=>{
 const regions=["US","India","Non-US"] as const;
 const sectors=["Technology","Financials","Healthcare","Industrials","Consumer","Energy","Communication"] as const;
 const j=i+121;
 return ["SEC"+String(j),"Synthetic Security "+String(j),regions[i%regions.length],sectors[(i*3+Math.floor(i/regions.length))%sectors.length]];
});
const allAssets: Array<readonly [string,string,string,string]>=[...assets,...extraAssets];
export const eightAttributeSample:EightAttributeRow[]=SAMPLE_DATES.flatMap((date,dateIndex)=>{
 const raw=allAssets.map((asset,i)=>{
  const [assetId,assetName,region,sector]=asset;
  const style=i%3===0?"Mid Cap":"Large Cap";
  const strategy=region==="India"?"India Focus":"Global Equity";
  const fund=region==="India"?(i%2?"India Leaders":"India Opportunities"):region==="US"?(i%2?"US Core":"US Growth"):(i%2?"International Core":"International Value");
  const managerBase=region==="India"?"Cedar Capital":region==="US"?"Aster Capital":"Delta Partners";
  const manager=i%5===0&&dateIndex>=2?"Beacon Management":i%11===0&&dateIndex>=3?"Horizon Partners":managerBase;
  const desk=(i%4===0?["Desk North","Desk South","Desk West","Desk North","Desk South"][dateIndex]:i%3===0?["Desk West","Desk West","Desk North","Desk South","Desk West"][dateIndex]:"Desk North");
  const weightUnits=4+((i*7+dateIndex*3)%11);
  return {date,assetId,assetName,assetClass:"Equity",strategy,region,style,sector,fund,manager,desk,weightUnits};
 });
 const denominator=raw.reduce((sum,r)=>sum+r.weightUnits,0);
 return raw.map(({weightUnits,...r})=>({...r,weight:Number((weightUnits/denominator).toFixed(8))}));
});
