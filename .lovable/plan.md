

## NeighborhoodTruth — Interactive Neighborhood Map SaaS

### Overview
A fullscreen interactive map app where users can drop labels on NYC neighborhoods with safety ratings, vibe tags, cost levels, and community voting.

### Database (Supabase)
1. **`labels` table** — id (uuid), lat (float8), lng (float8), text (varchar 80), safety (int2, 1-5), vibe (text[]), cost (text, one of $/$$/$$$/$$$$), upvotes (int default 0), downvotes (int default 0), created_at (timestamptz)
2. **`votes` table** — id (uuid), label_id (uuid FK → labels), voter_id (text), vote_type (text, upvote/downvote), created_at (timestamptz). Unique constraint on (label_id, voter_id).
3. RLS policies: public read on labels, authenticated insert. Public read on votes, authenticated insert.

### UI & Features
1. **Fullscreen Leaflet map** centered on NYC (40.7128, -74.0060, zoom 12) using OpenStreetMap tiles
2. **Floating "+ Add Label" button** (bottom-right) — opens a modal/dialog to place a label:
   - Click map to set location, then fill: text, safety (1-5 star slider), vibe tags (multi-select chips: Chill, Lively, Artsy, Family, Sketchy, Trendy, Quiet, Loud), cost ($-$$$$)
   - Submits to Supabase `labels` table
3. **Map markers** — custom markers for each label; clicking shows a popup card with label details + upvote/downvote buttons
4. **Upvote/Downvote** — generates anonymous voter_id (localStorage), updates votes table and label counters
5. **Left sidebar** — collapsible placeholder panel for future filters, with a toggle button
6. **Empty state** — friendly message when no labels exist yet
7. **Clean modern light theme** — minimal UI, shadcn components for dialogs/buttons, soft shadows

### Tech
- React + TypeScript + Tailwind + shadcn/ui
- react-leaflet for map
- Supabase client for data (Lovable Cloud)
- TanStack Query for data fetching

