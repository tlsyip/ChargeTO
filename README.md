# ChargeTO

A Charge Closer To Home. ChargeTO is a responsive Next.js prototype for finding and reserving overnight EV charging at underused neighbourhood parking lots in Toronto.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Node.js 20.9 or newer is required.

## What to try

- Search fictional Toronto charging locations and filter by neighbourhood, hourly price, charger speed, and availability.
- Select a map pin or location card to choose a date, start time, and overnight window. The estimated total updates as you make selections.
- Confirm a demo reservation, review it under **My bookings**, and cancel it. Bookings are stored in this browser's local storage; no account, payment, or backend is involved.
- Browse **City insights** for clearly labelled fictional planning data and **How it works** for the concept overview.

Overlapping time windows at the same location are blocked. Reservations are simulated and saved on this device only.

## Demo disclaimer

All locations, addresses, rates, availability, reservations, neighbourhood insights, and possible host sites are fictional and illustrative. The map is an original schematic preview, not live map data. This project is not officially affiliated with Green P, the City of Toronto, TDSB, or TCDSB.

## Checks

```bash
npm run lint
npm run build
```
