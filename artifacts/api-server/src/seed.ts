import { db, labelsTable, votesTable } from "@workspace/db";
import { count, sql } from "drizzle-orm";

const COSTS = ["$", "$$", "$$$", "$$$$"] as const;

type SeedLabel = {
  lat: number; lng: number; text: string; safety: number; vibe: string[];
  cost: typeof COSTS[number]; color: string; category: string | null;
  upvotes?: number; downvotes?: number;
};

const SEED_LABELS: SeedLabel[] = [
  // ===== NEW YORK CITY =====
  { lat: 40.7741, lng: -73.9566, text: "Old money vibes", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 42, downvotes: 3 },
  { lat: 40.7730, lng: -73.9590, text: "Best boutiques in NYC", safety: 5, vibe: ["Bougie"], cost: "$$$", color: "#4caf50", category: "Art galleries", upvotes: 28, downvotes: 5 },
  { lat: 40.7870, lng: -73.9750, text: "Museum Mile energy", safety: 5, vibe: ["Family", "Artsy"], cost: "$$$", color: "#2563eb", category: "Art galleries", upvotes: 61, downvotes: 2 },
  { lat: 40.7880, lng: -73.9760, text: "Riverside Park bliss", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 55, downvotes: 1 },
  { lat: 40.7550, lng: -73.9840, text: "Tourists everywhere", safety: 4, vibe: ["Loud"], cost: "$$$", color: "#ef5350", category: "Tourist traps", upvotes: 8, downvotes: 38 },
  { lat: 40.7580, lng: -73.9870, text: "Broadway shows amazing", safety: 4, vibe: ["Bougie", "Loud"], cost: "$$$", color: "#2563eb", category: "Bars", upvotes: 77, downvotes: 4 },
  { lat: 40.7460, lng: -74.0010, text: "Art galleries galore", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 45, downvotes: 6 },
  { lat: 40.7440, lng: -73.9990, text: "Rooftop bars best views", safety: 4, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#7c3aed", category: "Bars", upvotes: 63, downvotes: 8 },
  { lat: 40.7330, lng: -73.9980, text: "NYU campus life everywhere", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#1565c0", category: "Cafes to work", upvotes: 32, downvotes: 7 },
  { lat: 40.7310, lng: -73.9970, text: "Late night eats under $10", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 89, downvotes: 3 },
  { lat: 40.7230, lng: -74.0000, text: "Instagrammable streets", safety: 4, vibe: ["Artsy", "Bougie"], cost: "$$$", color: "#db2777", category: null, upvotes: 74, downvotes: 12 },
  { lat: 40.7220, lng: -73.9990, text: "Cast iron buildings stunning", safety: 4, vibe: ["Artsy"], cost: "$$$", color: "#7c3aed", category: null, upvotes: 38, downvotes: 4 },
  { lat: 40.7150, lng: -73.9850, text: "Taco trucks all day", safety: 3, vibe: ["Chill", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 91, downvotes: 5 },
  { lat: 40.7130, lng: -73.9820, text: "Cheap dim sum heaven", safety: 3, vibe: ["Chill"], cost: "$", color: "#16a34a", category: "Restaurants", upvotes: 104, downvotes: 3 },
  { lat: 40.7070, lng: -74.0090, text: "Finance Bros HQ", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#64b5f6", category: "Coworking", upvotes: 15, downvotes: 29 },
  { lat: 40.7060, lng: -74.0100, text: "Great running path along water", safety: 5, vibe: ["Family"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 88, downvotes: 2 },
  { lat: 40.8110, lng: -73.9500, text: "Community gardens lovely", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 44, downvotes: 8 },
  { lat: 40.8130, lng: -73.9530, text: "Live music on every block", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$", color: "#7c3aed", category: "Bars", upvotes: 67, downvotes: 9 },
  { lat: 40.8430, lng: -73.9390, text: "Dominican food is incredible", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 93, downvotes: 4 },
  { lat: 40.7140, lng: -73.9530, text: "Hipster heaven", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: null, upvotes: 51, downvotes: 11 },
  { lat: 40.7160, lng: -73.9560, text: "Cool independent coffee shops", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 86, downvotes: 3 },
  { lat: 40.7030, lng: -73.9880, text: "Stunning skyline views", safety: 4, vibe: ["Artsy"], cost: "$$$", color: "#2563eb", category: null, upvotes: 72, downvotes: 1 },
  { lat: 40.6720, lng: -73.9770, text: "Brownstones and brunch paradise", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 65, downvotes: 7 },
  { lat: 40.6940, lng: -73.9210, text: "Underground art scene thriving", safety: 3, vibe: ["Artsy", "Loud"], cost: "$", color: "#424242", category: "Art galleries", upvotes: 39, downvotes: 13 },
  { lat: 40.6710, lng: -73.9440, text: "Authentic Caribbean food", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 77, downvotes: 5 },
  { lat: 40.6870, lng: -73.9410, text: "Stuyvesant Heights charm", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 31, downvotes: 6 },
  { lat: 40.7720, lng: -73.9300, text: "Greek food street", safety: 4, vibe: ["Family"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 58, downvotes: 4 },
  { lat: 40.7440, lng: -73.9480, text: "Rising neighborhood quickly", safety: 4, vibe: ["Artsy"], cost: "$$", color: "#0d9488", category: null, upvotes: 27, downvotes: 9 },
  { lat: 40.7490, lng: -73.8830, text: "Diverse melting pot", safety: 3, vibe: ["Family"], cost: "$", color: "#16a34a", category: null, upvotes: 46, downvotes: 7 },
  { lat: 40.7630, lng: -73.8300, text: "Best dumplings outside China", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 99, downvotes: 2 },
  { lat: 40.8170, lng: -73.9180, text: "Yankee stadium energy", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 22, downvotes: 14 },
  { lat: 40.8620, lng: -73.8910, text: "Fordham University area", safety: 3, vibe: ["Chill"], cost: "$", color: "#1565c0", category: null, upvotes: 18, downvotes: 8 },
  { lat: 40.6340, lng: -74.0240, text: "Quiet and residential", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 33, downvotes: 5 },
  { lat: 40.7640, lng: -73.9930, text: "Great food markets everywhere", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 49, downvotes: 7 },
  { lat: 40.7170, lng: -74.0080, text: "Posh and tranquil", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 41, downvotes: 3 },
  { lat: 40.7160, lng: -73.9970, text: "Best soup dumplings in NYC", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 112, downvotes: 2 },
  { lat: 40.7270, lng: -73.9510, text: "Trendy but still approachable", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 57, downvotes: 8 },
  { lat: 40.7589, lng: -73.9851, text: "Times Square is a nightmare", safety: 3, vibe: ["Loud", "Family"], cost: "$$$", color: "#ef5350", category: "Tourist traps", upvotes: 5, downvotes: 71 },
  { lat: 40.7484, lng: -73.9967, text: "Hudson Yards ultra-modern", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 26, downvotes: 19 },
  { lat: 40.7571, lng: -73.9876, text: "9th Avenue incredible food crawl", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 73, downvotes: 4 },
  { lat: 40.7127, lng: -74.0134, text: "One World Trade area memorial", safety: 4, vibe: ["Family", "Loud"], cost: "$$$", color: "#2563eb", category: null, upvotes: 66, downvotes: 3 },
  { lat: 40.7359, lng: -73.9911, text: "Union Square farmer's market", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 84, downvotes: 2 },
  { lat: 40.7068, lng: -73.9517, text: "DUMBO cobblestones", safety: 4, vibe: ["Artsy", "Family"], cost: "$$$", color: "#7c3aed", category: null, upvotes: 53, downvotes: 8 },
  { lat: 40.7831, lng: -73.9712, text: "Columbia University vibe", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#1565c0", category: "Cafes to work", upvotes: 48, downvotes: 6 },
  { lat: 40.7213, lng: -73.9875, text: "Essex Market hidden gems", safety: 3, vibe: ["Family", "Artsy"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 61, downvotes: 5 },
  { lat: 40.7614, lng: -73.9776, text: "Central Park north edge peaceful", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 79, downvotes: 1 },
  { lat: 40.7282, lng: -74.0776, text: "Jersey City views of Manhattan", safety: 4, vibe: ["Chill", "Bougie"], cost: "$$", color: "#16a34a", category: null, upvotes: 41, downvotes: 9 },
  { lat: 40.7488, lng: -73.9680, text: "Greenpoint great coffee", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 69, downvotes: 4 },
  { lat: 40.6782, lng: -73.9442, text: "Best Caribbean food anywhere", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 88, downvotes: 3 },
  { lat: 40.7590, lng: -73.9690, text: "Midtown East quiet streets", safety: 4, vibe: ["Chill"], cost: "$$$", color: "#16a34a", category: null, upvotes: 23, downvotes: 5 },

  // ===== DELHI =====
  { lat: 28.6315, lng: 77.2167, text: "Business hub of Delhi", safety: 3, vibe: ["Bougie", "Loud"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 34, downvotes: 8 },
  { lat: 28.6330, lng: 77.2190, text: "Great for power shopping", safety: 3, vibe: ["Loud", "Family"], cost: "$$", color: "#ea580c", category: null, upvotes: 29, downvotes: 11 },
  { lat: 28.5494, lng: 77.2001, text: "Trendy cafes and boutiques", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Cafes to work", upvotes: 71, downvotes: 4 },
  { lat: 28.5510, lng: 77.1980, text: "Deer park nearby, peaceful", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 52, downvotes: 3 },
  { lat: 28.5680, lng: 77.2410, text: "Affordable shopping market", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: null, upvotes: 44, downvotes: 12 },
  { lat: 28.5700, lng: 77.2430, text: "Street food paradise Lajpat", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 88, downvotes: 4 },
  { lat: 28.6519, lng: 77.1909, text: "Dense market area Karol Bagh", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 33, downvotes: 15 },
  { lat: 28.6507, lng: 77.2311, text: "Old Delhi magic Chandni Chowk", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 97, downvotes: 7 },
  { lat: 28.6490, lng: 77.2330, text: "Spice market sensory overload", safety: 2, vibe: ["Loud"], cost: "$", color: "#424242", category: null, upvotes: 24, downvotes: 19 },
  { lat: 28.5216, lng: 77.2099, text: "Mall central family destination", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#64b5f6", category: null, upvotes: 38, downvotes: 9 },
  { lat: 28.5200, lng: 77.2080, text: "Great for families with kids", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Playgrounds", upvotes: 45, downvotes: 3 },
  { lat: 28.5697, lng: 77.2280, text: "Expat favourite area", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 56, downvotes: 6 },
  { lat: 28.5447, lng: 77.2440, text: "Luxury and calm in Delhi", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 63, downvotes: 4 },
  { lat: 28.5691, lng: 77.2196, text: "Good restaurants row", safety: 4, vibe: ["Family", "Bougie"], cost: "$$$", color: "#ea580c", category: "Restaurants", upvotes: 55, downvotes: 7 },
  { lat: 28.5225, lng: 77.1585, text: "Modern suburbs peaceful", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 34, downvotes: 5 },
  { lat: 28.5921, lng: 77.0460, text: "DDA flats large area", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 18, downvotes: 8 },
  { lat: 28.7279, lng: 77.1173, text: "Planned township feel", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 27, downvotes: 6 },
  { lat: 28.6952, lng: 77.1309, text: "Good schools and parks area", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Playgrounds", upvotes: 41, downvotes: 3 },
  { lat: 28.6441, lng: 77.2128, text: "Backpacker central Paharganj", safety: 3, vibe: ["Loud", "Nightlife"], cost: "$", color: "#424242", category: "Hotels", upvotes: 19, downvotes: 27 },
  { lat: 28.5896, lng: 77.2502, text: "Historic Sufi shrine Nizamuddin", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#7c3aed", category: null, upvotes: 63, downvotes: 4 },
  { lat: 28.5244, lng: 77.1855, text: "Qutub Minar ancient monuments", safety: 3, vibe: ["Family"], cost: "$", color: "#16a34a", category: null, upvotes: 76, downvotes: 3 },
  { lat: 28.6307, lng: 77.2845, text: "East Delhi hustle and bustle", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 22, downvotes: 11 },
  { lat: 28.6450, lng: 77.2964, text: "Metro connectivity excellent", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 35, downvotes: 7 },
  { lat: 28.5760, lng: 77.2290, text: "Best butter chicken here", safety: 4, vibe: ["Family"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 88, downvotes: 2 },

  // ===== MUMBAI =====
  { lat: 19.0596, lng: 72.8295, text: "Bollywood beach vibes", safety: 4, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#db2777", category: "Bars", upvotes: 76, downvotes: 6 },
  { lat: 19.0610, lng: 72.8310, text: "Linking Road weekend shopping", safety: 4, vibe: ["Loud", "Family"], cost: "$$", color: "#ea580c", category: null, upvotes: 44, downvotes: 9 },
  { lat: 19.1002, lng: 72.8269, text: "Celebrities walking around Juhu", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 61, downvotes: 4 },
  { lat: 19.1000, lng: 72.8250, text: "Juhu beach sunsets magical", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#2563eb", category: "Parks", upvotes: 93, downvotes: 2 },
  { lat: 18.9067, lng: 72.9162, text: "Gateway of India morning walks", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c", category: null, upvotes: 85, downvotes: 3 },
  { lat: 18.9050, lng: 72.9140, text: "Luxury hotels row Colaba", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50", category: "Hotels", upvotes: 47, downvotes: 5 },
  { lat: 19.1136, lng: 72.8697, text: "Malls and multiplex Andheri", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 28, downvotes: 11 },
  { lat: 19.1150, lng: 72.8720, text: "Film studios nearby", safety: 4, vibe: ["Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 55, downvotes: 4 },
  { lat: 19.1197, lng: 72.9051, text: "IIT Bombay campus nearby", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#1565c0", category: "Coworking", upvotes: 67, downvotes: 3 },
  { lat: 19.1200, lng: 72.9070, text: "Tech park startup hub Powai", safety: 4, vibe: ["Bougie"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 72, downvotes: 5 },
  { lat: 18.9984, lng: 72.8310, text: "Upmarket restaurants Lower Parel", safety: 4, vibe: ["Bougie", "Nightlife"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 83, downvotes: 4 },
  { lat: 18.9990, lng: 72.8290, text: "Art deco heritage buildings", safety: 4, vibe: ["Artsy", "Bougie"], cost: "$$$", color: "#7c3aed", category: null, upvotes: 74, downvotes: 3 },
  { lat: 19.0095, lng: 72.8183, text: "Sea link bridge views", safety: 4, vibe: ["Chill", "Bougie"], cost: "$$$", color: "#2563eb", category: null, upvotes: 88, downvotes: 2 },
  { lat: 19.0178, lng: 72.8478, text: "Dadar local train junction", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 19, downvotes: 13 },
  { lat: 19.0706, lng: 72.8798, text: "Eastern suburb commuter area", safety: 3, vibe: ["Loud"], cost: "$", color: "#424242", category: null, upvotes: 11, downvotes: 22 },
  { lat: 19.1874, lng: 72.8481, text: "Affordable flats Malad suburbs", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 23, downvotes: 8 },
  { lat: 19.0330, lng: 73.0297, text: "Navi Mumbai planned city", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 37, downvotes: 6 },
  { lat: 18.9432, lng: 72.8232, text: "Marine Drive joggers paradise", safety: 4, vibe: ["Chill", "Family"], cost: "$", color: "#16a34a", category: "Gyms", upvotes: 94, downvotes: 2 },
  { lat: 19.0620, lng: 72.8380, text: "SV Road best food joints", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 67, downvotes: 4 },

  // ===== LONDON =====
  { lat: 51.5248, lng: -0.0786, text: "Trendy weekend market Shoreditch", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 86, downvotes: 5 },
  { lat: 51.5240, lng: -0.0800, text: "Brick Lane curry mile", safety: 4, vibe: ["Artsy", "Chill"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 103, downvotes: 4 },
  { lat: 51.5137, lng: -0.1337, text: "Theatreland Soho amazing", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$$", color: "#7c3aed", category: "Bars", upvotes: 75, downvotes: 7 },
  { lat: 51.5130, lng: -0.1350, text: "Always crowded with tourists", safety: 4, vibe: ["Loud", "Family"], cost: "$$$", color: "#ef5350", category: "Tourist traps", upvotes: 8, downvotes: 44 },
  { lat: 51.5134, lng: -0.2050, text: "Portobello Market Saturdays", safety: 4, vibe: ["Artsy", "Family"], cost: "$$$", color: "#7c3aed", category: null, upvotes: 91, downvotes: 4 },
  { lat: 51.5140, lng: -0.2060, text: "Film location notting hill", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 77, downvotes: 6 },
  { lat: 51.5054, lng: -0.0235, text: "City workers lunch hour mad", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$$", color: "#64b5f6", category: "Coworking", upvotes: 29, downvotes: 21 },
  { lat: 51.5060, lng: -0.0250, text: "Canary Wharf river views", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#2563eb", category: null, upvotes: 58, downvotes: 7 },
  { lat: 51.5390, lng: -0.1426, text: "Camden Market live music", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 84, downvotes: 8 },
  { lat: 51.5380, lng: -0.1430, text: "Regent's Canal towpath walks", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 96, downvotes: 2 },
  { lat: 51.4611, lng: -0.1145, text: "Electric Brixton cultural mix", safety: 3, vibe: ["Artsy", "Family"], cost: "$", color: "#7c3aed", category: null, upvotes: 71, downvotes: 9 },
  { lat: 51.4620, lng: -0.1130, text: "Best jerk chicken in London", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 112, downvotes: 3 },
  { lat: 51.5451, lng: -0.0553, text: "Hackney up and coming", safety: 3, vibe: ["Artsy", "Chill"], cost: "$$", color: "#0d9488", category: null, upvotes: 63, downvotes: 8 },
  { lat: 51.4833, lng: -0.0090, text: "Greenwich Royal history", safety: 4, vibe: ["Family"], cost: "$$", color: "#16a34a", category: null, upvotes: 75, downvotes: 3 },
  { lat: 51.5010, lng: -0.1919, text: "Kensington Natural History Museum", safety: 4, vibe: ["Family", "Bougie"], cost: "$$$", color: "#4caf50", category: null, upvotes: 68, downvotes: 4 },
  { lat: 51.5116, lng: -0.1487, text: "Mayfair London's most exclusive", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 42, downvotes: 17 },
  { lat: 51.5000, lng: -0.1200, text: "Great coffee shops Fitzrovia", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 81, downvotes: 3 },
  { lat: 51.4900, lng: -0.1450, text: "South Bank amazing riverside", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#2563eb", category: null, upvotes: 107, downvotes: 2 },
  { lat: 51.5170, lng: -0.1200, text: "Bloomsbury book lover paradise", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#7c3aed", category: "Bookstores", upvotes: 64, downvotes: 5 },
  { lat: 51.5310, lng: -0.1080, text: "Islington gastropubs excellent", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 53, downvotes: 6 },

  // ===== TOKYO =====
  { lat: 35.6598, lng: 139.7005, text: "Shibuya shopping frenzy", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$", color: "#db2777", category: null, upvotes: 87, downvotes: 5 },
  { lat: 35.6610, lng: 139.7020, text: "Amazing independent coffee shops", safety: 5, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 94, downvotes: 2 },
  { lat: 35.6938, lng: 139.7035, text: "Shinjuku never sleeps", safety: 5, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242", category: "Bars", upvotes: 76, downvotes: 8 },
  { lat: 35.6920, lng: 139.7050, text: "Best ramen in the entire city", safety: 5, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 134, downvotes: 1 },
  { lat: 35.7022, lng: 139.7741, text: "Akihabara anime nerd paradise", safety: 5, vibe: ["Artsy", "Loud"], cost: "$", color: "#7c3aed", category: null, upvotes: 91, downvotes: 7 },
  { lat: 35.7010, lng: 139.7730, text: "Electronics market Akihabara", safety: 5, vibe: ["Loud", "Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 55, downvotes: 6 },
  { lat: 35.6715, lng: 139.7027, text: "Harajuku fashion forward street", safety: 5, vibe: ["Artsy", "Bougie"], cost: "$$$", color: "#db2777", category: null, upvotes: 79, downvotes: 4 },
  { lat: 35.6627, lng: 139.7315, text: "Roppongi expat nightlife", safety: 4, vibe: ["Nightlife", "Loud"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 33, downvotes: 28 },
  { lat: 35.6717, lng: 139.7670, text: "Ginza luxury shopping district", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 67, downvotes: 4 },
  { lat: 35.7148, lng: 139.7967, text: "Asakusa traditional Tokyo feel", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c", category: null, upvotes: 103, downvotes: 2 },
  { lat: 35.6580, lng: 139.7010, text: "Great izakayas everywhere here", safety: 5, vibe: ["Nightlife", "Family"], cost: "$$", color: "#ea580c", category: "Bars", upvotes: 89, downvotes: 3 },
  { lat: 35.7086, lng: 139.7713, text: "Ueno museums and park", safety: 5, vibe: ["Family", "Artsy"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 72, downvotes: 2 },

  // ===== PARIS =====
  { lat: 48.8566, lng: 2.3575, text: "Le Marais galleries falafel", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 88, downvotes: 4 },
  { lat: 48.8560, lng: 2.3560, text: "Sunday brunch spots Marais", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: "Cafes to work", upvotes: 76, downvotes: 3 },
  { lat: 48.8867, lng: 2.3431, text: "Montmartre artists colony", safety: 3, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 97, downvotes: 5 },
  { lat: 48.8880, lng: 2.3440, text: "Sacre Coeur tourist pilgrimage", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#2563eb", category: "Tourist traps", upvotes: 14, downvotes: 37 },
  { lat: 48.8533, lng: 2.3361, text: "Saint-Germain cafe culture", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$$", color: "#7c3aed", category: "Cafes to work", upvotes: 83, downvotes: 4 },
  { lat: 48.8820, lng: 2.3366, text: "Pigalle late night clubs", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242", category: "Bars", upvotes: 45, downvotes: 19 },
  { lat: 48.8638, lng: 2.3751, text: "Oberkampf hipster bars", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#424242", category: "Bars", upvotes: 67, downvotes: 8 },
  { lat: 48.8530, lng: 2.3691, text: "Bastille lively market", safety: 3, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 54, downvotes: 9 },
  { lat: 48.8705, lng: 2.3790, text: "Belleville multicultural food", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 72, downvotes: 6 },
  { lat: 48.8698, lng: 2.3078, text: "Champs tourist landmark row", safety: 4, vibe: ["Loud", "Bougie"], cost: "$$$$", color: "#ef5350", category: "Tourist traps", upvotes: 12, downvotes: 51 },
  { lat: 48.8590, lng: 2.3500, text: "Ile de la Cite stunning views", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#2563eb", category: null, upvotes: 88, downvotes: 3 },
  { lat: 48.8740, lng: 2.3470, text: "Canal Saint-Martin chill", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 91, downvotes: 4 },

  // ===== DUBAI =====
  { lat: 25.0805, lng: 55.1403, text: "Luxury living on water Dubai Marina", safety: 5, vibe: ["Bougie", "Nightlife"], cost: "$$$$", color: "#4caf50", category: "Bars", upvotes: 63, downvotes: 7 },
  { lat: 25.0820, lng: 55.1420, text: "JBR beach walks and dining", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#2563eb", category: "Restaurants", upvotes: 84, downvotes: 3 },
  { lat: 25.1972, lng: 55.2744, text: "Burj Khalifa neighbourhood", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 77, downvotes: 5 },
  { lat: 25.1980, lng: 55.2760, text: "Dubai Mall weekend madness", safety: 5, vibe: ["Loud", "Family"], cost: "$$$", color: "#9e9e9e", category: null, upvotes: 43, downvotes: 21 },
  { lat: 25.2048, lng: 55.2392, text: "Jumeirah beach villas exclusive", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 55, downvotes: 8 },
  { lat: 25.2770, lng: 55.3273, text: "Deira old soul spice souks", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 71, downvotes: 6 },
  { lat: 25.1862, lng: 55.2750, text: "Business Bay office towers", safety: 5, vibe: ["Bougie"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 38, downvotes: 12 },
  { lat: 25.1449, lng: 55.2229, text: "Al Quoz art galleries", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 76, downvotes: 4 },
  { lat: 25.2530, lng: 55.3550, text: "Global Village international", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c", category: null, upvotes: 54, downvotes: 7 },
  { lat: 25.0990, lng: 55.1580, text: "The Palm amazing views", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 89, downvotes: 4 },

  // ===== SINGAPORE =====
  { lat: 1.3050, lng: 103.8320, text: "Orchard Road luxury brands", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 48, downvotes: 11 },
  { lat: 1.3060, lng: 103.8330, text: "Amazing hawker food courts", safety: 5, vibe: ["Family"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 121, downvotes: 2 },
  { lat: 1.2834, lng: 103.8436, text: "Hawker food paradise Chinatown", safety: 5, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 138, downvotes: 1 },
  { lat: 1.2896, lng: 103.8465, text: "Clarke Quay riverside nightlife", safety: 5, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 73, downvotes: 6 },
  { lat: 1.3066, lng: 103.8519, text: "Little India authentic food", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 94, downvotes: 3 },
  { lat: 1.2494, lng: 103.8303, text: "Sentosa resort casino fun", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 55, downvotes: 13 },
  { lat: 1.3190, lng: 103.8686, text: "Tiong Bahru trendy indie", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 87, downvotes: 3 },
  { lat: 1.2860, lng: 103.8533, text: "Tanjong Pagar after work", safety: 5, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 62, downvotes: 8 },

  // ===== SYDNEY =====
  { lat: -33.8908, lng: 151.2743, text: "Bondi beach surf culture", safety: 5, vibe: ["Chill", "Family"], cost: "$$", color: "#2563eb", category: "Gyms", upvotes: 103, downvotes: 3 },
  { lat: -33.8920, lng: 151.2760, text: "Expensive brunch cafes Bondi", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Cafes to work", upvotes: 71, downvotes: 8 },
  { lat: -33.8979, lng: 151.1794, text: "Newtown alternative artsy crowd", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Bookstores", upvotes: 84, downvotes: 5 },
  { lat: -33.8990, lng: 151.1800, text: "Newtown live music pubs", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 78, downvotes: 6 },
  { lat: -33.8871, lng: 151.2097, text: "Surry Hills foodie destination", safety: 4, vibe: ["Bougie", "Nightlife"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 91, downvotes: 4 },
  { lat: -33.8767, lng: 151.2186, text: "Darlinghurst Oxford Street buzzing", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 66, downvotes: 9 },
  { lat: -33.7975, lng: 151.2847, text: "Manly ferry and beaches", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#2563eb", category: "Parks", upvotes: 97, downvotes: 2 },
  { lat: -33.8688, lng: 151.2093, text: "CBD central parks and lunch", safety: 4, vibe: ["Bougie", "Loud"], cost: "$$$", color: "#64b5f6", category: "Restaurants", upvotes: 44, downvotes: 11 },
  { lat: -33.9200, lng: 151.2330, text: "Cronulla beach suburbs lovely", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 58, downvotes: 4 },

  // ===== BERLIN =====
  { lat: 52.5200, lng: 13.4050, text: "Mitte museum island paradise", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 84, downvotes: 4 },
  { lat: 52.5210, lng: 13.4060, text: "Government district historic", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$", color: "#64b5f6", category: null, upvotes: 56, downvotes: 6 },
  { lat: 52.4988, lng: 13.3960, text: "Kreuzberg club scene legendary", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$", color: "#424242", category: "Bars", upvotes: 97, downvotes: 9 },
  { lat: 52.5000, lng: 13.3980, text: "Turkish market Tuesdays great", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 88, downvotes: 5 },
  { lat: 52.5390, lng: 13.4231, text: "Prenzlauer Berg cafes parents", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Cafes to work", upvotes: 76, downvotes: 4 },
  { lat: 52.5400, lng: 13.4240, text: "Farmers market Saturdays best", safety: 4, vibe: ["Family"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 91, downvotes: 2 },
  { lat: 52.5150, lng: 13.4541, text: "Friedrichshain techno bars", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#424242", category: "Bars", upvotes: 73, downvotes: 11 },
  { lat: 52.5160, lng: 13.4550, text: "East side gallery incredible", safety: 3, vibe: ["Artsy"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 112, downvotes: 3 },
  { lat: 52.4800, lng: 13.4350, text: "Neukölln immigrant community", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 65, downvotes: 13 },
  { lat: 52.5150, lng: 13.3800, text: "Charlottenburg elegant shopping", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 52, downvotes: 7 },
  { lat: 52.5290, lng: 13.4400, text: "Hackescher Markt galleries", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 79, downvotes: 4 },

  // ===== BARCELONA =====
  { lat: 41.3833, lng: 2.1766, text: "Gothic Quarter pickpockets watch out", safety: 2, vibe: ["Loud", "Family"], cost: "$$", color: "#424242", category: "Tourist traps", upvotes: 9, downvotes: 62 },
  { lat: 41.3840, lng: 2.1780, text: "Gothic Quarter medieval charm", safety: 3, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 74, downvotes: 9 },
  { lat: 41.3922, lng: 2.1577, text: "Eixample modernist architecture", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: null, upvotes: 83, downvotes: 4 },
  { lat: 41.3930, lng: 2.1590, text: "Eixample great tapas bars", safety: 4, vibe: ["Nightlife", "Family"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 97, downvotes: 3 },
  { lat: 41.4028, lng: 2.1568, text: "Gracia village feel in city", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: null, upvotes: 88, downvotes: 4 },
  { lat: 41.4035, lng: 2.1580, text: "Gracia festival August amazing", safety: 4, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed", category: null, upvotes: 91, downvotes: 3 },
  { lat: 41.3797, lng: 2.1693, text: "El Raval bohemian streets", safety: 3, vibe: ["Artsy", "Loud"], cost: "$", color: "#424242", category: "Bars", upvotes: 54, downvotes: 18 },
  { lat: 41.3800, lng: 2.1893, text: "Barceloneta beach party central", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#2563eb", category: "Bars", upvotes: 76, downvotes: 14 },
  { lat: 41.4050, lng: 2.1610, text: "Sant Pere quiet residential", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: null, upvotes: 43, downvotes: 5 },
  { lat: 41.3700, lng: 2.1600, text: "Sants local neighbourhood feel", safety: 4, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 34, downvotes: 6 },

  // ===== BANGKOK =====
  { lat: 13.7308, lng: 100.5694, text: "Sukhumvit rooftop bars galore", safety: 3, vibe: ["Nightlife", "Bougie"], cost: "$$", color: "#424242", category: "Bars", upvotes: 78, downvotes: 11 },
  { lat: 13.7320, lng: 100.5710, text: "Sukhumvit very busy road", safety: 2, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242", category: null, upvotes: 21, downvotes: 38 },
  { lat: 13.7222, lng: 100.5238, text: "Silom sky train connected", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 62, downvotes: 5 },
  { lat: 13.7230, lng: 100.5250, text: "Lumpini park morning yoga", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Yoga studios", upvotes: 85, downvotes: 2 },
  { lat: 13.7993, lng: 100.5500, text: "Chatuchak weekend market insane", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 96, downvotes: 7 },
  { lat: 13.7590, lng: 100.4971, text: "Khao San Road backpackers", safety: 3, vibe: ["Loud", "Nightlife"], cost: "$", color: "#424242", category: "Bars", upvotes: 38, downvotes: 29 },
  { lat: 13.7404, lng: 100.5093, text: "Chinatown best street food", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 109, downvotes: 4 },
  { lat: 13.7415, lng: 100.5100, text: "Gold jewellery market Yaowarat", safety: 3, vibe: ["Family"], cost: "$$", color: "#ea580c", category: null, upvotes: 64, downvotes: 6 },
  { lat: 13.7450, lng: 100.5330, text: "Silom rooftop sunset great", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 77, downvotes: 5 },
  { lat: 13.7200, lng: 100.5150, text: "Sathorn business district cafes", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 53, downvotes: 7 },

  // ===== EXTRA GLOBAL CITIES =====
  // San Francisco
  { lat: 37.8024, lng: -122.4058, text: "Golden Gate views", safety: 3, vibe: ["Family", "Chill"], cost: "$$$", color: "#2563eb", category: "Parks", upvotes: 94, downvotes: 3 },
  { lat: 37.7749, lng: -122.4194, text: "SoMa tech bro central", safety: 3, vibe: ["Bougie"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 29, downvotes: 21 },
  { lat: 37.7599, lng: -122.4148, text: "Mission Street amazing tacos", safety: 3, vibe: ["Family", "Artsy"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 107, downvotes: 5 },
  { lat: 37.8016, lng: -122.4177, text: "North Beach Italian classics", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 78, downvotes: 4 },
  { lat: 37.7832, lng: -122.4082, text: "Union Square shopping luxury", safety: 4, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 42, downvotes: 13 },

  // Los Angeles
  { lat: 34.0195, lng: -118.4912, text: "Venice Beach artists colony", safety: 3, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 81, downvotes: 9 },
  { lat: 34.0928, lng: -118.3287, text: "Silver Lake hipster haven", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Cafes to work", upvotes: 74, downvotes: 6 },
  { lat: 34.0736, lng: -118.3993, text: "Hollywood Boulevard tourist trap", safety: 3, vibe: ["Loud"], cost: "$$", color: "#ef5350", category: "Tourist traps", upvotes: 7, downvotes: 58 },
  { lat: 34.0626, lng: -118.3588, text: "Koreatown amazing 24hr food", safety: 3, vibe: ["Nightlife", "Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 99, downvotes: 4 },
  { lat: 34.1016, lng: -118.3410, text: "Los Feliz leafy residential", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 55, downvotes: 5 },

  // Mexico City
  { lat: 19.4326, lng: -99.1332, text: "Condesa leafy hipster paradise", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 87, downvotes: 4 },
  { lat: 19.4260, lng: -99.1676, text: "Polanco luxury brands row", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 52, downvotes: 8 },
  { lat: 19.4284, lng: -99.1469, text: "Roma Norte coffee shops great", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 93, downvotes: 3 },
  { lat: 19.4194, lng: -99.1653, text: "Coyoacan Frida Kahlo museum", safety: 4, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 104, downvotes: 2 },
  { lat: 19.3960, lng: -99.1710, text: "Xochimilco floating gardens", safety: 3, vibe: ["Family"], cost: "$", color: "#16a34a", category: null, upvotes: 76, downvotes: 6 },

  // Istanbul
  { lat: 41.0082, lng: 28.9784, text: "Taksim Square always lively", safety: 3, vibe: ["Loud", "Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 44, downvotes: 17 },
  { lat: 41.0135, lng: 28.9440, text: "Beyoglu nightlife and culture", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 68, downvotes: 9 },
  { lat: 41.0082, lng: 28.9784, text: "Grand Bazaar overwhelming", safety: 3, vibe: ["Loud", "Family"], cost: "$$", color: "#ea580c", category: null, upvotes: 37, downvotes: 22 },
  { lat: 41.0151, lng: 29.0201, text: "Kadikoy Asian side gem", safety: 4, vibe: ["Artsy", "Chill"], cost: "$", color: "#0d9488", category: "Restaurants", upvotes: 86, downvotes: 4 },
  { lat: 41.0553, lng: 29.0330, text: "Bosphorus views stunning", safety: 4, vibe: ["Family", "Chill"], cost: "$$$", color: "#2563eb", category: null, upvotes: 97, downvotes: 2 },

  // Amsterdam
  { lat: 52.3702, lng: 4.8952, text: "Red light district wild", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242", category: "Bars", upvotes: 22, downvotes: 34 },
  { lat: 52.3641, lng: 4.8818, text: "De Pijp brunch hotspot", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: "Cafes to work", upvotes: 88, downvotes: 4 },
  { lat: 52.3650, lng: 4.9050, text: "Jordaan canal house beauty", safety: 4, vibe: ["Chill", "Bougie"], cost: "$$$", color: "#4caf50", category: null, upvotes: 103, downvotes: 3 },
  { lat: 52.3800, lng: 4.9000, text: "Noord post-industrial art", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 71, downvotes: 5 },
  { lat: 52.3600, lng: 4.8800, text: "Museumplein world class museums", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 91, downvotes: 3 },

  // Buenos Aires
  { lat: -34.5885, lng: -58.4290, text: "Palermo Soho tango and art", safety: 3, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 79, downvotes: 8 },
  { lat: -34.6037, lng: -58.3816, text: "San Telmo antique market", safety: 3, vibe: ["Artsy", "Chill"], cost: "$", color: "#7c3aed", category: null, upvotes: 64, downvotes: 9 },
  { lat: -34.5755, lng: -58.4315, text: "Las Canitas steak restaurants", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 86, downvotes: 4 },
  { lat: -34.6168, lng: -58.3731, text: "La Boca colorful but touristy", safety: 2, vibe: ["Loud", "Family"], cost: "$$", color: "#ef5350", category: "Tourist traps", upvotes: 11, downvotes: 41 },
  { lat: -34.5710, lng: -58.4350, text: "Belgrano quiet residential", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 47, downvotes: 5 },

  // Toronto
  { lat: 43.6532, lng: -79.3832, text: "Kensington Market eclectic", safety: 3, vibe: ["Artsy", "Chill"], cost: "$", color: "#7c3aed", category: null, upvotes: 81, downvotes: 7 },
  { lat: 43.6612, lng: -79.3988, text: "Queen West trendy Toronto", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 74, downvotes: 8 },
  { lat: 43.6553, lng: -79.3860, text: "Chinatown dim sum Spadina", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 93, downvotes: 4 },
  { lat: 43.7049, lng: -79.3977, text: "North York Korean food strip", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 77, downvotes: 3 },
  { lat: 43.6740, lng: -79.3080, text: "Leslieville emerging brunch", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 65, downvotes: 5 },

  // ===== MORE NYC =====
  { lat: 40.7510, lng: -74.0040, text: "Meatpacking scene still hot", safety: 4, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 66, downvotes: 9 },
  { lat: 40.7306, lng: -73.9352, text: "Williamsburg keeps getting pricier", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$$", color: "#7c3aed", category: "Bars", upvotes: 44, downvotes: 19 },
  { lat: 40.7128, lng: -74.0060, text: "Wall St weekends completely empty", safety: 5, vibe: ["Chill"], cost: "$$$", color: "#64b5f6", category: null, upvotes: 33, downvotes: 11 },
  { lat: 40.7793, lng: -73.9631, text: "Hungarian Pastry Shop legendary", safety: 5, vibe: ["Chill", "Artsy"], cost: "$", color: "#0d9488", category: "Cafes to work", upvotes: 91, downvotes: 2 },
  { lat: 40.8250, lng: -73.9439, text: "Hamilton Heights hidden gem", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 48, downvotes: 7 },
  { lat: 40.7602, lng: -73.9602, text: "Lenox Hill very quiet rich", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 37, downvotes: 4 },
  { lat: 40.6890, lng: -73.9829, text: "Park Slope perfect for families", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#16a34a", category: "Parks", upvotes: 82, downvotes: 4 },
  { lat: 40.6501, lng: -73.9496, text: "Flatbush West Indian carnival", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: null, upvotes: 57, downvotes: 8 },
  { lat: 40.6432, lng: -74.0780, text: "Staten Island ferry free views", safety: 4, vibe: ["Family"], cost: "$", color: "#2563eb", category: null, upvotes: 71, downvotes: 3 },
  { lat: 40.7620, lng: -73.9750, text: "Museum of Art world class", safety: 5, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 104, downvotes: 2 },

  // ===== MORE LONDON =====
  { lat: 51.5155, lng: -0.0922, text: "Barbican arts centre brutalist", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 78, downvotes: 5 },
  { lat: 51.4747, lng: -0.0125, text: "Peckham rising rapidly Rye Lane", safety: 3, vibe: ["Artsy", "Loud"], cost: "$", color: "#0d9488", category: "Bars", upvotes: 69, downvotes: 11 },
  { lat: 51.5568, lng: -0.1077, text: "Crouch End villagey feeling", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 54, downvotes: 5 },
  { lat: 51.4553, lng: -0.0126, text: "New Cross gigs every night", safety: 3, vibe: ["Artsy", "Nightlife"], cost: "$", color: "#7c3aed", category: "Bars", upvotes: 63, downvotes: 12 },
  { lat: 51.5035, lng: -0.1150, text: "Southwark Tate Modern walk", safety: 4, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 88, downvotes: 3 },
  { lat: 51.5295, lng: -0.0862, text: "Dalston Turkish food street", safety: 3, vibe: ["Artsy", "Nightlife"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 74, downvotes: 8 },
  { lat: 51.5074, lng: -0.1278, text: "Trafalgar Square pigeons only", safety: 4, vibe: ["Loud", "Family"], cost: "$$", color: "#ef5350", category: "Tourist traps", upvotes: 11, downvotes: 49 },
  { lat: 51.5119, lng: -0.0707, text: "Bethnal Green cool pubs", safety: 3, vibe: ["Artsy", "Chill"], cost: "$$", color: "#0d9488", category: "Bars", upvotes: 66, downvotes: 8 },

  // ===== MORE TOKYO =====
  { lat: 35.6897, lng: 139.6922, text: "Shimokitazawa vintage shops", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: null, upvotes: 101, downvotes: 2 },
  { lat: 35.7280, lng: 139.7214, text: "Yanaka old Tokyo charm", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 92, downvotes: 1 },
  { lat: 35.6595, lng: 139.6992, text: "Daikanyama quiet boutiques", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 83, downvotes: 3 },
  { lat: 35.6585, lng: 139.7015, text: "Nakameguro canal walks perfect", safety: 5, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 116, downvotes: 2 },
  { lat: 35.6508, lng: 139.7760, text: "Meguro river cherry blossoms", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 128, downvotes: 1 },
  { lat: 35.6880, lng: 139.7014, text: "Shinjuku Gyoen park beautiful", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 97, downvotes: 2 },
  { lat: 35.7316, lng: 139.7046, text: "Ikebukuro west side budget food", safety: 4, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 79, downvotes: 6 },
  { lat: 35.6681, lng: 139.6957, text: "Jiyugaoka European patisseries", safety: 5, vibe: ["Chill", "Family"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 88, downvotes: 3 },

  // ===== MORE PARIS =====
  { lat: 48.8413, lng: 2.3222, text: "Montparnasse literary cafes", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Cafes to work", upvotes: 72, downvotes: 5 },
  { lat: 48.8462, lng: 2.3749, text: "Nation diverse working class", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e", category: null, upvotes: 38, downvotes: 12 },
  { lat: 48.8826, lng: 2.3614, text: "Buttes Chaumont best park", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 93, downvotes: 2 },
  { lat: 48.8580, lng: 2.2945, text: "Tour Eiffel obviously overrated", safety: 4, vibe: ["Loud", "Family"], cost: "$$$", color: "#ef5350", category: "Tourist traps", upvotes: 19, downvotes: 66 },
  { lat: 48.8494, lng: 2.3482, text: "Mouffetard street market", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 84, downvotes: 4 },
  { lat: 48.8780, lng: 2.3050, text: "Batignolles organic market", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 76, downvotes: 3 },
  { lat: 48.8755, lng: 2.2924, text: "Clichy budget neighborhood", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 31, downvotes: 9 },

  // ===== MORE BERLIN =====
  { lat: 52.5100, lng: 13.3750, text: "Tiergarten massive green lung", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 103, downvotes: 2 },
  { lat: 52.4834, lng: 13.4290, text: "Tempelhof airport turned park", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 118, downvotes: 2 },
  { lat: 52.5070, lng: 13.4500, text: "RAW Gelände underground events", safety: 3, vibe: ["Artsy", "Nightlife"], cost: "$", color: "#424242", category: "Bars", upvotes: 84, downvotes: 13 },
  { lat: 52.5140, lng: 13.3410, text: "Savignyplatz classic Berlin", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 62, downvotes: 5 },
  { lat: 52.4685, lng: 13.3210, text: "Steglitz family shopping", safety: 4, vibe: ["Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 29, downvotes: 7 },
  { lat: 52.5456, lng: 13.3500, text: "Wedding gentrifying quickly", safety: 3, vibe: ["Artsy", "Loud"], cost: "$", color: "#0d9488", category: null, upvotes: 47, downvotes: 14 },

  // ===== MORE SINGAPORE =====
  { lat: 1.3000, lng: 103.8560, text: "Dempsey Hill brunch expats", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$$", color: "#4caf50", category: "Restaurants", upvotes: 67, downvotes: 8 },
  { lat: 1.3219, lng: 103.8198, text: "Buona Vista startup campus", safety: 5, vibe: ["Bougie"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 72, downvotes: 4 },
  { lat: 1.2867, lng: 103.8545, text: "Tanjong Pagar after dark", safety: 5, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 81, downvotes: 6 },
  { lat: 1.3048, lng: 103.8318, text: "Newton hawker centre late night", safety: 5, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 94, downvotes: 3 },
  { lat: 1.3644, lng: 103.9915, text: "Changi airport world class", safety: 5, vibe: ["Family"], cost: "$$", color: "#16a34a", category: null, upvotes: 141, downvotes: 2 },

  // ===== MORE SYDNEY =====
  { lat: -33.8523, lng: 151.2108, text: "Glebe market indie vibes", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: null, upvotes: 71, downvotes: 6 },
  { lat: -33.9173, lng: 151.2299, text: "Coogee Beach local favourite", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#2563eb", category: "Parks", upvotes: 88, downvotes: 3 },
  { lat: -33.8650, lng: 151.2094, text: "Chinatown Dixon Street", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 85, downvotes: 5 },
  { lat: -33.8316, lng: 151.0985, text: "Parramatta western suburbs hub", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 34, downvotes: 8 },
  { lat: -33.8607, lng: 151.2058, text: "Haymarket bustle and food", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 67, downvotes: 7 },

  // ===== MORE DUBAI =====
  { lat: 25.0688, lng: 55.1329, text: "Jumeirah Lake Towers walk", safety: 5, vibe: ["Chill", "Bougie"], cost: "$$$", color: "#4caf50", category: null, upvotes: 57, downvotes: 6 },
  { lat: 25.2369, lng: 55.4001, text: "International City budget area", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 22, downvotes: 14 },
  { lat: 25.1117, lng: 55.1390, text: "Dubai Marina walks at night", safety: 5, vibe: ["Chill", "Bougie"], cost: "$$$", color: "#2563eb", category: "Parks", upvotes: 86, downvotes: 3 },
  { lat: 25.2609, lng: 55.3130, text: "Mirdif City Centre suburbs", safety: 4, vibe: ["Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 31, downvotes: 7 },

  // ===== MORE BANGKOK =====
  { lat: 13.7469, lng: 100.5347, text: "Asok area shopping massive", safety: 4, vibe: ["Bougie", "Loud"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 44, downvotes: 9 },
  { lat: 13.6580, lng: 100.5000, text: "Phra Pradaeng green oasis", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 63, downvotes: 4 },
  { lat: 13.7240, lng: 100.4780, text: "Thonburi local riverside life", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 58, downvotes: 6 },
  { lat: 13.8010, lng: 100.5630, text: "Mo Chit weekend market nearby", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: null, upvotes: 47, downvotes: 8 },

  // ===== MORE MUMBAI =====
  { lat: 19.0060, lng: 72.8190, text: "Bandra Fort sunset views", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#2563eb", category: "Parks", upvotes: 97, downvotes: 3 },
  { lat: 19.0528, lng: 72.8433, text: "Carter Road jogging promenade", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Gyms", upvotes: 82, downvotes: 2 },
  { lat: 18.9550, lng: 72.8138, text: "Nariman Point office district", safety: 4, vibe: ["Bougie", "Loud"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 38, downvotes: 9 },
  { lat: 19.1730, lng: 72.9480, text: "Thane peaceful lakeside", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 54, downvotes: 5 },

  // ===== MORE DELHI =====
  { lat: 28.6129, lng: 77.2295, text: "India Gate evening walks", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 91, downvotes: 3 },
  { lat: 28.5538, lng: 77.2090, text: "Mehrauli Qutub archaeology", safety: 3, vibe: ["Family"], cost: "$", color: "#16a34a", category: null, upvotes: 67, downvotes: 4 },
  { lat: 28.6745, lng: 77.2180, text: "Civil Lines colonial bungalows", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 52, downvotes: 6 },
  { lat: 28.6290, lng: 77.0810, text: "Dwarka massive planned suburb", safety: 3, vibe: ["Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 29, downvotes: 9 },
  { lat: 28.4595, lng: 77.0266, text: "Gurugram cyber city growth", safety: 4, vibe: ["Bougie"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 43, downvotes: 14 },

  // ===== BARCELONA MORE =====
  { lat: 41.4145, lng: 2.1527, text: "Park Guell surreal Gaudi", safety: 3, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 94, downvotes: 4 },
  { lat: 41.4036, lng: 2.1744, text: "Poblenou digital arts district", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#0d9488", category: "Coworking", upvotes: 77, downvotes: 5 },
  { lat: 41.3780, lng: 2.1680, text: "Port Olympic too loud summer", safety: 3, vibe: ["Loud", "Nightlife"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 33, downvotes: 27 },
  { lat: 41.3874, lng: 2.1686, text: "Sagrada Familia wow factor", safety: 4, vibe: ["Family"], cost: "$$", color: "#7c3aed", category: null, upvotes: 107, downvotes: 5 },

  // ===== MORE GLOBAL CITIES =====
  // Seoul
  { lat: 37.5172, lng: 127.0473, text: "Gangnam style expensive", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 55, downvotes: 14 },
  { lat: 37.5796, lng: 126.9770, text: "Hongdae youth nightlife culture", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 93, downvotes: 5 },
  { lat: 37.5707, lng: 126.9836, text: "Insadong traditional crafts", safety: 5, vibe: ["Family", "Artsy"], cost: "$", color: "#7c3aed", category: null, upvotes: 78, downvotes: 4 },
  { lat: 37.5133, lng: 127.1000, text: "Jamsil outdoor activities", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 62, downvotes: 4 },
  { lat: 37.5540, lng: 126.9720, text: "Itaewon international mix", safety: 4, vibe: ["Nightlife", "Family"], cost: "$$", color: "#9e9e9e", category: "Restaurants", upvotes: 71, downvotes: 9 },

  // Cairo
  { lat: 30.0444, lng: 31.2357, text: "Zamalek island calm", safety: 3, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Cafes to work", upvotes: 64, downvotes: 7 },
  { lat: 30.0596, lng: 31.2240, text: "Downtown Khedivial architecture", safety: 2, vibe: ["Artsy", "Loud"], cost: "$", color: "#7c3aed", category: null, upvotes: 48, downvotes: 22 },
  { lat: 30.0131, lng: 31.2089, text: "Maadi expat garden suburb", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 67, downvotes: 5 },
  { lat: 30.0000, lng: 31.1200, text: "Pyramids of Giza crowd madness", safety: 2, vibe: ["Loud", "Family"], cost: "$$", color: "#ef5350", category: "Tourist traps", upvotes: 14, downvotes: 43 },

  // Hong Kong
  { lat: 22.2783, lng: 114.1747, text: "Central finance hub expensive", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#4caf50", category: "Coworking", upvotes: 54, downvotes: 13 },
  { lat: 22.3193, lng: 114.1694, text: "Mong Kok craziest density", safety: 4, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 73, downvotes: 7 },
  { lat: 22.2468, lng: 114.1676, text: "Aberdeen fishing village feel", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 59, downvotes: 5 },
  { lat: 22.2821, lng: 114.1585, text: "Wan Chai bars restaurants mix", safety: 5, vibe: ["Nightlife", "Family"], cost: "$$", color: "#424242", category: "Bars", upvotes: 66, downvotes: 8 },
  { lat: 22.3360, lng: 114.1760, text: "Sha Tin racecourse weekends", safety: 5, vibe: ["Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 41, downvotes: 6 },

  // Bali
  { lat: -8.6478, lng: 115.1385, text: "Ubud rice fields meditation", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: null, upvotes: 114, downvotes: 3 },
  { lat: -8.7220, lng: 115.1687, text: "Seminyak beach clubs parties", safety: 3, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 77, downvotes: 11 },
  { lat: -8.7948, lng: 115.1649, text: "Kuta busy tourist beach", safety: 3, vibe: ["Loud", "Nightlife"], cost: "$$", color: "#ef5350", category: "Tourist traps", upvotes: 12, downvotes: 49 },
  { lat: -8.6690, lng: 115.2126, text: "Ubud yoga retreats everywhere", safety: 4, vibe: ["Chill"], cost: "$$", color: "#0d9488", category: "Yoga studios", upvotes: 88, downvotes: 4 },
  { lat: -8.7333, lng: 115.1678, text: "Canggu digital nomad central", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Coworking", upvotes: 103, downvotes: 4 },

  // Cape Town
  { lat: -33.9249, lng: 18.4241, text: "V&A Waterfront stunning", safety: 3, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: null, upvotes: 88, downvotes: 7 },
  { lat: -33.9258, lng: 18.4232, text: "Camps Bay celebrity beach", safety: 4, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 66, downvotes: 9 },
  { lat: -33.9340, lng: 18.4620, text: "Woodstock arts district", safety: 3, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 71, downvotes: 12 },
  { lat: -33.9500, lng: 18.5100, text: "Khayelitsha township reality", safety: 1, vibe: ["Family"], cost: "$", color: "#424242", category: null, upvotes: 26, downvotes: 38 },
  { lat: -33.9321, lng: 18.8601, text: "Stellenbosch wine country", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 94, downvotes: 3 },

  // Rome
  { lat: 41.9028, lng: 12.4964, text: "Trastevere pasta every night", safety: 3, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 96, downvotes: 5 },
  { lat: 41.8986, lng: 12.4769, text: "Vatican tourists 24/7", safety: 3, vibe: ["Loud", "Family"], cost: "$$$", color: "#ef5350", category: "Tourist traps", upvotes: 8, downvotes: 56 },
  { lat: 41.8950, lng: 12.4850, text: "Prati upscale residential", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 62, downvotes: 7 },
  { lat: 41.9109, lng: 12.5290, text: "Pigneto hipster neighbourhood", safety: 3, vibe: ["Artsy", "Nightlife"], cost: "$", color: "#7c3aed", category: "Bars", upvotes: 74, downvotes: 9 },
  { lat: 41.8933, lng: 12.5083, text: "Testaccio food market real Rome", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 102, downvotes: 4 },

  // ===== NAIROBI =====
  { lat: -1.2921, lng: 36.8219, text: "Westlands bar and restaurant hub", safety: 3, vibe: ["Nightlife", "Bougie"], cost: "$$", color: "#424242", category: "Bars", upvotes: 67, downvotes: 11 },
  { lat: -1.2660, lng: 36.8010, text: "Karen leafy suburb expats", safety: 4, vibe: ["Family", "Chill"], cost: "$$$", color: "#16a34a", category: null, upvotes: 58, downvotes: 6 },
  { lat: -1.3030, lng: 36.7800, text: "Kibera hustle reality check", safety: 1, vibe: ["Family"], cost: "$", color: "#424242", category: null, upvotes: 34, downvotes: 51 },
  { lat: -1.2833, lng: 36.8167, text: "CBD matatu chaos peak hour", safety: 2, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 19, downvotes: 43 },
  { lat: -1.2697, lng: 36.7856, text: "Kilimani coffee shops trendy", safety: 3, vibe: ["Bougie", "Chill"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 79, downvotes: 7 },

  // ===== LISBON =====
  { lat: 38.7223, lng: -9.1393, text: "Alfama fado music and tiles", safety: 3, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed", category: null, upvotes: 94, downvotes: 5 },
  { lat: 38.7139, lng: -9.1394, text: "Bairro Alto nightlife student", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$", color: "#424242", category: "Bars", upvotes: 78, downvotes: 9 },
  { lat: 38.7267, lng: -9.1481, text: "Intendente multicultural cheap eats", safety: 3, vibe: ["Artsy", "Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 63, downvotes: 11 },
  { lat: 38.7436, lng: -9.1452, text: "Mouraria authentic historic vibe", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 82, downvotes: 7 },
  { lat: 38.7169, lng: -9.1399, text: "Chiado bookshops and culture", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Bookstores", upvotes: 91, downvotes: 3 },

  // ===== MUMBAI EXTRA =====
  { lat: 19.0060, lng: 72.8420, text: "Bandra West brunch capital", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Cafes to work", upvotes: 88, downvotes: 4 },
  { lat: 19.1310, lng: 72.9100, text: "Hiranandani Powai pretty lake", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 72, downvotes: 3 },
  { lat: 18.9920, lng: 72.8317, text: "Worli Sea Face sunset walk", safety: 4, vibe: ["Chill", "Family"], cost: "$", color: "#2563eb", category: "Parks", upvotes: 85, downvotes: 2 },

  // ===== DELHI EXTRA =====
  { lat: 28.5335, lng: 77.2090, text: "Green Park markets great lunch", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 52, downvotes: 6 },
  { lat: 28.5000, lng: 77.1545, text: "Vasant Kunj malls everywhere", safety: 4, vibe: ["Family", "Bougie"], cost: "$$$", color: "#4caf50", category: null, upvotes: 38, downvotes: 11 },
  { lat: 28.6200, lng: 77.3100, text: "Noida extension affordable flats", safety: 3, vibe: ["Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 27, downvotes: 8 },

  // ===== NYC BOROUGHS EXTRA =====
  { lat: 40.7282, lng: -73.7949, text: "Jamaica Avenue diverse shops", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e", category: null, upvotes: 31, downvotes: 9 },
  { lat: 40.6903, lng: -73.9836, text: "Gowanus industrial art spaces", safety: 3, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 64, downvotes: 8 },
  { lat: 40.7308, lng: -73.8872, text: "Ridgewood quiet border Queens", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 41, downvotes: 6 },

  // ===== SINGAPORE EXTRA =====
  { lat: 1.3520, lng: 103.8198, text: "Bukit Timah nature reserve walks", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 87, downvotes: 2 },
  { lat: 1.2800, lng: 103.8500, text: "Chinatown Smith Street foods", safety: 5, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 101, downvotes: 3 },

  // ===== DUBAI EXTRA =====
  { lat: 25.1891, lng: 55.2736, text: "DIFC art week galleries", safety: 5, vibe: ["Bougie", "Artsy"], cost: "$$$$", color: "#7c3aed", category: "Art galleries", upvotes: 66, downvotes: 5 },
  { lat: 25.0655, lng: 55.1713, text: "JLT lake towers nice walk", safety: 5, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 72, downvotes: 3 },

  // ===== LONDON EXTRA =====
  { lat: 51.5210, lng: -0.0950, text: "Liverpool Street City workers", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$", color: "#64b5f6", category: "Restaurants", upvotes: 44, downvotes: 12 },
  { lat: 51.5034, lng: -0.1196, text: "Westminster political heart", safety: 4, vibe: ["Loud", "Family"], cost: "$$$", color: "#9e9e9e", category: "Tourist traps", upvotes: 19, downvotes: 38 },
  { lat: 51.5194, lng: -0.1270, text: "Covent Garden market always fun", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 74, downvotes: 7 },
  { lat: 51.5252, lng: -0.0698, text: "Spitalfields silk merchants history", safety: 4, vibe: ["Artsy", "Family"], cost: "$$", color: "#7c3aed", category: null, upvotes: 67, downvotes: 5 },

  // ===== TOKYO EXTRA =====
  { lat: 35.7720, lng: 139.6320, text: "Nerima rural Tokyo farms", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 52, downvotes: 3 },
  { lat: 35.6860, lng: 139.6930, text: "Ebisu upscale dining beer museum", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 88, downvotes: 3 },
  { lat: 35.6180, lng: 139.7230, text: "Meguro quiet residential", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 63, downvotes: 2 },

  // ===== PARIS EXTRA =====
  { lat: 48.8420, lng: 2.2880, text: "Auteuil old money Paris", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 44, downvotes: 7 },
  { lat: 48.8680, lng: 2.3430, text: "République gathering protest spot", safety: 3, vibe: ["Artsy", "Loud"], cost: "$", color: "#9e9e9e", category: null, upvotes: 37, downvotes: 14 },
  { lat: 48.8526, lng: 2.3697, text: "Charonne local neighbourhood gem", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 69, downvotes: 4 },

  // ===== BERLIN EXTRA =====
  { lat: 52.5297, lng: 13.3828, text: "Moabit gritty but authentic", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e", category: null, upvotes: 41, downvotes: 13 },
  { lat: 52.4893, lng: 13.3878, text: "Schöneberg LGBTQ+ history", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 83, downvotes: 5 },
  { lat: 52.5440, lng: 13.4120, text: "Weissensee hidden lake gem", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 71, downvotes: 3 },

  // ===== BARCELONA EXTRA =====
  { lat: 41.3673, lng: 2.1517, text: "El Born craft cocktail bars", safety: 3, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#424242", category: "Bars", upvotes: 79, downvotes: 9 },
  { lat: 41.4010, lng: 2.2040, text: "Glories tech district new", safety: 4, vibe: ["Bougie"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 54, downvotes: 7 },

  // ===== BANGKOK EXTRA =====
  { lat: 13.7560, lng: 100.5020, text: "Ratchadaphisek disco strip", safety: 3, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242", category: "Bars", upvotes: 47, downvotes: 21 },
  { lat: 13.6880, lng: 100.6470, text: "Suvarnabhumi airport zone bland", safety: 4, vibe: ["Loud"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 18, downvotes: 22 },
  { lat: 13.8090, lng: 100.5550, text: "Bang Sue grand station area", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e", category: null, upvotes: 26, downvotes: 9 },

  // ===== KUALA LUMPUR =====
  { lat: 3.1569, lng: 101.7121, text: "KLCC Petronas towers view", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: null, upvotes: 86, downvotes: 5 },
  { lat: 3.1412, lng: 101.6865, text: "Bangsar brunch and bars", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$", color: "#4caf50", category: "Restaurants", upvotes: 78, downvotes: 4 },
  { lat: 3.1480, lng: 101.6980, text: "Bukit Bintang shopping belt", safety: 4, vibe: ["Loud", "Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 54, downvotes: 9 },
  { lat: 3.1319, lng: 101.6841, text: "Chow Kit local wet market", safety: 2, vibe: ["Loud", "Family"], cost: "$", color: "#424242", category: "Restaurants", upvotes: 41, downvotes: 24 },
  { lat: 3.1215, lng: 101.6880, text: "Chinatown Petaling Street", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 73, downvotes: 7 },

  // ===== JAKARTA =====
  { lat: -6.2088, lng: 106.8456, text: "Sudirman CBD traffic nightmare", safety: 3, vibe: ["Bougie", "Loud"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 31, downvotes: 29 },
  { lat: -6.2614, lng: 106.7947, text: "Kemang expats restaurants", safety: 3, vibe: ["Bougie", "Family"], cost: "$$", color: "#4caf50", category: "Restaurants", upvotes: 63, downvotes: 8 },
  { lat: -6.1751, lng: 106.8272, text: "Kota Tua old colonial core", safety: 2, vibe: ["Artsy", "Family"], cost: "$", color: "#7c3aed", category: null, upvotes: 57, downvotes: 13 },
  { lat: -6.2272, lng: 106.8066, text: "Menteng leafy central Jakarta", safety: 3, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 44, downvotes: 7 },

  // ===== CHICAGO =====
  { lat: 41.8827, lng: -87.6233, text: "The Loop deep dish pizza stop", safety: 4, vibe: ["Loud", "Family"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 88, downvotes: 4 },
  { lat: 41.9244, lng: -87.6517, text: "Wicker Park indie music scene", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 76, downvotes: 7 },
  { lat: 41.8827, lng: -87.6678, text: "West Loop dining destination", safety: 4, vibe: ["Bougie", "Nightlife"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 91, downvotes: 4 },
  { lat: 41.7943, lng: -87.5973, text: "Hyde Park academic Obama", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#1565c0", category: "Cafes to work", upvotes: 72, downvotes: 5 },
  { lat: 41.9120, lng: -87.6783, text: "Ukrainian Village bungalows", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 54, downvotes: 5 },

  // ===== MIAMI =====
  { lat: 25.7907, lng: -80.1300, text: "Wynwood murals art district", safety: 3, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 94, downvotes: 7 },
  { lat: 25.7617, lng: -80.1918, text: "South Beach party central", safety: 3, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#424242", category: "Bars", upvotes: 71, downvotes: 18 },
  { lat: 25.7617, lng: -80.2000, text: "Art Deco strip Instagram gold", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 83, downvotes: 5 },
  { lat: 25.8577, lng: -80.2786, text: "Aventura mall suburban", safety: 4, vibe: ["Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 35, downvotes: 9 },
  { lat: 25.7680, lng: -80.1956, text: "Brickell financial district", safety: 4, vibe: ["Bougie"], cost: "$$$$", color: "#64b5f6", category: "Coworking", upvotes: 48, downvotes: 12 },

  // ===== NYC CONTINUED =====
  { lat: 40.7580, lng: -73.8290, text: "Flushing best Chinese dim sum", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 121, downvotes: 3 },
  { lat: 40.7750, lng: -73.8770, text: "Flushing Meadows tennis open", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 63, downvotes: 4 },
  { lat: 40.6650, lng: -73.9790, text: "Windsor Terrace quiet leafy", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 51, downvotes: 4 },
  { lat: 40.7300, lng: -73.9530, text: "Long Island City skyline views", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#2563eb", category: "Art galleries", upvotes: 74, downvotes: 5 },
  { lat: 40.7490, lng: -73.9430, text: "Astoria beer gardens amazing", safety: 4, vibe: ["Family", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 88, downvotes: 4 },
  { lat: 40.6840, lng: -73.9760, text: "Carroll Gardens tree-lined charm", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#16a34a", category: null, upvotes: 67, downvotes: 3 },
  { lat: 40.7440, lng: -73.9660, text: "Hunters Point newer development", safety: 4, vibe: ["Chill", "Bougie"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 57, downvotes: 6 },
  { lat: 40.7690, lng: -73.9890, text: "Morningside Heights academic enclave", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#1565c0", category: "Cafes to work", upvotes: 72, downvotes: 4 },

  // ===== TOKYO CONTINUED =====
  { lat: 35.6750, lng: 139.7600, text: "Hiroo international school families", safety: 5, vibe: ["Family", "Bougie"], cost: "$$$", color: "#4caf50", category: null, upvotes: 78, downvotes: 3 },
  { lat: 35.6130, lng: 139.7740, text: "Shinagawa transit hub busy", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$", color: "#9e9e9e", category: null, upvotes: 41, downvotes: 8 },
  { lat: 35.6860, lng: 139.6930, text: "Ebisu upscale dining beer museum", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 88, downvotes: 3 },
  { lat: 35.6280, lng: 139.7780, text: "Oimachi local shopping street", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 54, downvotes: 4 },

  // ===== LONDON CONTINUED =====
  { lat: 51.5120, lng: -0.2170, text: "Shepherd's Bush market diverse", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 64, downvotes: 9 },
  { lat: 51.4490, lng: -0.3120, text: "Richmond park deer weekend goal", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 104, downvotes: 2 },
  { lat: 51.5090, lng: -0.0860, text: "Whitechapel incredibly diverse area", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 57, downvotes: 12 },
  { lat: 51.5450, lng: -0.0280, text: "Stratford Westfield shopping East", safety: 3, vibe: ["Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 38, downvotes: 11 },

  // ===== PARIS CONTINUED =====
  { lat: 48.8600, lng: 2.2890, text: "Trocadero Eiffel photo spot", safety: 3, vibe: ["Family", "Loud"], cost: "$$", color: "#ef5350", category: "Tourist traps", upvotes: 13, downvotes: 44 },
  { lat: 48.8940, lng: 2.2400, text: "Neuilly sur Seine quiet wealthy", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 49, downvotes: 7 },
  { lat: 48.8060, lng: 2.3600, text: "Montrouge south Paris calm", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 42, downvotes: 5 },

  // ===== BERLIN CONTINUED =====
  { lat: 52.4970, lng: 13.5210, text: "Lichtenberg industrial transformation", safety: 3, vibe: ["Artsy"], cost: "$", color: "#7c3aed", category: null, upvotes: 44, downvotes: 15 },
  { lat: 52.5590, lng: 13.4230, text: "Pankow quiet leafy suburb", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 51, downvotes: 4 },

  // ===== SINGAPORE CONTINUED =====
  { lat: 1.2880, lng: 103.7550, text: "West Coast Park kite flying", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 76, downvotes: 2 },
  { lat: 1.4290, lng: 103.8350, text: "Woodlands JB causeway shopping", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 48, downvotes: 10 },

  // ===== SYDNEY CONTINUED =====
  { lat: -33.8870, lng: 151.1980, text: "Ultimo UTS tech hub", safety: 4, vibe: ["Chill"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 54, downvotes: 5 },
  { lat: -33.9630, lng: 151.1060, text: "Kogarah Greek community food", safety: 4, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 62, downvotes: 4 },

  // ===== DUBAI CONTINUED =====
  { lat: 25.1890, lng: 55.2610, text: "Karama South Asian vibes", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 73, downvotes: 6 },
  { lat: 25.2250, lng: 55.2890, text: "Bur Dubai old town heritage", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#ea580c", category: null, upvotes: 64, downvotes: 7 },

  // ===== BARCELONA CONTINUED =====
  { lat: 41.3760, lng: 2.1740, text: "Barceloneta beach sand", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#2563eb", category: "Parks", upvotes: 74, downvotes: 12 },
  { lat: 41.4190, lng: 2.1780, text: "Horta peaceful uphill escape", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 62, downvotes: 3 },

  // ===== CHICAGO CONTINUED =====
  { lat: 41.8559, lng: -87.6298, text: "Bronzeville jazz history revival", safety: 3, vibe: ["Artsy", "Family"], cost: "$", color: "#7c3aed", category: null, upvotes: 67, downvotes: 11 },
  { lat: 41.9200, lng: -87.6350, text: "Bucktown farmers market Sunday", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Restaurants", upvotes: 71, downvotes: 4 },
  { lat: 41.8950, lng: -87.6370, text: "Greektown Halsted Street food", safety: 4, vibe: ["Family"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 82, downvotes: 4 },

  // ===== LISBON CONTINUED =====
  { lat: 38.6970, lng: -9.2060, text: "Belem historical monuments", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 89, downvotes: 3 },
  { lat: 38.7380, lng: -9.1680, text: "Arroios affordable multicultural", safety: 3, vibe: ["Family", "Artsy"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 71, downvotes: 8 },
  { lat: 38.7130, lng: -9.1630, text: "Estrela embassies park quiet", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Parks", upvotes: 63, downvotes: 4 },

  // ===== BANGKOK CONTINUED =====
  { lat: 13.7020, lng: 100.5430, text: "Ari trendy locals neighbourhood", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 84, downvotes: 5 },
  { lat: 13.6790, lng: 100.6010, text: "Onnut BTS local area", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 41, downvotes: 7 },

  // ===== VIENNA =====
  { lat: 48.2093, lng: 16.3728, text: "Innere Stadt imperial grandeur", safety: 5, vibe: ["Family", "Artsy"], cost: "$$$", color: "#7c3aed", category: null, upvotes: 82, downvotes: 4 },
  { lat: 48.1980, lng: 16.3540, text: "Naschmarkt best market in Europe", safety: 5, vibe: ["Family", "Artsy"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 107, downvotes: 3 },
  { lat: 48.2030, lng: 16.3340, text: "Mariahilf trendy locals area", safety: 4, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 79, downvotes: 5 },
  { lat: 48.2230, lng: 16.3560, text: "Alsergrund coffee house culture", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 93, downvotes: 3 },
  { lat: 48.2160, lng: 16.3940, text: "Prater park Riesenrad rides", safety: 4, vibe: ["Family"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 88, downvotes: 4 },

  // ===== CAPE TOWN CONTINUED =====
  { lat: -33.9680, lng: 18.4660, text: "Constantia wine farms beautiful", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 88, downvotes: 3 },
  { lat: -33.9270, lng: 18.4680, text: "Observatory bohemian market vibes", safety: 3, vibe: ["Artsy", "Chill"], cost: "$", color: "#7c3aed", category: "Bars", upvotes: 73, downvotes: 9 },

  // ===== BALI CONTINUED =====
  { lat: -8.5080, lng: 115.2620, text: "Amed diving snorkelling gem", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#2563eb", category: null, upvotes: 88, downvotes: 3 },
  { lat: -8.5940, lng: 115.1640, text: "Tegalalang rice terraces stunning", safety: 4, vibe: ["Family"], cost: "$", color: "#16a34a", category: null, upvotes: 96, downvotes: 4 },

  // ===== SEOUL (EXPANDED) =====
  { lat: 37.5400, lng: 126.9560, text: "Mapo arts and culture hub", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 74, downvotes: 5 },
  { lat: 37.4880, lng: 127.0330, text: "Gangnam luxury shopping Apgujeong", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 62, downvotes: 11 },
  { lat: 37.5780, lng: 127.0040, text: "Jongno-gu historic centre", safety: 5, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 81, downvotes: 4 },
  { lat: 37.5519, lng: 126.9237, text: "Hongdae indie music scene", safety: 5, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 97, downvotes: 6 },
  { lat: 37.5510, lng: 126.9220, text: "Hongdae streets alive at midnight", safety: 4, vibe: ["Nightlife", "Loud"], cost: "$$", color: "#424242", category: "Bars", upvotes: 83, downvotes: 9 },
  { lat: 37.5347, lng: 126.9940, text: "Itaewon multicultural expat hub", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$$", color: "#7c3aed", category: "Restaurants", upvotes: 72, downvotes: 14 },
  { lat: 37.5360, lng: 126.9960, text: "Best foreign food in Seoul here", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 88, downvotes: 5 },
  { lat: 37.5592, lng: 126.9364, text: "Sinchon cheap student eats", safety: 5, vibe: ["Chill", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 91, downvotes: 4 },
  { lat: 37.5816, lng: 126.9840, text: "Bukchon Hanok Village stunning", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 104, downvotes: 3 },
  { lat: 37.5736, lng: 126.9863, text: "Insadong traditional tea houses", safety: 5, vibe: ["Artsy", "Family"], cost: "$$", color: "#ea580c", category: "Cafes to work", upvotes: 79, downvotes: 4 },
  { lat: 37.5636, lng: 126.9830, text: "Myeongdong K-beauty shopping paradise", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$", color: "#db2777", category: null, upvotes: 55, downvotes: 18 },
  { lat: 37.5714, lng: 127.0100, text: "Dongdaemun 24-hour fashion market", safety: 4, vibe: ["Loud", "Nightlife"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 66, downvotes: 7 },
  { lat: 37.5443, lng: 127.0560, text: "Seongsu-dong Seoul Brooklyn", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Cafes to work", upvotes: 93, downvotes: 4 },
  { lat: 37.4979, lng: 127.0276, text: "Gangnam clean and polished", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: null, upvotes: 58, downvotes: 9 },
  { lat: 37.5128, lng: 127.1007, text: "Jamsil Lotte World family zone", safety: 5, vibe: ["Family", "Loud"], cost: "$$", color: "#16a34a", category: null, upvotes: 71, downvotes: 5 },
  { lat: 37.5170, lng: 127.0470, text: "Apgujeong Rodeo Street fashion", safety: 5, vibe: ["Bougie", "Artsy"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 47, downvotes: 12 },

  // ===== HONG KONG =====
  { lat: 22.2822, lng: 114.1581, text: "Central finance district glamour", safety: 5, vibe: ["Bougie", "Loud"], cost: "$$$$", color: "#4caf50", category: "Coworking", upvotes: 68, downvotes: 9 },
  { lat: 22.2810, lng: 114.1570, text: "IFC Mall stunning harbour views", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#2563eb", category: null, upvotes: 81, downvotes: 4 },
  { lat: 22.2975, lng: 114.1722, text: "TST harbourfront iconic views", safety: 5, vibe: ["Family", "Loud"], cost: "$$$", color: "#2563eb", category: null, upvotes: 96, downvotes: 5 },
  { lat: 22.2990, lng: 114.1740, text: "Nathan Road nonstop shopping", safety: 4, vibe: ["Loud", "Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 43, downvotes: 17 },
  { lat: 22.3193, lng: 114.1694, text: "Mong Kok chaotic energy city", safety: 4, vibe: ["Loud", "Family"], cost: "$", color: "#424242", category: null, upvotes: 37, downvotes: 24 },
  { lat: 22.3200, lng: 114.1700, text: "Ladies Market great bargains", safety: 4, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: null, upvotes: 74, downvotes: 8 },
  { lat: 22.2777, lng: 114.1722, text: "Wan Chai gritty and vibrant", safety: 4, vibe: ["Nightlife", "Artsy"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 65, downvotes: 11 },
  { lat: 22.2805, lng: 114.1838, text: "Causeway Bay shopping never stops", safety: 5, vibe: ["Loud", "Bougie"], cost: "$$$", color: "#db2777", category: null, upvotes: 52, downvotes: 14 },
  { lat: 22.2866, lng: 114.1506, text: "Sheung Wan indie galleries cool", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 88, downvotes: 4 },
  { lat: 22.3308, lng: 114.1622, text: "Sham Shui Po electronics bargains", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e", category: null, upvotes: 61, downvotes: 7 },
  { lat: 22.2195, lng: 114.2141, text: "Stanley beach relaxed expat life", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#16a34a", category: "Restaurants", upvotes: 83, downvotes: 3 },
  { lat: 22.2817, lng: 114.1283, text: "Kennedy Town local and authentic", safety: 5, vibe: ["Chill", "Family"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 77, downvotes: 5 },
  { lat: 22.3360, lng: 114.1760, text: "Diamond Hill quiet residential", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 44, downvotes: 6 },
  { lat: 22.2690, lng: 114.1820, text: "Aberdeen fishing village heritage", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 56, downvotes: 7 },
  { lat: 22.3825, lng: 114.1944, text: "Sha Tin New Territories escape", safety: 5, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 63, downvotes: 4 },
  { lat: 22.3756, lng: 114.1218, text: "Tsuen Wan affordable local vibe", safety: 4, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 38, downvotes: 8 },

  // ===== TEHRAN =====
  { lat: 35.8053, lng: 51.4448, text: "Niavaran wealthy leafy north Tehran", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 71, downvotes: 6 },
  { lat: 35.8120, lng: 51.4473, text: "Niavaran palace gardens beautiful", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 85, downvotes: 3 },
  { lat: 35.6720, lng: 51.4186, text: "Grand Bazaar ancient trading city", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 93, downvotes: 8 },
  { lat: 35.6730, lng: 51.4200, text: "Bazaar sensory overload and chaos", safety: 3, vibe: ["Loud"], cost: "$", color: "#424242", category: null, upvotes: 42, downvotes: 21 },
  { lat: 35.7997, lng: 51.4314, text: "Tajrish traditional local bazaar", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 78, downvotes: 5 },
  { lat: 35.8000, lng: 51.4300, text: "Darband mountain trail entrance", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 104, downvotes: 4 },
  { lat: 35.7577, lng: 51.4165, text: "Vanak square upscale dining", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 67, downvotes: 7 },
  { lat: 35.7619, lng: 51.4086, text: "Jordan Ave cafes and restaurants", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$$", color: "#0d9488", category: "Cafes to work", upvotes: 79, downvotes: 5 },
  { lat: 35.7813, lng: 51.4117, text: "Elahieh most expensive Tehran", safety: 5, vibe: ["Bougie"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 54, downvotes: 9 },
  { lat: 35.7014, lng: 51.3911, text: "University area young and vibrant", safety: 3, vibe: ["Chill", "Artsy"], cost: "$", color: "#1565c0", category: "Cafes to work", upvotes: 66, downvotes: 10 },
  { lat: 35.7200, lng: 51.4300, text: "Abbas Abad government district", safety: 4, vibe: ["Chill"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 27, downvotes: 12 },
  { lat: 35.7446, lng: 51.3763, text: "Azadi Tower national symbol area", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 72, downvotes: 4 },
  { lat: 35.7560, lng: 51.3940, text: "Ekbatan huge modern complex", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 41, downvotes: 7 },
  { lat: 35.7690, lng: 51.4520, text: "Pasdaran calm and residential", safety: 4, vibe: ["Family", "Chill"], cost: "$$$", color: "#16a34a", category: null, upvotes: 55, downvotes: 4 },
  { lat: 35.6985, lng: 51.4270, text: "South Tehran authentic and cheap", safety: 2, vibe: ["Family", "Loud"], cost: "$", color: "#424242", category: null, upvotes: 33, downvotes: 19 },

  // ===== TEL AVIV =====
  { lat: 32.0793, lng: 34.7744, text: "Dizengoff Bauhaus architecture amazing", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$$", color: "#7c3aed", category: null, upvotes: 86, downvotes: 4 },
  { lat: 32.0800, lng: 34.7750, text: "Tel Aviv cafe culture world class", safety: 5, vibe: ["Chill", "Artsy"], cost: "$$$", color: "#0d9488", category: "Cafes to work", upvotes: 97, downvotes: 3 },
  { lat: 32.0563, lng: 34.7742, text: "Florentin street art hipster zone", safety: 4, vibe: ["Artsy", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 83, downvotes: 8 },
  { lat: 32.0524, lng: 34.7521, text: "Jaffa ancient port timeless beauty", safety: 4, vibe: ["Artsy", "Family"], cost: "$$", color: "#ea580c", category: null, upvotes: 104, downvotes: 5 },
  { lat: 32.0641, lng: 34.7658, text: "Neve Tzedek boutique gallery gem", safety: 5, vibe: ["Artsy", "Bougie"], cost: "$$$", color: "#4caf50", category: "Art galleries", upvotes: 91, downvotes: 4 },
  { lat: 32.0989, lng: 34.7731, text: "Tel Aviv Port nightlife waterfront", safety: 5, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#2563eb", category: "Bars", upvotes: 78, downvotes: 7 },
  { lat: 32.0690, lng: 34.7793, text: "Rothschild Boulevard vibrant", safety: 5, vibe: ["Chill", "Bougie"], cost: "$$$", color: "#4caf50", category: null, upvotes: 88, downvotes: 3 },

  // ===== JERUSALEM =====
  { lat: 31.7767, lng: 35.2345, text: "Old City world religions converge", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#7c3aed", category: null, upvotes: 112, downvotes: 11 },
  { lat: 31.7780, lng: 35.2310, text: "Western Wall profound experience", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#2563eb", category: null, upvotes: 94, downvotes: 4 },
  { lat: 31.7839, lng: 35.2101, text: "Mahane Yehuda market day and night", safety: 4, vibe: ["Family", "Nightlife"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 88, downvotes: 6 },
  { lat: 31.7610, lng: 35.2184, text: "German Colony quiet cafe streets", safety: 5, vibe: ["Chill", "Family"], cost: "$$$", color: "#0d9488", category: "Cafes to work", upvotes: 73, downvotes: 4 },
  { lat: 31.7759, lng: 35.2083, text: "Rehavia leafy prestigious area", safety: 5, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 61, downvotes: 5 },
  { lat: 31.7780, lng: 35.2202, text: "Mamilla luxury mall near Old City", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 55, downvotes: 9 },
  { lat: 31.7692, lng: 35.2027, text: "Ein Kerem artist village serene", safety: 5, vibe: ["Artsy", "Chill"], cost: "$$", color: "#7c3aed", category: "Art galleries", upvotes: 77, downvotes: 3 },
  { lat: 32.0928, lng: 34.7851, text: "Ramat Aviv university calm enclave", safety: 5, vibe: ["Chill", "Family"], cost: "$$$", color: "#1565c0", category: "Cafes to work", upvotes: 62, downvotes: 4 },
  { lat: 32.0836, lng: 34.7978, text: "Yarkon Park Tel Aviv green lung", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 88, downvotes: 2 },
  { lat: 31.7916, lng: 35.2205, text: "Mea Shearim ultra-orthodox quarter", safety: 3, vibe: ["Family", "Chill"], cost: "$", color: "#9e9e9e", category: null, upvotes: 44, downvotes: 16 },

  // ===== KARACHI =====
  { lat: 24.8120, lng: 67.0313, text: "Clifton sea breezes upscale feel", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 67, downvotes: 9 },
  { lat: 24.8218, lng: 67.0367, text: "Zamzama dining street restaurant row", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#ea580c", category: "Restaurants", upvotes: 83, downvotes: 5 },
  { lat: 24.8037, lng: 67.0540, text: "DHA Defence gated community calm", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 71, downvotes: 7 },
  { lat: 24.8556, lng: 67.0127, text: "Saddar colonial era commerce hub", safety: 3, vibe: ["Loud", "Family"], cost: "$$", color: "#9e9e9e", category: null, upvotes: 38, downvotes: 19 },
  { lat: 24.9337, lng: 67.1057, text: "Gulshan-e-Iqbal middle class heart", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 44, downvotes: 13 },
  { lat: 24.8745, lng: 67.0548, text: "PECHS quiet residential streets", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 52, downvotes: 6 },
  { lat: 24.9050, lng: 67.0850, text: "North Nazimabad affordable living", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 31, downvotes: 11 },

  // ===== LAHORE =====
  { lat: 31.5218, lng: 74.3462, text: "Gulberg upscale Lahore lifestyle", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 76, downvotes: 6 },
  { lat: 31.5099, lng: 74.3437, text: "Liberty Market fashion and food", safety: 4, vibe: ["Family", "Loud"], cost: "$$", color: "#ea580c", category: null, upvotes: 64, downvotes: 9 },
  { lat: 31.5804, lng: 74.3214, text: "Walled City Mughal heritage alive", safety: 3, vibe: ["Family", "Artsy"], cost: "$", color: "#7c3aed", category: null, upvotes: 92, downvotes: 8 },
  { lat: 31.5820, lng: 74.3240, text: "Lahore Fort and Badshahi Mosque", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 107, downvotes: 4 },
  { lat: 31.4825, lng: 74.3971, text: "DHA Lahore modern gated living", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 63, downvotes: 7 },
  { lat: 31.4949, lng: 74.3120, text: "Model Town colonial garden city", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 55, downvotes: 5 },
  { lat: 31.4697, lng: 74.2681, text: "Johar Town dense and affordable", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#9e9e9e", category: null, upvotes: 41, downvotes: 12 },
  { lat: 31.5507, lng: 74.3436, text: "Mall Road colonial promenade", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#16a34a", category: null, upvotes: 69, downvotes: 5 },

  // ===== BANGALORE =====
  { lat: 12.9352, lng: 77.6245, text: "Koramangala startup culture everywhere", safety: 4, vibe: ["Bougie", "Artsy"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 94, downvotes: 5 },
  { lat: 12.9716, lng: 77.6412, text: "Indiranagar 100 Feet Road pub crawl", safety: 4, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#7c3aed", category: "Bars", upvotes: 87, downvotes: 6 },
  { lat: 12.9758, lng: 77.6012, text: "Cubbon Park morning jogs peaceful", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 103, downvotes: 2 },
  { lat: 12.9698, lng: 77.5985, text: "MG Road malls and cafes buzzing", safety: 4, vibe: ["Loud", "Family"], cost: "$$", color: "#ea580c", category: null, upvotes: 61, downvotes: 9 },
  { lat: 12.8445, lng: 77.6791, text: "Electronic City IT campus ghost town on weekends", safety: 4, vibe: ["Chill"], cost: "$$", color: "#9e9e9e", category: "Coworking", upvotes: 33, downvotes: 18 },
  { lat: 12.9279, lng: 77.6271, text: "HSR Layout best biryani in Bangalore", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 82, downvotes: 3 },
  { lat: 13.0071, lng: 77.5686, text: "Malleswaram old Bangalore charm", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 69, downvotes: 4 },
  { lat: 12.9165, lng: 77.6101, text: "Jayanagar South Bangalore quiet and green", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: "Parks", upvotes: 74, downvotes: 3 },
  { lat: 12.9698, lng: 77.7499, text: "Whitefield tech park sprawl long commute", safety: 3, vibe: ["Chill"], cost: "$$", color: "#9e9e9e", category: "Coworking", upvotes: 29, downvotes: 22 },
  { lat: 12.9141, lng: 77.6411, text: "BTM Layout affordable student area", safety: 3, vibe: ["Chill", "Family"], cost: "$", color: "#0d9488", category: null, upvotes: 55, downvotes: 7 },
  { lat: 12.9352, lng: 77.6122, text: "Lalbagh Botanical Garden stunning roses", safety: 5, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 91, downvotes: 1 },
  { lat: 13.0453, lng: 77.6269, text: "Hebbal lake views excellent", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#2563eb", category: "Parks", upvotes: 63, downvotes: 4 },

  // ===== HYDERABAD =====
  { lat: 17.4123, lng: 78.4485, text: "Banjara Hills upscale restaurants row", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 88, downvotes: 5 },
  { lat: 17.4316, lng: 78.4065, text: "Jubilee Hills celebrity neighbourhood", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$$", color: "#4caf50", category: null, upvotes: 71, downvotes: 6 },
  { lat: 17.4474, lng: 78.3762, text: "Hitech City CYBERABAD IT hub", safety: 4, vibe: ["Bougie"], cost: "$$$", color: "#64b5f6", category: "Coworking", upvotes: 79, downvotes: 7 },
  { lat: 17.4400, lng: 78.3489, text: "Gachibowli stadium area modern flats", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#16a34a", category: null, upvotes: 58, downvotes: 6 },
  { lat: 17.3616, lng: 78.4747, text: "Charminar Hyderabadi biryani origin", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 127, downvotes: 3 },
  { lat: 17.4399, lng: 78.4983, text: "Secunderabad twin city calm pace", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 47, downvotes: 5 },
  { lat: 17.4239, lng: 78.4738, text: "Begumpet good for expats and families", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 52, downvotes: 4 },
  { lat: 17.3850, lng: 78.4867, text: "Old City walled bazaars and mosques", safety: 3, vibe: ["Family", "Artsy"], cost: "$", color: "#7c3aed", category: null, upvotes: 83, downvotes: 7 },
  { lat: 17.4948, lng: 78.3996, text: "Madhapur cafes and tech bro coffee", safety: 4, vibe: ["Chill", "Artsy"], cost: "$$", color: "#0d9488", category: "Cafes to work", upvotes: 66, downvotes: 5 },
  { lat: 17.3614, lng: 78.3998, text: "Golconda Fort ancient wonder nearby", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 95, downvotes: 2 },

  // ===== PUNE =====
  { lat: 18.5362, lng: 73.8929, text: "Koregaon Park brunch scene incredible", safety: 4, vibe: ["Bougie", "Artsy"], cost: "$$$", color: "#7c3aed", category: "Restaurants", upvotes: 91, downvotes: 4 },
  { lat: 18.5524, lng: 73.9012, text: "Kalyani Nagar young professionals area", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$", color: "#0d9488", category: "Coworking", upvotes: 73, downvotes: 5 },
  { lat: 18.5679, lng: 73.9143, text: "Viman Nagar airport proximity good", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 54, downvotes: 6 },
  { lat: 18.4907, lng: 73.8140, text: "Kothrud residential and very affordable", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 49, downvotes: 5 },
  { lat: 18.5195, lng: 73.8553, text: "Camp area colonial charm Pune", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 67, downvotes: 5 },
  { lat: 18.5966, lng: 73.7340, text: "Hinjewadi tech park Pune's Electronic City", safety: 3, vibe: ["Chill"], cost: "$$", color: "#9e9e9e", category: "Coworking", upvotes: 34, downvotes: 19 },
  { lat: 18.5116, lng: 73.9283, text: "Magarpatta self-contained smart city", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 61, downvotes: 4 },
  { lat: 18.5236, lng: 73.8478, text: "Shivaji Nagar heart of Pune city", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 38, downvotes: 11 },
  { lat: 18.6186, lng: 73.8037, text: "Aundh peaceful suburb great malls", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 58, downvotes: 4 },
  { lat: 18.5271, lng: 73.8778, text: "FC Road student hangout zone", safety: 4, vibe: ["Chill", "Nightlife"], cost: "$", color: "#0d9488", category: "Cafes to work", upvotes: 77, downvotes: 5 },

  // ===== CHENNAI =====
  { lat: 13.0418, lng: 80.2341, text: "T Nagar shopping mecca for sarees", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: null, upvotes: 88, downvotes: 7 },
  { lat: 13.0827, lng: 80.2707, text: "Anna Nagar planned suburb very liveable", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 73, downvotes: 4 },
  { lat: 13.0012, lng: 80.2565, text: "Adyar quiet and green expat favourite", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 81, downvotes: 3 },
  { lat: 13.0002, lng: 80.2707, text: "Besant Nagar beach walks evening bliss", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#2563eb", category: "Parks", upvotes: 97, downvotes: 2 },
  { lat: 13.0569, lng: 80.2466, text: "Nungambakkam upscale dining and embassies", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: "Restaurants", upvotes: 64, downvotes: 5 },
  { lat: 12.8996, lng: 80.2209, text: "OMR IT corridor long drive but good pay", safety: 4, vibe: ["Chill"], cost: "$$", color: "#9e9e9e", category: "Coworking", upvotes: 45, downvotes: 13 },
  { lat: 13.0337, lng: 80.2697, text: "Mylapore ancient temple neighbourhood", safety: 4, vibe: ["Family", "Artsy"], cost: "$", color: "#7c3aed", category: null, upvotes: 89, downvotes: 3 },
  { lat: 13.0770, lng: 80.2604, text: "Egmore budget hotels near railway", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#9e9e9e", category: "Hotels", upvotes: 29, downvotes: 16 },
  { lat: 12.9591, lng: 80.2175, text: "Velachery south Chennai well connected", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 55, downvotes: 5 },
  { lat: 13.1018, lng: 80.2122, text: "Ambattur industrial area affordable flats", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 31, downvotes: 9 },

  // ===== KOLKATA =====
  { lat: 22.5526, lng: 88.3529, text: "Park Street Kolkata's nightlife heart", safety: 4, vibe: ["Nightlife", "Bougie"], cost: "$$$", color: "#7c3aed", category: "Bars", upvotes: 86, downvotes: 5 },
  { lat: 22.5732, lng: 88.4324, text: "Salt Lake City Sector V IT hub modern", safety: 4, vibe: ["Chill", "Family"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 61, downvotes: 6 },
  { lat: 22.5152, lng: 88.3690, text: "Ballygunge educated affluent area", safety: 4, vibe: ["Family", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 67, downvotes: 4 },
  { lat: 22.5896, lng: 88.4735, text: "New Town Rajarhat tech and new apartments", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 53, downvotes: 6 },
  { lat: 22.5851, lng: 88.3468, text: "North Kolkata heritage homes and chaos", safety: 3, vibe: ["Family", "Artsy"], cost: "$", color: "#7c3aed", category: null, upvotes: 74, downvotes: 8 },
  { lat: 22.5726, lng: 88.3639, text: "College Street bookstores everywhere", safety: 4, vibe: ["Artsy", "Chill"], cost: "$", color: "#7c3aed", category: "Bookstores", upvotes: 98, downvotes: 2 },
  { lat: 22.5448, lng: 88.3298, text: "Maidan huge green lung of Kolkata", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 81, downvotes: 3 },
  { lat: 22.5869, lng: 88.3278, text: "Howrah Bridge iconic walk early morning", safety: 3, vibe: ["Family", "Artsy"], cost: "$", color: "#2563eb", category: null, upvotes: 107, downvotes: 3 },
  { lat: 22.5243, lng: 88.3618, text: "Kalighat temple morning pilgrimage", safety: 3, vibe: ["Family"], cost: "$", color: "#ea580c", category: null, upvotes: 66, downvotes: 5 },
  { lat: 22.5646, lng: 88.3444, text: "New Market best street food Kolkata", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 93, downvotes: 4 },

  // ===== JAIPUR =====
  { lat: 26.9260, lng: 75.8235, text: "Pink City old walled city breathtaking", safety: 3, vibe: ["Family", "Artsy"], cost: "$", color: "#db2777", category: null, upvotes: 112, downvotes: 5 },
  { lat: 26.8927, lng: 75.8069, text: "Malviya Nagar best restaurants in Jaipur", safety: 4, vibe: ["Family", "Bougie"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 79, downvotes: 4 },
  { lat: 26.9124, lng: 75.7390, text: "Vaishali Nagar western Jaipur modern living", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 58, downvotes: 5 },
  { lat: 26.9000, lng: 75.8235, text: "C-scheme upscale consulates area", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 62, downvotes: 4 },
  { lat: 26.9197, lng: 75.8032, text: "Bani Park quiet heritage haveli area", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 54, downvotes: 3 },
  { lat: 26.9124, lng: 75.7877, text: "Mansarovar huge planned township", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 38, downvotes: 8 },
  { lat: 26.9197, lng: 75.8255, text: "MI Road main drag shopping and chaos", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#ea580c", category: null, upvotes: 44, downvotes: 12 },
  { lat: 26.9855, lng: 75.8513, text: "Amber Fort area tourist town excellent", safety: 4, vibe: ["Family", "Artsy"], cost: "$$", color: "#7c3aed", category: null, upvotes: 103, downvotes: 3 },
  { lat: 26.9315, lng: 75.8467, text: "Raja Park local Jaipur feel authentic", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 49, downvotes: 5 },
  { lat: 26.9260, lng: 75.8195, text: "Johari Bazaar gems and jewellery street", safety: 3, vibe: ["Family", "Loud"], cost: "$$", color: "#db2777", category: null, upvotes: 84, downvotes: 6 },

  // ===== LUCKNOW =====
  { lat: 26.8535, lng: 80.9420, text: "Hazratganj heart of Lucknow historical charm", safety: 4, vibe: ["Family", "Old City Charm"], cost: "$$", color: "#7c3aed", category: null, upvotes: 98, downvotes: 4 },
  { lat: 26.8544, lng: 81.0074, text: "Gomti Nagar modern Lucknow IT and malls", safety: 4, vibe: ["IT Hub", "Family"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 82, downvotes: 5 },
  { lat: 26.8785, lng: 80.9985, text: "Indiranagar best restaurants in Lucknow", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 74, downvotes: 5 },
  { lat: 26.8268, lng: 80.9573, text: "Ashiyana Colony affordable family suburb", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 53, downvotes: 4 },
  { lat: 26.8875, lng: 80.9756, text: "Aliganj educated middle class area", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 61, downvotes: 3 },
  { lat: 26.8715, lng: 80.9120, text: "Chowk old city Lucknow nawabi architecture", safety: 3, vibe: ["Old City Charm", "Family"], cost: "$", color: "#ea580c", category: null, upvotes: 91, downvotes: 7 },
  { lat: 26.8676, lng: 80.9205, text: "Aminabad bustling bazaar and street food", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 77, downvotes: 9 },
  { lat: 26.8430, lng: 80.8973, text: "Vikas Nagar DDA housing affordable", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 34, downvotes: 8 },
  { lat: 26.8562, lng: 80.9302, text: "Nishatganj Gomti river view relaxed", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#2563eb", category: "Parks", upvotes: 67, downvotes: 4 },
  { lat: 26.8890, lng: 81.0130, text: "Indira Nagar new Lucknow premium", safety: 4, vibe: ["Family", "Bougie"], cost: "$$$", color: "#4caf50", category: null, upvotes: 73, downvotes: 6 },
  { lat: 26.8654, lng: 80.9523, text: "Mahanagar peaceful tree-lined avenues", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 58, downvotes: 3 },
  { lat: 26.8011, lng: 80.9867, text: "Sushant Golf City luxury gated township", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: null, upvotes: 71, downvotes: 5 },
  { lat: 26.8430, lng: 81.0045, text: "Faizabad Road IT parks and new malls", safety: 4, vibe: ["IT Hub", "Upcoming Area"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 45, downvotes: 7 },
  { lat: 26.8753, lng: 80.9445, text: "Naka Hindola local market flavour", safety: 3, vibe: ["Family", "Loud"], cost: "$", color: "#ea580c", category: null, upvotes: 41, downvotes: 10 },
  { lat: 26.8600, lng: 80.9580, text: "Gomti riverfront new park excellent", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: "Parks", upvotes: 83, downvotes: 2 },

  // ===== INDORE =====
  { lat: 22.7543, lng: 75.8931, text: "Vijay Nagar upscale Indore commercial hub", safety: 4, vibe: ["Bougie", "IT Hub"], cost: "$$$", color: "#4caf50", category: "Coworking", upvotes: 91, downvotes: 5 },
  { lat: 22.6946, lng: 75.8577, text: "Rajwada old Holkar palace heritage area", safety: 3, vibe: ["Old City Charm", "Family"], cost: "$", color: "#7c3aed", category: null, upvotes: 107, downvotes: 5 },
  { lat: 22.7196, lng: 75.8577, text: "MG Road upscale dining and shopping", safety: 4, vibe: ["Bougie", "Family"], cost: "$$", color: "#ea580c", category: "Restaurants", upvotes: 79, downvotes: 6 },
  { lat: 22.7325, lng: 75.9014, text: "Palasia College Road student zone", safety: 4, vibe: ["Student Zone", "Chill"], cost: "$", color: "#0d9488", category: "Cafes to work", upvotes: 73, downvotes: 4 },
  { lat: 22.7426, lng: 75.8775, text: "Mahalakshmi Nagar family residential area", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 62, downvotes: 4 },
  { lat: 22.6837, lng: 75.9201, text: "Rau IT park Indore tech zone growing", safety: 4, vibe: ["IT Hub", "Upcoming Area"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 58, downvotes: 7 },
  { lat: 22.7567, lng: 75.8427, text: "Bhawarkuan posh locality near airport", safety: 4, vibe: ["Bougie", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 65, downvotes: 4 },
  { lat: 22.7286, lng: 75.8649, text: "Annapurna Colony temple town vibe calm", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 54, downvotes: 3 },
  { lat: 22.6995, lng: 75.8333, text: "Sudama Nagar working class affordable", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 37, downvotes: 8 },
  { lat: 22.7703, lng: 75.9086, text: "Pipliyahana IT zone upcoming area", safety: 4, vibe: ["IT Hub", "Upcoming Area"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 49, downvotes: 6 },
  { lat: 22.7469, lng: 75.8267, text: "Silicon City new tech township", safety: 4, vibe: ["IT Hub", "Upcoming Area"], cost: "$$", color: "#64b5f6", category: null, upvotes: 44, downvotes: 8 },
  { lat: 22.7154, lng: 75.9272, text: "Lasudia affordable eastern suburb", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 31, downvotes: 7 },
  { lat: 22.7412, lng: 75.8706, text: "Scheme 54 premium plotted development", safety: 4, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: null, upvotes: 67, downvotes: 4 },
  { lat: 22.7286, lng: 75.8793, text: "Treasure Island Mall area Indore nightlife", safety: 4, vibe: ["Family", "Nightlife"], cost: "$$", color: "#7c3aed", category: "Bars", upvotes: 55, downvotes: 7 },
  { lat: 22.7534, lng: 75.8694, text: "Bicholi Mardana peaceful greens suburb", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 43, downvotes: 5 },

  // ===== COIMBATORE =====
  { lat: 11.0035, lng: 76.9602, text: "RS Puram upscale residential Coimbatore best", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 84, downvotes: 3 },
  { lat: 11.0168, lng: 77.0278, text: "Peelamedu IT colleges and tech zone", safety: 4, vibe: ["IT Hub", "Student Zone"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 79, downvotes: 5 },
  { lat: 11.0004, lng: 76.9601, text: "Gandhipuram central bus stand chaotic bustling", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#ea580c", category: null, upvotes: 45, downvotes: 14 },
  { lat: 11.0228, lng: 76.9559, text: "Saibaba Colony clean tree-lined streets", safety: 4, vibe: ["Family", "Chill"], cost: "$$", color: "#16a34a", category: null, upvotes: 73, downvotes: 3 },
  { lat: 11.0495, lng: 76.9782, text: "Singanallur manufacturing and mid-range housing", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 38, downvotes: 7 },
  { lat: 10.9839, lng: 76.9542, text: "Sungam junction busy commercial area", safety: 3, vibe: ["Loud", "Family"], cost: "$", color: "#ea580c", category: null, upvotes: 41, downvotes: 10 },
  { lat: 11.0074, lng: 76.9710, text: "Race Course premium Coimbatore locality", safety: 5, vibe: ["Bougie", "Family"], cost: "$$$", color: "#4caf50", category: null, upvotes: 88, downvotes: 3 },
  { lat: 11.0145, lng: 76.9226, text: "Vadavalli peaceful western suburb", safety: 4, vibe: ["Family", "Chill"], cost: "$", color: "#16a34a", category: null, upvotes: 62, downvotes: 4 },
  { lat: 10.9613, lng: 76.9613, text: "Kovaipudur serene premium residential hills", safety: 5, vibe: ["Family", "Chill"], cost: "$$$", color: "#4caf50", category: null, upvotes: 71, downvotes: 3 },
  { lat: 11.0202, lng: 77.0102, text: "Hopes College area student hangout zone", safety: 4, vibe: ["Student Zone", "Chill"], cost: "$", color: "#0d9488", category: "Cafes to work", upvotes: 67, downvotes: 4 },
  { lat: 10.9725, lng: 76.9803, text: "Podanur railway junction affordable workers area", safety: 3, vibe: ["Family"], cost: "$", color: "#9e9e9e", category: null, upvotes: 29, downvotes: 8 },
  { lat: 11.0271, lng: 76.9762, text: "Tidel Park IT zone Coimbatore tech belt", safety: 4, vibe: ["IT Hub", "Women Safe"], cost: "$$", color: "#64b5f6", category: "Coworking", upvotes: 75, downvotes: 5 },
  { lat: 11.0337, lng: 76.9668, text: "Avinashi Road colleges and hostels student belt", safety: 4, vibe: ["Student Zone", "Upcoming Area"], cost: "$", color: "#0d9488", category: null, upvotes: 58, downvotes: 6 },
  { lat: 10.9957, lng: 76.9730, text: "Ramanathapuram north Coimbatore upcoming area", safety: 4, vibe: ["Upcoming Area", "Family"], cost: "$$", color: "#0d9488", category: null, upvotes: 46, downvotes: 5 },
  { lat: 11.0100, lng: 77.0062, text: "Ukkadam traditional market old Coimbatore", safety: 3, vibe: ["Old City Charm", "Family"], cost: "$", color: "#ea580c", category: "Restaurants", upvotes: 61, downvotes: 8 },
];

export async function seedIfNeeded(): Promise<void> {
  const [{ value: existingCount }] = await db.select({ value: count() }).from(labelsTable);

  if (existingCount >= SEED_LABELS.length) {
    console.log(`Seed check: DB has ${existingCount} labels (${SEED_LABELS.length} defined), skipping.`);
    return;
  }

  const labelsToInsert = SEED_LABELS.slice(existingCount);
  console.log(`Seeding ${labelsToInsert.length} new labels (${existingCount} already in DB)...`);

  const batchSize = 50;
  for (let i = 0; i < labelsToInsert.length; i += batchSize) {
    const batch = labelsToInsert.slice(i, i + batchSize);
    await db.insert(labelsTable).values(
      batch.map((l) => ({
        lat: l.lat,
        lng: l.lng,
        text: l.text,
        safety: l.safety,
        vibe: l.vibe,
        cost: l.cost,
        color: l.color,
        category: l.category,
        upvotes: l.upvotes ?? 0,
        downvotes: l.downvotes ?? 0,
      }))
    );
    console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} labels`);
  }

  const [{ value: finalCount }] = await db.select({ value: count() }).from(labelsTable);
  console.log(`Seed complete. Total labels in DB: ${finalCount}`);
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.mjs")) {
  seedIfNeeded().then(() => process.exit(0)).catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
