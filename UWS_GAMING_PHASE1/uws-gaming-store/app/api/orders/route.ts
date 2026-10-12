import {NextRequest,NextResponse} from 'next/server';
import {configured,serverDb} from '@/lib/db';
import {randomUUID} from 'crypto';
export async function POST(req:NextRequest){
 try{
 if(!configured())return NextResponse.json({error:'数据库未配置，不能创建正式订单。'},{status:503});
 const body=await req.json();const name=String(body.customer_name??'').trim(),email=String(body.email??'').trim().toLowerCase(),notes=String(body.notes??'').slice(0,500);const items=body.items;
 if(name.length<2||name.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!Array.isArray(items)||items.length<1||items.length>30)return NextResponse.json({error:'请检查姓名、邮箱及购物车。'},{status:400});
 const counts=new Map<string,{product_id:string;option_id:string|null;quantity:number}>();for(const item of items){if(typeof item.product_id!=='string'||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)return NextResponse.json({error:'商品数量无效'},{status:400});if(item.option_id!==null&&item.option_id!==undefined&&(typeof item.option_id!=='string'||!/^[0-9a-f-]{36}$/i.test(item.option_id)))return NextResponse.json({error:'商品选项无效'},{status:400});const option_id=item.option_id||null;const k=item.product_id+'|'+(option_id||'');const old=counts.get(k);counts.set(k,{product_id:item.product_id,option_id,quantity:(old?.quantity||0)+item.quantity})}
 if(counts.size>20||[...counts.values()].some(e=>e.quantity>10))return NextResponse.json({error:'订单超过数量限制'},{status:400});
 const db=serverDb();const lines=[...counts.values()];
 const {data:products,error:pe}=await db.from('products').select('id,name,price_cents,stock,active,options').in('id',[...new Set(lines.map(e=>e.product_id))]);
 if(pe||!products)return NextResponse.json({error:'商品读取失败'},{status:500});
 const byId=new Map(products.map(p=>[p.id,p]));
 const resolved=[] as {product_id:string;product_name:string;option_id:string|null;option_label:string|null;quantity:number;unit_price_cents:number}[];
 for(const line of lines){
  const p=byId.get(line.product_id);
  if(!p||!p.active)return NextResponse.json({error:'商品已下架'},{status:409});
  const opts=Array.isArray(p.options)?p.options as {id:string;label:string;price_cents:number;stock:number|null}[]:[];
  const option=opts.find(o=>o.id===line.option_id);
  if((opts.length>0&&!option)||(opts.length===0&&line.option_id))return NextResponse.json({error:'请选择有效商品选项'},{status:409});
  const stock=option?option.stock:p.stock;
  if(stock!==null&&stock<line.quantity)return NextResponse.json({error:'库存不足'},{status:409});
  resolved.push({product_id:p.id,product_name:p.name,option_id:option?.id||null,option_label:option?.label||null,quantity:line.quantity,unit_price_cents:option?option.price_cents:p.price_cents});
 }
 // Prices and option stock are fetched server-side; guest-submitted amounts are ignored.
 // Stock is checked but not reserved atomically; manual review is required before fulfilment.
 const total=resolved.reduce((sum,l)=>sum+l.quantity*l.unit_price_cents,0);
 if(total<=0||total>100000000)return NextResponse.json({error:'订单金额无效'},{status:400});
 const id=randomUUID();const orderNumber=`UWS-${Date.now().toString(36).toUpperCase()}-${id.slice(0,6).toUpperCase()}`;
 const {error:oe}=await db.from('orders').insert({id,order_number:orderNumber,customer_name:name,customer_email:email,customer_notes:notes,total_cents:total,currency:'MYR',payment_status:'unpaid',fulfillment_status:'pending'});
 if(oe)throw oe;
 const {error:ie}=await db.from('order_items').insert(resolved.map(line=>({order_id:id,...line})));
 if(ie){await db.from('orders').delete().eq('id',id);throw ie}
 return NextResponse.json({order_number:orderNumber,status:'unpaid',message:'订单已创建，尚未付款。'}, {status:201});
 }catch(e){console.error('Order create failed',e);return NextResponse.json({error:'订单提交暂时失败，请稍后重试。'},{status:500})}
}
