

## Feature Roadmap Plan for NeighborhoodTruth

### Phase 1 — Trust & Engagement (Week 1-2)
**Goal:** Make existing data more useful and keep users coming back.

1. **Neighborhood Score Cards** — Floating summary showing Safety, Cost, and Vibe scores when zoomed into an area. Derived from existing label aggregations. No new tables needed.

2. **Label Accuracy Feedback** — "Is this still accurate?" thumbs up/down on each label. Add a `label_feedback` table (label_id, vote, created_at). Helps surface stale data and builds trust.

3. **Trending Labels** — Flame icon on labels with 5+ votes in the last 7 days. Pure frontend logic using existing `created_at` and vote data.

### Phase 2 — Stickiness & Sharing (Week 3-4)
**Goal:** Give users reasons to share and return.

4. **Deep Links** — Encode lat/lng/zoom in URL params so users can share specific neighborhood views. Frontend-only change in MapView and routing.

5. **Day/Night Toggle** — Filter labels by daytime vs nightlife vibes using existing `vibe` array data. Simple UI toggle + filter logic.

6. **Saved Areas** — Let users bookmark neighborhoods. Requires auth (email signup/login) + a `saved_areas` table.

### Phase 3 — Monetization (Week 5-6)
**Goal:** Start generating revenue without degrading UX.

7. **User Authentication** — Email signup/login using the built-in auth system. Required for paid features and personalization.

8. **Pro Subscription** — Gate AI chat at 5 free questions/day. Pro users ($5/mo) get unlimited. Integrate Stripe for payments.

9. **Promoted Labels** — Businesses pay for a visually distinct "Promoted" pin. Add `is_promoted`, `business_name` fields to labels table. Separate submission flow.

### Phase 4 — Data Moat (Week 7-8)
**Goal:** Build defensible data advantage.

10. **Heatmap Layer Switcher** — Toggle between Safety, Cost, and Activity density heatmaps using existing data.

11. **Neighborhood Comparison** — Side-by-side comparison of two areas' scores, costs, and vibes.

12. **Data API** — Expose aggregated neighborhood insights via an authenticated API endpoint for real estate/travel partners.

---

### Recommended Starting Point

Phase 1 is highest impact with zero new infrastructure. All three features use existing data and require only frontend changes + one small table.

### Technical Notes
- Auth is the critical unlock for Phase 2-3. Everything before it works anonymously.
- Stripe integration is needed only in Phase 3.
- No schema changes needed for Phase 1 except the small `label_feedback` table.

