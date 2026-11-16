# Carbon Dashboard · Rice Farming Emissions

**Live dashboard: https://arsyadika.github.io/Carbon-Emissions-Dashboard/**

Open the link above to explore the dashboard directly in your browser. No installation or login is needed.

[![Carbon Dashboard preview](docs/preview.jpg)](https://arsyadika.github.io/Carbon-Emissions-Dashboard/)

An interactive WebGIS dashboard that shows greenhouse gas emissions from rice farming across 39 villages in Java, Indonesia, from April 2024 to March 2026.

## What you can do

- **Map:** village polygons on a satellite basemap, coloured by actual emissions per hectare. Villages without data have no colour (they are never shown as zero).
- **KPIs:** farmers, land area, average yield, harvest, total emissions, baseline vs. actual emissions per hectare, and the reduction against the baseline.
- **Charts:** monthly emission trend, top 10 villages, emission intensity (kg CO2e per kg grain), and reduction vs. baseline by month and cumulative.
- **Month slider:** view a single month or the cumulative total since April 2024.
- **Factors tab:** fertilizer factors per village, compared between Baseline and Actual.
- **Data tab:** definitions of every metric, with a live worked example.
- **Guide:** press the `?` button for a short walkthrough and important notes on the data.

## Key definitions

- **Actual emissions:** estimated emissions for fields harvested in the period, based on recorded farming practices.
- **Baseline emissions:** expected emissions under conventional practice before the programme (baseline survey in 2021, endline in 2023, with IRRI).
- **Reduction:** Baseline minus Actual.

Ratios (tCO2e/ha, yield, reduction %) are recomputed from sums, never averaged across months. Farmers are counted once.

## How it is built

- Fully static site: HTML, CSS and ES modules, with [MapLibre GL JS](https://maplibre.org/) and [Chart.js](https://www.chartjs.org/). No server, no database.
- Data is prepared offline (Python) and shipped as static files in `data/`: `villages.geojson`, `meta.json`, `factors.json`.
- Data comes from two anonymised sources ("source A" and "source B"). No personal or farmer-level data is published; values are aggregated per village.

```
index.html      page structure
style.css       styling
src/            JavaScript modules (map, charts, KPIs, tabs, guide)
data/           village polygons, monthly series, fertilizer factors
assets/         images
```

## Run locally

Any static server works, for example:

```
python -m http.server 8000
```

Then open http://localhost:8000 (the page loads MapLibre and Chart.js from a CDN, so an internet connection is needed).

## Credits

Basemap imagery © Esri and its data providers. Village boundaries from an official ArcGIS REST service and OpenStreetMap contributors (ODbL). Map rendering by MapLibre GL JS, charts by Chart.js.

## Author

Muhammad Arsya Dika Maulana · Community Resilience · Regenerative Agriculture · Decarbonization
[linkedin.com/in/arsya-dika](https://www.linkedin.com/in/arsya-dika)
