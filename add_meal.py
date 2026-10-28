#!/usr/bin/env python3
"""Append a meal (or items to an existing meal) to a date in data.json.
Totals are computed client-side; nothing else is recomputed.

Usage:
  python3 add_meal.py 2026-10-28 "18:30" "Dinner" items.json [--note "..."]
  # items.json: list of {"food","kcal","protein","carbs","fat","fiber","nutrients":{...}}
  # If a meal with the same name+time exists, items are appended to it.
  echo '[{...}]' | python3 add_meal.py 2026-10-28 18:30 Dinner -
"""
import json, sys, argparse, datetime
ap = argparse.ArgumentParser()
ap.add_argument("date"); ap.add_argument("time"); ap.add_argument("name"); ap.add_argument("items")
ap.add_argument("--note", default=""); ap.add_argument("--file", default="data.json")
a = ap.parse_args()
items = json.load(sys.stdin if a.items == "-" else open(a.items))
if isinstance(items, dict): items = [items]
d = json.load(open(a.file))
day = d.setdefault("days", {}).setdefault(a.date, {"meals": [], "notes": ""})
meal = next((m for m in day["meals"] if m["name"] == a.name and m["time"] == a.time), None)
if meal: meal["items"].extend(items); meal["note"] = a.note or meal.get("note", "")
else: day["meals"].append({"time": a.time, "name": a.name, "items": items, "note": a.note})
day["meals"].sort(key=lambda m: m["time"])
d["last_updated"] = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
json.dump(d, open(a.file, "w"), indent=1)
print(f"{a.date}: {a.name} @ {a.time} now has {len((meal or day['meals'][-1])['items'])} item(s)")
