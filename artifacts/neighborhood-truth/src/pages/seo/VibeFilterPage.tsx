import type { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SEOLayout } from "./SEOLayout";
import { MapPin, ChevronRight, Briefcase, GraduationCap, Heart, Shield } from "lucide-react";

interface AreaItem {
  name: string;
  note: string;
  rent?: string;
  tags?: string[];
}

interface Section {
  heading: string;
  content: string;
  areas?: AreaItem[];
}

interface VibePageData {
  title: string;
  h1: string;
  description: string;
  cityName: string;
  citySlug: string;
  icon: ReactNode;
  intro: string;
  sections: Section[];
  faqs: Array<{ q: string; a: string }>;
  relatedLinks: Array<{ href: string; label: string }>;
}

const DATA: Record<string, VibePageData> = {
  "bangalore/it-hub-areas": {
    title: "Best IT Hub Areas in Bangalore (2026) | PlaceLabels",
    h1: "Top IT Hub Neighborhoods in Bangalore — Rated by Tech Workers",
    description: "Best areas in Bangalore near IT parks. Locals rate Koramangala, HSR Layout, Whitefield, Electronic City & Outer Ring Road for proximity, rent & lifestyle.",
    cityName: "Bangalore",
    citySlug: "bangalore",
    icon: <Briefcase className="h-6 w-6 text-blue-600" />,
    intro: "Bangalore is India's IT capital, home to hundreds of tech companies across multiple tech corridors. Whether you work at Infosys in Electronic City, at a startup in Koramangala, or at a multinational in Manyata Tech Park, finding the right neighborhood near your office can save you hours of commute time and thousands in monthly transport costs.",
    sections: [
      {
        heading: "Neighborhoods Near Electronic City (Phase 1 & 2)",
        content: "Electronic City houses some of India's largest tech campuses — Infosys, Wipro, HCL, and TCS all have major operations here. The best residential areas nearby include Neeladri Nagar, Electronic City Phase 2, Bommanahalli, and Harlur Road. Rents range from ₹10,000–₹22,000 for a 1BHK. The elevated expressway (NICE Road) significantly cuts commute time.",
        areas: [
          { name: "Electronic City Phase 2", rent: "₹8,000–₹14,000", note: "Closest to Infosys and HCL campuses. Dedicated township feel with schools, supermarkets, and eateries inside." },
          { name: "Harlur Road", rent: "₹12,000–₹20,000", note: "Off Sarjapur Road, popular with Wipro employees. Good mix of apartments and villas. Better infrastructure than EC Phase 2." },
          { name: "Bommanahalli", rent: "₹9,500–₹16,000", note: "On the Outer Ring Road, equidistant from Electronic City and EPIP Zone. Good value-for-money with solid connectivity." },
        ],
      },
      {
        heading: "Neighborhoods Near Outer Ring Road (Marathahalli, Bellandur, Sarjapur)",
        content: "The Outer Ring Road (ORR) corridor from Silk Board to Marathahalli is Bangalore's densest IT cluster. Companies like Cisco, SAP, Oracle, Accenture, and dozens of startups are based here. Best nearby residential areas include Bellandur, HSR Layout, and Haralur. Expect to pay a premium for proximity — 1BHK rents start at ₹15,000.",
        areas: [
          { name: "HSR Layout", rent: "₹16,000–₹30,000", note: "Startup hub with great cafes, coworking spaces, and walkability. Popular with young professionals and entrepreneurs. Sector 2 is especially livable." },
          { name: "Bellandur", rent: "₹14,000–₹25,000", note: "Directly on ORR, close to Salarpuria Tech Parks and Cessna Business Park. Dense but very convenient for ORR corridor offices." },
          { name: "Marathahalli", rent: "₹13,000–₹22,000", note: "Good IT access, lots of restaurants and shops. Traffic is the main concern — weekday commutes within Marathahalli can be slow." },
        ],
      },
      {
        heading: "Neighborhoods Near Whitefield",
        content: "Whitefield is a major IT destination with ITPL, Prestige Tech Park, RMZ Infinity, and SAP Labs. Residential options include Whitefield itself, Kadugodi, Varthur, and Brookefield. Whitefield rents are high but surrounding areas offer good value. The Purple metro line now connects Whitefield to Central Bangalore.",
        areas: [
          { name: "Whitefield Main", rent: "₹18,000–₹35,000", note: "Most expensive option but saves significant commute time. Good social infrastructure — restaurants, malls, schools, and international community." },
          { name: "Varthur", rent: "₹10,000–₹16,000", note: "Budget alternative to Whitefield. Improving infrastructure but still developing. Good for those who can work from home occasionally." },
          { name: "Kadugodi", rent: "₹11,000–₹18,000", note: "On the Purple metro line, connecting to Whitefield IT hubs. More affordable than Whitefield proper with metro access now." },
        ],
      },
      {
        heading: "Neighborhoods Near Manyata Tech Park (Hebbal, Thanisandra)",
        content: "Manyata Tech Park in North Bangalore houses Biocon, Shell, Cognizant, Mphasis, and many other companies. The best residential options nearby are Thanisandra, Hebbal, Sahakara Nagar, and RT Nagar. Northern Bangalore is generally less congested than the south.",
        areas: [
          { name: "Thanisandra", rent: "₹9,000–₹15,000", note: "Affordable and close to Manyata. Rapidly developing with new apartment complexes. Metro connectivity being extended to this area." },
          { name: "Hebbal", rent: "₹14,000–₹25,000", note: "Close to Manyata and the airport. Better infrastructure than Thanisandra but more expensive. Good connectivity via Outer Ring Road." },
          { name: "Sahakara Nagar", rent: "₹12,000–₹20,000", note: "Quiet, established neighborhood with good schools and parks. 15–20 minutes from Manyata. Popular with families in the IT sector." },
        ],
      },
      {
        heading: "IT Hub Areas by Budget",
        content: "Under ₹15,000/month: Electronic City Phase 2, Thanisandra, Bommanahalli, Begur Road. Under ₹25,000/month: HSR Layout, Bellandur, Whitefield adjacent areas, Hebbal. Premium (₹25,000+): Koramangala, Indiranagar, Whitefield main, JP Nagar 7th phase. The ORR corridor offers the best rent-to-commute ratio for most IT workers.",
      },
    ],
    faqs: [
      { q: "Which area in Bangalore is best for IT professionals?", a: "It depends on where you work. For Electronic City — EC Phase 2 or Bommanahalli. For ORR corridor — HSR Layout or Bellandur. For Whitefield — Kadugodi (metro access) or Brookefield. For Manyata — Thanisandra or Hebbal." },
      { q: "Is it cheaper to live near Electronic City or near Koramangala in Bangalore?", a: "Electronic City is significantly cheaper. 1BHK near EC Phase 2 costs ₹8,000–₹14,000 vs ₹18,000–₹35,000 in Koramangala. The trade-off is commute time to central Bangalore and social infrastructure quality." },
    ],
    relatedLinks: [
      { href: "/bangalore", label: "Bangalore Neighborhoods Overview" },
      { href: "/bangalore/cheap-areas-to-live", label: "Cheapest Areas in Bangalore" },
      { href: "/compare/bangalore-vs-hyderabad", label: "Bangalore vs Hyderabad for IT" },
    ],
  },

  "pune/student-friendly-areas": {
    title: "Best Student-Friendly Areas in Pune (2026) | PlaceLabels",
    h1: "Top Student Areas in Pune — Budget, Safe & Well-Connected",
    description: "Best areas in Pune for students. Locals rate Kothrud, Shivajinagar, Deccan, Pimpri & Wakad for PG costs, safety, college proximity & lifestyle. 2026 guide.",
    cityName: "Pune",
    citySlug: "pune",
    icon: <GraduationCap className="h-6 w-6 text-purple-600" />,
    intro: "Pune is one of India's top student cities, with over 500 colleges and universities attracting students from across the country. Finding the right area to live as a student means balancing affordability, safety, proximity to your college, and access to the social infrastructure that makes student life enjoyable.",
    sections: [
      {
        heading: "Areas Near Pune University",
        content: "Pune University (Savitribai Phule Pune University) on Ganeshkhind Road is surrounded by popular student neighborhoods. Aundh, Baner, and Pashan are the closest and most popular, but also pricier. More affordable options include Bavdhan and the areas along Karve Road.",
        areas: [
          { name: "Shivajinagar", rent: "₹7,000–₹12,000 (PG)", note: "Very close to Pune University. Excellent bus connectivity, affordable street food, and a large student population. Busy but lively." },
          { name: "Deccan Gymkhana", rent: "₹8,000–₹13,000 (PG)", note: "Prime student area with FC Road's cafes, bookshops, and restaurants. Slightly more expensive but worth it for the atmosphere." },
          { name: "Karve Nagar", rent: "₹7,000–₹11,000 (PG)", note: "Quieter alternative to Deccan. Good PG options, close to several engineering and arts colleges. Lower traffic than Shivajinagar." },
        ],
      },
      {
        heading: "Areas Near SB Road & FC Road (Student Culture Hub)",
        content: "FC Road (Fergusson College Road) and SB Road (Senapati Bapat Road) form the heart of Pune's student culture. Dozens of budget cafes, libraries, bookstores, and coaching institutes line these roads. The adjacent neighborhoods of Deccan, Shivajinagar, Erandwane, and Kothrud are among Pune's most popular for student accommodation.",
        areas: [
          { name: "Kothrud", rent: "₹6,500–₹11,000 (PG)", note: "Large student population, excellent infrastructure, and proximity to engineering and management colleges. One of Pune's safest areas. Multiple PG options available." },
          { name: "Erandwane", rent: "₹8,000–₹14,000 (PG)", note: "Close to Law College Road and FC Road. Good quality PGs with meals. Slightly upmarket feel with better safety ratings than more crowded areas." },
          { name: "Paud Road", rent: "₹6,000–₹10,000 (PG)", note: "More affordable than FC Road area. Popular with budget-conscious students. Close to Kothrud and multiple bus routes to Pune University." },
        ],
      },
      {
        heading: "Budget PG-Friendly Zones (₹5,000–₹10,000/month)",
        content: "For students on tight budgets, the most affordable PG areas in Pune include Chinchwad, Pimpri, Bhosari, and parts of Hadapsar. These areas are farther from the main university clusters but significantly cheaper. Many students in these areas use two-wheelers to commute. PMPML bus routes connect most of these areas to the main campus zones.",
        areas: [
          { name: "Pimpri-Chinchwad", rent: "₹5,000–₹9,000 (PG)", note: "PCMC area has many engineering colleges and affordable accommodation. Well-connected to Pune city by bus and upcoming metro." },
          { name: "Hadapsar", rent: "₹6,000–₹10,000 (PG)", note: "Close to several colleges and Magarpatta City area. Affordable PGs with meals. Good for students with part-time jobs in the IT sector." },
          { name: "Dhankawadi", rent: "₹5,500–₹9,500 (PG)", note: "South Pune location near Bharati Vidyapeeth and other institutions. Less congested, more affordable, but further from Pune University." },
        ],
      },
      {
        heading: "Safe Areas for Female Students in Pune",
        content: "Pune is generally considered one of India's safer cities for female students. Areas specifically well-rated by female students include Kothrud, Erandwane, Shivajinagar, Baner, and Aundh. These areas have better street lighting, more women-friendly PGs, and active local communities. PlaceLabels users consistently rate these areas highly for women's safety.",
      },
      {
        heading: "Areas with Best Cafes, Libraries & Co-working Spaces",
        content: "Koregaon Park and Kalyani Nagar have the best cafe culture in Pune, though rents are higher. FC Road and SB Road near Deccan are more budget-friendly with a genuine student cafe culture. For co-working spaces, Baner, Wakad, and Viman Nagar have good options starting from ₹3,000/month for hot desks. The Pune Municipal Library and Jaykar Library near Pune University are popular free study spots.",
      },
    ],
    faqs: [
      { q: "Which is the best area for students in Pune?", a: "Kothrud, Deccan, and Shivajinagar are the top areas for students in Pune — close to Pune University, affordable PG options, great student atmosphere, and safe surroundings. Kothrud is especially popular for its safety and connectivity." },
      { q: "What is the average PG rent in Pune for students?", a: "PG rents in Pune range from ₹5,000–₹14,000/month depending on location and facilities. Kothrud and Shivajinagar average ₹7,000–₹12,000 with meals. More distant areas like Pimpri offer ₹5,000–₹8,000 options." },
    ],
    relatedLinks: [
      { href: "/pune", label: "Pune Neighborhoods Overview" },
      { href: "/pune/cheap-areas-to-live", label: "Cheapest Areas in Pune" },
      { href: "/compare/mumbai-vs-pune", label: "Mumbai vs Pune: Which is Better?" },
    ],
  },

  "delhi/family-friendly-areas": {
    title: "Best Family-Friendly Areas in Delhi (2026) | PlaceLabels",
    h1: "Top Family Neighborhoods in Delhi — Safe, Green & Well-Connected",
    description: "Best areas in Delhi for families. Locals rate Dwarka, Rohini, Vasant Kunj, Saket & Greater Kailash for safety, schools, parks & daily living. Real 2026 data.",
    cityName: "Delhi",
    citySlug: "delhi",
    icon: <Heart className="h-6 w-6 text-red-500" />,
    intro: "Delhi is a city of contrasts — some areas are bustling, congested, and challenging for family life, while others offer quiet residential streets, excellent schools, green parks, and strong community infrastructure. Here's a local-driven guide to the best family neighborhoods in Delhi.",
    sections: [
      {
        heading: "Safest Family Areas in South Delhi",
        content: "South Delhi consistently ranks as the city's most family-friendly zone. Vasant Kunj, Vasant Vihar, Greater Kailash (GK 1 & 2), Saket, Malviya Nagar, and Hauz Khas are all popular with families for their safety, green areas, and excellent schools. Rents are higher than other parts of Delhi, but the quality of life is exceptional.",
        areas: [
          { name: "Vasant Kunj", rent: "₹20,000–₹45,000", note: "One of Delhi's most upscale family areas. Planned township with wide roads, DDA parks, and excellent metro connectivity to South Campus and Saket." },
          { name: "Greater Kailash (GK 2)", rent: "₹22,000–₹50,000", note: "Popular with established families and returning NRIs. Great schools, markets, and community infrastructure. M-block and N-block markets are neighbourhood hubs." },
          { name: "Saket", rent: "₹18,000–₹40,000", note: "Well-connected via Yellow Line metro. Good schools, parks, and proximity to Saket District Centre for shopping and services." },
        ],
      },
      {
        heading: "Best Family Zones in West Delhi",
        content: "West Delhi offers much more affordable options while still providing good family infrastructure. Dwarka (especially Sectors 6–14), Janakpuri, and Paschim Vihar are all popular with middle-class families. These areas have planned layouts, decent schools, and green spaces — all at a fraction of South Delhi prices.",
        areas: [
          { name: "Dwarka (Sectors 6–14)", rent: "₹14,000–₹28,000", note: "Planned township with excellent metro connectivity. Wide roads, DDA parks, and multiple school options. One of Delhi's best family zones for the price." },
          { name: "Janakpuri", rent: "₹12,000–₹22,000", note: "Long-established family neighbourhood with strong community bonds. Good schools, Janakpuri District Centre, and Blue Line metro access." },
          { name: "Paschim Vihar", rent: "₹13,000–₹24,000", note: "Well-planned residential area popular with government employees. Green Dwarka adjacent feel with lower rents. Good connectivity via Green Line metro." },
        ],
      },
      {
        heading: "Top Schools & Their Catchment Areas",
        content: "Delhi has several outstanding schools and living near them is a priority for many families. DPS R.K. Puram draws families to Vasant Kunj and Munirka areas. Springdales (Pusa Road) makes Rajender Nagar and Karol Bagh popular. Modern School (Vasant Vihar) draws families to South Delhi. Delhi Public School (Dwarka) makes Dwarka Sectors 6–12 very popular. Ryan International (Vasant Kunj) influences Vasant Kunj and Vasant Vihar demand.",
      },
      {
        heading: "Green Areas with Parks & Open Spaces",
        content: "Delhi has excellent park infrastructure in planned zones. Lodhi Garden area (Lodhi Colony, Jor Bagh) is surrounded by greenery. Dwarka has numerous DDA parks and a golf course. Vasant Kunj is adjacent to Aravalli Forest. Rohini has Recreational Park and several DDA parks. Garden of Five Senses is near Saket and Lado Sarai. Families who prioritize outdoor space should focus on South Delhi and Dwarka.",
      },
      {
        heading: "Family Areas by Budget",
        content: "Budget (₹10,000–₹18,000/month): Dwarka outer sectors, Rohini (outer), Uttam Nagar West. Mid-range (₹18,000–₹35,000/month): Janakpuri, Paschim Vihar, Dwarka inner sectors, Malviya Nagar, Saket (flats). Premium (₹35,000+/month): Greater Kailash, Vasant Kunj, Vasant Vihar, Hauz Khas, Panchsheel Park.",
      },
    ],
    faqs: [
      { q: "Which is the safest area in Delhi for families?", a: "Vasant Kunj, Greater Kailash (GK 1 & 2), Dwarka (Sectors 6–14), and Janakpuri consistently rank as the safest family areas in Delhi according to PlaceLabels community ratings. South Delhi areas generally have higher safety scores than North or East Delhi." },
      { q: "Is Dwarka good for families in Delhi?", a: "Yes, Dwarka is one of the best family destinations in Delhi for the mid-range budget. It offers planned infrastructure, DDA parks, excellent metro connectivity via Blue Line, multiple school options, and rents significantly lower than South Delhi at ₹14,000–₹28,000 for a 1BHK." },
    ],
    relatedLinks: [
      { href: "/delhi", label: "Delhi Neighborhoods Overview" },
      { href: "/delhi/cheap-areas-to-live", label: "Cheapest Areas in Delhi" },
      { href: "/compare/delhi-vs-gurgaon", label: "Delhi vs Gurgaon: Which is Better?" },
    ],
  },

  "mumbai/safe-areas-for-women": {
    title: "Safest Areas in Mumbai for Women (2026) | PlaceLabels",
    h1: "Safest Neighborhoods for Women in Mumbai — Locals Know Best",
    description: "Looking for safe areas in Mumbai for women? Locals rate Powai, Bandra, Andheri West & Goregaon for safety, street lighting, transport & community. 2026.",
    cityName: "Mumbai",
    citySlug: "mumbai",
    icon: <Shield className="h-6 w-6 text-green-600" />,
    intro: "Mumbai is one of India's more progressive cities, and many women live independently and comfortably across the metropolitan area. That said, safety levels vary significantly by neighborhood — and the best insights come not from official statistics but from women who actually live there. Here's what PlaceLabels locals say about the safest areas in Mumbai for women.",
    sections: [
      {
        heading: "What Makes an Area Safe for Women",
        content: "PlaceLabels uses a Women Safe vibe label that contributors apply when an area meets certain criteria: good street lighting, active foot traffic late into the night, accessible public transport (auto, cab, local train), presence of police patrolling, and a generally welcoming community attitude. Areas with a high density of Women Safe labels are the ones listed here.",
      },
      {
        heading: "Top Neighborhoods Labeled Women Safe by Locals",
        content: "Powai, Bandra West, Andheri West, Goregaon West, Vile Parle West, and Juhu consistently receive Women Safe labels from PlaceLabels contributors. These areas have well-lit streets, strong local communities, 24-hour cab availability, and active social infrastructure. Navi Mumbai's Vashi and Kharghar also receive high marks for women's safety.",
        areas: [
          { name: "Powai", rent: "₹18,000–₹35,000", note: "One of Mumbai's safest neighborhoods overall. Well-planned township with 24-hour security, wide roads, and a professional working community. IIT Bombay campus presence ensures a safe, educated environment.", tags: ["Well-lit", "Safe at night", "Strong community"] },
          { name: "Bandra West", rent: "₹30,000–₹70,000+", note: "Mumbai's most cosmopolitan neighborhood with a strong women-friendly culture. Excellent late-night transport, active streets until midnight, and a community that looks out for each other.", tags: ["Late night safe", "Active street life", "Great transport"] },
          { name: "Andheri West", rent: "₹20,000–₹40,000", note: "Versova and Lokhandwala in Andheri West are known for good safety. Strong film industry community creates a more progressive social environment. Metro Line 1 and 7 both accessible.", tags: ["Metro access", "Safe roads", "Well-connected"] },
          { name: "Goregaon West", rent: "₹16,000–₹30,000", note: "Film City proximity creates a professional, educated community. Well-lit main roads, 24-hour commercial activity, and good cab availability make this a strong choice for working women.", tags: ["Safe at night", "Good transport"] },
          { name: "Vile Parle West", rent: "₹22,000–₹42,000", note: "One of Mumbai's most family-oriented neighborhoods with strong community safety. Active resident associations, CCTV coverage on main roads, and consistent patrolling.", tags: ["Family safe", "Community watch"] },
          { name: "Kharghar (Navi Mumbai)", rent: "₹10,000–₹18,000", note: "CIDCO planned township with excellent infrastructure and a reputation for safety. Wide roads with good lighting, active residential associations, and lower crime rates than Mumbai proper.", tags: ["Planned city", "Low crime", "Affordable"] },
        ],
      },
      {
        heading: "Areas with Best Late-Night Transport Access",
        content: "Transport access is critical for women's safety in Mumbai. Western Railway runs 24 hours and is considered relatively safe for women (Ladies compartment available). Metro Line 1 (Versova–Ghatkopar) operates until 11 PM. Cab apps (Ola, Uber, Rapido) operate city-wide. Areas near major railway stations — Andheri, Borivali, Bandra — have the best late-night cab availability. Central suburbs and Navi Mumbai areas with Harbour Line access are also good.",
      },
      {
        heading: "Areas Near Women's Colleges & Co-working Spaces",
        content: "Areas near women's colleges tend to be safer for female students and young professionals. SNDT Women's University campuses are in Churchgate (South Mumbai) and Santa Cruz (Western suburbs) — both well-regarded areas. Sophia College (Mumbai) in Breach Candy attracts women to South Mumbai's Peddar Road and Tardeo areas. For co-working spaces, Andheri, Bandra, and Lower Parel have the most women-friendly co-working spaces with all-hours access.",
      },
      {
        heading: "What Women Residents Say About Their Neighborhoods",
        content: "\"Powai is one of the few places in Mumbai where I feel completely comfortable coming home at midnight. The roads are lit, cabs are always available, and neighbours look out for each other.\" — PlaceLabels contributor. \"Bandra West is vibrant until 1 AM on weekends. I've lived here for 4 years and never felt unsafe walking to the station.\" — PlaceLabels local. \"Kharghar in Navi Mumbai is underrated for safety. Wide roads, CCTV, and a community watch program. Much safer feeling than many Western suburbs.\" — Local resident.",
      },
      {
        heading: "Safety vs Affordability Trade-off in Mumbai",
        content: "The safest areas in Mumbai (Bandra, Powai, Juhu) are also among the most expensive. But affordable safe options exist: Kharghar in Navi Mumbai (₹10k–₹18k), Goregaon West (₹16k–₹30k), and Mira Road (₹10k–₹16k) all have decent safety ratings at mid-range prices. Nalasopara and Virar are the cheapest but have lower safety scores — particularly for women travelling late at night.",
      },
    ],
    faqs: [
      { q: "Which is the safest area in Mumbai for women living alone?", a: "Powai, Bandra West, and Andheri West are consistently rated as the safest areas for women living alone in Mumbai. These neighborhoods have good street lighting, active communities, 24-hour cab access, and a welcoming atmosphere for independent women." },
      { q: "Is Mumbai safe for women at night?", a: "Mumbai is generally considered one of India's safer cities for women at night, especially compared to Delhi. Areas like Bandra, Andheri, and Powai have active street life until late. However, some suburban areas (particularly far-north suburbs and some parts of Central Mumbai) are less safe after 10 PM. Always use cabs rather than walking alone late at night in unfamiliar areas." },
    ],
    relatedLinks: [
      { href: "/mumbai", label: "Mumbai Neighborhoods Overview" },
      { href: "/mumbai/cheap-areas-to-live", label: "Cheapest Areas in Mumbai" },
      { href: "/compare/mumbai-vs-pune", label: "Mumbai vs Pune: Which is Safer?" },
    ],
  },
};

