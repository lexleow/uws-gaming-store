import Store from '@/components/Store';
import {demoProducts,Product} from '@/lib/products';
import {configured,serverDb} from '@/lib/db';
export const dynamic='force-dynamic';
export default async function Page(){let products:Product[]=demoProducts;let demo=!configured();if(!demo){try{const {data,error}=await serverDb().from('products').select('id,name,category,description,price_cents,image_emoji,badge,active,delivery_mode,stock,image_url,options').eq('active',true).order('created_at',{ascending:false});if(error)throw error;products=(data??[]) as Product[]}catch{products=[]}}return <Store products={products} demo={demo}/>}
