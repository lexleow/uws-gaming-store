import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {randomUUID} from 'crypto';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 const auth=await requireAdmin(req);
 if(!auth)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const data=await req.formData();
  const file=data.get('file');
  if(!(file instanceof File))return NextResponse.json({error:'请选择图片'},{status:400});
  const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
  const ext=types[file.type];
  if(!ext||file.size<1||file.size>5*1024*1024)return NextResponse.json({error:'仅支持 JPG/PNG/WebP/GIF，最大 5MB'},{status:400});
  const path=`products/${randomUUID()}.${ext}`;
  const {error}=await auth.db.storage.from('product-images').upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false,cacheControl:'3600'});
  if(error)throw error;
  const {data:publicUrl}=auth.db.storage.from('product-images').getPublicUrl(path);
  return NextResponse.json({url:publicUrl.publicUrl});
 }catch(e){console.error('Upload failed',e);return NextResponse.json({error:'图片上传失败，请确认 Storage bucket 已配置'},{status:500})}
}
