import { useState, useMemo, useCallback } from "react";
import "./styles.css";
import logo from "./kaimakkilogo.png";

const PRODUCTION_STAGES = [
  {
    title: "Social Media Strategy & Video Concept Ideation",
    frequency: "Once per month",
    handler: "kaimakki" as const,
    note: "10% Discount if handled by agency",
    scope: [
      "Analyse performance from last month. Setup new 'experiments'",
      "Research latest trends",
      "Align with client on new products, campaigns, events, special dates (eg Easter) for coming month — adjust video strategy",
      "Present three ideas per video for client to choose from",
      "Prioritise list of videos, carousels and photos for next month",
      "Understand brand, video & comms style of client",
      "Run strategy call — 1-2h",
    ],
  },
  {
    title: "Pre-production",
    frequency: "Per video (depends on format)",
    handler: "kaimakki" as const,
    note: "",
    scope: [
      "Prepare scripts — if relevant",
      "Prepare shot-list — if relevant",
    ],
  },
  {
    title: "Filming",
    frequency: "One shoot can cover 3-6 videos (depending on formats)",
    handler: "kaimakki" as const,
    note: "",
    scope: [
      "Travel to place",
      "Coordinate shoot as per pre-production",
    ],
  },
  {
    title: "Editing",
    frequency: "Per video",
    handler: "kaimakki" as const,
    note: "",
    scope: ["Editing"],
  },
  {
    title: "Account Management",
    frequency: "",
    handler: "agency" as const,
    note: "",
    scope: [
      "Coordinate shoot dates",
      "Get auxiliary media (extra photos, old footage etc)",
      "Get other information necessary during the editing phase",
      "Get feedback and approval from client for preproduction",
      "Get feedback and approval from client for final video",
    ],
  },
];

const AGENCY_TIERS = [
  { min: 1, max: 4, price: 165, normalPrice: 197 },
  { min: 5, max: 8, price: 148, normalPrice: null },
  { min: 9, max: 15, price: 138, normalPrice: 156 },
  { min: 16, max: 25, price: 132, normalPrice: null },
  { min: 26, max: 36, price: 128, normalPrice: null },
  { min: 37, max: 50, price: 125, normalPrice: 137 },
];

// For tiers without a normal price, interpolate discount % from surrounding tiers
function getTierDiscount(tierIndex: number): number {
  const tier = AGENCY_TIERS[tierIndex];
  if (tier.normalPrice) {
    return Math.round(((tier.normalPrice - tier.price) / tier.normalPrice) * 100);
  }
  // Find nearest tier before with a normal price
  let prevIdx = tierIndex - 1;
  while (prevIdx >= 0 && !AGENCY_TIERS[prevIdx].normalPrice) prevIdx--;
  // Find nearest tier after with a normal price
  let nextIdx = tierIndex + 1;
  while (nextIdx < AGENCY_TIERS.length && !AGENCY_TIERS[nextIdx].normalPrice) nextIdx++;

  const prevDiscount = prevIdx >= 0 ? getTierDiscount(prevIdx) : 0;
  const nextDiscount = nextIdx < AGENCY_TIERS.length ? getTierDiscount(nextIdx) : prevDiscount;

  const totalSteps = nextIdx - prevIdx;
  const currentStep = tierIndex - prevIdx;
  return Math.round(prevDiscount + (nextDiscount - prevDiscount) * (currentStep / totalSteps));
}

function calculateTotal(numVideos: number) {
  let remaining = numVideos;
  let total = 0;
  let normalTotal = 0;
  const breakdown: { count: number; price: number; normalPrice: number | null; tierIndex: number }[] = [];

  for (let idx = 0; idx < AGENCY_TIERS.length; idx++) {
    const tier = AGENCY_TIERS[idx];
    if (remaining <= 0) break;
    const tierCapacity = tier.max - tier.min + 1;
    const videosInTier = Math.min(remaining, tierCapacity);
    total += videosInTier * tier.price;
    // For tiers without a normal price, derive it from the interpolated discount
    const discount = getTierDiscount(idx);
    const impliedNormal = tier.normalPrice ?? Math.round(tier.price / (1 - discount / 100));
    normalTotal += videosInTier * impliedNormal;
    breakdown.push({ count: videosInTier, price: tier.price, normalPrice: tier.normalPrice, tierIndex: idx });
    remaining -= videosInTier;
  }

  return { total, normalTotal, breakdown };
}

const MIN_VIDEOS = 4;
const MAX_VIDEOS = 50;
const MAX_PER_WEEK = 2;

const MIN_POSTS = 1;
const MAX_POSTS = 8; // per month

