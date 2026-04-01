import { useState, useMemo } from "react";
import "./styles.css";
import logo from "./kaimakkilogo.png";

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

export default function App() {
  const [numVideos, setNumVideos] = useState(4);
  const [postsPerMonth, setPostsPerMonth] = useState(4);

  const perWeek = postsPerMonth / 4.33;
  const { total, normalTotal, breakdown } = useMemo(() => calculateTotal(numVideos), [numVideos]);
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

        <footer className="footer">
          <p>made with meraki by kaimakki 🤍</p>
        </footer>
      </main>
    </div>
  );
}
