# Todd's Nutrition Tracker

Static, single-page, mobile-first daily nutrition dashboard (Cronometer-style). Plain HTML/CSS/JS, no build, no CDNs.

## Files
- `index.html` – page shell, iOS home-screen meta, styles (auto light/dark)
- `app.js` – fetches `data.json?t=<timestamp>` and computes all totals client-side
- `data.json` – the only data source: `targets` + `days` keyed by `YYYY-MM-DD`
- `sw.js` – service worker: network-first for data.json, cached fallback offline
- `manifest.json`, `icon-180.png`, `icon-512.png` – Add to Home Screen
- `add_meal.py` – helper to append a meal/items to a date

## How data.json is updated
The **Nutrition Coach** agent edits `data.json` (by hand or with `add_meal.py`) and pushes it to wherever the site is hosted. The app re-fetches with a cache-busting `?t=` param on load and whenever it returns to the foreground, so the phone always shows the latest push. No totals are stored — the app sums items.

```
python3 add_meal.py 2026-10-28 18:45 Dinner items.json --note "chili at parents'"
echo '[{"food":"1 glass red wine","kcal":125,"protein":0.1,"carbs":4,"fat":0,"fiber":0,"nutrients":{"potassium_mg":187}}]' | python3 add_meal.py 2026-10-28 18:45 Dinner -
```
Optional per-day keys: `weight_lb`, `active_kcal`, `notes`, `day_type` (`rest|lifting|hard` → picks kcal target), `estimate: true` (shows badge).

## Run locally
`python3 -m http.server 8000` then open http://localhost:8000/. Open `?d=YYYY-MM-DD` to jump to a date. Dates use America/Phoenix.

All values are approximate estimates.
