"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CloudMoon,
  CornerDownRight,
  CreditCard,
  Filter,
  Leaf,
  MapPin,
  Menu,
  Navigation,
  PlugZap,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import chargeToLogo from "./chargeto-logo.png";
import {
  bookingConflicts,
  approvedParkingEnd,
  getChargingDurations,
  getLocation,
  locations,
  neighbourhoods,
  timeSlots,
  type Booking,
  type Location,
} from "./data";

type Section = "explore" | "bookings" | "how";
type Notice = { message: string; kind: "success" | "error" } | null;

const STORAGE_KEY = "nightshift-bookings-v1";
const parkingFee = 1.75;
const idleFeePerMinute = 0.5;

function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function tomorrowString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const offset = tomorrow.getTimezoneOffset();
  return new Date(tomorrow.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    weekday: "short",
    ...options,
  }).format(new Date(`${date}T12:00:00`));
}

function formatTime(time: string) {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function formatEnd(date: string, start: string, hours: number) {
  const startDate = new Date(`${date}T${start}:00`);
  startDate.setHours(startDate.getHours() + hours);
  return startDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function validBookings(value: unknown): value is Booking[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item?.id === "string" &&
        typeof item?.locationId === "string" &&
        typeof item?.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
        typeof item?.start === "string" &&
        timeSlots.includes(item.start) &&
        [8, 9, 10, 11, 12].includes(item?.hours) &&
        typeof item?.total === "number" &&
        Number.isFinite(item.total) &&
        item.total >= 0 &&
        typeof item?.createdAt === "string" &&
        Boolean(getLocation(item.locationId)),
    )
  );
}

