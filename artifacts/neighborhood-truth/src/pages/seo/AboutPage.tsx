import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SEOLayout } from "./SEOLayout";
import { MapPin, Users, Shield, Star, Globe, ChevronRight } from "lucide-react";

const CANONICAL = "https://placelabels.com/about";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "PlaceLabels", item: "https://placelabels.com" },
    { "@type": "ListItem", position: 2, name: "About", item: CANONICAL },
  ],
};

export default function AboutPage() {
  return (
    <SEOLayout breadcrumbs={[{ label: "About" }]}>
      <Helmet>
        <title>About PlaceLabels — Honest Neighborhood Reviews from Locals</title>
        <meta name="description" content="PlaceLabels is a crowd-sourced neighborhood map where real locals label areas by safety, cost, and vibe. No ads. No agents. Just honest local insights." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={CANONICAL} />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <meta property="og:title" content="About PlaceLabels — Honest Neighborhood Reviews from Locals" />
        <meta property="og:description" content="PlaceLabels is a crowd-sourced neighborhood map where real locals label areas by safety, cost, and vibe. No ads. No agents. Just honest local insights." />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://placelabels.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About PlaceLabels" />
        <meta name="twitter:description" content="Crowd-sourced neighborhood reviews from real locals. No ads, no agents." />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">About PlaceLabels</h1>
      <p className="text-lg text-gray-600 mb-10 max-w-2xl">
        PlaceLabels is a crowd-sourced global neighborhood map where real locals drop honest labels about the areas they live in — covering safety, cost of living, vibe, and more.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {[
          { icon: <Users className="h-6 w-6 text-teal-600" />, title: "Built by the community", desc: "Every label on PlaceLabels is contributed by real residents, visitors, and local experts — not marketing teams or advertisers." },
          { icon: <Shield className="h-6 w-6 text-teal-600" />, title: "Honest, unfiltered insights", desc: "We show both positive and negative neighborhood labels. Safety concerns, infrastructure issues, and honest cost data — all surfaced transparently." },
          { icon: <Star className="h-6 w-6 text-teal-600" />, title: "Community voting", desc: "The community votes on every label. Labels with the most upvotes rise to the top, ensuring the most accurate insights are visible." },
          { icon: <Globe className="h-6 w-6 text-teal-600" />, title: "Global coverage", desc: "PlaceLabels covers cities across India, North America, Europe, the Middle East, and Southeast Asia — and is growing every day." },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="mb-3">{item.icon}</div>
            <h2 className="font-bold text-gray-900 mb-2">{item.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Why We Built PlaceLabels</h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        Finding a place to live is one of the most important decisions you'll make — but most information available online comes from real estate listings (biased toward making you buy or rent) or outdated blog posts. There was no reliable, real-time, community-driven source of truth about what it actually feels like to live in a neighborhood.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        PlaceLabels was built to fill that gap. We believe the best information about any neighborhood comes from the people who live there. A long-time Bandra resident knows things about the area that no listing agent will ever tell you. A Koramangala IT professional can tell you exactly which streets to avoid and which cafés are genuinely good.
      </p>
      <p className="text-gray-600 leading-relaxed mb-10">
        Our mission is simple: give anyone moving to or within a city access to the kind of ground-level knowledge that usually only comes from knowing the right people. No ads, no sponsored listings, no agents — just honest local labels.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">How PlaceLabels Works</h2>
      <div className="space-y-4 mb-10">
        {[
          { step: "1", title: "Locals drop labels on the map", desc: "Any registered user can pin a label to any location on the map. Labels describe the area's safety level (1–5), cost category, vibe tags (Family, Nightlife, Quiet, etc.), and a short text description." },
          { step: "2", title: "The community votes", desc: "Other users vote labels up or down based on accuracy. Labels with more upvotes rank higher in search results and city pages. This self-correcting system keeps data accurate over time." },
          { step: "3", title: "You discover your ideal area", desc: "Filter labels by safety, cost, vibe, or category. Explore city pages to find the best neighborhoods for your specific needs — whether you're looking for the safest areas, most affordable spots, or the best areas for young professionals." },
        ].map((item) => (
          <div key={item.step} className="flex gap-4 bg-white rounded-xl border border-gray-200 p-5">
            <span className="text-3xl font-black text-teal-600 w-10 flex-shrink-0">{item.step}</span>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Who PlaceLabels Is For</h2>
      <ul className="space-y-2 mb-10 text-gray-600">
        {[
          "People relocating to a new city who want unbiased neighborhood intelligence",
          "IT professionals in Bangalore, Hyderabad, Pune, or Delhi looking for the best area near their office",
          "Students choosing between PG options in different neighborhoods",
          "Families comparing areas for safety, schools, and daily convenience",
          "Expats and international visitors who want to understand a city from a local's perspective",
          "Anyone tired of real-estate-industry-driven neighborhood rankings",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white mb-8">
        <h2 className="text-xl font-bold mb-2">Know your neighborhood? Help others find a great place to live.</h2>
        <p className="text-teal-100 mb-4 text-sm">Drop a label on the map and contribute your local knowledge. It takes 30 seconds and helps hundreds of people make better decisions about where to live.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors text-sm">
          <MapPin className="h-4 w-4" />
          Open the Map →
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Explore India's Cities</h2>
        <div className="flex flex-wrap gap-2">
          {["mumbai", "delhi", "bangalore", "pune", "hyderabad", "chennai", "kolkata", "jaipur"].map((city) => (
            <Link key={city} href={`/${city}`} className="px-3 py-1.5 bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-700 rounded-full text-sm capitalize transition-colors">
              {city.charAt(0).toUpperCase() + city.slice(1)}
            </Link>
          ))}
        </div>
      </div>
    </SEOLayout>
  );
}
