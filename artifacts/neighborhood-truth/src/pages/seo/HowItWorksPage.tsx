import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { SEOLayout } from "./SEOLayout";
import { MapPin, ThumbsUp, Filter, Shield, DollarSign, Zap, HelpCircle } from "lucide-react";

const CANONICAL = "https://placelabels.com/how-it-works";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "PlaceLabels", item: "https://placelabels.com" },
    { "@type": "ListItem", position: 2, name: "How It Works", item: CANONICAL },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Who can drop a label on PlaceLabels?", acceptedAnswer: { "@type": "Answer", text: "Anyone can drop a label on PlaceLabels. You don't need to be a registered user to view labels, but you need a free account to add or vote on them. We encourage residents, frequent visitors, and local experts to contribute." } },
    { "@type": "Question", name: "How are labels moderated on PlaceLabels?", acceptedAnswer: { "@type": "Answer", text: "Labels are moderated by the community through upvoting and downvoting. Labels with a very negative vote ratio (more downvotes than upvotes) are automatically flagged for review. Our team also manually reviews reported labels." } },
    { "@type": "Question", name: "What types of labels can I drop on PlaceLabels?", acceptedAnswer: { "@type": "Answer", text: "You can drop labels describing any characteristic of a neighborhood: safety level, cost of living, general vibe (Quiet, Nightlife, Family, Student-friendly etc.), proximity to public transport, food scene quality, and more. Labels can be positive or constructive." } },
    { "@type": "Question", name: "How accurate is the data on PlaceLabels?", acceptedAnswer: { "@type": "Answer", text: "PlaceLabels data is as accurate as its community. High-vote labels from multiple contributors in the same area are generally very reliable. Areas with fewer labels may be less accurate. We show the total number of labels and votes for full transparency." } },
    { "@type": "Question", name: "Does PlaceLabels cover cities outside India?", acceptedAnswer: { "@type": "Answer", text: "Yes, PlaceLabels covers major cities globally including New York, London, Tokyo, Dubai, Singapore, and many others. Our India coverage is the most detailed, with deep data for Mumbai, Delhi, Bangalore, Hyderabad, Pune, Chennai, Kolkata, and Jaipur." } },
  ],
};

export default function HowItWorksPage() {
  return (
    <SEOLayout breadcrumbs={[{ label: "How It Works" }]}>
      <Helmet>
        <title>How PlaceLabels Works — Drop Labels, Vote, Discover</title>
        <meta name="description" content="Learn how to use PlaceLabels — drop a neighborhood label, vote on existing ones, filter by safety/cost/vibe, and find your perfect area. 3-step guide." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={CANONICAL} />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <meta property="og:title" content="How PlaceLabels Works — Drop Labels, Vote, Discover" />
        <meta property="og:description" content="Learn how to use PlaceLabels — drop a neighborhood label, vote on existing ones, filter by safety/cost/vibe, and find your perfect area. 3-step guide." />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://placelabels.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How PlaceLabels Works" />
        <meta name="twitter:description" content="Drop a neighborhood label, vote on existing ones, discover the best areas." />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">How PlaceLabels Works</h1>
      <p className="text-lg text-gray-600 mb-10 max-w-2xl">
        PlaceLabels is a 3-step process: drop a label, vote on others, and discover neighborhoods that fit your needs. Here's everything you need to know.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">The 3-Step Guide</h2>
      <div className="space-y-6 mb-12">
        <div className="bg-white rounded-xl border-2 border-teal-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-teal-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-lg flex-shrink-0">1</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-600" /> Drop a Label
              </h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Open the PlaceLabels map and navigate to any neighborhood. Click on the map to drop a pin, then fill in the label details: a short description of the area, a safety rating (1–5 stars), a cost category (Budget / Affordable / Mid-range / Luxury), and vibe tags.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Labels can be anything a local would tell a friend moving to the area: "Great street food scene," "Avoid this alley at night," "Best connectivity in South Delhi," "surprisingly quiet for a city centre area," and so on. The more specific, the more useful.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-lg flex-shrink-0">2</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-blue-600" /> Vote on Labels
              </h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Every label on PlaceLabels can be upvoted or downvoted by the community. If you've been to an area and a label rings true, upvote it. If it's outdated, inaccurate, or misleading, downvote it.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Labels with more upvotes rank higher in city pages and search results. This community-driven ranking means the most accurate insights float to the top naturally over time — without any editorial bias.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-lg flex-shrink-0">3</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" /> Filter by Your Needs
              </h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Use PlaceLabels' filter system to find neighborhoods that match your specific priorities. Filter by safety level, cost range, vibe (Family, Nightlife, Student, Quiet, etc.), or category (Parks, Cafes, Transport, etc.).
              </p>
              <p className="text-gray-600 leading-relaxed">
                You can also explore our curated city pages for pre-filtered guides: safest areas, most affordable areas, best areas for young professionals, IT hub neighborhoods, student-friendly zones, and more.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">What You Can Label</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { icon: <Shield className="h-5 w-5 text-green-600" />, title: "Safety", desc: "Rate the area from 1 (unsafe) to 5 (very safe). Include specifics like safe for women, safe at night, or specific streets to avoid." },
          { icon: <DollarSign className="h-5 w-5 text-teal-600" />, title: "Cost of Living", desc: "Budget ($), Affordable ($$), Mid-range ($$$), or Luxury ($$$$). Helps others understand what to expect before they visit or move." },
          { icon: <Zap className="h-5 w-5 text-yellow-600" />, title: "Vibe & Atmosphere", desc: "Tags like Family, Nightlife, Quiet, Student, Expat, Foodie, Artsy, and Corporate. Help paint a picture of what life in the area is like." },
          { icon: <MapPin className="h-5 w-5 text-red-500" />, title: "Specific Insights", desc: "Infrastructure issues, hidden gems, best streets, noise levels, commute tips, local market quality, and anything else that would help someone decide where to live." },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              {item.icon}
              <h3 className="font-bold text-gray-900">{item.title}</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4 mb-10">
        {faqSchema.mainEntity.map((item) => (
          <div key={item.name} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
              {item.name}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed ml-6">{item.acceptedAnswer.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white mb-8">
        <h2 className="text-xl font-bold mb-2">Ready to explore or contribute?</h2>
        <p className="text-teal-100 mb-4 text-sm">Open the map, find your area, and drop your first label. Your local knowledge helps thousands of people make better decisions about where to live.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors text-sm">
          <MapPin className="h-4 w-4" />
          Open the Map →
        </Link>
      </div>
    </SEOLayout>
  );
}