function SectionTitle({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}

function MapPreview({
  visibleLocations,
  selectedId,
  onSelect,
}: {
  visibleLocations: Location[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="map-panel" aria-label="Schematic map showing the provided addresses in North York and Scarborough">
      <svg
        className="map-art"
        viewBox="0 0 760 530"
        preserveAspectRatio="none"
        role="img"
        aria-labelledby="map-title"
      >
        <title id="map-title">Schematic map of five user-provided North York and Scarborough addresses</title>
        <rect width="760" height="530" fill="#eaf0e8" />
        <path d="M0 0h760v530H0z" fill="#eaf0e8" />
        <path d="M45 30h105l25 54-22 39H50zM268 342l78-31 42 43-31 61-87 9-27-39zM574 86l107-26 34 40-23 57-101 8-37-36zM598 353l97-18 34 62-46 61-87-18-24-44z" fill="#dce8d6" />
        <path d="M20 172c96-35 174-34 251-8s145 28 226 0 155-36 249-2M-5 278c104-25 193-19 271 8s160 22 241-8 155-30 271-4M4 414c100-28 181-28 264-4s163 26 247-1 153-31 253-9" fill="none" stroke="#fff" strokeWidth="15" />
        <path d="M164-20c-22 85-25 157 1 226s21 149-9 213-28 94-7 146M349-20c-25 80-31 158-4 229s32 145 6 211-29 107-8 147M540-19c-28 89-27 159 2 225s32 139 4 208-28 101-8 151M704-19c-23 84-20 152 7 220s31 142 7 207-19 111-2 155" fill="none" stroke="#fff" strokeWidth="13" />
        <path d="M-20 83c105 18 197 17 279-7s161-25 244-3 166 24 281 1M-14 224c103 17 196 17 282-6s163-21 246 1 164 24 277 1M-8 350c110 20 203 19 287-5s163-23 248 0 163 25 261 5M0 474c108 17 199 18 286-4s164-21 246 1 160 22 248 1" fill="none" stroke="#fff" strokeWidth="7" />
        <path d="M0 117c93 27 176 18 252-4m-76 285c93-17 145-55 182-114m123 241c29-56 37-103 19-153" fill="none" stroke="#fff" strokeWidth="5" />
        <path d="M40 244c117-25 197-18 278 4s156 22 245-7 133-27 219-8M165 0c-20 85-20 160 4 224s20 149-13 210M352 0c-25 82-27 155 0 224s32 144 3 211M541 0c-26 84-24 158 4 224s31 144 3 211" fill="none" stroke="#d8dfd5" strokeWidth="1.4" strokeDasharray="6 7" />
        <text x="28" y="68" className="map-label map-label-small">TORONTO · NORTH YORK &amp; SCARBOROUGH</text>
        <text x="224" y="105" className="map-label">HILLCREST VILLAGE</text>
        <text x="26" y="323" className="map-label">YORK UNIVERSITY HEIGHTS</text>
        <text x="566" y="180" className="map-label">AGINCOURT NORTH</text>
        <text x="620" y="300" className="map-label">AGINCOURT</text>
        <text x="658" y="473" className="map-label">WOBURN</text>
        <g transform="translate(710 75)">
          <path d="M0 19 8 0l8 19-8-5z" fill="#76917d" />
          <text x="8" y="32" textAnchor="middle" className="map-north">N</text>
        </g>
      </svg>
      <div className="map-topline">
        <span className="map-live"><span /> APPROXIMATE ADDRESS PINS</span>
        <button
          className="map-locate"
          type="button"
          onClick={() => onSelect(visibleLocations[0]?.id ?? "")}
          disabled={visibleLocations.length === 0}
          aria-label="Focus the first visible charging location"
        >
          <Navigation size={14} /> First spot
        </button>
      </div>
      {visibleLocations.map((location) => (
        <button
          type="button"
          key={location.id}
          className={`map-marker ${selectedId === location.id ? "is-selected" : ""}`}
          style={{ left: `${location.x}%`, top: `${location.y}%` }}
          onClick={() => onSelect(location.id)}
          aria-label={`${location.name}, ${formatMoney(location.rate)} per charging hour`}
          aria-pressed={selectedId === location.id}
        >
          <PlugZap size={15} />
          <span>{formatMoney(location.rate)}</span>
        </button>
      ))}
      <div className="map-legend">
        <span className="legend-dot" /> Demo availability
        <span className="legend-fictional"><Sparkles size={12} /> Schematic map</span>
      </div>
      {selectedId && getLocation(selectedId) && (
        <button
          className="map-selection"
          type="button"
          onClick={() => onSelect(selectedId)}
          aria-label={`Selected: ${getLocation(selectedId)?.name}`}
        >
          <span className="selection-icon"><PlugZap size={17} /></span>
          <span><strong>{getLocation(selectedId)?.name}</strong><small>{getLocation(selectedId)?.neighbourhood}</small></span>
          <ChevronRight size={17} />
        </button>
      )}
    </div>
  );
}

function LocationCard({
  location,
  selected,
  onSelect,
}: {
  location: Location;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <article className={`location-card ${selected ? "location-card-selected" : ""}`}>
      <button
        className="location-card-main"
        type="button"
        onClick={() => onSelect(location.id)}
        aria-pressed={selected}
      >
        <span className={`location-art art-${location.id}`}>
          <span className="art-spark"><Zap size={20} fill="currentColor" /></span>
          <span className="art-caption">{location.neighbourhood}</span>
        </span>
        <span className="location-card-content">
          <span className="location-heading">
            <strong>{location.name}</strong>
            <span className="price"><b>{formatMoney(location.rate)}</b><small>/ charge hr</small></span>
          </span>
          <span className="address-line"><MapPin size={13} /> {location.address}</span>
          <span className="location-meta">
            <span><span className="available-dot" /> {location.available} demo spots</span>
            <span><Zap size={13} /> {location.speed}</span>
          </span>
        </span>
      </button>
      <button
        className="card-arrow"
        type="button"
        onClick={() => onSelect(location.id)}
        aria-label={`Reserve a spot at ${location.name}`}
      >
        <ArrowUpRight size={16} />
      </button>
    </article>
  );
}

export default function Home() {
  const [section, setSection] = useState<Section>("explore");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [search, setSearch] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("All neighbourhoods");
  const [speed, setSpeed] = useState("Any speed");
  const [maxPrice, setMaxPrice] = useState(3);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedId, setSelectedId] = useState("ay-jackson");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingStart, setBookingStart] = useState("21:00");
  const [bookingHours, setBookingHours] = useState(8);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setToday(todayString());
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (!validBookings(parsed)) {
            setNotice({ message: "Saved demo bookings were invalid and could not be loaded.", kind: "error" });
          } else {
            setBookings(parsed);
          }
        }
      } catch {
        setNotice({ message: "Your browser blocked saved bookings. Local storage is unavailable.", kind: "error" });
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSection("explore");
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBookingId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [bookingId]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return locations.filter((location) => {
      const matchesSearch =
        !query ||
        `${location.name} ${location.neighbourhood} ${location.address}`.toLowerCase().includes(query);
      const matchesNeighbourhood =
        neighbourhood === "All neighbourhoods" || location.neighbourhood === neighbourhood;
      const matchesSpeed = speed === "Any speed" || location.speed === speed;
      const matchesPrice = location.rate <= maxPrice;
      const matchesAvailability = !availableOnly || location.available > 0;
      return matchesSearch && matchesNeighbourhood && matchesSpeed && matchesPrice && matchesAvailability;
    });
  }, [availableOnly, maxPrice, neighbourhood, search, speed]);
  const mapSelectedId = filteredLocations.some((location) => location.id === selectedId)
    ? selectedId
    : filteredLocations[0]?.id ?? "";

  const activeBookings = useMemo(
    () =>
      [...bookings]
        .filter((booking) => !today || booking.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)),
    [bookings, today],
  );
  const pastBookings = useMemo(
    () =>
      [...bookings]
        .filter((booking) => today && booking.date < today)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [bookings, today],
  );
  const selectedLocation = bookingId ? getLocation(bookingId) : undefined;
  const selectedBookingConflicts = selectedLocation
    ? bookingConflicts(
        {
          locationId: selectedLocation.id,
          date: bookingDate,
          start: bookingStart,
        },
        bookings,
      )
    : false;
  const chargingCost = selectedLocation ? selectedLocation.rate * bookingHours : 0;
  const estimatedTotal = chargingCost + parkingFee;

  function saveBookings(nextBookings: Booking[]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings));
      setBookings(nextBookings);
      return true;
    } catch {
      setNotice({ message: "Could not save this change. Check your browser storage settings and try again.", kind: "error" });
      return false;
    }
  }

  function openBooking(locationId: string) {
    setSelectedId(locationId);
    setBookingDate(tomorrowString());
    setBookingStart("21:00");
    setBookingHours(8);
    setBookingId(locationId);
  }

  function confirmBooking() {
    if (!hydrated || !selectedLocation) return;
    if (bookingDate < todayString()) {
      setNotice({ message: "Choose today or a future date for your reservation.", kind: "error" });
      return;
    }
    if (selectedBookingConflicts) {
      setNotice({ message: "That time overlaps another reservation here. Choose a different start time.", kind: "error" });
      return;
    }
    const booking: Booking = {
      id: crypto.randomUUID(),
      locationId: selectedLocation.id,
      date: bookingDate,
      start: bookingStart,
      hours: bookingHours,
      total: Number(estimatedTotal.toFixed(2)),
      createdAt: new Date().toISOString(),
    };
    if (!saveBookings([...bookings, booking])) return;
    setBookingId(null);
    setSection("bookings");
    setNotice({ message: "Your demo charging spot is reserved. You're all set!", kind: "success" });
  }

  function confirmCancellation() {
    if (!cancelId) return;
    const nextBookings = bookings.filter((booking) => booking.id !== cancelId);
    if (!saveBookings(nextBookings)) return;
    setCancelId(null);
    setNotice({ message: "Reservation cancelled and removed from this device.", kind: "success" });
  }

  function selectSection(nextSection: Section) {
    setSection(nextSection);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const navItems: { id: Section; label: string }[] = [
    { id: "explore", label: "Explore" },
    { id: "bookings", label: "My bookings" },
    { id: "how", label: "How it works" },
  ];

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => selectSection("explore")} aria-label="ChargeTO home">
            <Image className="brand-logo" src={chargeToLogo} alt="" priority />
            <span className="brand-tagline">A Charge Closer To Home</span>
          </button>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`nav-link ${section === item.id ? "nav-active" : ""}`}
                onClick={() => selectSection(item.id)}
                aria-current={section === item.id ? "page" : undefined}
              >
                {item.label}
                {item.id === "bookings" && activeBookings.length > 0 && (
                  <span className="nav-count">{activeBookings.length}</span>
                )}
              </button>
            ))}
          </nav>
          <button className="header-cta" type="button" onClick={() => selectSection("explore")}>
            Find a charger <ArrowRight size={15} />
          </button>
        </div>
        <nav className="mobile-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`mobile-nav-link ${section === item.id ? "mobile-nav-active" : ""}`}
              onClick={() => selectSection(item.id)}
              aria-current={section === item.id ? "page" : undefined}
            >
              {item.id === "explore" && <Search size={15} />}
              {item.id === "bookings" && <CalendarDays size={15} />}
              {item.id === "how" && <Menu size={15} />}
              {item.label}
              {item.id === "bookings" && activeBookings.length > 0 && <span>({activeBookings.length})</span>}
            </button>
          ))}
        </nav>
      </header>

      {section === "explore" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-kicker"><span className="pulse-dot" /> TORONTO EV CHARGING, REIMAGINED</span>
              <h1>A good night&apos;s sleep.<br /><em>A full battery.</em></h1>
              <p>Find a charger just around the corner. Book an underused neighbourhood parking spot overnight, and wake up ready to go.</p>
              <div className="hero-proof">
                <span><CheckCircle2 size={15} /> Close to home</span>
                <span><CheckCircle2 size={15} /> No subscriptions</span>
                <span><CheckCircle2 size={15} /> Charging from $1.75 / hr</span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-moon"><CloudMoon size={29} /></div>
              <span className="hero-star star-one">✳</span>
              <span className="hero-star star-two">·</span>
              <span className="hero-star star-three">✦</span>
              <div className="hero-hill hill-back" />
              <div className="hero-hill hill-front" />
              <div className="hero-charger">
                <div className="charger-head"><span /><span /></div>
                <div className="charger-cable" />
                <div className="charger-base"><PlugZap size={28} /></div>
              </div>
              <div className="hero-car"><div className="car-window" /><span /><span /></div>
              <div className="hero-charge-pill"><span><Zap size={13} fill="currentColor" /></span><b>100%</b><small>by 7:00 AM</small></div>
              <div className="hero-caption">YOUR NEIGHBOURHOOD, AFTER DARK</div>
            </div>
          </section>

          <section className="explore-section" aria-labelledby="explore-heading">
            <div className="explore-heading-row">
              <div>
                <span className="eyebrow">A SPOT FOR TONIGHT</span>
                <h2 id="explore-heading">Find your overnight charge</h2>
                <p>Five provided addresses across North York and Scarborough. Tap a pin to see demo details.</p>
              </div>
              <span className="fictional-note"><Sparkles size={14} /> Provided addresses · Demo details</span>
            </div>
            <div className="search-toolbar">
              <label className="search-field">
                <Search size={17} />
                <span className="sr-only">Search locations</span>
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search a street or neighbourhood"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <kbd>⌘ K</kbd>
              </label>
              <label className="filter-select">
                <MapPin size={15} />
                <span className="sr-only">Filter by neighbourhood</span>
                <select value={neighbourhood} onChange={(event) => setNeighbourhood(event.target.value)}>
                  {neighbourhoods.map((item) => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown size={15} />
              </label>
              <label className="filter-select speed-filter">
                <Zap size={15} />
                <span className="sr-only">Filter by charger speed</span>
                <select value={speed} onChange={(event) => setSpeed(event.target.value)}>
                  <option>Any speed</option>
                  <option>Level 2</option>
                  <option>DC fast</option>
                </select>
                <ChevronDown size={15} />
              </label>
              <label className="price-filter">
                <span><SlidersHorizontal size={14} /> Up to <b>{formatMoney(maxPrice)}</b>/hr</span>
                <input
                  aria-label="Maximum hourly charging price"
                  type="range"
                  min="1.5"
                  max="3"
                  step="0.25"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
              </label>
              <label className="available-filter">
                <input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} />
                <span className="toggle-track"><span /></span>
                <span>Demo availability</span>
              </label>
            </div>

            <div className="explore-grid">
              <div className="list-pane">
                <div className="list-toolbar">
                  <span><b>{filteredLocations.length}</b> demo sites</span>
                  <span className="sort-label"><Filter size={13} /> Sort: <b>Recommended</b></span>
                </div>
                <div className="location-list" aria-live="polite">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <LocationCard
                        key={location.id}
                        location={location}
                        selected={selectedId === location.id}
                        onSelect={(id) => openBooking(id)}
                      />
                    ))
                  ) : (
                    <div className="empty-results">
                      <span className="empty-icon"><Search size={21} /></span>
                      <strong>No spots match those filters</strong>
                      <p>Try a different street, a higher price, or another charger speed.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setNeighbourhood("All neighbourhoods");
                          setSpeed("Any speed");
                          setMaxPrice(3);
                          setAvailableOnly(false);
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
                <p className="list-footnote"><ShieldCheck size={14} /> Demo reservations use the 7:00 AM parking cutoff.</p>
              </div>
              <MapPreview
                visibleLocations={filteredLocations}
                selectedId={mapSelectedId}
                onSelect={(id) => id && openBooking(id)}
              />
            </div>
            <div className="trust-strip">
              <div><span className="trust-icon"><CloudMoon size={17} /></span><span><b>Made for overnight</b><small>Charge while you sleep</small></span></div>
              <div><span className="trust-icon"><CreditCard size={17} /></span><span><b>Pay as you go</b><small>No membership required</small></span></div>
              <div><span className="trust-icon"><Leaf size={17} /></span><span><b>Better use of space</b><small>Make idle lots work harder</small></span></div>
              <div><span className="trust-icon"><ShieldCheck size={17} /></span><span><b>Know before you go</b><small>Upfront, predictable pricing</small></span></div>
            </div>
          </section>
        </>
      )}

      {section === "bookings" && (
        <section className="page-section bookings-page">
          <SectionTitle
            eyebrow="YOUR CHARGE PLANS"
            title="My bookings"
            detail="Your overnight charging plans, all in one place."
          />
          <div className="demo-banner"><Sparkles size={16} /><span><b>Demo mode.</b> Reservations are simulated and saved only in this browser.</span></div>
          {!hydrated ? (
            <div className="loading-state">Loading your saved bookings…</div>
          ) : activeBookings.length ? (
            <div className="booking-stack">
              {activeBookings.map((booking) => {
                const location = getLocation(booking.locationId);
                if (!location) return null;
                return (
                  <article className="booking-card" key={booking.id}>
                    <div className="booking-date-block">
                      <span>{formatDate(booking.date, { weekday: "short" }).split(" ")[0]}</span>
                      <b>{new Date(`${booking.date}T12:00:00`).getDate()}</b>
                      <small>{new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-CA", { month: "short" })}</small>
                    </div>
                    <div className="booking-main">
                      <span className="booking-status"><span /> CONFIRMED · DEMO</span>
                      <h3>{location.name}</h3>
                      <p><MapPin size={14} /> {location.address}, Toronto</p>
                      <div className="booking-facts">
                        <span><CalendarDays size={14} /> {formatDate(booking.date)}</span>
                        <span><Clock3 size={14} /> {formatTime(booking.start)} – {formatEnd(booking.date, booking.start, booking.hours)}</span>
                        <span><Zap size={14} /> {booking.hours} hours · {location.speed}</span>
                      </div>
                    </div>
                    <div className="booking-side">
                      <span>Estimated total</span>
                      <b>{formatMoney(booking.total)}</b>
                      <button type="button" className="cancel-link" onClick={() => setCancelId(booking.id)}>Cancel booking</button>
                    </div>
                  </article>
                );
              })}
              <div className="booking-tip"><ShieldCheck size={17} /><p><b>Good to know</b> Arrive at your booked start time. Your reservation covers a dedicated charging spot for the full overnight window.</p></div>
            </div>
          ) : (
            <div className="empty-bookings">
              <span className="empty-booking-icon"><CalendarDays size={28} /></span>
              <span className="eyebrow">A FRESH START</span>
              <h3>No upcoming bookings</h3>
              <p>When you reserve a neighbourhood charger, it will show up here.</p>
              <button type="button" className="green-button" onClick={() => selectSection("explore")}>Find a spot <ArrowRight size={16} /></button>
            </div>
          )}
          {pastBookings.length > 0 && (
            <div className="past-bookings">
              <h3>Past reservations <span>{pastBookings.length}</span></h3>
              {pastBookings.map((booking) => {
                const location = getLocation(booking.locationId);
                return location ? (
                  <div className="past-booking-row" key={booking.id}>
                    <span><Check size={15} /></span>
                    <div><b>{location.name}</b><small>{formatDate(booking.date)} · {booking.hours} hours</small></div>
                    <strong>{formatMoney(booking.total)}</strong>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </section>
      )}

      {section === "how" && (
        <section className="page-section how-page">
          <SectionTitle
            eyebrow="CHARGING, IN THREE STEPS"
            title="Plug in. Sleep well. Go."
            detail="A charger nearby makes the rest of your day easier."
          />
          <div className="how-hero">
            <div className="how-hero-icon"><CloudMoon size={34} /></div>
            <div><span className="eyebrow">OVERNIGHT CHARGING, WITHOUT THE DETOUR</span><h3>Your car needs a charge.<br />You need a good night&apos;s sleep.</h3></div>
            <p>Instead of driving across town for a charger, reserve an available spot close to home. That&apos;s a better use of the neighbourhood—and your evening.</p>
          </div>
          <div className="steps-grid">
            {[
              { number: "01", icon: <Search size={22} />, title: "Find your spot", description: "Search nearby neighbourhood lots, compare charger speeds and prices, and choose a spot that works for you.", accent: "step-mint" },
              { number: "02", icon: <CalendarDays size={22} />, title: "Book overnight", description: "Choose your date, pick a start time and charging window. See the estimated total before you confirm.", accent: "step-peach" },
              { number: "03", icon: <BatteryCharging size={22} />, title: "Wake up ready", description: "Plug in at your reserved spot while you sleep. Head out in the morning with the day ahead fully charged.", accent: "step-lilac" },
            ].map((step) => (
              <article className={`step-card ${step.accent}`} key={step.number}>
                <div className="step-card-top"><span className="step-icon">{step.icon}</span><span>{step.number}</span></div>
                <h3>{step.title}</h3><p>{step.description}</p><CornerDownRight size={16} className="step-arrow" />
              </article>
            ))}
          </div>
          <div className="benefits-row">
            <div><span><MapPin size={17} /></span><p><b>Close to home</b><small>A neighbourhood spot, not another errand.</small></p></div>
            <div><span><CreditCard size={17} /></span><p><b>Simple, upfront pricing</b><small>Know the estimated total before booking.</small></p></div>
            <div><span><Leaf size={17} /></span><p><b>Better for the block</b><small>Put underused overnight parking to work.</small></p></div>
          </div>
          <div className="how-cta">
            <span className="how-cta-icon"><PlugZap size={22} /></span>
            <div><b>There&apos;s a spot with your name on it.</b><small>See what&apos;s available in this demo.</small></div>
            <button type="button" onClick={() => selectSection("explore")}>Explore spots <ArrowRight size={15} /></button>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="footer-main">
          <button className="brand footer-brand" type="button" onClick={() => selectSection("explore")} aria-label="ChargeTO home">
            <Image className="brand-logo" src={chargeToLogo} alt="" />
            <span className="brand-tagline">A Charge Closer To Home</span>
          </button>
          <p>Charge a little closer to home.<br />A neighbourhood charging concept for Toronto.</p>
          <button type="button" className="footer-how" onClick={() => selectSection("how")}>How it works <ArrowUpRight size={14} /></button>
        </div>
        <div className="disclaimer"><ShieldCheck size={16} /><p><b>Prototype disclaimer</b> The five addresses were provided for this prototype, and pins are approximate. The map is schematic—not live road or parking data. The named sites have not been confirmed as EV charging hosts. Rates, charger types, availability, bookings, neighbourhood metrics, and potential sites are demo data only; no host partnership or access is implied. Bookings are simulated and saved in your browser only. Address pin geocoding: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>. Not officially affiliated with Green P, the City of Toronto, TDSB, or TCDSB.</p></div>
        <div className="footer-bottom"><span>© 2026 ChargeTO concept · Toronto, ON</span><span>Made for a city that never stops moving <ArrowDownRight size={13} /></span></div>
      </footer>

      {bookingId && selectedLocation && (
        <div className="modal-scrim" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setBookingId(null);
        }}>
          <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
            <div className="modal-topline"><span className="eyebrow"><span className="pulse-dot" /> RESERVE A DEMO SPOT</span><button className="icon-button" type="button" onClick={() => setBookingId(null)} aria-label="Close reservation"><X size={19} /></button></div>
            <div className="modal-title-row"><div><h2 id="booking-title">{selectedLocation.name}</h2><p><MapPin size={14} /> {selectedLocation.address} · {selectedLocation.neighbourhood}</p></div><span className="modal-price"><b>{formatMoney(selectedLocation.rate)}</b><small> / charge hour</small></span></div>
            <div className="modal-charger-info"><span><PlugZap size={15} /> {selectedLocation.speed}</span><span><span className="available-dot" /> {selectedLocation.available} demo spots</span><span>{selectedLocation.connector}</span></div>
            <div className="booking-form">
              <label className="field-label" htmlFor="booking-date"><span><CalendarDays size={15} /> Pick a night</span></label>
              <input id="booking-date" className="booking-input" type="date" min={today || undefined} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} />
              <div className="booking-field-row">
                <label><span className="field-label"><Clock3 size={15} /> Start time</span>
                  <select className="booking-input" value={bookingStart} onChange={(event) => {
                    const nextStart = event.target.value;
                    const nextDurations = getChargingDurations(nextStart);
                    setBookingStart(nextStart);
                    if (!nextDurations.includes(bookingHours) && nextDurations.length > 0) {
                      setBookingHours(nextDurations[nextDurations.length - 1]);
                    }
                  }}>
                    {timeSlots.map((time) => <option key={time} value={time}>{formatTime(time)}</option>)}
                  </select>
                </label>
                <label><span className="field-label"><CloudMoon size={15} /> Charge duration</span>
                  <select className="booking-input" value={bookingHours} onChange={(event) => setBookingHours(Number(event.target.value))}>
                    {getChargingDurations(bookingStart).map((duration) => <option key={duration} value={duration}>{duration} hours</option>)}
                  </select>
                </label>
              </div>
              <div className="time-summary"><span>Charging window</span><b>{formatTime(bookingStart)} – {formatEnd(bookingDate, bookingStart, bookingHours)}</b></div>
              <div className="parking-window-notice">
                <Clock3 size={14} />
                <span>Your parking spot is reserved until <b>{formatTime(approvedParkingEnd)}</b>.</span>
              </div>
              {selectedBookingConflicts && (
                <div className="conflict-message" role="alert"><X size={15} /> This time overlaps another booking at this location. Try another start time.</div>
              )}
              <aside className="idle-fee-notice" aria-label="Morning idle fee">
                <span className="idle-fee-icon"><Clock3 size={15} /></span>
                <span><b>Morning idle fee</b><small>Please move your vehicle by 7:00 AM. Vehicles remaining after the approved parking window are charged {formatMoney(idleFeePerMinute)}/minute starting at 7:01 AM. This conditional fee is not included in the estimate below.</small></span>
              </aside>
              <div className="price-breakdown">
                <div><span>Charging · {bookingHours} hours × {formatMoney(selectedLocation.rate)}/hr</span><span>{formatMoney(chargingCost)}</span></div>
                <div><span>Overnight parking fee</span><span>{formatMoney(parkingFee)}</span></div>
                <div className="idle-fee-row"><span>Morning idle fee · if applicable</span><span>{formatMoney(idleFeePerMinute)}/min from 7:01 AM</span></div>
                <div className="price-total"><b>Estimated total</b><b>{formatMoney(estimatedTotal)} <small>CAD</small></b></div>
              </div>
              <button type="button" className="confirm-button" onClick={confirmBooking} disabled={!hydrated || Boolean(selectedBookingConflicts)}>
                {selectedBookingConflicts ? "Choose another time" : "Reserve this spot"} <ArrowRight size={17} />
              </button>
              <p className="modal-disclaimer"><ShieldCheck size={14} /> Simulated booking only. No payment or real reservation will be made.</p>
            </div>
          </section>
        </div>
      )}

      {cancelId && (
        <div className="modal-scrim" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCancelId(null);
        }}>
          <section className="cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
            <button className="icon-button cancel-close" type="button" onClick={() => setCancelId(null)} aria-label="Close"><X size={19} /></button>
            <span className="cancel-modal-icon"><CalendarDays size={23} /></span>
            <h2 id="cancel-title">Cancel this reservation?</h2>
            <p>This demo booking will be removed from your saved bookings on this device.</p>
            <div className="cancel-actions"><button type="button" onClick={() => setCancelId(null)}>Keep booking</button><button type="button" className="cancel-confirm" onClick={confirmCancellation}>Yes, cancel it</button></div>
          </section>
        </div>
      )}

      {notice && (
        <div className={`toast toast-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.kind === "success" ? <CheckCircle2 size={17} /> : <X size={17} />}
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={15} /></button>
        </div>
      )}
    </main>
  );
}
