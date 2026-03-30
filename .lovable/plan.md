

## Plan: Hoodmaps-Style Colored Zone Overlay

### What it does
Replace the current `leaflet.heat` gradient heatmap with colored polygon zone overlays like Hoodmaps. Each predefined NYC neighborhood gets a semi-transparent colored rectangle/circle based on its dominant category, determined by aggregating labels in that area.

### Categories and Colors
Using the Hoodmaps model adapted to our data:
- **Suits** (high cost, high safety) — Light Blue `#64b5f6`
- **Rich** ($$$$, high safety) — Green `#4caf50`
- **Cool** (Artsy/Nightlife vibes) — Yellow `#ffeb3b`
- **Tourists** (mixed vibes, moderate cost) — Red/Coral `#ef5350`
- **Uni** (Chill, low cost) — Dark Blue `#1565c0`
- **Normies** (neutral, moderate everything) — Gray `#9e9e9e`
- **Edgy** (low safety, Loud/Nightlife) — Dark Gray `#424242`

Each neighborhood zone is classified by aggregating its labels' vibe, cost, and safety data.

### Technical approach

**1. Zone classification function**
- For each predefined area in the existing `getAreaName` list, gather nearby labels
- Score each category based on label attributes (cost level, safety, vibes)
- Assign the dominant category + its color

**2. Render colored zones as Leaflet circle overlays**
- Use `L.circle()` with semi-transparent fill (opacity ~0.25) for each neighborhood
- Radius matches the existing `r` value from the areas array
- Add the zone layer when heatmap toggle is ON; remove when OFF

**3. Add legend bar at the bottom**
- Horizontal bar matching the reference image showing category colors + labels + emoji
- Positioned at the bottom of the map, fixed, z-indexed above the map

**4. Replace heatmap rendering**
- The current `leaflet.heat` layer is replaced by the zone overlay system when toggled
- Labels remain visible on top of zones

### Files Modified
- `src/components/MapView.tsx` — zone classification logic, circle overlay rendering (replaces heat layer), legend bar
- No database changes needed