function getFrequencyLabel(postsPerMonth: number): string {
  if (postsPerMonth <= 3) return `${postsPerMonth}× per month`;
  if (postsPerMonth === 4) return "1× per week";
  if (postsPerMonth === 8) return "2× per week";
  return `${postsPerMonth}× per month`;
}

function AccordionItem({ stage }: { stage: typeof PRODUCTION_STAGES[number] }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className={`accordion-item ${open ? "accordion-open" : ""}`}>
      <button className="accordion-header" onClick={toggle}>
        {stage.handler === "kaimakki" ? (
          <span className="handler-thumb handler-kaimakki">
            <img src={logo} alt="Kaimakki" />
          </span>
        ) : (
          <span className="handler-thumb handler-agency">A</span>
        )}
        <div className="accordion-title-row">
          <span className="accordion-title">{stage.title}</span>
          {stage.handler === "kaimakki" && (
            <span className="accordion-handler-label">Kaimakki</span>
          )}
          {stage.handler === "agency" && (
            <span className="accordion-handler-label accordion-handler-agency">Agency</span>
          )}
          {stage.note && <span className="accordion-note">{stage.note}</span>}
        </div>
        <span className="accordion-arrow">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="accordion-body">
          {stage.frequency && (
            <div className="accordion-freq">
              <strong>Frequency:</strong> {stage.frequency}
            </div>
          )}
          <ul className="accordion-scope">
            {stage.scope.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [numVideos, setNumVideos] = useState(4);
  const [postsPerMonth, setPostsPerMonth] = useState(4);
  const [agencyHandlesStrategy, setAgencyHandlesStrategy] = useState(false);

  const perWeek = postsPerMonth / 4.33;
  const { total: baseTotal, normalTotal, breakdown } = useMemo(() => calculateTotal(numVideos), [numVideos]);
  const strategyDiscount = agencyHandlesStrategy ? 0.10 : 0;
  const total = Math.round(baseTotal * (1 - strategyDiscount));
  const prepayment = total / 2;

  const weeksToDeliver = Math.ceil(numVideos / MAX_PER_WEEK);
  const weeksOfContent = perWeek > 0 ? numVideos / perWeek : 0;
  const monthsOfContent = weeksOfContent / 4.33;

  const avgPrice = numVideos > 0 ? total / numVideos : 0;
  const savings = normalTotal - total;
  const discountPct = normalTotal > 0 ? Math.round((savings / normalTotal) * 100) : 0;

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <a href="https://kaimakki.com" target="_blank" rel="noopener noreferrer" className="logo-link">
          <img src={logo} alt="Kaimakki" className="logo-img" />
        </a>
        <p className="subtitle">Agency Pricing Calculator</p>
      </header>

      <main className="main">
        <div className="two-col">
          {/* LEFT COLUMN — Inputs */}
          <div className="col-left">
            {/* Video Count */}
            <section className="card">
              <label className="card-label">How many videos do you need?</label>
              <div className="slider-row">
                <input
                  type="range"
                  min={MIN_VIDEOS}
                  max={MAX_VIDEOS}
                  value={numVideos}
                  onChange={(e) => setNumVideos(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{numVideos}</div>
              </div>
              <div className="slider-hints">
                <span>4</span>
                <span>50</span>
              </div>
            </section>

            {/* Frequency */}
            <section className="card">
              <label className="card-label">How often will you post?</label>
              <div className="slider-row">
                <input
                  type="range"
                  min={MIN_POSTS}
                  max={MAX_POSTS}
                  value={postsPerMonth}
                  onChange={(e) => setPostsPerMonth(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value slider-value-sm">{getFrequencyLabel(postsPerMonth)}</div>
              </div>
              <div className="slider-hints">
                <span>1×/mo</span>
                <span>2×/wk</span>
              </div>
            </section>

            {/* Strategy checkbox */}
            <section className="card">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={agencyHandlesStrategy}
                  onChange={(e) => setAgencyHandlesStrategy(e.target.checked)}
                  className="checkbox"
                />
                <div>
                  <span className="checkbox-label">Agency handles strategy, video concept ideation &amp; prioritisation</span>
                  <span className="checkbox-bonus">10% discount applied</span>
                </div>
              </label>
              <p className="card-note" style={{ marginTop: "12px", marginBottom: 0 }}>
                We recommend Kaimakki handles strategy for the best results
              </p>
            </section>

          </div>

          {/* RIGHT COLUMN — Results */}
          <div className="col-right">
            {/* Price Breakdown */}
            <section className="card">
              <h2 className="card-label">Price Breakdown</h2>
              <p className="card-note">Pricing is progressive — each tier applies only to videos in that range</p>
              <div className="breakdown-list">
                {breakdown.map((tier, i) => {
                  const discount = getTierDiscount(tier.tierIndex);
                  return (
                    <div key={i} className="breakdown-row">
                      <span className="breakdown-desc">
                        {tier.count} video{tier.count > 1 ? "s" : ""} &times;{" "}
                        {tier.normalPrice && (
                          <><span className="price-normal">&euro;{tier.normalPrice}</span>{" "}</>
                        )}
                        &euro;{tier.price}
                        <span className="discount-badge">-{discount}%</span>
                      </span>
                      <span className="breakdown-amount">&euro;{(tier.count * tier.price).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              <div className="totals">
                {agencyHandlesStrategy && (
                  <div className="breakdown-row strategy-row">
                    <span className="breakdown-desc">Strategy discount</span>
                    <span className="strategy-amount">-&euro;{Math.round(baseTotal * 0.10).toLocaleString()}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Total Investment</span>
                  <span className="total-amount">&euro;{total.toLocaleString()}</span>
                </div>
                <div className="total-row prepay-row">
                  <span>Prepayment (50% upfront)</span>
                  <span className="prepay-amount">&euro;{prepayment.toLocaleString()}</span>
                </div>
                {savings > 0 && (
                  <div className="savings-row">
                    <span>Agency discount</span>
                    <span>&euro;{savings.toLocaleString()} saved ({discountPct}% off normal pricing)</span>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>

        {/* FULL WIDTH — What You Get */}
        <section className="card card-full">
          <div className="stats-grid stats-grid-full">
            <div className="stat-box">
              <div className="stat-number">{numVideos}</div>
              <div className="stat-label">Short-form Videos</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{numVideos}</div>
              <div className="stat-label">Branded Photos</div>
              <div className="stat-bonus">included free</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">
                {monthsOfContent >= 1
                  ? `${monthsOfContent.toFixed(1)}`
                  : `${Math.round(weeksOfContent)}`}
              </div>
              <div className="stat-label">
                {monthsOfContent >= 1 ? "Months of Content" : `Week${Math.round(weeksOfContent) !== 1 ? "s" : ""} of Content`}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-number">&euro;{Math.round(avgPrice)}</div>
              <div className="stat-label">Avg. per Video</div>
            </div>
          </div>
        </section>

        {/* FULL WIDTH — Tier Reference */}
        <section className="card card-full">
          <h2 className="card-label">Agency Price Tiers</h2>
          <div className="tiers-grid tiers-grid-full">
            {AGENCY_TIERS.map((tier, idx) => {
              const isActive = numVideos >= tier.min;
              const discount = getTierDiscount(idx);
              return (
                <div
                  key={tier.min}
                  className={`tier-box ${isActive ? "tier-active" : ""}`}
                >
                  <div className="tier-range">
                    {tier.min === 1 ? "1" : tier.min}-{tier.max} videos
                  </div>
                  {tier.normalPrice ? (
                    <div className="tier-normal-price">&euro;{tier.normalPrice}</div>
                  ) : (
                    <div className="tier-na">not available</div>
                  )}
                  <div className="tier-price">&euro;{tier.price}</div>
                  <div className="tier-unit">per video</div>
                  <div className="tier-discount">~{discount}% off</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FULL WIDTH — Extra Perks */}
        <section className="card card-full">
          <h2 className="card-label">Extra Perks for Agencies</h2>
          <div className="perks-grid">
            <div className="perk-item">
              <span className="perk-icon">⚡</span>
              <div>
                <strong className="perk-title">Faster Postproduction</strong>
                <p className="perk-desc">3-day post-shoot delivery (standard is 4–5) for first video</p>
              </div>
            </div>
            <div className="perk-item">
              <span className="perk-icon">🚨</span>
              <div>
                <strong className="perk-title">Emergency Productions</strong>
                <p className="perk-desc">
                  {numVideos <= 2
                    ? "1 video can have urgent delivery with 24h post-shoot turnaround"
                    : `${Math.floor(numVideos * 0.25)} of your ${numVideos} videos can have urgent delivery with 24h post-shoot turnaround`}
                </p>
              </div>
            </div>
            <div className="perk-item">
              <span className="perk-icon">🎥</span>
              <div>
                <strong className="perk-title">Drone Shots</strong>
                <p className="perk-desc">Included in all shoots if necessary</p>
              </div>
            </div>
          </div>
        </section>

        {/* FULL WIDTH — Production Stages */}
        <section className="card card-full">
          <h2 className="card-label">How It Works — Production Stages</h2>
          <div className="accordion">
            {PRODUCTION_STAGES.map((stage) => (
              <AccordionItem key={stage.title} stage={stage} />
            ))}
          </div>
        </section>

        <footer className="footer">
          <p>made with meraki by kaimakki 🤍</p>
        </footer>
      </main>
    </div>
  );
}
