'use client';
import {useEffect,useState} from 'react';
import type {Product,ProductOption} from '@/lib/products';
import {money} from '@/lib/products';
type Edit=Omit<Product,'id'> & {id?:string};
const empty=():Edit=>({name:'',category:'game',description:'',price_cents:0,stock:null,image_url:'',image_emoji:'🎮',badge:'DIGITAL',active:false,delivery_mode:'manual',options:[]});
export default function ProductManager({token}:{token:string}){
 const [products,setProducts]=useState<Product[]>([]),[edit,setEdit]=useState<Edit|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[info,setInfo]=useState('');
 const headers={Authorization:`Bearer ${token}`};
 async function load(){const r=await fetch('/api/admin/products',{headers});const j=await r.json();if(r.ok)setProducts(j.products);else setError(j.error||'读取失败')}
 useEffect(()=>{void load()},[token]);
 function update(p:Partial<Edit>){setEdit(e=>e?{...e,...p}:e)}
 async function save(e:React.FormEvent){e.preventDefault();if(!edit)return;setBusy(true);setError('');setInfo('');
  try{const r=await fetch('/api/admin/products',{method:edit.id?'PATCH':'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(edit)});const j=await r.json();if(!r.ok)throw Error(j.error||'保存失败');setEdit(null);setInfo('商品已保存');await load()}catch(e){setError(e instanceof Error?e.message:'保存失败')}finally{setBusy(false)}}
 async function upload(file:File){setBusy(true);setError('');try{const form=new FormData();form.append('file',file);const r=await fetch('/api/admin/upload',{method:'POST',headers,body:form});const j=await r.json();if(!r.ok)throw Error(j.error);update({image_url:j.url})}catch(e){setError(e instanceof Error?e.message:'上传失败')}finally{setBusy(false)}}
 async function toggle(p:Product){setBusy(true);setError('');try{const r=await fetch('/api/admin/products',{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({...p,active:!p.active})});const j=await r.json();if(!r.ok)throw Error(j.error);await load()}catch(e){setError(e instanceof Error?e.message:'切换失败')}finally{setBusy(false)}}
 function setOption(i:number,change:Partial<ProductOption>){if(!edit)return;update({options:edit.options.map((o,k)=>k===i?{...o,...change}:o)})}
 return <section style={{marginTop:32}}><div className="actions"><h2>商品管理 · GAMES & SOFTWARE</h2><button className="primary" onClick={()=>{setEdit(empty());setError('')}}>＋ 新增商品</button><button className="secondary" onClick={()=>load()}>刷新商品</button></div>
 <p className="muted">每种商品可自定义多个选项（例如 OFFLINE ACC / OWN ACC）。默认不添加选项；每个选项都有独立价格和库存。新商品默认下架。</p>
 {info&&<p className="demoNotice">{info}</p>}{error&&<p className="error">{error}</p>}
 <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>商品</th><th>基础价格</th><th>选项</th><th>状态</th><th>操作</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.name}<small style={{display:'block'}}>{p.category}</small></td><td>{money(p.price_cents)}</td><td>{p.options?.length||0}</td><td>{p.active?'上架':'下架'}</td><td><button className="secondary" onClick={()=>updateEditing(p)}>编辑</button> <button className="secondary" disabled={busy} onClick={()=>toggle(p)}>{p.active?'下架':'上架'}</button></td></tr>)}</tbody></table></div>
 {edit&&<form onSubmit={save} style={{marginTop:22,padding:20,border:'1px solid #5d6475',borderRadius:12,display:'grid',gap:13}}><h3>{edit.id?'编辑商品':'新增商品'}</h3>
 <label>商品名称<input required minLength={2} maxLength={200} value={edit.name} onChange={e=>update({name:e.target.value})}/></label>
 <label>分类<select value={edit.category} onChange={e=>update({category:e.target.value as 'game'|'software'})}><option value="game">游戏 Games</option><option value="software">软件 Software</option></select></label>
 <label>描述<textarea value={edit.description} onChange={e=>update({description:e.target.value})} rows={3} maxLength={5000}/></label>
 <label>基础售价 (RM)<input type="number" min="0" max="1000000" step=".01" required value={(edit.price_cents/100).toFixed(2)} onChange={e=>update({price_cents:Math.round(Number(e.target.value)*100)})}/></label>
 <label>基础库存（留空表示不限）<input type="number" min="0" step="1" value={edit.stock??''} onChange={e=>update({stock:e.target.value===''?null:Number(e.target.value)})}/></label>
 <label>上传商品图片（JPG、PNG、WebP 或 GIF；最大 5MB）<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/></label>
 {edit.image_url&&<img src={edit.image_url} alt="商品预览" style={{width:150,height:150,objectFit:'contain'}}/>}
 <label>图片 URL<input value={edit.image_url} onChange={e=>update({image_url:e.target.value})} placeholder="上传图片后自动填入，也可使用 HTTPS 图片链接"/></label>
 <label>标签<input value={edit.badge} onChange={e=>update({badge:e.target.value})}/></label>
 <div><h3>商品选项（默认空白）</h3>{edit.options.map((o,i)=><div key={o.id} style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:10,alignItems:'end'}}><label>选项名称<input placeholder="OFFLINE ACC / OWN ACC" required value={o.label} onChange={e=>setOption(i,{label:e.target.value})}/></label><label>售价 RM<input type="number" min="0" step=".01" required value={(o.price_cents/100).toFixed(2)} onChange={e=>setOption(i,{price_cents:Math.round(Number(e.target.value)*100)})}/></label><label>库存（留空不限）<input type="number" min="0" step="1" value={o.stock??''} onChange={e=>setOption(i,{stock:e.target.value===''?null:Number(e.target.value)})}/></label><button type="button" className="secondary" onClick={()=>update({options:edit.options.filter((_,k)=>k!==i)})}>移除</button></div>)}
 <button type="button" className="secondary" onClick={()=>update({options:[...edit.options,{id:crypto.randomUUID(),label:'',price_cents:edit.price_cents,stock:null}]})}>＋ 添加空白选项</button></div>
 <label><input type="checkbox" checked={edit.active} onChange={e=>update({active:e.target.checked})}/> 上架公开销售</label>
 <div className="actions"><button className="primary" disabled={busy}>{busy?'处理中...':'保存商品'}</button><button type="button" className="secondary" onClick={()=>setEdit(null)}>取消</button></div></form>}</section>;
 function updateEditing(p:Product){setEdit({...p,options:(p.options||[]).map(o=>({...o}))});setInfo('');setError('')}
}
