"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/nuevo", label: "NUEVO" },
  { href: "/lugares", label: "LUGARES" },
  { href: "/historial", label: "HISTORIAL" },
  { href: "/resumen", label: "RESUMEN" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-4 md:gap-6 font-mono text-xs md:text-sm tracking-widest uppercase">
      {links.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`transition-colors ${
              isActive
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {isActive ? `[ ${label} ]` : label}
          </Link>
        );
      })}
      <div className="hidden md:block">
        <ThemeToggle />
      </div>
    </nav>
  );
}
