

## Plan: Add Places Filter & No Tags Toggle (Hoodmaps-style)

### What it does
Add two Hoodmaps-inspired features to the top toolbar area:
1. **"Places" dropdown** — categorized checkbox list of place types (Good: Cafes, Parks, Coworking... / Bad: Fast food, Gambling, Pawn shops) that filter labels by matching text/vibe keywords
2. **"No tags" toggle** — instantly hides ALL labels from the map, showing only the base map + zone overlays

### How it works

**1. Add a `category` field to labels (database migration)**
- Add `category text` column to the `labels` table
- This stores a place type like "Cafes to work", "Parks", "Fast food", etc.
- Optional field — existing labels without a category still show normally

**2. Update AddLabelDialog with place category picker**
- Add a "Place Type" selector in the label creation dialog
- Two groups: "Good" (Cafes to work, Coworking, Yoga studios, Parks, Playgrounds, etc.) and "Bad" (Hotels, Fast food, Gambling, Pawn shops, Laundromats, Phone repair, Money transfer)
- Each option has an emoji icon like the reference
- Optional — users can skip if their label doesn't fit a category

**3. Add top toolbar with Places dropdown + No Tags toggle**
- Horizontal bar at the top of the map (below title) with three toggle buttons: **"District mode"**, **"Places"**, **"No tags"**
- **Places** button opens a dropdown/popover with checkboxed categories grouped into Good/Bad
- Checking categories filters the map to only show labels matching those categories
- **No tags** button hides all text labels from the map entirely

**4. Update MapView filtering logic**
- Add `showLabels` boolean and `selectedCategories` string array to filter state
- When "No tags" is active, skip rendering all label markers
- When specific place categories are selected, only show labels matching those categories

### Files Modified
- `supabase/migrations/` — add `category` column
- `src/components/AddLabelDialog.tsx` — add place type selector
- `src/components/FilterSidebar.tsx` or new `src/components/TopToolbar.tsx` — Places dropdown + No Tags toggle
- `src/components/MapView.tsx` — respect `showLabels` flag and category filter
- `src/pages/Index.tsx` — wire up new state

