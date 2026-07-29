import Link from "next/link";
import { Lock } from "lucide-react";

export function LockedContentState({ reason, courseId }: { reason: string; courseId: string }) {
  return <section className="locked-content-state" role="status"><Lock size={38}/><h1>Bu ünite kilitli</h1><p>{reason}</p><Link className="button button-primary" href={`/courses/${courseId}`}>Programa Dön</Link></section>;
}
