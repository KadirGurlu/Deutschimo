import { CheckCircle2, CloudOff, LoaderCircle } from "lucide-react";

export function SaveStatusIndicator({ status }: { status: "saving" | "saved" | "offline" }) {
  const content = status === "saving" ? <><LoaderCircle className="spin" size={15}/> Kaydediliyor</> : status === "offline" ? <><CloudOff size={15}/> Çevrim dışı · geçici kayıt</> : <><CheckCircle2 size={15}/> Kaydedildi</>;
  return <span className={`save-status save-${status}`}>{content}</span>;
}
