import { authorized, json } from './shared.js';
import { rewardsData } from './rewards.js';

export async function onRequestPost({request,env}){
  try{
    const {role,password}=await request.json();
    if(!['parent','leon','logan','monitor'].includes(role)||role!=='monitor'&&!await authorized(env,role,password))return json({error:'Please sign in again.'},401);
    return json({rewards:await rewardsData(env,role)});
  }catch{return json({error:'Could not refresh the store. Please try again.'},500);}
}
