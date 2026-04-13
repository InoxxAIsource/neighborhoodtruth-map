# PlaceLabels — Honest Neighborhood Reviews from Real Locals

> **Drop a label. Vote on insights. Find your perfect area.**  
> A crowd-sourced global neighborhood map where locals tell the truth about where they live.

🌍 **Live at [placelabels.com](https://placelabels.com)**

---

## What Is PlaceLabels?

PlaceLabels is a community-powered neighborhood intelligence platform. Instead of relying on outdated statistics or corporate data, PlaceLabels lets **real locals** drop honest labels about any neighborhood in the world — covering safety, cost of living, vibe, noise levels, walkability, and more.

Anyone can:
- 📍 **Drop a label** — pin a neighborhood anywhere on the map with honest insights
- 👍 **Vote on labels** — upvote or downvote community insights to surface the most accurate ones
- 🗺️ **Explore cities** — browse crowd-sourced neighborhood data for 35+ cities worldwide
- 🔍 **Find your area** — filter by safety, vibe, cost, and more to find where you actually want to live

No algorithms. No corporate bias. Just locals telling the truth.

---

## Features

- **Interactive global map** powered by Leaflet + OpenStreetMap
- **Crowd-sourced labels** with safety ratings (1–5), cost levels, and vibe tags
- **Community voting** — upvote/downvote to validate neighborhood insights
- **35+ cities covered** — New York, London, Tokyo, Mumbai, Dubai, and more
- **No account required** — browse, vote, and add labels freely
- **PWA-ready** — installable on mobile devices
- **Real-time updates** via Supabase backend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite + Bun |
| Styling | Tailwind CSS |
| Map Engine | Leaflet + OpenStreetMap |
| Backend / DB | Supabase (PostgreSQL) |
| Component Library | Radix UI |
| State Management | TanStack Query |
| Testing | Playwright |
| Prerendering | Custom Node.js SSG script (35 city pages) |
| Analytics | Google Analytics 4 |

---

## Cities Covered

**North America**
New York · San Francisco · Los Angeles · Toronto · Mexico City · Buenos Aires

**Europe & Middle East**
London · Amsterdam · Rome · Istanbul · Tel Aviv · Cairo · Jerusalem · Tehran

**Africa**
Cape Town

**East Asia**
Tokyo · Seoul · Hong Kong · Bali

**India**
Mumbai · Delhi · Bangalore · Hyderabad · Pune · Chennai · Kolkata · Jaipur · Goa · Ahmedabad · Lucknow · Chandigarh · Indore · Coimbatore

**South Asia**
Karachi · Lahore

> New labels can be dropped **anywhere in the world** — not just listed cities.

---

## How It Works

1. Visit [placelabels.com](https://placelabels.com)
2. Click **Drop Label** and tap anywhere on the map
3. Fill in the neighborhood name, safety rating (1–5), cost level, and vibe tags
4. Submit — your label appears instantly for the community to vote on
5. Browse other labels and vote to validate the most accurate insights

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/InoxxAIsource/neighborhoodtruth-map.git
cd neighborhoodtruth-map

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key

# Start dev server
bun run dev

# Build for production (includes SSG prerender)
bun run build
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Prerendering

PlaceLabels uses a custom Node.js prerender script (`scripts/prerender.mjs`) that runs automatically after every Vite build. It generates static HTML for all 35 city pages with:

- City-specific `<title>` and `<meta description>`
- Correct canonical tags and Open Graph metadata
- Visible `<h1>` and description content
- City-specific BreadcrumbList schema
- Full city footer for crawlability

This ensures Googlebot and all other crawlers can index every city page without executing JavaScript.

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request

Please open an issue first for major changes.

---

## Roadmap

- [ ] User accounts and label history
- [ ] Neighborhood comparison tool
- [ ] API for neighborhood data
- [ ] More cities and regional coverage
- [ ] Mobile app (iOS / Android)

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for people who want to know the truth about a neighborhood before they move.**  
🌍 [placelabels.com](https://placelabels.com) · 🐦 [@placelabels](https://twitter.com/placelabels)
