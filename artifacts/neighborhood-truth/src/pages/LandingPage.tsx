import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Search } from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { RotatingBadge } from "@/components/landing/RotatingBadge";
import { CityCarousel } from "@/components/landing/CityCarousel";
import { Helmet } from "react-helmet-async";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function MapCardIllustration({ color, seed }: { color: string; seed: string }) {
  const h = hashStr(seed);
  const c = color || "#14b8a6";

  // Vary route shape based on hash
  const routes = [
    "M 20 80 L 20 50 L 60 50 L 60 30 L 100 30",
    "M 20 90 L 20 60 L 50 60 L 50 40 L 80 40 L 80 20",
    "M 30 90 L 30 55 L 70 55 L 70 25 L 110 25",
    "M 15 85 L 15 45 L 55 45 L 55 25 L 95 25",
    "M 25 90 L 25 65 L 65 65 L 65 35 L 105 35",
  ];
  const routePath = routes[h % routes.length];

  // Pin position matches route end
  const pins = [
    { x: 100, y: 24 },
    { x: 80, y: 14 },
    { x: 110, y: 19 },
    { x: 95, y: 19 },
    { x: 105, y: 29 },
  ];
  const pin = pins[h % pins.length];

  // Building block layouts — 3 variants
  const blockSets = [
    [
      { x: 25, y: 58, w: 22, h: 14 },
      { x: 65, y: 58, w: 28, h: 16 },
      { x: 25, y: 28, w: 26, h: 14 },
      { x: 70, y: 38, w: 18, h: 10 },
      { x: 95, y: 55, w: 20, h: 20 },
    ],
    [
      { x: 28, y: 68, w: 18, h: 12 },
      { x: 60, y: 68, w: 24, h: 14 },
      { x: 28, y: 32, w: 20, h: 10 },
      { x: 58, y: 48, w: 14, h: 10 },
      { x: 88, y: 48, w: 22, h: 22 },
    ],
    [
      { x: 30, y: 62, w: 20, h: 16 },
      { x: 72, y: 62, w: 26, h: 14 },
      { x: 30, y: 30, w: 22, h: 12 },
      { x: 72, y: 30, w: 20, h: 12 },
      { x: 100, y: 42, w: 18, h: 18 },
    ],
  ];
  const blocks = blockSets[h % blockSets.length];

  // Road grid offsets
  const gridOffset = (h % 3) * 4;

  return (
    <svg
      viewBox="0 0 128 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="128" height="100" fill={`${c}18`} />

      {/* Road grid */}
      {[20 + gridOffset, 52 + gridOffset, 84 + gridOffset].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#00000018" strokeWidth="6" />
      ))}
      {[25 + gridOffset, 55 + gridOffset, 80 + gridOffset].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="128" y2={y} stroke="#00000018" strokeWidth="5" />
      ))}

      {/* Road centre dashes */}
      {[20 + gridOffset, 52 + gridOffset, 84 + gridOffset].map((x) => (
        <line key={`vd${x}`} x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="1" strokeDasharray="4 5" />
      ))}
      {[25 + gridOffset, 55 + gridOffset, 80 + gridOffset].map((y) => (
        <line key={`hd${y}`} x1="0" y1={y} x2="128" y2={y} stroke="white" strokeWidth="1" strokeDasharray="4 5" />
      ))}

      {/* Building blocks */}
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="1.5"
          fill={`${c}28`} stroke={`${c}55`} strokeWidth="0.75" />
      ))}

      {/* Route — shadow */}
      <path d={routePath} fill="none" stroke="white" strokeWidth="5"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Route — coloured */}
      <path d={routePath} fill="none" stroke={c} strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray="200"
        strokeDashoffset="0" />

      {/* Route start dot */}
      <circle cx={Number(routePath.split(" ")[1])} cy={Number(routePath.split(" ")[2])}
        r="3.5" fill="white" stroke={c} strokeWidth="2" />

      {/* Destination pin */}
      <g transform={`translate(${pin.x - 8}, ${pin.y - 18})`}>
        <path d="M8 0 C3.6 0 0 3.6 0 8 C0 14 8 20 8 20 C8 20 16 14 16 8 C16 3.6 12.4 0 8 0Z"
          fill={c} />
        <circle cx="8" cy="8" r="3.5" fill="white" />
      </g>
    </svg>
  );
}

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
  const areaSlug = label.text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const vibes = (label.vibe ?? []).slice(0, 3);

  return (
    <Link href={`/${citySlug}/${areaSlug}`} className="block">
    <div
      className="relative cursor-pointer group border border-black"
    >
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        <div
          className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
        >
          <MapCardIllustration color={label.color ?? "#14b8a6"} seed={label.text + citySlug} />
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
    </Link>
  );
}

