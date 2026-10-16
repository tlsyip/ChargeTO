# ChargeTO

A Charge Closer To Home. ChargeTO is a responsive Next.js prototype for finding and reserving overnight EV charging at underused neighbourhood parking lots in Toronto.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Node.js 20.9 or newer is required.
Keep this command running while you use the local site. To stop it, press `Ctrl+C`.

## What to try

- Search the five user-provided North York and Scarborough addresses. Filter by neighbourhood, hourly price, charger speed, and demo availability.
- Select a map pin or location card to choose a date, start time, and overnight window. The estimated total updates as you make selections.
- Confirm a demo reservation, review it under **My bookings**, and cancel it. Bookings are stored in this browser's local storage; no account, payment, or backend is involved.
- Browse **City insights** for clearly labelled fictional planning data and **How it works** for the concept overview.

Overlapping time windows at the same location are blocked. Reservations are simulated and saved on this device only.
The hourly location rate is the charging fee; each overnight reservation also has a flat $1.75 demo parking fee. Parking is reserved through 7:00 AM. A conditional idle fee of $0.50 per minute applies from 7:01 AM if a vehicle remains after the approved window; this potential fee is disclosed before booking and is not included in the estimate.

## Demo disclaimer

The five map addresses were supplied for this prototype; pin coordinates are approximate and based on OpenStreetMap geocoding. The map illustration is schematic, not live road or parking data. The named properties have not been confirmed as EV charging sites or partners, and no access is implied. Rates, charger types, availability, reservations, neighbourhood insights, and potential host sites are fictional demo data. Geocoding attribution: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright). This project is not officially affiliated with Green P, the City of Toronto, TDSB, or TCDSB.

## Checks

```bash
npm run lint
npm run build
```

## Deploy to GitHub Pages

This repository is configured to publish as a static site at `https://tlsyip.github.io/ChargeTO/`.
Pushes to `main` build and deploy the app with the repository subpath automatically. To enable
deployment, open the repository's **Settings → Pages** and set **Build and deployment → Source**
to **GitHub Actions**.

The Pages build can also be generated locally:

```bash
npm run build:pages
```

The static site is written to `out/`. It has no server-side runtime: demo bookings remain in each
visitor's browser, and there are no backend APIs. Because this project is exported as a static
site, run `npm run dev` for local development; the Next.js production server is not used.
