import { Link } from "wouter";

const CITY_REGIONS = [
  {
    region: "North America",
    cities: [
      { label: "New York Neighborhoods", href: "/new-york" },
      { label: "San Francisco Neighborhoods", href: "/san-francisco" },
      { label: "Los Angeles Neighborhoods", href: "/los-angeles" },
      { label: "Toronto Neighborhoods", href: "/toronto" },
      { label: "Mexico City Neighborhoods", href: "/mexico-city" },
      { label: "Buenos Aires Neighborhoods", href: "/buenos-aires" },
    ],
  },
  {
    region: "Europe & Middle East",
    cities: [
      { label: "London Neighborhoods", href: "/london" },
      { label: "Amsterdam Neighborhoods", href: "/amsterdam" },
      { label: "Rome Neighborhoods", href: "/rome" },
      { label: "Istanbul Neighborhoods", href: "/istanbul" },
      { label: "Tel Aviv Neighborhoods", href: "/tel-aviv" },
      { label: "Jerusalem Neighborhoods", href: "/jerusalem" },
      { label: "Tehran Neighborhoods", href: "/tehran" },
    ],
  },
  {
    region: "Africa",
    cities: [
      { label: "Cairo Neighborhoods", href: "/cairo" },
      { label: "Cape Town Neighborhoods", href: "/cape-town" },
    ],
  },
  {
    region: "East & Southeast Asia",
    cities: [
      { label: "Tokyo Neighborhoods", href: "/tokyo" },
      { label: "Seoul Neighborhoods", href: "/seoul" },
      { label: "Hong Kong Neighborhoods", href: "/hong-kong" },
      { label: "Bali Neighborhoods", href: "/bali" },
    ],
  },
  {
    region: "India",
    cities: [
      { label: "Mumbai Neighborhoods", href: "/mumbai" },
      { label: "Delhi Neighborhoods", href: "/delhi" },
      { label: "Bangalore Neighborhoods", href: "/bangalore" },
      { label: "Hyderabad Neighborhoods", href: "/hyderabad" },
      { label: "Pune Neighborhoods", href: "/pune" },
      { label: "Chennai Neighborhoods", href: "/chennai" },
      { label: "Kolkata Neighborhoods", href: "/kolkata" },
      { label: "Jaipur Neighborhoods", href: "/jaipur" },
      { label: "Ahmedabad Neighborhoods", href: "/ahmedabad" },
      { label: "Lucknow Neighborhoods", href: "/lucknow" },
      { label: "Chandigarh Neighborhoods", href: "/chandigarh" },
      { label: "Indore Neighborhoods", href: "/indore" },
      { label: "Coimbatore Neighborhoods", href: "/coimbatore" },
      { label: "Goa Neighborhoods", href: "/goa" },
    ],
  },
  {
    region: "South Asia",
    cities: [
      { label: "Karachi Neighborhoods", href: "/karachi" },
      { label: "Lahore Neighborhoods", href: "/lahore" },
    ],
  },
];

export function CityFooter() {
  return (
    <section className="bg-gray-900 text-gray-300 py-12 px-4 mt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-white font-bold text-base mb-6 pb-3 border-b border-gray-700">
          Explore Neighborhoods by City
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {CITY_REGIONS.map((group) => (
            <div key={group.region}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {group.region}
              </p>
              <ul className="space-y-1.5">
                {group.cities.map((city) => (
                  <li key={city.href}>
                    <Link
                      href={city.href}
                      className="text-sm text-gray-300 hover:text-teal-400 hover:underline transition-colors leading-snug"
                    >
                      {city.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-gray-700 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} PlaceLabels — Crowd-sourced neighborhood intelligence from real locals worldwide.</p>
          <p className="mt-1">
            <Link href="/" className="hover:text-teal-400 transition-colors">Open Map</Link>
            {" · "}
            <a href="https://placelabels.com" className="hover:text-teal-400 transition-colors">placelabels.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}
