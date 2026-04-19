import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, MapPin } from "lucide-react";

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "DISCOVER" },
    { href: "/labels", label: "MAP" },
    { href: "/compare/delhi-vs-gurgaon", label: "COMPARE" },
    { href: "/about", label: "ABOUT" },
  ];

  return (
    <>
      <nav className="fixed top-6 left-4 md:left-8 z-[2000] flex items-center gap-0">
        <Link href="/">
          <div className="bg-black text-white h-[34px] w-[34px] border border-black flex items-center justify-center flex-shrink-0 cursor-pointer">
            <MapPin className="w-4 h-4" />
          </div>
        </Link>

        <div className="hidden md:flex items-center">
          {navLinks.map((link, i) => (
            <Link key={link.href} href={link.href}>
              <div
                className={`relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border border-black leading-none group cursor-pointer ${i > 0 ? "border-l-0" : ""}`}
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </div>
            </Link>
          ))}
          <Link href="/labels">
            <div className="relative overflow-hidden bg-black text-white h-[34px] px-4 flex items-center text-[11px] font-medium uppercase border border-black border-l-0 leading-none group cursor-pointer">
              <span className="relative z-10">ADD LABEL</span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </div>
          </Link>
        </div>

        <button
          className="md:hidden bg-white border border-black h-[34px] w-[34px] flex items-center justify-center"
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[1999] bg-white flex flex-col pt-20 px-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div
                className="text-3xl font-bold uppercase py-4 border-b border-gray-100 cursor-pointer"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </div>
            </Link>
          ))}
          <Link href="/labels">
            <div
              className="mt-6 bg-black text-white text-center py-4 text-lg font-bold uppercase cursor-pointer"
              onClick={() => setMobileOpen(false)}
            >
              ADD LABEL
            </div>
          </Link>
        </div>
      )}
    </>
  );
}