const COMPARE_CITIES = [
  { slug: "delhi", name: "Delhi" },
  { slug: "mumbai", name: "Mumbai" },
  { slug: "bangalore", name: "Bangalore" },
  { slug: "hyderabad", name: "Hyderabad" },
  { slug: "pune", name: "Pune" },
  { slug: "chennai", name: "Chennai" },
  { slug: "kolkata", name: "Kolkata" },
  { slug: "gurgaon", name: "Gurgaon" },
  { slug: "noida", name: "Noida" },
  { slug: "jaipur", name: "Jaipur" },
  { slug: "ahmedabad", name: "Ahmedabad" },
  { slug: "surat", name: "Surat" },
  { slug: "lucknow", name: "Lucknow" },
  { slug: "indore", name: "Indore" },
  { slug: "chandigarh", name: "Chandigarh" },
  { slug: "goa", name: "Goa" },
];

const POPULAR_COMPARES = [
  { slug: "delhi-vs-gurgaon", cityA: "Delhi", cityB: "Gurgaon", desc: "NCR showdown — jobs, rent & commute" },
  { slug: "mumbai-vs-pune", cityA: "Mumbai", cityB: "Pune", desc: "Finance hub vs growing IT city" },
  { slug: "bangalore-vs-hyderabad", cityA: "Bangalore", cityB: "Hyderabad", desc: "South India's top tech cities" },
  { slug: "delhi-vs-mumbai", cityA: "Delhi", cityB: "Mumbai", desc: "India's two biggest metros" },
  { slug: "bangalore-vs-pune", cityA: "Bangalore", cityB: "Pune", desc: "Best city for IT professionals" },
  { slug: "chennai-vs-bangalore", cityA: "Chennai", cityB: "Bangalore", desc: "South India living compared" },
  { slug: "hyderabad-vs-pune", cityA: "Hyderabad", cityB: "Pune", desc: "Affordable metros for young pros" },
  { slug: "kolkata-vs-mumbai", cityA: "Kolkata", cityB: "Mumbai", desc: "Old metro vs financial capital" },
  { slug: "delhi-vs-noida", cityA: "Delhi", cityB: "Noida", desc: "Capital vs NCR suburb" },
  { slug: "gurgaon-vs-noida", cityA: "Gurgaon", cityB: "Noida", desc: "NCR's two corporate hubs" },
  { slug: "jaipur-vs-delhi", cityA: "Jaipur", cityB: "Delhi", desc: "Tier-2 heritage city vs capital" },
  { slug: "ahmedabad-vs-surat", cityA: "Ahmedabad", cityB: "Surat", desc: "Gujarat's fastest-growing cities" },
];

