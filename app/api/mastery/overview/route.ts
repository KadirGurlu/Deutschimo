import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMasteryOverview } from "@/lib/mastery/server";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(){
  const session=await auth(); const userId=(session?.user as {id?:string}|undefined)?.id;
  if(!userId)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
  return NextResponse.json(await getMasteryOverview(userId));
}
