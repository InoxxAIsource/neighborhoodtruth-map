import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MapPin, ArrowRight, Search } from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { RotatingBadge } from "@/components/landing/RotatingBadge";
import { CityCarousel } from "@/components/landing/CityCarousel";
import { Helmet } from "react-helmet-async";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface LabelDTO {
  id: string;
  lat: number;
  lng: number;
  text: string;
  safety: number;
  vibe: string[] | null;
  cost: string;
  upvotes: number;
  color: string | null;
}

const VIBE_COLORS: Record<string, string> = {
  safe: "bg-green-100 text-green-800",
  walkable: "bg-blue-100 text-blue-800",
  affordable: "bg-yellow-100 text-yellow-800",
  noisy: "bg-red-100 text-red-800",
  vibrant: "bg-purple-100 text-purple-800",
  peaceful: "bg-teal-100 text-teal-800",
  expensive: "bg-orange-100 text-orange-800",
  trendy: "bg-pink-100 text-pink-800",
};

const CITY_VIBES = [
  { label: "ALL", value: "" },
  { label: "SAFE", value: "safe" },
  { label: "AFFORDABLE", value: "affordable" },
  { label: "WALKABLE", value: "walkable" },
  { label: "VIBRANT", value: "vibrant" },
  { label: "PEACEFUL", value: "peaceful" },
];

const FEATURED_CITIES = [
  { slug: "mumbai", name: "Mumbai" },
  { slug: "delhi", name: "Delhi" },
  { slug: "bangalore", name: "Bangalore" },
  { slug: "hyderabad", name: "Hyderabad" },
  { slug: "pune", name: "Pune" },
  { slug: "chennai", name: "Chennai" },
  { slug: "kolkata", name: "Kolkata" },
  { slug: "new-york", name: "New York" },
  { slug: "london", name: "London" },
];

const CITY_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number; name: string }> = {
  mumbai: { latMin: 18.7, latMax: 19.4, lngMin: 72.4, lngMax: 73.3, name: "Mumbai" },
  delhi: { latMin: 28.3, latMax: 29.1, lngMin: 76.7, lngMax: 77.5, name: "Delhi" },
  bangalore: { latMin: 12.5, latMax: 13.4, lngMin: 77.2, lngMax: 78.0, name: "Bangalore" },
  hyderabad: { latMin: 16.9, latMax: 17.8, lngMin: 78.0, lngMax: 78.9, name: "Hyderabad" },
  pune: { latMin: 18.0, latMax: 18.9, lngMin: 73.4, lngMax: 74.3, name: "Pune" },
  chennai: { latMin: 12.6, latMax: 13.5, lngMin: 79.8, lngMax: 80.8, name: "Chennai" },
  kolkata: { latMin: 22.1, latMax: 22.9, lngMin: 88.0, lngMax: 88.8, name: "Kolkata" },
  "new-york": { latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7, name: "New York" },
  london: { latMin: 51.3, latMax: 51.7, lngMin: -0.3, lngMax: 0.1, name: "London" },
};

function getCityForLabel(lat: number, lng: number): string | null {
  for (const [slug, bounds] of Object.entries(CITY_BOUNDS)) {
    if (lat >= bounds.latMin && lat <= bounds.latMax && lng >= bounds.lngMin && lng <= bounds.lngMax) {
      return slug;
    }
  }
  return null;
}

