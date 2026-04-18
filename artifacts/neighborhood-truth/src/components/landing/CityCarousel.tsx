import { useLocation } from "wouter";

interface CityCard {
  city: string;
  slug: string;
  image: string;
  labels: string[];
  caption: string;
}

const CITY_COLORS: string[] = [
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#1b4332", "#184e77", "#6b2737", "#7b2d00",
  "#2d6a4f", "#023e8a",
];

const CITIES: CityCard[] = [
  {
    city: "Mumbai",
    slug: "mumbai",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
    labels: ["COASTAL", "EXPENSIVE", "VIBRANT"],
    caption: "Financial capital of India",
  },
  {
    city: "Delhi",
    slug: "delhi",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
    labels: ["HISTORIC", "POLLUTED", "AFFORDABLE"],
    caption: "Power & politics",
  },
  {
    city: "Bangalore",
    slug: "bangalore",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80",
    labels: ["IT HUB", "WALKABLE", "CONGESTED"],
    caption: "Silicon Valley of India",
  },
  {
    city: "Hyderabad",
    slug: "hyderabad",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    labels: ["AFFORDABLE", "GROWING", "BIRYANI"],
    caption: "City of pearls",
  },
  {
    city: "Pune",
    slug: "pune",
    image: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&q=80",
    labels: ["STUDENT", "PLEASANT", "CULTURAL"],
    caption: "Oxford of the East",
  },
  {
    city: "Chennai",
    slug: "chennai",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80",
    labels: ["COASTAL", "HOT", "TRADITIONAL"],
    caption: "Cultural heartland of South",
  },
  {
    city: "Kolkata",
    slug: "kolkata",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
    labels: ["HISTORIC", "ARTISTIC", "CHEAP"],
    caption: "City of joy",
  },
  {
    city: "New York",
    slug: "new-york",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    labels: ["ICONIC", "EXPENSIVE", "DIVERSE"],
    caption: "The city that never sleeps",
  },
  {
    city: "London",
    slug: "london",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
    labels: ["HISTORIC", "RAINY", "MULTICULTURAL"],
    caption: "A city of villages",
  },
  {
    city: "Jaipur",
    slug: "jaipur",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
    labels: ["PINK CITY", "HERITAGE", "AFFORDABLE"],
    caption: "Rajasthan's royal capital",
  },
];

const doubled = [...CITIES, ...CITIES];

export function CityCarousel() {
  const [, navigate] = useLocation();

  return (
    <div className="w-full overflow-hidden py-8 bg-white">
      <div className="relative overflow-hidden">
        <div className="flex gap-px w-max animate-scroll-left-fast will-change-transform">
          {doubled.map((city, i) => (
            <div
              key={`${city.slug}-${i}`}
              onClick={() => navigate(`/${city.slug}`)}
              className="relative flex-shrink-0 w-[65vw] md:w-[36vw] lg:w-[26vw] aspect-[4/5] cursor-pointer overflow-hidden group"
              style={{ backgroundColor: CITY_COLORS[i % CITY_COLORS.length] }}
            >
              <img
                src={city.image}
                alt={city.city}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              <div className="absolute top-4 left-4 flex flex-col gap-0">
                {city.labels.map((label) => (
                  <div
                    key={label}
                    className="bg-white border border-black px-3 h-[22px] flex items-center first:border-b-0 [&:not(:first-child)]:border-t-0"
                    style={{ marginTop: label !== city.labels[0] ? "-1px" : 0 }}
                  >
                    <span className="text-[10px] font-semibold uppercase leading-none">{label}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h3 className="text-xl md:text-2xl font-bold leading-tight">{city.city}</h3>
                <p className="text-sm text-white/80 mt-0.5">{city.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
