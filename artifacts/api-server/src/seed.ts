import { db, labelsTable } from "@workspace/db";
import { count } from "drizzle-orm";

const VIBES = ["Chill", "Loud", "Bougie", "Artsy", "Family", "Nightlife"];
const COSTS = ["$", "$$", "$$$", "$$$$"] as const;

const SEED_LABELS: Array<{
  lat: number; lng: number; text: string; safety: number; vibe: string[]; cost: typeof COSTS[number]; color: string;
}> = [
  // ===== NEW YORK CITY =====
  { lat: 40.7741, lng: -73.9566, text: "Old money vibes", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50" },
  { lat: 40.7730, lng: -73.9590, text: "Best boutiques in NYC", safety: 5, vibe: ["Bougie"], cost: "$$$", color: "#4caf50" },
  { lat: 40.7870, lng: -73.9750, text: "Museum Mile energy", safety: 5, vibe: ["Family", "Artsy"], cost: "$$$", color: "#2563eb" },
  { lat: 40.7880, lng: -73.9760, text: "Riverside Park bliss", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 40.7550, lng: -73.9840, text: "Tourists everywhere", safety: 4, vibe: ["Loud"], cost: "$$$", color: "#ef5350" },
  { lat: 40.7580, lng: -73.9870, text: "Broadway shows", safety: 4, vibe: ["Bougie", "Loud"], cost: "$$$", color: "#2563eb" },
  { lat: 40.7460, lng: -74.0010, text: "Art galleries galore", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed" },
  { lat: 40.7440, lng: -73.9990, text: "Rooftop bars", safety: 4, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#7c3aed" },
  { lat: 40.7330, lng: -73.9980, text: "NYU campus life", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#1565c0" },
  { lat: 40.7310, lng: -73.9970, text: "Late night eats", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 40.7230, lng: -74.0000, text: "Instagrammable streets", safety: 4, vibe: ["Artsy", "Bougie"], cost: "$$$", color: "#db2777" },
  { lat: 40.7220, lng: -73.9990, text: "Cast iron buildings", safety: 4, vibe: ["Artsy"], cost: "$$$", color: "#7c3aed" },
  { lat: 40.7150, lng: -73.9850, text: "Taco trucks all day", safety: 3, vibe: ["Chill", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 40.7130, lng: -73.9820, text: "Cheap dim sum", safety: 3, vibe: ["Chill"], cost: "$", color: "#16a34a" },
  { lat: 40.7070, lng: -74.0090, text: "Finance Bros HQ", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#64b5f6" },
  { lat: 40.7060, lng: -74.0100, text: "Great running path", safety: 5, vibe: ["Family"], cost: "$", color: "#16a34a" },
  { lat: 40.8110, lng: -73.9500, text: "Community gardens", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a" },
  { lat: 40.8130, lng: -73.9530, text: "Live music on every block", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$", color: "#7c3aed" },
  { lat: 40.8430, lng: -73.9390, text: "Dominican food heaven", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 40.7140, lng: -73.9530, text: "Hipster heaven", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed" },
  { lat: 40.7160, lng: -73.9560, text: "Cool coffee shops", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488" },
  { lat: 40.7030, lng: -73.9880, text: "Stunning skyline views", safety: 4, vibe: ["Artsy"], cost: "$$$", color: "#2563eb" },
  { lat: 40.6720, lng: -73.9770, text: "Brownstones and brunch", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 40.6940, lng: -73.9210, text: "Underground art scene", safety: 3, vibe: ["Artsy", "Loud"], cost: "$", color: "#424242" },
  { lat: 40.6710, lng: -73.9440, text: "Authentic Caribbean food", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 40.6870, lng: -73.9410, text: "Stuyvesant Heights charm", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a" },
  { lat: 40.7720, lng: -73.9300, text: "Greek food street", safety: 4, vibe: ["Family"], cost: "$$", color: "#ea580c" },
  { lat: 40.7440, lng: -73.9480, text: "Rising quickly", safety: 4, vibe: ["Artsy"], cost: "$$", color: "#0d9488" },
  { lat: 40.7490, lng: -73.8830, text: "Diverse melting pot", safety: 3, vibe: ["Family"], cost: "$", color: "#16a34a" },
  { lat: 40.7630, lng: -73.8300, text: "Best dumplings in NYC", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 40.8170, lng: -73.9180, text: "Yankee stadium energy", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e" },
  { lat: 40.8620, lng: -73.8910, text: "University atmosphere", safety: 3, vibe: ["Chill"], cost: "$", color: "#1565c0" },
  { lat: 40.6340, lng: -74.0240, text: "Quiet and residential", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 40.7640, lng: -73.9930, text: "Great food markets", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c" },
  { lat: 40.7170, lng: -74.0080, text: "Posh and quiet", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$$", color: "#4caf50" },
  { lat: 40.7160, lng: -73.9970, text: "Best soup dumplings", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 40.7270, lng: -73.9510, text: "Trendy but approachable", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488" },

  // ===== DELHI =====
  { lat: 28.6315, lng: 77.2167, text: "Business hub of Delhi", safety: 3, vibe: ["Bougie", "Loud"], cost: "$$$", color: "#64b5f6" },
  { lat: 28.6330, lng: 77.2190, text: "Great for shopping", safety: 3, vibe: ["Loud", "Family"], cost: "$$", color: "#ea580c" },
  { lat: 28.5494, lng: 77.2001, text: "Trendy cafes and boutiques", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed" },
  { lat: 28.5510, lng: 77.1980, text: "Deer park nearby", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a" },
  { lat: 28.5680, lng: 77.2410, text: "Affordable shopping", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 28.5700, lng: 77.2430, text: "Street food paradise", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 28.6519, lng: 77.1909, text: "Dense market area", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e" },
  { lat: 28.6507, lng: 77.2311, text: "Old Delhi magic", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 28.6490, lng: 77.2330, text: "Spice market overload", safety: 2, vibe: ["Loud"], cost: "$", color: "#424242" },
  { lat: 28.5216, lng: 77.2099, text: "Mall central", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#64b5f6" },
  { lat: 28.5200, lng: 77.2080, text: "Great for families", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 28.5697, lng: 77.2280, text: "Expat favourite area", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50" },
  { lat: 28.5447, lng: 77.2440, text: "Luxury and calm", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50" },
  { lat: 28.5691, lng: 77.2196, text: "Good restaurants", safety: 4, vibe: ["Family", "Bougie"], cost: "$$$", color: "#ea580c" },
  { lat: 28.5225, lng: 77.1585, text: "Modern suburbs", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 28.5921, lng: 77.0460, text: "DDA flats galore", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e" },
  { lat: 28.7279, lng: 77.1173, text: "Planned township feel", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 28.6952, lng: 77.1309, text: "Good schools area", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 28.6441, lng: 77.2128, text: "Backpacker central", safety: 3, vibe: ["Loud", "Nightlife"], cost: "$", color: "#424242" },
  { lat: 28.5896, lng: 77.2502, text: "Historic Sufi shrine", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#7c3aed" },
  { lat: 28.5244, lng: 77.1855, text: "Ancient monuments", safety: 3, vibe: ["Family"], cost: "$", color: "#16a34a" },
  { lat: 28.6307, lng: 77.2845, text: "East Delhi hustle", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e" },
  { lat: 28.6450, lng: 77.2964, text: "Metro connectivity", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e" },

  // ===== MUMBAI =====
  { lat: 19.0596, lng: 72.8295, text: "Bollywood & beach vibes", safety: 4, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#db2777" },
  { lat: 19.0610, lng: 72.8310, text: "Linking Road shopping", safety: 4, vibe: ["Loud", "Family"], cost: "$$", color: "#ea580c" },
  { lat: 19.1002, lng: 72.8269, text: "Celebrities walking around", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50" },
  { lat: 19.1000, lng: 72.8250, text: "Beach sunsets", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#2563eb" },
  { lat: 18.9067, lng: 72.9162, text: "Gateway of India walks", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c" },
  { lat: 18.9050, lng: 72.9140, text: "Luxury hotels row", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50" },
  { lat: 19.1136, lng: 72.8697, text: "Malls and multiplex", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#9e9e9e" },
  { lat: 19.1150, lng: 72.8720, text: "Film studios nearby", safety: 4, vibe: ["Artsy"], cost: "$$", color: "#7c3aed" },
  { lat: 19.1197, lng: 72.9051, text: "IIT bombay nearby", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#1565c0" },
  { lat: 19.1200, lng: 72.9070, text: "Tech park hub", safety: 4, vibe: ["Bougie"], cost: "$$$", color: "#64b5f6" },
  { lat: 18.9984, lng: 72.8310, text: "Upmarket restaurants", safety: 4, vibe: ["Bougie", "Nightlife"], cost: "$$$", color: "#4caf50" },
  { lat: 18.9990, lng: 72.8290, text: "Art deco buildings", safety: 4, vibe: ["Artsy", "Bougie"], cost: "$$$", color: "#7c3aed" },
  { lat: 19.0095, lng: 72.8183, text: "Sea link views", safety: 4, vibe: ["Chill", "Bougie"], cost: "$$$", color: "#2563eb" },
  { lat: 19.0178, lng: 72.8478, text: "Local train junction", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e" },
  { lat: 19.0706, lng: 72.8798, text: "Dharavi nearby", safety: 2, vibe: ["Loud"], cost: "$", color: "#424242" },
  { lat: 19.1874, lng: 72.8481, text: "Affordable flats", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e" },
  { lat: 19.0330, lng: 73.0297, text: "Planned city, peaceful", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 18.9432, lng: 72.8232, text: "Joggers' park at dusk", safety: 4, vibe: ["Chill", "Family"], cost: "$", color: "#16a34a" },

  // ===== LONDON =====
  { lat: 51.5248, lng: -0.0786, text: "Trendy weekend market", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed" },
  { lat: 51.5240, lng: -0.0800, text: "Brick Lane bagels", safety: 4, vibe: ["Artsy", "Chill"], cost: "$", color: "#ea580c" },
  { lat: 51.5137, lng: -0.1337, text: "Theatreland & Carnaby St", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$$", color: "#7c3aed" },
  { lat: 51.5130, lng: -0.1350, text: "Tourists everywhere", safety: 4, vibe: ["Loud", "Family"], cost: "$$$", color: "#ef5350" },
  { lat: 51.5134, lng: -0.2050, text: "Portobello Market Saturdays", safety: 4, vibe: ["Artsy", "Family"], cost: "$$$", color: "#7c3aed" },
  { lat: 51.5140, lng: -0.2060, text: "Film location vibes", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50" },
  { lat: 51.5054, lng: -0.0235, text: "City workers lunch rush", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$$", color: "#64b5f6" },
  { lat: 51.5060, lng: -0.0250, text: "Stunning river views", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#2563eb" },
  { lat: 51.5390, lng: -0.1426, text: "Markets and live music", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed" },
  { lat: 51.5380, lng: -0.1430, text: "Regent's Canal walks", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a" },
  { lat: 51.4611, lng: -0.1145, text: "Electric cultural mix", safety: 3, vibe: ["Artsy", "Family"], cost: "$", color: "#7c3aed" },
  { lat: 51.4620, lng: -0.1130, text: "Best jerk chicken", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 51.5451, lng: -0.0553, text: "Up and coming", safety: 3, vibe: ["Artsy", "Chill"], cost: "$$", color: "#0d9488" },
  { lat: 51.4833, lng: -0.0090, text: "Royal history tour", safety: 4, vibe: ["Family"], cost: "$$", color: "#16a34a" },
  { lat: 51.5010, lng: -0.1919, text: "Natural History Museum", safety: 4, vibe: ["Family", "Bougie"], cost: "$$$", color: "#4caf50" },
  { lat: 51.5116, lng: -0.1487, text: "London's most exclusive", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50" },

  // ===== TOKYO =====
  { lat: 35.6598, lng: 139.7005, text: "Shopping heaven", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$", color: "#db2777" },
  { lat: 35.6610, lng: 139.7020, text: "Coffee shops everywhere", safety: 5, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488" },
  { lat: 35.6938, lng: 139.7035, text: "Never sleeps", safety: 5, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242" },
  { lat: 35.6920, lng: 139.7050, text: "Best ramen in the city", safety: 5, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 35.7022, lng: 139.7741, text: "Anime nerd paradise", safety: 5, vibe: ["Artsy", "Loud"], cost: "$", color: "#7c3aed" },
  { lat: 35.7010, lng: 139.7730, text: "Electronics market", safety: 5, vibe: ["Loud", "Family"], cost: "$$", color: "#9e9e9e" },
  { lat: 35.6715, lng: 139.7027, text: "Fashion forward", safety: 5, vibe: ["Artsy", "Bougie"], cost: "$$$", color: "#db2777" },
  { lat: 35.6627, lng: 139.7315, text: "Expat nightlife scene", safety: 4, vibe: ["Nightlife", "Loud"], cost: "$$$", color: "#424242" },
  { lat: 35.6717, lng: 139.7670, text: "Window shopping bliss", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50" },
  { lat: 35.7148, lng: 139.7967, text: "Traditional Tokyo feel", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c" },

  // ===== PARIS =====
  { lat: 48.8566, lng: 2.3575, text: "Trendy galleries & falafel", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed" },
  { lat: 48.8560, lng: 2.3560, text: "Sunday brunch spots", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a" },
  { lat: 48.8867, lng: 2.3431, text: "Artists colony history", safety: 3, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed" },
  { lat: 48.8880, lng: 2.3440, text: "Sacré-Cœur views", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#2563eb" },
  { lat: 48.8533, lng: 2.3361, text: "Intellectual café culture", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$$", color: "#7c3aed" },
  { lat: 48.8820, lng: 2.3366, text: "Late night clubs", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242" },
  { lat: 48.8638, lng: 2.3751, text: "Hipster bars", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#424242" },
  { lat: 48.8530, lng: 2.3691, text: "Lively market square", safety: 3, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c" },
  { lat: 48.8705, lng: 2.3790, text: "Multicultural food scene", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 48.8698, lng: 2.3078, text: "Tourist landmark overload", safety: 4, vibe: ["Loud", "Bougie"], cost: "$$$$", color: "#ef5350" },

  // ===== DUBAI =====
  { lat: 25.0805, lng: 55.1403, text: "Luxury living on water", safety: 5, vibe: ["Bougie", "Nightlife"], cost: "$$$$", color: "#4caf50" },
  { lat: 25.0820, lng: 55.1420, text: "JBR beach walks", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#2563eb" },
  { lat: 25.1972, lng: 55.2744, text: "Burj Khalifa neighbourhood", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#4caf50" },
  { lat: 25.1980, lng: 55.2760, text: "Dubai Mall craziness", safety: 5, vibe: ["Loud", "Family"], cost: "$$$", color: "#9e9e9e" },
  { lat: 25.2048, lng: 55.2392, text: "Beach villas row", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50" },
  { lat: 25.2770, lng: 55.3273, text: "Old soul, spice souks", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 25.1862, lng: 55.2750, text: "Office towers", safety: 5, vibe: ["Bougie"], cost: "$$$", color: "#64b5f6" },
  { lat: 25.1449, lng: 55.2229, text: "Art galleries, hidden bars", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed" },

  // ===== SINGAPORE =====
  { lat: 1.3050, lng: 103.8320, text: "Luxury brands everywhere", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#4caf50" },
  { lat: 1.3060, lng: 103.8330, text: "Amazing food courts", safety: 5, vibe: ["Family"], cost: "$$", color: "#ea580c" },
  { lat: 1.2834, lng: 103.8436, text: "Hawker food paradise", safety: 5, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 1.2896, lng: 103.8465, text: "Riverside nightlife", safety: 5, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#424242" },
  { lat: 1.3066, lng: 103.8519, text: "Authentic Indian food", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 1.2494, lng: 103.8303, text: "Resorts and casinos", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50" },

  // ===== SYDNEY =====
  { lat: -33.8908, lng: 151.2743, text: "Surf culture heaven", safety: 5, vibe: ["Chill", "Family"], cost: "$$", color: "#2563eb" },
  { lat: -33.8920, lng: 151.2760, text: "Expensive brunch cafes", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50" },
  { lat: -33.8979, lng: 151.1794, text: "Alternative, artsy crowd", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed" },
  { lat: -33.8990, lng: 151.1800, text: "Live music pubs", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#7c3aed" },
  { lat: -33.8871, lng: 151.2097, text: "Foodie destination", safety: 4, vibe: ["Bougie", "Nightlife"], cost: "$$$", color: "#4caf50" },
  { lat: -33.8767, lng: 151.2186, text: "Oxford Street buzzing", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#7c3aed" },
  { lat: -33.7975, lng: 151.2847, text: "Ferry rides and beaches", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#2563eb" },

  // ===== BERLIN =====
  { lat: 52.5200, lng: 13.4050, text: "Museum island paradise", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed" },
  { lat: 52.5210, lng: 13.4060, text: "Government district vibes", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$", color: "#64b5f6" },
  { lat: 52.4988, lng: 13.3960, text: "Club scene is legendary", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$", color: "#424242" },
  { lat: 52.5000, lng: 13.3980, text: "Turkish market Tuesdays", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 52.5390, lng: 13.4231, text: "Cafes and young parents", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 52.5400, lng: 13.4240, text: "Farmers market Saturdays", safety: 4, vibe: ["Family"], cost: "$$", color: "#16a34a" },
  { lat: 52.5150, lng: 13.4541, text: "Techno bars", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#424242" },
  { lat: 52.5160, lng: 13.4550, text: "East side gallery area", safety: 3, vibe: ["Artsy"], cost: "$$", color: "#7c3aed" },
  { lat: 52.4800, lng: 13.4350, text: "Immigrant community food", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },

  // ===== BARCELONA =====
  { lat: 41.3833, lng: 2.1766, text: "Pickpocket watch out!", safety: 2, vibe: ["Loud", "Family"], cost: "$$", color: "#424242" },
  { lat: 41.3840, lng: 2.1780, text: "Medieval charm", safety: 3, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed" },
  { lat: 41.3922, lng: 2.1577, text: "Modernist architecture", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50" },
  { lat: 41.3930, lng: 2.1590, text: "Great tapas bars", safety: 4, vibe: ["Nightlife", "Family"], cost: "$$", color: "#ea580c" },
  { lat: 41.4028, lng: 2.1568, text: "Village feel in the city", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a" },
  { lat: 41.4035, lng: 2.1580, text: "Gracia festival August", safety: 4, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed" },
  { lat: 41.3797, lng: 2.1693, text: "Bohemian streets", safety: 3, vibe: ["Artsy", "Loud"], cost: "$", color: "#424242" },
  { lat: 41.3800, lng: 2.1893, text: "Beach party central", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#2563eb" },

  // ===== BANGKOK =====
  { lat: 13.7308, lng: 100.5694, text: "Rooftop bars galore", safety: 3, vibe: ["Nightlife", "Bougie"], cost: "$$", color: "#424242" },
  { lat: 13.7320, lng: 100.5710, text: "Nana Plaza nearby...", safety: 2, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242" },
  { lat: 13.7222, lng: 100.5238, text: "Sky train connected", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#64b5f6" },
  { lat: 13.7230, lng: 100.5250, text: "Lumpini park runs", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a" },
  { lat: 13.7993, lng: 100.5500, text: "Weekend market madness", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#ea580c" },
  { lat: 13.7590, lng: 100.4971, text: "Backpacker central", safety: 3, vibe: ["Loud", "Nightlife"], cost: "$", color: "#424242" },
  { lat: 13.7404, lng: 100.5093, text: "Best street food ever", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c" },
  { lat: 13.7415, lng: 100.5100, text: "Gold jewellery market", safety: 3, vibe: ["Family"], cost: "$$", color: "#ea580c" },

  // ===== EXTRA NYC LABELS =====
  { lat: 40.7589, lng: -73.9851, text: "Times Square horror", safety: 3, vibe: ["Loud", "Family"], cost: "$$$", color: "#ef5350" },
  { lat: 40.7488, lng: -73.9680, text: "Great coffee at Greenpoint", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488" },
  { lat: 40.6782, lng: -73.9442, text: "Best Caribbean food", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c" },
  { lat: 40.7282, lng: -73.7949, text: "JFK airport hotels strip", safety: 3, vibe: ["Loud"], cost: "$$", color: "#9e9e9e" },
  { lat: 40.7590, lng: -73.9690, text: "Midtown East quiet streets", safety: 4, vibe: ["Chill"], cost: "$$$", color: "#16a34a" },
  { lat: 40.7614, lng: -73.9776, text: "Central Park north edge", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 40.6892, lng: -74.0445, text: "Staten Island Ferry terminal", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e" },
  { lat: 40.7282, lng: -74.0776, text: "Jersey City views", safety: 4, vibe: ["Chill", "Bougie"], cost: "$$", color: "#16a34a" },
  { lat: 40.7831, lng: -73.9712, text: "Columbia University area", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#1565c0" },
  { lat: 40.7484, lng: -73.9967, text: "Hudson Yards modern", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50" },
  { lat: 40.7571, lng: -73.9876, text: "9th Avenue food crawl", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c" },
  { lat: 40.7127, lng: -74.0134, text: "One World Trade area", safety: 4, vibe: ["Family", "Loud"], cost: "$$$", color: "#2563eb" },
  { lat: 40.7213, lng: -73.9875, text: "Essex Market gems", safety: 3, vibe: ["Family", "Artsy"], cost: "$$", color: "#ea580c" },
  { lat: 40.7359, lng: -73.9911, text: "Union Square farmer's market", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a" },
  { lat: 40.7068, lng: -73.9517, text: "DUMBO cobblestones", safety: 4, vibe: ["Artsy", "Family"], cost: "$$$", color: "#7c3aed" },
  { lat: 40.6501, lng: -73.9496, text: "Flatbush Avenue life", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e" },
  { lat: 40.7282, lng: -73.8082, text: "Diverse Queens neighborhood", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e" },
  { lat: 40.7580, lng: -73.8290, text: "Flushing Meadows park", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a" },
];

async function seed() {
  const [{ value: existingCount }] = await db.select({ value: count() }).from(labelsTable);
  
  if (existingCount >= 50) {
    console.log(`Database already has ${existingCount} labels, skipping seed.`);
    process.exit(0);
  }

  console.log(`Seeding ${SEED_LABELS.length} labels...`);
  
  const batchSize = 50;
  for (let i = 0; i < SEED_LABELS.length; i += batchSize) {
    const batch = SEED_LABELS.slice(i, i + batchSize);
    await db.insert(labelsTable).values(batch);
    console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} labels`);
  }
  
  const [{ value: finalCount }] = await db.select({ value: count() }).from(labelsTable);
  console.log(`Seed complete. Total labels in DB: ${finalCount}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
