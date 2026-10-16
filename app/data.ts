export type Location = {
  id: string;
  name: string;
  neighbourhood: string;
  address: string;
  rate: number;
  speed: "Level 2" | "DC fast";
  available: number;
  total: number;
  connector: string;
  x: number;
  y: number;
  note: string;
};

export type Booking = {
  id: string;
  locationId: string;
  date: string;
  start: string;
  hours: number;
  total: number;
  createdAt: string;
};

export const locations: Location[] = [
  {
    id: "junction-hall",
    name: "The Junction Hall",
    neighbourhood: "The Junction",
    address: "2990 Dundas St W",
    rate: 1.5,
    speed: "Level 2",
    available: 6,
    total: 8,
    connector: "J1772",
    x: 24,
    y: 28,
    note: "Quiet overnight lot",
  },
  {
    id: "bloor-west",
    name: "Bloor West Village",
    neighbourhood: "Bloor West Village",
    address: "2200 Bloor St W",
    rate: 1.75,
    speed: "Level 2",
    available: 3,
    total: 6,
    connector: "J1772",
    x: 18,
    y: 59,
    note: "Well-lit, easy access",
  },
  {
    id: "annex-green",
    name: "Annex Green Lot",
    neighbourhood: "The Annex",
    address: "489 Bloor St W",
    rate: 2.25,
    speed: "DC fast",
    available: 2,
    total: 4,
    connector: "CCS",
    x: 58,
    y: 36,
    note: "Fast charge, downtown",
  },
  {
    id: "parkdale",
    name: "Parkdale Community Hub",
    neighbourhood: "Parkdale",
    address: "1313 Queen St W",
    rate: 1.5,
    speed: "Level 2",
    available: 5,
    total: 8,
    connector: "J1772",
    x: 42,
    y: 68,
    note: "Overnight favourite",
  },
  {
    id: "leslieville",
    name: "Leslieville Market Lot",
    neighbourhood: "Leslieville",
    address: "1001 Queen St E",
    rate: 1.75,
    speed: "Level 2",
    available: 4,
    total: 6,
    connector: "J1772",
    x: 81,
    y: 39,
    note: "Steps from Queen East",
  },
  {
    id: "riverdale",
    name: "Riverdale Rec Centre",
    neighbourhood: "Riverdale",
    address: "550 Broadview Ave",
    rate: 2.25,
    speed: "DC fast",
    available: 1,
    total: 4,
    connector: "CCS",
    x: 76,
    y: 57,
    note: "One spot left tonight",
  },
];

export const neighbourhoods = [
  "All neighbourhoods",
  ...Array.from(new Set(locations.map((location) => location.neighbourhood))),
];

export const timeSlots = ["19:00", "20:00", "21:00", "22:00"];
export const approvedParkingEnd = "07:00";
export const minimumChargingHours = 8;

export function getChargingDurations(start: string) {
  const startHour = Number(start.slice(0, 2));
  const hoursUntilParkingEnds = (24 - startHour) + Number(approvedParkingEnd.slice(0, 2));
  return Array.from(
    { length: Math.max(0, hoursUntilParkingEnds - minimumChargingHours + 1) },
    (_, index) => minimumChargingHours + index,
  );
}

export function getLocation(locationId: string) {
  return locations.find((location) => location.id === locationId);
}

function parkingReservationEnd(date: string, start: string) {
  const endDate = new Date(`${date}T${start}:00`);
  endDate.setDate(endDate.getDate() + 1);
  endDate.setHours(Number(approvedParkingEnd.slice(0, 2)), 0, 0, 0);
  return endDate.getTime();
}

export function bookingConflicts(
  booking: Pick<Booking, "locationId" | "date" | "start">,
  existing: Booking[],
  exceptId?: string,
) {
  const start = new Date(`${booking.date}T${booking.start}:00`).getTime();
  const end = parkingReservationEnd(booking.date, booking.start);

  return existing.some((item) => {
    if (item.id === exceptId || item.locationId !== booking.locationId) return false;
    const otherStart = new Date(`${item.date}T${item.start}:00`).getTime();
    const otherEnd = parkingReservationEnd(item.date, item.start);
    return start < otherEnd && otherStart < end;
  });
}
