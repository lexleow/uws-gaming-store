import {NextRequest,NextResponse} from 'next/server';
import {configured,serverDb} from '@/lib/db';
import {randomUUID} from 'crypto';
export async function POST(req:NextRequest){
 try{
 if(!configured())return NextResponse.json({error:'数据库未配置，不能创建正式订单。'},{status:503});
 const body=await req.json();const name=String(body.customer_name??'').trim(),email=String(body.email??'').trim().toLowerCase(),notes=String(body.notes??'').slice(0,500);const items=body.items;
 if(name.length<2||name.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!Array.isArray(items)||items.length<1||items.length>30)return NextResponse.json({error:'请检查姓名、邮箱及购物车。'},{status:400});
 const counts=new Map<string,number>();for(const item of items){if(typeof item.product_id!=='string'||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)return NextResponse.json({error:'商品数量无效'},{status:400});counts.set(item.product_id,(counts.get(item.product_id)||0)+item.quantity)}
 if(counts.size>20||[...counts.values()].some(q=>q>10))return NextResponse.json({error:'订单超过数量限制'},{status:400});
 const db=serverDb();const {data:products,error:pe}=await db.from('products').select('id,name,price_cents,stock,active').in('id',[...counts.keys()]);if(pe||!products||products.length!==counts.size||products.some(p=>!p.active||p.stock===0||p.stock!==null&&(counts.get(p.id)||0)>p.stock))return NextResponse.json({error:'部分商品不可购买或库存不足。'},{status:409});
 // Server-side amount calculation. Never accept customer-submitted pricing.
 const total=products.reduce((s,p)=>s+p.price_cents*(counts.get(p.id)||0),0);if(total<=0||total>100000000)return NextResponse.json({error:'订单金额无效'},{status:400});
 const id=randomUUID();const orderNumber=`UWS-${Date.now().toString(36).toUpperCase()}-${id.slice(0,6).toUpperCase()}`;
 const {error:oe}=await db.from('orders').insert({id,order_number:orderNumber,customer_name:name,customer_email:email,customer_notes:notes,total_cents:total,currency:'MYR',payment_status:'unpaid',fulfillment_status:'pending'});
 if(oe)throw oe;
 const {error:ie}=await db.from('order_items').insert(products.map(p=>({order_id:id,product_id:p.id,product_name:p.name,quantity:counts.get(p.id),unit_price_cents:p.price_cents})));
 if(ie){await db.from('orders').delete().eq('id',id);throw ie}
 return NextResponse.json({order_number:orderNumber,status:'unpaid',message:'订单已创建，尚未付款。'}, {status:201});
 }catch(e){console.error('Order create failed',e);return NextResponse.json({error:'订单提交暂时失败，请稍后重试。'},{status:500})}
}
