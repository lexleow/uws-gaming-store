import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {randomUUID} from 'crypto';

function validate(input:unknown){
 if(!input||typeof input!=='object')throw Error('商品资料无效');
 const p=input as Record<string,unknown>;
 const name=String(p.name??'').trim(),description=String(p.description??'').trim();
 if(name.length<2||name.length>200||description.length>5000)throw Error('商品名称或描述长度无效');
 if(p.category!=='game'&&p.category!=='software')throw Error('商品分类无效');
 if(!Number.isSafeInteger(p.price_cents)||Number(p.price_cents)<0||Number(p.price_cents)>100000000)throw Error('基础价格无效');
 if(p.stock!==null&&(!Number.isSafeInteger(p.stock)||Number(p.stock)<0||Number(p.stock)>1000000))throw Error('库存无效');
 if(typeof p.image_url!=='string'||p.image_url.length>1000||p.image_url&&!/^https:\/\//.test(p.image_url))throw Error('图片地址无效');
 if(!Array.isArray(p.options)||p.options.length>40)throw Error('商品选项数量无效');
 const ids=new Set<string>();
 const options=p.options.map((raw:unknown)=>{
  if(!raw||typeof raw!=='object')throw Error('选项无效');
  const o=raw as Record<string,unknown>;
  const id=typeof o.id==='string'&&/^[a-f0-9-]{36}$/i.test(o.id)?o.id:randomUUID();
  const label=String(o.label??'').trim();
  if(label.length<1||label.length>120||ids.has(id))throw Error('选项名称不可为空、重复 ID 或过长');
  ids.add(id);
  if(!Number.isSafeInteger(o.price_cents)||Number(o.price_cents)<0||Number(o.price_cents)>100000000)throw Error('选项价格无效');
  if(o.stock!==null&&(!Number.isSafeInteger(o.stock)||Number(o.stock)<0||Number(o.stock)>1000000))throw Error('选项库存无效');
  return {id,label,price_cents:Number(o.price_cents),stock:o.stock===null?null:Number(o.stock)};
 });
 return {name,description,category:p.category,price_cents:Number(p.price_cents),stock:p.stock===null?null:Number(p.stock),image_url:p.image_url,image_emoji:String(p.image_emoji||'🎮').slice(0,20),badge:String(p.badge||'DIGITAL').slice(0,40),delivery_mode:'manual',active:p.active===true,options};
}
export async function GET(req:NextRequest){
 const auth=await requireAdmin(req);
 if(!auth)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {data,error}=await auth.db.from('products').select('*').order('created_at',{ascending:false});
 if(error)return NextResponse.json({error:'无法读取商品，请先执行数据库升级 SQL'},{status:500});
 return NextResponse.json({products:data});
}
export async function POST(req:NextRequest){
 const auth=await requireAdmin(req);
 if(!auth)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const record=validate(await req.json());
  const {data,error}=await auth.db.from('products').insert(record).select('*').single();
  if(error)throw error;
  return NextResponse.json({product:data},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'保存失败'},{status:400})}
}
export async function PATCH(req:NextRequest){
 const auth=await requireAdmin(req);
 if(!auth)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await req.json();
  if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.id))return NextResponse.json({error:'ID 无效'},{status:400});
  const record=validate(body);
  const {data,error}=await auth.db.from('products').update(record).eq('id',body.id).select('*').maybeSingle();
  if(error)throw error;
  if(!data)return NextResponse.json({error:'商品不存在'},{status:404});
  return NextResponse.json({product:data});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'保存失败'},{status:400})}
}
