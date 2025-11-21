"use client";

import { Home, BookOpen, Settings, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/library", label: "Library", icon: BookOpen },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation ${
                isActive
                  ? "text-blue-500"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
