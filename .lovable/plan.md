

## Plan: Add Color Picker to Labels + Bold Outlined Font Style

### What Changes

**1. Database: Add `color` column to `labels` table**
- Migration: `ALTER TABLE public.labels ADD COLUMN color text DEFAULT '#6b7280';`
- Default gray so existing seed labels get a neutral color

**2. AddLabelDialog: Add color picker**
- Add a row of 8-10 preset color swatches (red, green, blue, orange, purple, pink, teal, yellow, gray, black)
- User clicks to select; selected swatch gets a ring/border highlight
- Color is submitted alongside other label data

**3. MapView: Use user-chosen color + bold outlined font**
- In `createTextIcon`, use `label.color` (falling back to the current score-based color logic if no color set)
- Change font style to match the reference image: **heavy bold weight (800-900), larger base size, thick white outline stroke** using CSS `text-shadow` with multiple offsets (like a 3D outlined/embossed look similar to the Ghibli Museum sign)
- Font: `'Arial Black', 'Impact', system-ui, sans-serif` for that chunky feel

**4. Seed script update**
- When seeding labels, assign random colors from the preset palette so the map looks colorful immediately

**5. Index.tsx / mutation**
- Pass `color` field through the add label mutation to Supabase

### Files Modified
- `supabase/migrations/` — new migration for `color` column
- `src/components/AddLabelDialog.tsx` — color picker UI
- `src/components/MapView.tsx` — use label color + bold outlined font
- `src/pages/Index.tsx` — pass color in mutation

