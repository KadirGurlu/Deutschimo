import { AppSidebar } from "@/components/layout/app-sidebar";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";

export default async function ProfilePage(){
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id:true,firstName:true,lastName:true,email:true,image:true,currentLevel:true,targetLevel:true,dailyGoalMinutes:true } });
  if (!user) return null;
  return <div className="dashboard-shell"><AppSidebar active="profile"/><section className="dashboard-main"><div><span className="eyebrow">PROFİL VE AYARLAR</span><h1 className="section-title">Hesabın</h1><p className="section-copy">Öğrenme hedeflerini ve hesap bilgilerini yönet. Değişiklikler bütün cihazlarında geçerlidir.</p></div><ProfileForm initialUser={user}/></section></div>;
}
