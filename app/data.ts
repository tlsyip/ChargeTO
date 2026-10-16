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
    id: "ay-jackson",
    name: "A. Y. Jackson Secondary School",
    neighbourhood: "Hillcrest Village, North York",
    address: "50 Francine Drive, North York",
    rate: 1.75,
    speed: "Level 2",
    available: 6,
    total: 8,
    connector: "J1772",
    x: 48.5,
    y: 25,
    note: "User-provided address · Demo availability",
  },
  {
    id: "agincourt",
    name: "Agincourt Collegiate Institute",
    neighbourhood: "Agincourt, Scarborough",
    address: "2621 Midland Avenue, Scarborough",
    rate: 1.75,
    speed: "Level 2",
    available: 4,
    total: 6,
    connector: "J1772",
    x: 71.9,
    y: 40.5,
    note: "User-provided address · Demo availability",
  },
  {
    id: "albert-campbell",
    name: "Albert Campbell Collegiate Institute",
    neighbourhood: "Agincourt North, Scarborough",
    address: "1550 Sandhurst Circle, Scarborough",
    rate: 1.75,
    speed: "Level 2",
    available: 5,
    total: 8,
    connector: "J1772",
    x: 73.2,
    y: 19.9,
    note: "User-provided address · Demo availability",
  },
  {
    id: "cedarbrae",
    name: "Cedarbrae Collegiate Institute",
    neighbourhood: "Woburn, Scarborough",
    address: "550 Markham Road, Scarborough",
    rate: 1.75,
    speed: "Level 2",
    available: 3,
    total: 6,
    connector: "J1772",
    x: 85.5,
    y: 72.7,
    note: "User-provided address · Demo availability",
  },
  {
    id: "cw-jefferys",
    name: "C. W. Jefferys Collegiate Institute",
    neighbourhood: "York University Heights, North York",
    address: "340 Sentinel Road, North York",
    rate: 1.75,
    speed: "Level 2",
    available: 7,
    total: 10,
    connector: "J1772",
    x: 13.1,
    y: 70.8,
    note: "User-provided address · Demo availability",
  },
];

export const neighbourhoods = [
  "All neighbourhoods",
  ...Array.from(new Set(locations.map((location) => location.neighbourhood))),
];

export const timeSlots = ["19:00", "20:00", "21:00", "22:00", "23:00", "0:00"];
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
