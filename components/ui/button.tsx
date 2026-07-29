import Link from "next/link";

export function Button({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  return <Link className={`button button-${variant} ${className}`} href={href}>{children}</Link>;
}
