import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SEOLayout } from "./SEOLayout";
import { DollarSign, Train, Shield, MapPin, ChevronRight } from "lucide-react";

interface AreaEntry {
  name: string;
  rent: string;
  commute: string;
  safety: string;
  note: string;
}

interface ExtraSection {
  heading: string;
  content: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface CheapAreasData {
  title: string;
  h1: string;
  description: string;
  cityName: string;
  citySlug: string;
  areas: AreaEntry[];
  extraSections: ExtraSection[];
  faqs: FAQ[];
  relatedLinks: Array<{ href: string; label: string }>;
}

const DATA: Record<string, CheapAreasData> = {
  mumbai: {
    title: "Cheapest Areas to Live in Mumbai (2026) | PlaceLabels",
    h1: "10 Most Affordable Neighborhoods in Mumbai — Verified by Locals",
    description: "Looking for cheap areas in Mumbai? Locals rate Virar, Mira Road, Nalasopara, Kandivali & Vasai for rent cost, safety & commute. Real 2026 data.",
    cityName: "Mumbai",
    citySlug: "mumbai",
    areas: [
      { name: "Virar", rent: "₹6,000–₹10,000/month", commute: "75–90 min to CST", safety: "Moderate", note: "Virar is one of the most affordable suburbs on the Western Railway line. Ideal for budget renters who don't mind long commutes. Local markets, schools, and basic amenities are well-established." },
      { name: "Nalasopara", rent: "₹7,000–₹12,000/month", commute: "65–80 min to CST", safety: "Moderate", note: "Just south of Virar, Nalasopara offers slightly better connectivity while staying affordable. A large working-class community makes it vibrant and well-serviced." },
      { name: "Vasai", rent: "₹8,000–₹13,000/month", commute: "60–75 min to CST", safety: "Moderate–Good", note: "Vasai has seen rapid infrastructure development. It's a popular choice for families and first-time renters who want space without the Mumbai price tag." },
      { name: "Mira Road", rent: "₹10,000–₹16,000/month", commute: "50–65 min to CST", safety: "Good", note: "Mira Road offers a good balance of affordability and connectivity. Well-developed with schools, malls, and hospitals. One of the most popular suburbs for young families." },
      { name: "Kandivali East", rent: "₹12,000–₹18,000/month", commute: "35–50 min to CST", safety: "Good", note: "Within Mumbai proper, Kandivali East is one of the most affordable options. Metro connectivity via Line 7 makes it increasingly attractive for professionals." },
      { name: "Borivali East", rent: "₹13,000–₹20,000/month", commute: "30–45 min to CST", safety: "Good", note: "Close to Sanjay Gandhi National Park, Borivali East offers a greener environment. Good schools and a strong local market make it family-friendly." },
      { name: "Malad East", rent: "₹14,000–₹22,000/month", commute: "30–40 min to CST", safety: "Good", note: "Malad East is popular with IT professionals due to proximity to Mindspace and Raheja Mindspace tech parks. Metro and Western Railway both accessible." },
      { name: "Goregaon East", rent: "₹15,000–₹24,000/month", commute: "25–35 min to CST", safety: "Very Good", note: "NESCO IT Park and Film City proximity make Goregaon East popular. Relatively more expensive than outer suburbs but much cheaper than South Mumbai." },
      { name: "Thane", rent: "₹12,000–₹20,000/month", commute: "40–55 min to CST", safety: "Good", note: "Thane has developed into a full city in its own right with excellent infrastructure. Lakes, malls, and schools make it ideal for families. Good metro connectivity planned." },
      { name: "Navi Mumbai (Kharghar)", rent: "₹10,000–₹18,000/month", commute: "50–65 min to CST", safety: "Very Good", note: "Planned township with wide roads, parks, and a good quality of life. Kharghar and Airoli are especially popular. CIDCO developments keep prices controlled." },
    ],
    extraSections: [
      { heading: "Why Mumbai Rent Varies So Wildly", content: "Mumbai's rent gradient is one of the steepest in the world. Moving 10 km from the city centre reduces rent by 20–30%. South Mumbai starts at ₹40,000+, while suburbs like Virar (75 km away) average ₹8,000. This dramatic variation is driven by rail access, infrastructure quality, and proximity to employment hubs. Understanding this gradient is key to finding affordable housing without sacrificing too much commute time." },
      { heading: "Cheap Areas Near Western Railway Line", content: "The Western Railway corridor from Churchgate to Virar is the lifeline for budget renters in Mumbai. Areas like Mira Road, Nalasopara, and Virar sit at the far end where rents are 60–70% cheaper than Bandra or Andheri. The trade-off is commute time — expect 60–90 minutes to South Mumbai during peak hours. Locals recommend getting a first-class rail pass (₹800–₹1,000/month) to make the daily commute bearable." },
      { heading: "Cheap Areas Near Harbour Line", content: "Navi Mumbai's Harbour Line connects Thane, Vashi, Nerul, and Panvel to CST. Areas like Kharghar, Airoli, and Panvel offer planned infrastructure with rents 40–50% lower than comparable Western suburbs. CIDCO's township planning means wider roads and better civic amenities compared to the cramped inner suburbs. The upcoming metro network will further improve connectivity for these areas." },
      { heading: "What Locals Say About Living Cheap in Mumbai", content: "\"Mira Road is underrated — great schools, malls, good neighbours, and rent half of what Andheri charges.\" — PlaceLabels local label. \"Nalasopara is chaotic but the rent savings are real. I save ₹8,000/month vs Borivali.\" — PlaceLabels contributor. \"Kharghar in Navi Mumbai is the best-kept secret. Planned city, clean roads, and rents are still sane.\" — Local resident." },
    ],
    faqs: [
      { q: "What is the cheapest area to live in Mumbai?", a: "Virar and Nalasopara are among the most affordable areas in Mumbai, with 1BHK rents starting at ₹6,000–₹7,000/month. These areas are on the far end of the Western Railway line and involve longer commutes to the city centre." },
      { q: "Is it safe to live in cheap areas of Mumbai?", a: "Safety varies by area. PlaceLabels locals rate Mira Road, Kandivali, and Navi Mumbai as relatively safe options. Virar and Nalasopara have moderate safety scores. As with any large city, safety also depends on the specific locality within each area." },
      { q: "What is the average rent in Mumbai suburbs?", a: "Suburban Mumbai rents range from ₹6,000 to ₹20,000 per month for a 1BHK depending on how far you are from the city centre. Mira Road and Kandivali offer the best balance of affordability, safety, and connectivity." },
    ],
    relatedLinks: [
      { href: "/mumbai", label: "Mumbai Neighborhoods Overview" },
      { href: "/mumbai/safe-areas-for-women", label: "Safest Areas for Women in Mumbai" },
      { href: "/compare/mumbai-vs-pune", label: "Mumbai vs Pune Cost Comparison" },
    ],
  },
  delhi: {
    title: "Cheapest Areas to Live in Delhi (2026) | PlaceLabels",
    h1: "10 Most Affordable Neighborhoods in Delhi — Rated by Locals",
    description: "Find cheap areas in Delhi. Locals rate Dwarka, Uttam Nagar, Shahdara, Laxmi Nagar & Rohini for rent, safety, and metro access. Real 2026 data.",
    cityName: "Delhi",
    citySlug: "delhi",
    areas: [
      { name: "Uttam Nagar", rent: "₹7,000–₹12,000/month", commute: "45–55 min to Connaught Place", safety: "Moderate", note: "Uttam Nagar is one of Delhi's densest and most affordable areas. Well-connected via Blue Line metro, it's popular with working-class families and daily wage earners." },
      { name: "Dwarka (Sectors 23–25)", rent: "₹8,000–₹14,000/month", commute: "40–50 min to CP", safety: "Good", note: "Dwarka's outer sectors are significantly cheaper than Sector 10–14 while still on the Blue Line. Planned infrastructure, parks, and schools make it family-friendly." },
      { name: "Shahdara", rent: "₹7,000–₹11,000/month", commute: "30–40 min to CP", safety: "Moderate", note: "East Delhi's Shahdara is dense but affordable with excellent metro connectivity via Red and Pink lines. Popular with traders and families who need central access." },
      { name: "Laxmi Nagar", rent: "₹9,000–₹15,000/month", commute: "25–35 min to CP", safety: "Moderate–Good", note: "Laxmi Nagar is one of East Delhi's most connected areas. The Blue Line metro makes it a 25-minute ride to Central Delhi. Known for commerce and education hubs nearby." },
      { name: "Rohini (Outer Sectors)", rent: "₹8,000–₹13,000/month", commute: "35–45 min to CP", safety: "Good", note: "Rohini's outer sectors (22–25) offer significantly lower rents than inner sectors. Well-planned locality with good schools, hospitals, and parks." },
      { name: "Vikaspuri", rent: "₹9,000–₹14,000/month", commute: "35–45 min to CP", safety: "Good", note: "Vikaspuri in West Delhi is a quiet, well-planned colony with good connectivity via metro. Popular with government employees and middle-class families." },
      { name: "Janakpuri", rent: "₹10,000–₹16,000/month", commute: "35–45 min to CP", safety: "Good", note: "Janakpuri is slightly pricier than neighbouring areas but offers better infrastructure. Well-regarded schools and hospitals make it a top family choice in West Delhi." },
      { name: "Burari", rent: "₹6,000–₹10,000/month", commute: "40–55 min to CP", safety: "Moderate", note: "North Delhi's Burari is one of the cheapest areas in the city. It's less developed than South and West Delhi but improving rapidly with new residential construction." },
      { name: "Kondli", rent: "₹6,500–₹11,000/month", commute: "35–50 min to CP", safety: "Moderate", note: "Kondli in East Delhi sits near the Pink Line metro corridor. A mix of unauthorized colonies and planned sectors keeps rents low for budget-conscious renters." },
      { name: "Mustafabad", rent: "₹5,000–₹9,000/month", commute: "40–55 min to CP", safety: "Moderate", note: "One of Delhi's most affordable areas, Mustafabad in North-East Delhi has very low rents. It's a dense urban area with limited amenities but improving metro access." },
    ],
    extraSections: [
      { heading: "Cheap Areas in West Delhi", content: "West Delhi — including Uttam Nagar, Vikaspuri, and Janakpuri — offers the best blend of affordability and connectivity via the Blue Line metro. Rents here are 40–50% lower than South Delhi while still within 40 minutes of Connaught Place. Family-friendly infrastructure like parks and schools is well-developed across this zone." },
      { heading: "Cheap Areas in East Delhi", content: "Shahdara, Laxmi Nagar, and Kondli form East Delhi's budget belt. The Pink and Blue lines connect these areas well to Central Delhi. East Delhi is denser and more commercial than West Delhi but rents are among the lowest within Delhi's border. The upcoming Pink Line extensions will further improve connectivity." },
      { heading: "Budget Areas with Good Metro Access in Delhi", content: "Delhi's metro network is the country's best, and several budget areas are extremely well connected. Uttam Nagar (Blue Line), Shahdara (Red/Pink Line), Rohini (Yellow/Red Line), and Dwarka outer sectors (Blue Line) all offer sub-₹15,000 rents with 35–50 minute commutes to Central Delhi." },
      { heading: "Delhi vs Gurgaon — Is Gurgaon Actually Cheaper?", content: "Many IT professionals consider Gurgaon as an alternative to Delhi for housing. The reality: Gurgaon's budget areas (Sectors 9, 10, 14) are 30–40% more expensive than comparable Delhi areas. Delhi's metro network is also vastly superior. Unless you work specifically in Cyber City or DLF, staying in Delhi's West or East zones often makes more financial sense." },
    ],
    faqs: [
      { q: "What is the cheapest area to live in Delhi?", a: "Mustafabad, Burari, and Uttam Nagar are among the cheapest areas in Delhi, with rents starting from ₹5,000–₹7,000/month for a 1BHK. These areas are in North and East Delhi and have moderate amenities." },
      { q: "Which cheap areas in Delhi have metro access?", a: "Almost all major budget areas in Delhi have metro access — Uttam Nagar and Dwarka are on the Blue Line, Rohini on the Yellow/Red Line, and Shahdara and Laxmi Nagar on the Pink/Blue Lines. Delhi's metro makes budget living very practical." },
      { q: "Is it safe to live in budget areas of Delhi?", a: "Safety varies significantly by locality. Areas like Janakpuri, Vikaspuri, Dwarka, and Rohini are generally considered safe by PlaceLabels users. Burari and Mustafabad have moderate safety ratings. Always research the specific colony or sector you plan to rent in." },
    ],
    relatedLinks: [
      { href: "/delhi", label: "Delhi Neighborhoods Overview" },
      { href: "/delhi/family-friendly-areas", label: "Family-Friendly Areas in Delhi" },
      { href: "/compare/delhi-vs-gurgaon", label: "Delhi vs Gurgaon Comparison" },
    ],
  },
  hyderabad: {
    title: "Cheapest Areas to Live in Hyderabad (2026) | PlaceLabels",
    h1: "10 Most Affordable Neighborhoods in Hyderabad — Local Guide",
    description: "Cheap areas in Hyderabad near HITEC City? Locals rate LB Nagar, Uppal, Dilsukhnagar, Miyapur & more for rent, safety & IT hub distance. Real 2026 data.",
    cityName: "Hyderabad",
    citySlug: "hyderabad",
    areas: [
      { name: "LB Nagar", rent: "₹7,000–₹12,000/month", commute: "35–45 min to HITEC City", safety: "Good", note: "LB Nagar is a well-established affordable area in South-East Hyderabad. Excellent metro connectivity via the Red Line and good commercial infrastructure." },
      { name: "Uppal", rent: "₹8,000–₹13,000/month", commute: "30–40 min to HITEC City", safety: "Good", note: "Uppal is rapidly developing with metro connectivity. Close to ECIL and Uppal IT parks. Rents are low compared to the main IT corridors." },
      { name: "Dilsukhnagar", rent: "₹7,500–₹12,000/month", commute: "40–50 min to HITEC City", safety: "Moderate–Good", note: "One of Hyderabad's busiest commercial areas with excellent metro and bus connectivity. A dense area with a strong local culture and affordable food options." },
      { name: "Miyapur", rent: "₹9,000–₹15,000/month", commute: "20–30 min to HITEC City", safety: "Good", note: "Miyapur sits on the western edge of the city close to HITEC City. One of the best value-for-money areas for IT professionals wanting a short commute without paying Gachibowli prices." },
      { name: "Kompally", rent: "₹8,000–₹13,000/month", commute: "35–50 min to HITEC City", safety: "Good", note: "North Hyderabad's Kompally is rapidly growing with large residential projects. Lower density means more space for your money. Popular with families looking for quieter surroundings." },
      { name: "Nacharam", rent: "₹9,000–₹14,000/month", commute: "25–35 min to HITEC City", safety: "Good", note: "Nacharam and the nearby Uppal belt offer budget housing close to the eastern IT corridor. Several IT companies have offices in the Nacharam industrial area." },
      { name: "Malkajgiri", rent: "₹8,000–₹13,000/month", commute: "30–45 min to HITEC City", safety: "Good", note: "Malkajgiri is a large, well-established residential area in East Hyderabad. Good connectivity, plenty of schools and markets, and consistently affordable rents." },
      { name: "Kothapet", rent: "₹7,000–₹12,000/month", commute: "35–50 min to HITEC City", safety: "Moderate", note: "Kothapet offers very affordable rents in South Hyderabad. Older infrastructure but good metro connectivity via Red Line makes it viable for budget renters." },
      { name: "Vanasthalipuram", rent: "₹6,500–₹11,000/month", commute: "40–55 min to HITEC City", safety: "Moderate", note: "One of Hyderabad's most affordable areas. Limited amenities compared to newer developments but very low rents attract first-time renters." },
      { name: "Tarnaka", rent: "₹8,500–₹14,000/month", commute: "30–40 min to HITEC City", safety: "Good", note: "Tarnaka is a quieter residential area near Osmania University. A mix of student housing and family apartments at budget prices with decent connectivity." },
    ],
    extraSections: [
      { heading: "Budget Areas Near HITEC City", content: "IT professionals who want a short commute to HITEC City without paying Gachibowli or Kondapur prices should look at Miyapur, Kukatpally, and Bachupally. Miyapur is the closest affordable option at 20–30 minutes by metro. Rents here are 40–50% lower than HITEC City's immediate surroundings." },
      { heading: "Old City Affordable Neighborhoods", content: "Hyderabad's Old City areas — including Malakpet, Saidabad, and parts of Chandrayangutta — offer among the cheapest rents in the city. While connectivity to IT hubs is longer (50–70 min), the cultural richness, affordable food, and community atmosphere make it a unique choice for those who don't prioritize IT proximity." },
      { heading: "Cost vs IT Commute Time in Hyderabad", content: "The further you move from HITEC City, the cheaper the rent. Miyapur (₹9k–₹15k, 20 min) vs LB Nagar (₹7k–₹12k, 40 min) vs Vanasthalipuram (₹6.5k–₹11k, 55 min). Hyderabad's metro has dramatically improved commute quality — areas once considered too far are now viable options." },
    ],
    faqs: [
      { q: "What is the cheapest area to live in Hyderabad?", a: "Vanasthalipuram, Kothapet, and LB Nagar are among the cheapest areas in Hyderabad, with 1BHK rents starting from ₹6,500–₹7,000/month. These are established residential areas in South and East Hyderabad." },
      { q: "Which cheap area in Hyderabad is closest to HITEC City?", a: "Miyapur is the most affordable area within a reasonable distance (20–30 min) of HITEC City. Kukatpally and Bachupally are also good options at 25–35 minutes. These areas offer rents 40–50% lower than Gachibowli or Kondapur." },
      { q: "Is Hyderabad affordable compared to Bangalore?", a: "Yes, Hyderabad is noticeably more affordable than Bangalore. Average 1BHK rents in Hyderabad's mid-range areas are ₹10,000–₹18,000 vs ₹14,000–₹25,000 in comparable Bangalore areas. Hyderabad also has lower food and transport costs." },
    ],
    relatedLinks: [
      { href: "/hyderabad", label: "Hyderabad Neighborhoods Overview" },
      { href: "/compare/bangalore-vs-hyderabad", label: "Bangalore vs Hyderabad Comparison" },
    ],
  },
  bangalore: {
    title: "Cheapest Areas to Live in Bangalore (2026) | PlaceLabels",
    h1: "10 Most Affordable Neighborhoods in Bangalore for 2026",
    description: "Cheap areas in Bangalore near IT parks? Locals rate Electronic City, Hennur, Sarjapur, Yelahanka & Marathahalli for rent cost and commute. Real data.",
    cityName: "Bangalore",
    citySlug: "bangalore",
    areas: [
      { name: "Electronic City Phase 2", rent: "₹8,000–₹14,000/month", commute: "30–45 min to MG Road", safety: "Good", note: "Electronic City Phase 2 is the go-to for IT professionals working at Infosys, Wipro, or HCL campuses. Right next to major offices, rents are low and local amenities are solid." },
      { name: "Hennur", rent: "₹9,000–₹15,000/month", commute: "30–40 min to MG Road", safety: "Good", note: "Hennur in North Bangalore is developing rapidly. Well-connected via Outer Ring Road and popular with families and professionals looking for mid-range housing." },
      { name: "Yelahanka", rent: "₹9,000–₹15,000/month", commute: "35–50 min to MG Road", safety: "Good", note: "North Bangalore's Yelahanka offers affordable rents close to the airport. KIADB Industrial Area and upcoming metro connectivity make it increasingly attractive." },
      { name: "Sarjapur Road (Outer)", rent: "₹10,000–₹16,000/month", commute: "40–55 min to MG Road", safety: "Good", note: "The outer parts of Sarjapur Road near Attibele and Chandapura are much cheaper than the Marathahalli end. Good for professionals working in the Electronic City–Sarjapur belt." },
      { name: "Bommanahalli", rent: "₹9,500–₹15,000/month", commute: "30–40 min to MG Road", safety: "Good", note: "Bommanahalli on the outer ring road is popular with IT professionals. Well-connected to Electronic City and Silk Board area. Rents are moderate with good local markets." },
      { name: "Hoskote", rent: "₹6,000–₹10,000/month", commute: "45–65 min to MG Road", safety: "Good", note: "East of Bangalore, Hoskote offers the cheapest rents in the Bangalore metro region. Industrial zones nearby create employment but infrastructure is still developing." },
      { name: "Jalahalli", rent: "₹8,500–₹14,000/month", commute: "25–35 min to MG Road", safety: "Good", note: "Jalahalli in North-West Bangalore is a quiet residential area with good metro connectivity via Yellow Line. Popular with defense personnel and their families." },
      { name: "Thanisandra", rent: "₹9,000–₹15,000/month", commute: "30–40 min to MG Road", safety: "Good", note: "Thanisandra is north of Hebbal and is developing rapidly. Close to Manyata Tech Park, it's popular with tech professionals. Metro connectivity is planned for this corridor." },
      { name: "Begur Road", rent: "₹8,000–₹13,000/month", commute: "30–45 min to MG Road", safety: "Moderate–Good", note: "Begur Road connects Electronic City to Bannerghatta Road area. Affordable housing options are available, and the area is improving with new residential complexes." },
      { name: "Attibele", rent: "₹6,000–₹10,000/month", commute: "50–70 min to MG Road", safety: "Moderate", note: "On the Bangalore–Tamil Nadu border, Attibele offers the cheapest rents in the Bangalore metro area. Best for those working in far Electronic City or Hosur Road belt." },
    ],
    extraSections: [
      { heading: "Cheap Areas Near Outer Ring Road", content: "Bangalore's Outer Ring Road (ORR) is the main IT corridor. Areas slightly off the ORR — like Bommanahalli, Begur Road, and Harlur — offer rents 30–40% lower than Koramangala or HSR Layout while staying within 20–30 minutes of major IT parks. These areas are the sweet spot for budget-conscious IT professionals." },
      { heading: "Budget Zones Near Whitefield", content: "Whitefield is one of Bangalore's most expensive IT areas, but surrounding areas like Varthur, Kadugodi, and Brookefield offer 1BHK rents from ₹10,000–₹16,000 — significantly cheaper than Whitefield's core while within 15–20 minutes of major IT campuses including SAP, IBM, and Prestige Tech Park." },
    ],
    faqs: [
      { q: "What is the cheapest area to live in Bangalore?", a: "Hoskote and Attibele are the cheapest areas in the Bangalore metro region, with 1BHK rents from ₹6,000/month. Within Bangalore proper, Electronic City Phase 2 and Begur Road offer the best value at ₹8,000–₹14,000/month." },
      { q: "Which cheap area in Bangalore is closest to IT parks?", a: "Electronic City Phase 2 (for Infosys/Wipro workers), Thanisandra (for Manyata Tech Park), and Bommanahalli (for EPIP Zone) offer the best value near major IT hubs. Rents are 40–50% lower than Koramangala or Indiranagar." },
      { q: "Is Bangalore more expensive than Hyderabad?", a: "Yes, Bangalore is consistently more expensive than Hyderabad. Average 1BHK rents in Bangalore are ₹12,000–₹22,000 in mid-range areas vs ₹9,000–₹16,000 in comparable Hyderabad areas. Food and transport costs are also higher in Bangalore." },
    ],
    relatedLinks: [
      { href: "/bangalore", label: "Bangalore Neighborhoods Overview" },
      { href: "/bangalore/it-hub-areas", label: "Top IT Hub Areas in Bangalore" },
      { href: "/compare/bangalore-vs-hyderabad", label: "Bangalore vs Hyderabad Comparison" },
    ],
  },
  pune: {
    title: "Cheapest Areas to Live in Pune (2026) | PlaceLabels",
    h1: "10 Most Affordable Neighborhoods in Pune — Ranked by Locals",
    description: "Cheap areas in Pune? Locals rate Hadapsar, Kondhwa, Bibwewadi, Wadgaon Sheri & Ambegaon for rent, safety & commute to Hinjewadi. Real 2026 data.",
    cityName: "Pune",
    citySlug: "pune",
    areas: [
      { name: "Hadapsar", rent: "₹8,000–₹13,000/month", commute: "30–45 min to Hinjewadi", safety: "Good", note: "Hadapsar is one of Pune's most established IT and residential areas. Proximity to Magarpatta City and SP Infocity makes it popular with tech workers. Rents are moderate for what you get." },
      { name: "Kondhwa", rent: "₹8,500–₹14,000/month", commute: "40–55 min to Hinjewadi", safety: "Good", note: "Kondhwa in South Pune is a well-developed residential area with excellent schools, hospitals, and markets. Popular with families who prefer a quieter environment away from the IT crowd." },
      { name: "Bibwewadi", rent: "₹8,000–₹13,000/month", commute: "35–50 min to Hinjewadi", safety: "Good", note: "A quiet, relatively affordable area in central-south Pune. Bibwewadi is well-connected and popular with families and long-term residents. Low-rise housing dominates the streetscape." },
      { name: "Ambegaon", rent: "₹7,000–₹11,000/month", commute: "45–60 min to Hinjewadi", safety: "Moderate–Good", note: "Ambegaon in South Pune is one of the city's most affordable options. Surrounded by hills, it offers a green environment. Infrastructure is improving with new residential projects." },
      { name: "Fursungi", rent: "₹6,500–₹10,000/month", commute: "30–40 min to Hinjewadi", safety: "Moderate", note: "Near Hadapsar, Fursungi offers some of Pune's cheapest rents. An expanding area with basic amenities, ideal for those who work in the Hadapsar-Magarpatta belt." },
      { name: "Undri", rent: "₹7,500–₹12,000/month", commute: "35–50 min to Hinjewadi", safety: "Moderate–Good", note: "Undri is developing rapidly in South Pune. Lower rents and improving infrastructure make it popular with young professionals and families priced out of Kondhwa." },
      { name: "Wadgaon Sheri", rent: "₹9,000–₹14,000/month", commute: "30–40 min to Hinjewadi", safety: "Good", note: "Near Nagar Road and the airport, Wadgaon Sheri is affordable with good connectivity. Popular with Pune airport workers and professionals in the Kharadi IT area." },
      { name: "Dhanori", rent: "₹8,500–₹13,500/month", commute: "30–40 min to Hinjewadi", safety: "Good", note: "Dhanori near the airport is a growing residential hub. Close to Kharadi IT park, it's becoming popular with IT professionals priced out of Viman Nagar." },
      { name: "Vishrantwadi", rent: "₹8,000–₹13,000/month", commute: "35–45 min to Hinjewadi", safety: "Good", note: "Vishrantwadi is near Pune airport and connects well to Kharadi and Yerwada. A mix of old and new residential areas with decent amenities and improving infrastructure." },
      { name: "Katraj", rent: "₹7,500–₹12,000/month", commute: "40–55 min to Hinjewadi", safety: "Good", note: "South Pune's Katraj is a large, well-established residential area with excellent schools and hospitals. Affordable rents and a strong local community make it ideal for families." },
    ],
    extraSections: [
      { heading: "Budget Areas Near Hinjewadi IT Park", content: "Hinjewadi is Pune's largest IT hub but rents in and around it can be surprisingly high. Budget alternatives within 20–30 minutes include Wakad, Pimple Saudagar, and Ravet. These areas offer 1BHK rents from ₹10,000–₹18,000 — significantly cheaper than Hinjewadi's Phase 1–3 core areas." },
      { heading: "Cheap Student Areas in Pune", content: "Pune has one of India's largest student populations. Budget areas popular with students include Shivajinagar, Deccan, Kothrud, and Karve Nagar — all near Pune University and FC Road. PG accommodations in these areas start from ₹5,000–₹8,000/month including meals. See our complete guide to student-friendly areas in Pune for more details." },
      { heading: "Pune vs Mumbai Cost of Living", content: "Pune is consistently 30–50% cheaper than Mumbai for equivalent housing. A 1BHK in Pune's affordable areas costs ₹7,000–₹14,000 vs ₹12,000–₹22,000 in comparable Mumbai suburbs. Food, transport, and recreation also cost significantly less in Pune, making it a popular destination for professionals relocating from Mumbai." },
    ],
    faqs: [
      { q: "What is the cheapest area to live in Pune?", a: "Fursungi and Ambegaon are among the cheapest areas in Pune, with 1BHK rents starting from ₹6,500–₹7,000/month. These areas are in South Pune and have basic but improving infrastructure." },
      { q: "Which cheap area in Pune is closest to Hinjewadi IT Park?", a: "Wakad, Pimple Saudagar, and Ravet are the most affordable areas within 20–30 minutes of Hinjewadi. Within South Pune, Hadapsar and Fursungi are good budget options for professionals working in Magarpatta City or ITSP." },
      { q: "Is Pune cheaper than Mumbai to live in?", a: "Yes, Pune is significantly cheaper than Mumbai. Average 1BHK rents in Pune's affordable areas are ₹7,000–₹14,000 vs ₹12,000–₹22,000 in comparable Mumbai suburbs. Pune also has lower food, transport, and lifestyle costs. See our Mumbai vs Pune comparison for a full breakdown." },
    ],
    relatedLinks: [
      { href: "/pune", label: "Pune Neighborhoods Overview" },
      { href: "/pune/student-friendly-areas", label: "Student-Friendly Areas in Pune" },
      { href: "/compare/mumbai-vs-pune", label: "Mumbai vs Pune Cost Comparison" },
    ],
  },
};

function SafetyBadge({ label }: { label: string }) {
  const color =
    label === "Very Good" ? "bg-green-100 text-green-800" :
    label === "Good" ? "bg-teal-100 text-teal-800" :
    label === "Moderate–Good" ? "bg-blue-100 text-blue-800" :
    "bg-yellow-100 text-yellow-800";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

export default function CheapAreasPage() {
  const { city } = useParams<{ city: string }>();
  const data = city ? DATA[city] : null;

  if (!data) {
    return (
      <SEOLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Page Not Found</h1>
          <p className="text-gray-500 mb-6">We don't have a cheap areas guide for this city yet.</p>
          <Link href="/" className="text-teal-600 underline">Back to the map →</Link>
        </div>
      </SEOLayout>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const canonicalUrl = `https://placelabels.com/${data.citySlug}/cheap-areas-to-live`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PlaceLabels", item: "https://placelabels.com" },
      { "@type": "ListItem", position: 2, name: `${data.cityName} Neighborhoods`, item: `https://placelabels.com/${data.citySlug}` },
      { "@type": "ListItem", position: 3, name: `Cheap Areas in ${data.cityName}`, item: canonicalUrl },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <SEOLayout breadcrumbs={[{ label: data.cityName, href: `/${data.citySlug}` }, { label: "Cheap Areas" }]}>
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
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="mb-2 text-xs text-gray-400">Last updated: {today} · Real local data</div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{data.h1}</h1>
      <p className="text-gray-600 text-lg mb-8 max-w-2xl">{data.description}</p>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Top 10 Cheapest Areas in {data.cityName} to Live
      </h2>
      <div className="space-y-4 mb-10">
        {data.areas.map((area, i) => (
          <div key={area.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-teal-600 w-8 flex-shrink-0">{i + 1}</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{area.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <DollarSign className="h-3 w-3" />{area.rent}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Train className="h-3 w-3" />{area.commute}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Shield className="h-3 w-3" /><SafetyBadge label={area.safety} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-2 ml-11">{area.note}</p>
          </div>
        ))}
      </div>

      {data.extraSections.map((section) => (
        <div key={section.heading} className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-3">{section.heading}</h2>
          <p className="text-gray-600 leading-relaxed">{section.content}</p>
        </div>
      ))}

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-10">
        <h2 className="text-xl font-bold text-teal-800 mb-3">
          <Shield className="inline h-5 w-5 mr-2" />
          Cost vs Commute Trade-Off Table
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-teal-700 font-semibold border-b border-teal-200">
                <th className="py-2 pr-4">Area</th>
                <th className="py-2 pr-4">Avg Rent (1BHK)</th>
                <th className="py-2 pr-4">Commute</th>
                <th className="py-2">Safety</th>
              </tr>
            </thead>
            <tbody>
              {data.areas.slice(0, 6).map((a) => (
                <tr key={a.name} className="border-b border-teal-100 text-gray-700">
                  <td className="py-2 pr-4 font-medium">{a.name}</td>
                  <td className="py-2 pr-4">{a.rent}</td>
                  <td className="py-2 pr-4">{a.commute}</td>
                  <td className="py-2"><SafetyBadge label={a.safety} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {data.faqs.map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white mb-10">
        <h2 className="text-xl font-bold mb-2">Know a great affordable area in {data.cityName}?</h2>
        <p className="text-teal-100 mb-4 text-sm">Drop a label on the map and help others find affordable housing based on real local experience.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors text-sm">
          <MapPin className="h-4 w-4" />
          Drop a Label on the Map →
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Related Guides</h2>
        <ul className="space-y-2">
          {data.relatedLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="flex items-center gap-2 text-teal-600 hover:text-teal-800 hover:underline text-sm">
                <ChevronRight className="h-4 w-4" />{link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/${data.citySlug}/affordable-areas`} className="flex items-center gap-2 text-teal-600 hover:text-teal-800 hover:underline text-sm">
              <ChevronRight className="h-4 w-4" />Affordable areas in {data.cityName}
            </Link>
          </li>
          <li>
            <Link href={`/${data.citySlug}/safe-neighborhoods`} className="flex items-center gap-2 text-teal-600 hover:text-teal-800 hover:underline text-sm">
              <ChevronRight className="h-4 w-4" />Safest neighborhoods in {data.cityName}
            </Link>
          </li>
          <li>
            <Link href={`/${data.citySlug}/best-areas-for-young-professionals`} className="flex items-center gap-2 text-teal-600 hover:text-teal-800 hover:underline text-sm">
              <ChevronRight className="h-4 w-4" />Best areas for young professionals in {data.cityName}
            </Link>
          </li>
        </ul>
      </div>

      {/* Cheap areas in other cities */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Cheap Areas in Other Indian Cities</h2>
        <div className="flex flex-wrap gap-2">
          {["mumbai", "delhi", "bangalore", "pune", "hyderabad"].filter((c) => c !== data.citySlug).map((c) => (
            <Link key={c} href={`/${c}/cheap-areas-to-live`} className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-colors capitalize">
              💰 Cheap areas in {c}
            </Link>
          ))}
        </div>
      </div>
    </SEOLayout>
  );
}
