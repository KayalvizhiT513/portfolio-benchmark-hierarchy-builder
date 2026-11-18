export type Comparison = "eq" | "neq" | "contains" | "in";
export type RuleExpr =
  | { id:string; type:"group"; join:"AND" | "OR"; negate:boolean; children:RuleExpr[] }
  | { id:string; type:"condition"; field:string; op:Comparison; value:string };
export type SourceRow = Record<string,unknown> & { assetId:string; date:string };
export const ruleId=()=>Math.random().toString(36).slice(2,11);
export const emptyRule=():RuleExpr=>({id:ruleId(),type:"group",join:"AND",negate:false,children:[]});
export const condition=():RuleExpr=>({id:ruleId(),type:"condition",field:"region",op:"eq",value:"US"});
export const blank=(value:unknown)=>value===null||value===undefined||String(value).trim()==="";
export function missingAttributes(rows:SourceRow[],dimensions:string[]){
 const errors:{field:string;date:string;assetId:string;row:number}[]=[];
 rows.forEach((row,index)=>dimensions.forEach(field=>{if(blank(row[field]))errors.push({field,date:row.date,assetId:row.assetId,row:index+1})}));
 return errors;
}
export function evaluate(expr:RuleExpr,row:SourceRow):boolean{
 if(expr.type==="group"){
  const result=expr.join==="AND"?expr.children.every(item=>evaluate(item,row)):expr.children.some(item=>evaluate(item,row));
  // An empty group is a pass-through, including if the negate option is selected.
  return expr.children.length===0?true:expr.negate?!result:result;
 }
 const raw=row[expr.field];
 if(blank(raw))return false;
 const left=String(raw).toLowerCase().trim(),right=expr.value.toLowerCase().trim();
 switch(expr.op){
  case "eq":return left===right;
  case "neq":return left!==right;
  case "contains":return left.includes(right);
  case "in":return right.split(",").map(x=>x.trim()).includes(left);
 }
}
export function updateRule(expr:RuleExpr,target:string,fn:(r:RuleExpr)=>RuleExpr):RuleExpr{
 if(expr.id===target)return fn(expr);
 return expr.type==="group"?{...expr,children:expr.children.map(child=>updateRule(child,target,fn))}:expr;
}
export function deleteRule(expr:RuleExpr,target:string):RuleExpr{
 return expr.type==="group"?{...expr,children:expr.children.filter(child=>child.id!==target).map(child=>deleteRule(child,target))}:expr;
}
export function matches(row:SourceRow,rule?:RuleExpr,excluded:string[]=[]){
 return !excluded.includes(row.assetId)&&(!rule||evaluate(rule,row));
}
