export type Category='game'|'software';
export type Product={id:string;name:string;category:Category;description:string;price_cents:number;image_emoji:string;badge:string;active:boolean;delivery_mode:'manual'|'automatic';stock:number|null};
export const demoProducts:Product[]=[
{id:'11111111-1111-4111-8111-111111111111',name:'Indie Adventure — Digital Edition',category:'game',description:'原创数字冒险游戏 · PC 下载版（演示商品）',price_cents:4900,image_emoji:'🎮',badge:'FEATURED',active:true,delivery_mode:'manual',stock:50},
{id:'22222222-2222-4222-8222-222222222222',name:'Pixel Racer — PC Game',category:'game',description:'赛车游戏数字版（演示商品）',price_cents:3900,image_emoji:'🏎️',badge:'POPULAR',active:true,delivery_mode:'manual',stock:50},
{id:'33333333-3333-4333-8333-333333333333',name:'UWS Productivity Toolkit',category:'software',description:'效率工具软件 · 单用户许可证（演示商品）',price_cents:7900,image_emoji:'💻',badge:'NEW',active:true,delivery_mode:'manual',stock:50},
{id:'44444444-4444-4444-8444-444444444444',name:'UWS Creative Utility',category:'software',description:'创意工具软件（演示商品）',price_cents:5900,image_emoji:'🎨',badge:'TOP PICK',active:true,delivery_mode:'manual',stock:50}];
export const money=(c:number)=>new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR'}).format(c/100);
