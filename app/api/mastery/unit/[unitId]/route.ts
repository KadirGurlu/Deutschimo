import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUnitMastery } from "@/lib/mastery/server";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{unitId:string}>}){
  const session=await auth(); const userId=(session?.user as {id?:string}|undefined)?.id;
  if(!userId)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
  const {unitId}=await params; return NextResponse.json(await getUnitMastery(userId,unitId));
}
