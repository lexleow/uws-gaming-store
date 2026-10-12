import {NextRequest} from 'next/server';
import {configured,serverDb} from '@/lib/db';
export async function requireAdmin(req:NextRequest){
  const token=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token||!configured())return null;
  const db=serverDb();
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user)return null;
  const {data:admin,error:ae}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(ae||!admin)return null;
  return {db,user};
}