export default function VibeFilterPage() {
  const [location] = useLocation();
  const key = location.replace(/^\//, "");
  const data = DATA[key];

  if (!data) {
    return (
      <SEOLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Page Not Found</h1>
          <p className="text-gray-500 mb-6">We don't have a guide for this page yet.</p>
          <Link href="/" className="text-teal-600 underline">Back to the map →</Link>
        </div>
      </SEOLayout>
    );
  }

  const canonicalUrl = `https://placelabels.com/${key}`;
  const area = key.includes("/") ? key.split("/")[1] : key;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PlaceLabels", item: "https://placelabels.com" },
      { "@type": "ListItem", position: 2, name: `${data.cityName} Neighborhoods`, item: `https://placelabels.com/${data.citySlug}` },
      { "@type": "ListItem", position: 3, name: data.h1, item: canonicalUrl },
    ],
  };

  const faqSchema = data.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  return (
    <SEOLayout breadcrumbs={[{ label: data.cityName, href: `/${data.citySlug}` }, { label: area?.replace(/-/g, " ") ?? "" }]}>
      <Helmet>
        <title>{data.title}</title>
        <meta name="description" content={data.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <meta property="og:title" content={data.title} />
        <meta property="og:description" content={data.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://placelabels.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={data.title} />
        <meta name="twitter:description" content={data.description} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <div className="flex items-center gap-2 mb-4">
        {data.icon}
        <span className="text-sm text-gray-500 font-medium">{data.cityName} Guide</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{data.h1}</h1>
      <p className="text-gray-600 text-lg mb-6 max-w-2xl">{data.description}</p>
      <p className="text-gray-600 leading-relaxed mb-10">{data.intro}</p>

      {data.sections.map((section) => (
        <div key={section.heading} className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{section.heading}</h2>
          <p className="text-gray-600 leading-relaxed mb-4">{section.content}</p>
          {section.areas && section.areas.length > 0 && (
            <div className="space-y-3 mt-4">
              {section.areas.map((a) => (
                <div key={a.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h3 className="font-bold text-gray-900">{a.name}</h3>
                    {a.rent && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-semibold">{a.rent}/mo</span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{a.note}</p>
                  {a.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {data.faqs.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {data.faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white mb-10">
        <h2 className="text-xl font-bold mb-2">Know this area? Drop a label on the map →</h2>
        <p className="text-teal-100 mb-4 text-sm">Your local knowledge helps others find the right neighborhood. It takes 30 seconds.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors text-sm">
          <MapPin className="h-4 w-4" />
          Open the Map →
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Related Guides</h2>
        <ul className="space-y-2">
          {data.relatedLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex items-center gap-2 text-teal-600 hover:text-teal-800 hover:underline text-sm">
                <ChevronRight className="h-4 w-4" />{link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SEOLayout>
  );
}