function NeighborhoodCard({ label, citySlug, cityName }: { label: LabelDTO; citySlug: string; cityName: string }) {
  const [, navigate] = useLocation();
  const areaSlug = label.text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const vibes = (label.vibe ?? []).slice(0, 3);

  return (
    <div
      className="relative cursor-pointer group border border-black"
      onClick={() => navigate(`/${citySlug}/${areaSlug}`)}
    >
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${label.color ?? "#14b8a6"}22 0%, ${label.color ?? "#14b8a6"}44 100%)`,
          }}
        >
          <MapPin className="w-10 h-10 opacity-30" style={{ color: label.color ?? "#14b8a6" }} />
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-0">
          <div className="bg-white border border-black px-2.5 h-[22px] flex items-center">
            <span className="text-[10px] font-semibold uppercase leading-none">{cityName}</span>
          </div>
          <div className="bg-white border border-black border-t-0 px-2.5 h-[22px] flex items-center">
            <span className="text-[10px] font-medium leading-none">
              {"⭐".repeat(Math.min(label.safety, 5))} {label.cost}
            </span>
          </div>
        </div>

        {label.upvotes > 0 && (
          <div className="absolute top-3 right-3 bg-black text-white px-2 py-0.5">
            <span className="text-[10px] font-medium">▲ {label.upvotes}</span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-black">
        <h3 className="text-base font-semibold leading-tight mb-2">{label.text}</h3>
        {vibes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vibes.map((v) => (
              <span
                key={v}
                className={`text-[10px] font-medium uppercase px-2 py-0.5 ${VIBE_COLORS[v.toLowerCase()] ?? "bg-gray-100 text-gray-700"}`}
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [search, setSearch] = useState("");
  const [activeVibe, setActiveVibe] = useState("");
  const [, navigate] = useLocation();

  const { data: labels = [] } = useQuery<LabelDTO[]>({
    queryKey: ["labels"],
    queryFn: () =>
      fetch(`${API}/labels`)
        .then((r) => r.json())
        .catch(() => []),
    staleTime: 60000,
  });

  const featuredLabels = useMemo(() => {
    const withCity = labels
      .map((l) => ({ ...l, citySlug: getCityForLabel(l.lat, l.lng) }))
      .filter((l) => l.citySlug !== null && l.upvotes >= 0)
      .filter((l) => {
        if (activeVibe) {
          return (l.vibe ?? []).some((v) => v.toLowerCase() === activeVibe);
        }
        return true;
      })
      .filter((l) => {
        if (search) {
          return l.text.toLowerCase().includes(search.toLowerCase());
        }
        return true;
      });

    const seen = new Set<string>();
    return withCity
      .sort((a, b) => b.upvotes - a.upvotes)
      .filter((l) => {
        const key = `${l.citySlug}-${l.text.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }, [labels, activeVibe, search]);

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Helmet>
        <title>PlaceLabels — Honest Neighborhood Reviews from Real Locals</title>
        <meta
          name="description"
          content="Crowd-sourced neighborhood labels from real locals. Discover honest reviews for areas in Mumbai, Delhi, Bangalore and cities worldwide. Find safe, affordable, walkable neighbourhoods."
        />
        <link rel="canonical" href="https://placelabels.com/" />
      </Helmet>

      <LandingNavbar />
      <RotatingBadge onClick={() => navigate("/map")} />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-28 md:pt-32 pb-8 px-5 md:px-10 max-w-[1200px] mx-auto">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-6 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          Crowd-sourced · Honest · Real locals
        </p>

        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] uppercase tracking-tight mb-6 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          What&apos;s your
          <br />
          neighbourhood
          <br />
          <span className="italic font-black text-[#FA76FF]">really</span> like?
        </h1>

        <p
          className="text-base md:text-lg text-gray-500 max-w-xl mb-8 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          Honest labels from real locals across Mumbai, Delhi, Bangalore, and cities worldwide. No sponsored content, no hidden agendas.
        </p>

        <div
          className="flex flex-wrap gap-0 animate-fade-in"
          style={{ animationDelay: "0.7s" }}
        >
          <Link href="/map">
            <div className="relative overflow-hidden bg-black text-white h-[46px] px-6 flex items-center text-[13px] font-semibold uppercase border border-black cursor-pointer group">
              <span className="relative z-10 flex items-center gap-2">
                EXPLORE MAP <ArrowRight className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </div>
          </Link>
          <Link href="/map">
            <div className="relative overflow-hidden bg-white text-black h-[46px] px-6 flex items-center text-[13px] font-semibold uppercase border border-black border-l-0 cursor-pointer group">
              <span className="relative z-10">ADD A LABEL</span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </div>
          </Link>
          <div className="h-[46px] px-4 flex items-center text-[12px] text-gray-400 border border-black border-l-0 bg-white">
            {labels.length > 0 ? `${labels.length.toLocaleString()} labels worldwide` : "Worldwide coverage"}
          </div>
        </div>
      </section>

      {/* ── City Carousel ─────────────────────────────────────────── */}
      <div className="animate-fade-in" style={{ animationDelay: "0.9s" }}>
        <CityCarousel />
      </div>

      {/* ── Neighbourhood Discovery ───────────────────────────────── */}
      <section className="px-5 md:px-10 pb-20 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-black uppercase">
            Discover Neighbourhoods
          </h2>
          <Link href="/map">
            <div className="text-[12px] font-semibold uppercase border-b border-black cursor-pointer hover:text-[#FA76FF] hover:border-[#FA76FF] transition-colors">
              VIEW ALL ON MAP →
            </div>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search neighbourhood..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[40px] pl-9 pr-4 border border-black text-sm focus:outline-none focus:border-[#FA76FF] bg-white"
            />
          </div>
          <div className="flex gap-0 flex-wrap">
            {CITY_VIBES.map((v) => (
              <button
                key={v.value}
                onClick={() => setActiveVibe(v.value)}
                className={`relative overflow-hidden h-[40px] px-4 text-[11px] font-semibold uppercase border border-black transition-colors duration-150 ${
                  activeVibe === v.value
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-gray-50"
                } [&:not(:first-child)]:border-l-0`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {featuredLabels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-black">
            {featuredLabels.map((label, i) => (
              <div
                key={label.id}
                className="bg-white animate-fade-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <NeighborhoodCard
                  label={label}
                  citySlug={label.citySlug!}
                  cityName={CITY_BOUNDS[label.citySlug!]?.name ?? label.citySlug!}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
            {search ? `No neighbourhoods found for "${search}"` : "Loading neighbourhoods..."}
          </div>
        )}
      </section>

      {/* ── Featured Comparisons ──────────────────────────────────── */}
      <section className="border-t border-black px-5 md:px-10 py-14 bg-black text-white">
        <h2 className="text-xl md:text-2xl font-black uppercase mb-6 text-[#FA76FF]">
          City Comparisons
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10">
          {[
            { slug: "delhi-vs-gurgaon", label: "Delhi vs Gurgaon" },
            { slug: "mumbai-vs-pune", label: "Mumbai vs Pune" },
            { slug: "bangalore-vs-hyderabad", label: "Bangalore vs Hyderabad" },
            { slug: "bangalore-vs-pune", label: "Bangalore vs Pune" },
            { slug: "chennai-vs-bangalore", label: "Chennai vs Bangalore" },
            { slug: "delhi-vs-mumbai", label: "Delhi vs Mumbai" },
            { slug: "hyderabad-vs-pune", label: "Hyderabad vs Pune" },
            { slug: "kolkata-vs-mumbai", label: "Kolkata vs Mumbai" },
          ].map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`}>
              <div className="bg-black px-4 py-5 cursor-pointer group border border-white/10 hover:border-[#FA76FF] transition-colors">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1 group-hover:text-[#FA76FF] transition-colors">
                  Compare
                </div>
                <div className="text-base font-bold leading-tight">{c.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="border-t border-black px-5 md:px-10 py-14 max-w-[1200px] mx-auto">
        <h2 className="text-xl md:text-2xl font-black uppercase mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black border border-black">
          {[
            {
              num: "01",
              title: "Explore the Map",
              desc: "Browse thousands of neighbourhood labels placed by real locals. Filter by safety, cost, and vibe.",
            },
            {
              num: "02",
              title: "Drop a Label",
              desc: "Click anywhere on the map to add your honest review. No signup required. Your voice matters.",
            },
            {
              num: "03",
              title: "Vote & Verify",
              desc: "Upvote accurate labels, downvote misleading ones. Community consensus surfaces the truth.",
            },
          ].map((step) => (
            <div key={step.num} className="bg-white p-8">
              <div className="text-[11px] font-semibold uppercase text-gray-400 mb-3">{step.num}</div>
              <h3 className="text-lg font-black uppercase mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-0">
          <Link href="/how-it-works">
            <div className="relative overflow-hidden bg-white text-black h-[40px] px-5 flex items-center text-[12px] font-semibold uppercase border border-black cursor-pointer group">
              <span className="relative z-10">LEARN MORE</span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </div>
          </Link>
          <Link href="/about">
            <div className="relative overflow-hidden bg-white text-black h-[40px] px-5 flex items-center text-[12px] font-semibold uppercase border border-black border-l-0 cursor-pointer group">
              <span className="relative z-10">ABOUT US</span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── SEO Footer Nav ────────────────────────────────────────── */}
      <footer className="border-t border-black px-5 md:px-10 py-8 bg-white">
        <nav aria-label="Explore Indian Cities">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-3">Explore India</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              {FEATURED_CITIES.filter((c) =>
                ["mumbai", "delhi", "bangalore", "pune", "hyderabad", "chennai", "kolkata", "jaipur"].includes(c.slug)
              ).map((city) => (
                <a
                  key={city.slug}
                  href={`/${city.slug}`}
                  className="text-[12px] text-black hover:text-[#FA76FF] font-medium transition-colors"
                >
                  {city.name}
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              <a href="/mumbai/cheap-areas-to-live" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Cheap Areas in Mumbai</a>
              <a href="/delhi/cheap-areas-to-live" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Cheap Areas in Delhi</a>
              <a href="/bangalore/it-hub-areas" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">IT Hub Areas Bangalore</a>
              <a href="/compare/delhi-vs-gurgaon" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Delhi vs Gurgaon</a>
              <a href="/compare/mumbai-vs-pune" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Mumbai vs Pune</a>
              <a href="/compare/bangalore-vs-hyderabad" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Bangalore vs Hyderabad</a>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-400">© 2025 PlaceLabels</span>
              <a href="/about" className="text-[11px] text-gray-400 hover:text-black transition-colors">About</a>
              <a href="/how-it-works" className="text-[11px] text-gray-400 hover:text-black transition-colors">How It Works</a>
              <a href="/map" className="text-[11px] text-gray-400 hover:text-black transition-colors">Open Map</a>
            </div>
          </div>
        </nav>
      </footer>
    </div>
  );
}
