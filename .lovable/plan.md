

## Plan: India-Focused Enhanced Features

The user previously requested 4 features (3D view, live traffic, real-time events, religious/utility places). Since the app uses vanilla Leaflet (not Mapbox GL), true 3D isn't viable — but we can deliver practical alternatives focused on India.

### What We'll Build

**1. Tilt/Perspective View (instead of true 3D)**
- Add a "Tilt" toggle button that applies a CSS perspective transform to the map container, giving a pseudo-3D angled view
- Lightweight, no library change needed — pure CSS transform on the map div

**2. Live Traffic Layer**
- Overlay a traffic tile layer from TomTom's free API (no key needed for basic tiles) or use OpenStreetMap-based traffic data
- Add a "Traffic" toggle button in the toolbar
- Shows real-time traffic flow overlay on Indian roads

**3. Real-Time Events / Alerts System**
- New `area_alerts` database table: `id, lat, lng, city, title, description, alert_type (crime | festival | weather | protest | accident), severity (low | medium | high), active, created_at, expires_at`
- Seed with ~30 sample alerts across Indian cities (festivals like upcoming events, known traffic-heavy zones, safety advisories)
- Display as pulsing markers on the map with distinct icons per type
- Alert panel/drawer showing active alerts for the current viewport
- Users can submit new alerts via a simple form

**4. Points of Interest — Religious & Utility Places**
- New category groups in the Places filter: **Religious** (🕌 Mosque, 🛕 Temple, ⛪ Church, 🕍 Gurudwara) and **Utilities** (⛽ Fuel Pump, ⚡ EV Charger, 🏥 Hospital, 💊 Pharmacy)
- Add these to `PLACE_CATEGORIES` in TopToolbar
- Seed ~60 labels for major religious landmarks and utility spots across Indian cities (Golden Temple Amritsar, Jama Masjid Delhi, Basilica of Bom Jesus Goa, etc.)
- Update label colors: religious = purple, utilities = blue

### Technical Details

**Database changes:**
- New `area_alerts` table with RLS (public read, authenticated insert)
- Seed migration with ~30 alerts + ~60 religious/utility labels

**Frontend changes:**
- `TopToolbar.tsx` — Add Traffic toggle, Tilt toggle, expand PLACE_CATEGORIES with religious/utility groups
- `MapView.tsx` — Add traffic tile layer, CSS tilt transform, alert marker rendering with pulsing animation
- New `AlertPanel.tsx` — Slide-out panel listing active alerts in viewport
- New `SubmitAlertDialog.tsx` — Form for users to report events
- `Index.tsx` — Wire up new state and components

**Map stays centered on India** — default view remains `[20.5937, 78.9629]`.

### Scope
- ~6 files modified/created
- 2 database migrations (alerts table + seed data)
- No external API keys required (traffic tiles use free tier)