function CompareSection() {
  const [cityA, setCityA] = useState("");
  const [cityB, setCityB] = useState("");
  const [, navigate] = useLocation();

  const canCompare = !!(cityA && cityB && cityA !== cityB);

  const handleCompare = () => {
    if (canCompare) navigate(`/compare/${cityA}-vs-${cityB}`);
  };

  return (
    <section className="border-t border-black px-5 md:px-10 py-14 bg-black text-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#FA76FF] mb-2">Compare Tool</p>
          <h2 className="text-xl md:text-3xl font-black uppercase leading-tight mb-3">
            Compare Any Two Cities
          </h2>
          <p className="text-sm text-gray-400 max-w-xl">
            Pick any two cities and get a detailed side-by-side breakdown — rent, safety, commute,
            vibe, and neighbourhood data from real locals.
          </p>
        </div>

        {/* ── Search UI ─────────────────────────────────────────── */}
        <div className="border border-white/20 bg-white/5 p-6 mb-10">
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">City A</label>
              <select
                value={cityA}
                onChange={(e) => setCityA(e.target.value)}
                className="w-full bg-black border border-white/30 text-white px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#FA76FF] transition-colors cursor-pointer appearance-none"
              >
                <option value="">Choose a city…</option>
                {COMPARE_CITIES.map((c) => (
                  <option key={c.slug} value={c.slug} disabled={c.slug === cityB}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex sm:flex-col items-center justify-center gap-0 pt-0 sm:pt-5 flex-shrink-0">
              <span className="text-2xl font-black text-[#FA76FF]">VS</span>
            </div>

            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">City B</label>
              <select
                value={cityB}
                onChange={(e) => setCityB(e.target.value)}
                className="w-full bg-black border border-white/30 text-white px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#FA76FF] transition-colors cursor-pointer appearance-none"
              >
                <option value="">Choose a city…</option>
                {COMPARE_CITIES.map((c) => (
                  <option key={c.slug} value={c.slug} disabled={c.slug === cityA}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex sm:flex-col items-end justify-end sm:pt-5 flex-shrink-0">
              <button
                onClick={handleCompare}
                disabled={!canCompare}
                className={`w-full sm:w-auto px-8 py-3 font-black uppercase text-sm transition-colors ${
                  canCompare
                    ? "bg-[#FA76FF] text-black hover:bg-white cursor-pointer"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                Compare →
              </button>
            </div>
          </div>

          {cityA && cityB && cityA === cityB && (
            <p className="text-[11px] text-red-400 mt-3 uppercase tracking-wide">
              Please select two different cities.
            </p>
          )}

          {!cityA && !cityB && (
            <p className="text-[11px] text-gray-500 mt-3 uppercase tracking-wide">
              16 Indian cities available to compare
            </p>
          )}
        </div>

        {/* ── Popular comparisons ───────────────────────────────── */}
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          Popular Comparisons
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
          {POPULAR_COMPARES.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`}>
              <div className="bg-black px-5 py-4 cursor-pointer group border border-transparent hover:border-[#FA76FF] transition-all h-full">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base font-black leading-tight">{c.cityA}</span>
                  <span className="text-[#FA76FF] text-[10px] font-black bg-[#FA76FF]/10 px-1.5 py-0.5 rounded">VS</span>
                  <span className="text-base font-black leading-tight">{c.cityB}</span>
                </div>
                <p className="text-[12px] text-gray-400 group-hover:text-gray-200 transition-colors leading-snug">
                  {c.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
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
      .filter((l) => l.citySlug !== null && l.upvotes >= 0 && l.text && l.text.trim().length > 0)
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
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is PlaceLabels?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "PlaceLabels is a crowd-sourced global neighborhood map where locals drop honest labels about areas — covering safety, cost of living, vibe, and more. Anyone can vote on existing insights or add their own."
              }
            },
            {
              "@type": "Question",
              "name": "How do I add a neighborhood label?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Click the 'Drop Label' button, then tap anywhere on the map to place your pin. Fill in the neighborhood name, safety rating (1–5), cost level, and vibe tags, then submit. Your label appears instantly on the map for others to vote on."
              }
            },
            {
              "@type": "Question",
              "name": "How is neighborhood safety rated?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Safety is rated on a 1–5 scale by local contributors: 1 is unsafe, 5 is very safe. Each label's safety score is set by the person who drops it, and other community members can upvote or downvote to validate the insight."
              }
            },
            {
              "@type": "Question",
              "name": "Is PlaceLabels free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, PlaceLabels is completely free. You can browse the map, read neighborhood insights, vote on labels, and add your own labels without creating an account."
              }
            },
            {
              "@type": "Question",
              "name": "Which cities are covered?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "PlaceLabels has community-contributed labels for neighborhoods in major cities worldwide including New York, London, Paris, Tokyo, Dubai, Singapore, Sydney, Berlin, Barcelona, Bangkok, Seoul, Mumbai, Cairo, and many more. New labels can be added anywhere in the world."
              }
            }
          ]
        })}</script>
      </Helmet>

      <LandingNavbar />
      <RotatingBadge onClick={() => navigate("/labels")} />

      <main>

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
          <Link href="/labels">
            <div className="relative overflow-hidden bg-black text-white h-[46px] px-6 flex items-center text-[13px] font-semibold uppercase border border-black cursor-pointer group">
              <span className="relative z-10 flex items-center gap-2">
                EXPLORE MAP <ArrowRight className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </div>
          </Link>
          <Link href="/labels">
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
          <Link href="/labels">
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
              aria-label="Search neighbourhoods"
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

      {/* ── City Compare Tool ──────────────────────────────────────── */}
      <CompareSection />

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

      {/* ── What is PlaceLabels? — SEO content section ───────────── */}
      <section className="border-t border-black px-5 md:px-10 py-14 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase mb-5">What is PlaceLabels?</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              PlaceLabels is a crowd-sourced neighborhood review platform built on a simple idea: real locals know their areas better than any algorithm. Anyone can drop a label on the map — rating safety, cost of living, walkability, and local vibe — without creating an account or being paid to promote anything.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Unlike real-estate portals that hide uncomfortable truths, PlaceLabels surfaces raw, unfiltered local knowledge. Every label is community-verified through upvotes and downvotes, so the most accurate insights rise to the top. Browse by city, filter by what matters to you, and discover neighborhoods that match your lifestyle — not just your budget.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We cover hundreds of cities worldwide with a strong focus on India: Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Kolkata, and beyond. Whether you're relocating, traveling, or just curious about a new area, PlaceLabels gives you honest ground truth from people who actually live there.
            </p>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase mb-5">Popular Cities</h2>
            <ul className="grid grid-cols-2 gap-2">
              {[
                { href: "/mumbai", label: "Mumbai" },
                { href: "/delhi", label: "Delhi" },
                { href: "/bangalore", label: "Bangalore" },
                { href: "/pune", label: "Pune" },
                { href: "/hyderabad", label: "Hyderabad" },
                { href: "/chennai", label: "Chennai" },
                { href: "/kolkata", label: "Kolkata" },
                { href: "/jaipur", label: "Jaipur" },
                { href: "/gurgaon", label: "Gurgaon" },
                { href: "/noida", label: "Noida" },
                { href: "/ahmedabad", label: "Ahmedabad" },
                { href: "/london", label: "London" },
                { href: "/new-york", label: "New York" },
                { href: "/tokyo", label: "Tokyo" },
              ].map((city) => (
                <li key={city.href}>
                  <Link href={city.href} className="text-sm font-medium text-gray-800 hover:text-[#FA76FF] transition-colors">
                    → {city.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Explore by Topic — Long-tail SEO hub ─────────────────── */}
      <section className="border-t border-black px-5 md:px-10 py-14 bg-gray-50">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-xl md:text-2xl font-black uppercase mb-2">Explore by Topic</h2>
          <p className="text-sm text-gray-500 mb-10">All neighbourhood guides, curated by city, intent, and lifestyle.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Safe Neighbourhoods */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">🛡️ Safe Neighbourhoods</h3>
              <ul className="space-y-1.5">
                {[
                  { href: "/mumbai/safe-neighborhoods", label: "Safe areas in Mumbai" },
                  { href: "/delhi/safe-neighborhoods", label: "Safe areas in Delhi" },
                  { href: "/bangalore/safe-neighborhoods", label: "Safe areas in Bangalore" },
                  { href: "/pune/safe-neighborhoods", label: "Safe areas in Pune" },
                  { href: "/hyderabad/safe-neighborhoods", label: "Safe areas in Hyderabad" },
                  { href: "/chennai/safe-neighborhoods", label: "Safe areas in Chennai" },
                  { href: "/kolkata/safe-neighborhoods", label: "Safe areas in Kolkata" },
                  { href: "/mumbai/safe-areas-for-women", label: "Safe areas for women in Mumbai" },
                ].map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-gray-700 hover:text-black hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Cheap & Affordable */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">💰 Cheap & Affordable Areas</h3>
              <ul className="space-y-1.5">
                {[
                  { href: "/mumbai/cheap-areas-to-live", label: "Cheapest areas to live in Mumbai" },
                  { href: "/delhi/cheap-areas-to-live", label: "Cheapest areas to live in Delhi" },
                  { href: "/bangalore/cheap-areas-to-live", label: "Cheapest areas to live in Bangalore" },
                  { href: "/pune/cheap-areas-to-live", label: "Cheapest areas to live in Pune" },
                  { href: "/hyderabad/cheap-areas-to-live", label: "Cheapest areas to live in Hyderabad" },
                  { href: "/mumbai/affordable-areas", label: "Affordable areas in Mumbai" },
                  { href: "/delhi/affordable-areas", label: "Affordable areas in Delhi" },
                  { href: "/bangalore/affordable-areas", label: "Affordable areas in Bangalore" },
                ].map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-gray-700 hover:text-black hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Family & Students */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">👨‍👩‍👧 Family & Student Areas</h3>
              <ul className="space-y-1.5">
                {[
                  { href: "/delhi/family-friendly-areas", label: "Family-friendly areas in Delhi" },
                  { href: "/mumbai/family-friendly", label: "Family-friendly areas in Mumbai" },
                  { href: "/bangalore/family-friendly", label: "Family-friendly areas in Bangalore" },
                  { href: "/pune/student-friendly-areas", label: "Student-friendly areas in Pune" },
                  { href: "/mumbai/best-areas-for-students", label: "Best areas for students in Mumbai" },
                  { href: "/delhi/best-areas-for-students", label: "Best areas for students in Delhi" },
                  { href: "/bangalore/best-areas-for-students", label: "Best areas for students in Bangalore" },
                  { href: "/hyderabad/family-friendly", label: "Family-friendly areas in Hyderabad" },
                ].map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-gray-700 hover:text-black hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* IT & Professionals */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">💼 IT Hubs & Professionals</h3>
              <ul className="space-y-1.5">
                {[
                  { href: "/bangalore/it-hub-areas", label: "IT hub areas in Bangalore" },
                  { href: "/bangalore/best-areas-for-young-professionals", label: "Best areas for professionals in Bangalore" },
                  { href: "/hyderabad/best-areas-for-young-professionals", label: "Best areas for professionals in Hyderabad" },
                  { href: "/pune/best-areas-for-young-professionals", label: "Best areas for professionals in Pune" },
                  { href: "/delhi/best-areas-for-young-professionals", label: "Best areas for professionals in Delhi" },
                  { href: "/mumbai/best-areas-for-young-professionals", label: "Best areas for professionals in Mumbai" },
                  { href: "/chennai/best-areas-for-young-professionals", label: "Best areas for professionals in Chennai" },
                  { href: "/gurgaon/best-areas-for-young-professionals", label: "Best areas for professionals in Gurgaon" },
                ].map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-gray-700 hover:text-black hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Nightlife & Quiet */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">🎉 Nightlife & Quiet Areas</h3>
              <ul className="space-y-1.5">
                {[
                  { href: "/mumbai/nightlife-areas", label: "Best nightlife areas in Mumbai" },
                  { href: "/delhi/nightlife-areas", label: "Best nightlife areas in Delhi" },
                  { href: "/bangalore/nightlife-areas", label: "Best nightlife areas in Bangalore" },
                  { href: "/pune/nightlife-areas", label: "Best nightlife areas in Pune" },
                  { href: "/mumbai/quiet-neighborhoods", label: "Quiet neighbourhoods in Mumbai" },
                  { href: "/delhi/quiet-neighborhoods", label: "Quiet neighbourhoods in Delhi" },
                  { href: "/bangalore/quiet-neighborhoods", label: "Quiet neighbourhoods in Bangalore" },
                  { href: "/goa/nightlife-areas", label: "Best nightlife areas in Goa" },
                ].map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-gray-700 hover:text-black hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* City Comparisons */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-2 mb-3">⚖️ City Comparisons</h3>
              <ul className="space-y-1.5">
                {[
                  { href: "/compare/delhi-vs-gurgaon", label: "Delhi vs Gurgaon: which to live in?" },
                  { href: "/compare/mumbai-vs-pune", label: "Mumbai vs Pune: cost & lifestyle" },
                  { href: "/compare/bangalore-vs-hyderabad", label: "Bangalore vs Hyderabad: IT city showdown" },
                  { href: "/compare/delhi-vs-mumbai", label: "Delhi vs Mumbai: India's two biggest cities" },
                  { href: "/compare/bangalore-vs-pune", label: "Bangalore vs Pune: best for IT jobs?" },
                  { href: "/compare/chennai-vs-bangalore", label: "Chennai vs Bangalore: South India living" },
                  { href: "/compare/hyderabad-vs-pune", label: "Hyderabad vs Pune: affordability guide" },
                  { href: "/compare/kolkata-vs-mumbai", label: "Kolkata vs Mumbai: old vs new metro" },
                  { href: "/compare/delhi-vs-noida", label: "Delhi vs Noida: which is better?" },
                  { href: "/compare/gurgaon-vs-noida", label: "Gurgaon vs Noida: NCR comparison" },
                  { href: "/compare/chennai-vs-hyderabad", label: "Chennai vs Hyderabad: South IT hubs" },
                  { href: "/compare/jaipur-vs-delhi", label: "Jaipur vs Delhi: tier-2 vs capital" },
                  { href: "/compare/ahmedabad-vs-surat", label: "Ahmedabad vs Surat: Gujarat cities" },
                ].map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm text-gray-700 hover:text-black hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      </main>

      {/* ── SEO Footer Nav ────────────────────────────────────────── */}
      <footer className="border-t border-black px-5 md:px-10 py-8 bg-white">
        <nav aria-label="Explore Indian Cities">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-3">Explore India</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              {FEATURED_CITIES.filter((c) =>
                ["mumbai", "delhi", "bangalore", "pune", "hyderabad", "chennai", "kolkata", "jaipur"].includes(c.slug)
              ).map((city) => (
                <Link
                  key={city.slug}
                  href={`/${city.slug}`}
                  className="text-[12px] text-black hover:text-[#FA76FF] font-medium transition-colors"
                >
                  {city.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              <Link href="/mumbai/cheap-areas-to-live" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Cheap Areas in Mumbai</Link>
              <Link href="/delhi/cheap-areas-to-live" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Cheap Areas in Delhi</Link>
              <Link href="/bangalore/it-hub-areas" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">IT Hub Areas Bangalore</Link>
              <Link href="/compare/delhi-vs-gurgaon" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Delhi vs Gurgaon</Link>
              <Link href="/compare/mumbai-vs-pune" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Mumbai vs Pune</Link>
              <Link href="/compare/bangalore-vs-hyderabad" className="text-[12px] text-gray-500 hover:text-[#FA76FF] transition-colors">Bangalore vs Hyderabad</Link>
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-400">© 2025 PlaceLabels</span>
              <Link href="/about" className="text-[11px] text-gray-400 hover:text-black transition-colors">About</Link>
              <Link href="/how-it-works" className="text-[11px] text-gray-400 hover:text-black transition-colors">How It Works</Link>
              <Link href="/labels" className="text-[11px] text-gray-400 hover:text-black transition-colors">Open Map</Link>
            </div>
          </div>
        </nav>
      </footer>
    </div>
  );
}
