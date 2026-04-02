

## Plan: Dense Seed Labels for India

Add 200+ labels across major Indian cities with realistic neighborhood-level coverage so zooming in reveals rich data.

### Cities and Label Counts

- **Mumbai** — 30 labels (Bandra, Colaba, Juhu, Andheri, Dadar, Lower Parel, Worli, Powai, Dharavi, Marine Drive, Fort, Churchgate)
- **Delhi/NCR** — 35 labels (Connaught Place, Chandni Chowk, Hauz Khas, Saket, Dwarka, Karol Bagh, Lajpat Nagar, Greater Kailash, Paharganj, Defence Colony, Khan Market, Nehru Place, Vasant Kunj, Janakpuri)
- **Bangalore** — 25 labels (Koramangala, Indiranagar, MG Road, Whitefield, Electronic City, HSR Layout, Jayanagar, Malleshwaram, Brigade Road, JP Nagar)
- **Chennai** — 20 labels (T. Nagar, Adyar, Anna Nagar, Mylapore, Nungambakkam, Velachery, Besant Nagar, Guindy, Egmore)
- **Kolkata** — 20 labels (Park Street, Salt Lake, New Town, Howrah, College Street, Esplanade, Ballygunge, Gariahat, Kalighat)
- **Hyderabad** — 20 labels (Banjara Hills, Jubilee Hills, Hitech City, Charminar, Secunderabad, Gachibowli, Madhapur, Ameerpet)
- **Jaipur** — 15 labels (Hawa Mahal area, C-Scheme, Malviya Nagar, Vaishali Nagar, MI Road, Amer)
- **Goa** — 15 labels (Baga, Calangute, Panjim, Old Goa, Anjuna, Vagator, Mapusa)
- **Pune** — 15 labels (Koregaon Park, FC Road, Hinjewadi, Shivaji Nagar, Camp, Kothrud)
- **Varanasi** — 10 labels (Dashashwamedh Ghat, Assi Ghat, Lanka, Godowlia, BHU area)

### Data Variety per Label
Each label will have contextually accurate:
- **Text**: Neighborhood-specific descriptions (e.g., "Street food paradise", "IT hub, overpriced cafes", "Temple quarter, peaceful mornings")
- **Safety**: 1-5 based on real neighborhood reputation
- **Vibes**: Relevant tags (e.g., `["street-food", "loud", "busy"]` for Chandni Chowk; `["hipster", "nightlife", "trendy"]` for Hauz Khas)
- **Cost**: `$` to `$$$$` matching actual cost of living
- **Category**: Mix of Good (Cafes, Parks, Coworking, Street Food, Temples) and Bad (Traffic, Pollution, Tourist Trap, Overpriced)
- **Color**: Matching category sentiment

### Technical
- Single SQL INSERT via database migration tool (~205 rows)
- No schema changes needed
- Coordinates will use precise lat/lng for each specific neighborhood/landmark

