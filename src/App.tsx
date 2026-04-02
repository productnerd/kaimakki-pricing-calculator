import { useState, useMemo, useCallback, useEffect } from "react";
import "./styles.css";
import logo from "./kaimakkilogo.png";
import monogram from "./mongram.png";
import celebrationGif from "./giphy-19.gif";

const PRODUCTION_STAGES = [
  {
    title: "Social Media Strategy & Video Concept Ideation",
    frequency: "Once per month",
    handler: "both" as const,
    note: "",
    scope: [
      { text: "Understand brand, video & comms style of client", owner: "agency" },
      { text: "Align with client on new products, campaigns, events, special dates (eg Easter) for coming month — adjust video strategy", owner: "agency" },
      { text: "Social media high level strategy", owner: "both" },
      { text: "Analyse performance from last month. Setup new 'experiments'", owner: "kaimakki" },
      { text: "Research latest trends", owner: "kaimakki" },
      { text: "Present three ideas per video for agency to present to client", owner: "kaimakki" },
      { text: "Prioritise list of videos, carousels and photos for next month with client -using above list if they so wish- and communicate with Kaimakki", owner: "agency" },
    ],
  },
  {
    title: "Pre-production",
    frequency: "Per video (depends on format)",
    handler: "kaimakki" as const,
    note: "",
    scope: [
      { text: "Prepare scripts — if relevant", owner: "" },
      { text: "Prepare shot-list — if relevant", owner: "" },
    ],
  },
  {
    title: "Filming",
    frequency: "One shoot can cover 3-6 videos (depending on formats)",
    handler: "kaimakki" as const,
    note: "",
    scope: [
      { text: "Travel to place", owner: "" },
      { text: "Coordinate shoot as per pre-production", owner: "" },
    ],
  },
  {
    title: "Editing",
    frequency: "Per video",
    handler: "kaimakki" as const,
    note: "",
    scope: [{ text: "Editing", owner: "" }],
  },
  {
    title: "Account Management",
    frequency: "",
    handler: "agency" as const,
    note: "",
    scope: [
      { text: "Coordinate shoot dates", owner: "" },
      { text: "Get auxiliary media (extra photos, old footage etc)", owner: "" },
      { text: "Get other information necessary during the editing phase", owner: "" },
      { text: "Get feedback and approval from client for preproduction", owner: "" },
      { text: "Get feedback and approval from client for final video", owner: "" },
    ],
  },
];

const TERMS_SECTIONS = [
  {
    title: "Service",
    items: [
      "Each video is a maximum of 45 seconds.",
      "Prices do not include posting or setting up social media accounts. We can propose a content calendar but the marketing agency is to handle both.",
      "We do not handle community management (responding to comments and DMs).",
      "Prices are for a single client. Agency cannot purchase a pack of 20 videos and use it across 2+ clients. This is because there is a fixed cost per client for onboarding, strategy and comms as well as the shooting. It also keeps accounts more tidy.",
      "Prices include video PLUS the same amount of photos (that can also be used as social media posts: static image or carousel).",
      "Shoot time is proportional to the number of videos: 4 videos, 4 hours, +30 minutes for every extra video. So for example for 8 videos the max shoot time is 6 hours.",
      "For Limassol: Transport to and from the location beyond a single location is included in the shoot time. This means that if two shoots are needed and the total shoot time is 4 hours then we will subtract the transport time of the second shoot from the 4 hours.",
      "Outside Limassol: Given the extra hours on the road and fuel costs, this will incur an additional cost of €60 per shoot.",
    ],
  },
  {
    title: "Account Management / Communications",
    items: [
      "Communication between the client and Kaimakki is owned either entirely by the marketing agency or by the client. We are happy to speak with both but for better collaboration it is important to define a single POC and decision maker.",
      "This decision maker is to sign off on the videos we will make, provide input for scripts and edits. This POC can talk to other stakeholders of course to gather feedback and insights but they are responsible to be the single POC with Kaimakki.",
    ],
  },
  {
    title: "Meetings",
    items: [
      "30' intro meeting with free proposal.",
      "1h monthly strategy & performance meeting after we sign where we agree exactly what to shoot — this can be handled either by agency or Kaimakki.",
      "No additional meetings unless otherwise agreed.",
    ],
  },
  {
    title: "Strategy & Video Prioritisation",
    items: [
      "Kaimakki has to agree to the scope of each video after each strategy session.",
      "As you might appreciate, different video formats require different effort for both pre, film and post. Handling this part well includes being able to balance this effort/quality. If the effort is too high given the price per video, Kaimakki might have to propose alternatives or tweaks to keep the production effort 'reasonable'.",
    ],
  },
  {
    title: "Iteration Policy",
    items: [
      "Two iterations allowed during pre-production. One from agency and another from client.",
      "Two iterations allowed on final video edit. One from agency and another from client.",
      "Iteration feedback can be done over the phone & email.",
    ],
  },
  {
    title: "Payment Terms",
    items: [
      "50% prepayment upfront. Non-refundable unless Kaimakki cancels.",
      "50% upon delivery of all videos.",
      "Shoots outside Limassol incur an additional €60 per shoot for travel and fuel costs.",
      "Videos longer than 45 seconds are subject to an additional charge depending on length and complexity.",
      "Additional aspect ratios (e.g. 16:9 horizontal, 1:1 square) beyond the default 9:16 vertical are charged extra per video.",
    ],
  },
  {
    title: "Posting",
    items: [
      "Our plans are monthly & quarterly for different number of videos per week. Consistency is important for social media algorithms so it is essential that as a minimum, two pieces of content are posted per week (our smallest plan).",
    ],
  },
  {
    title: "Credits",
    items: [
      "Kaimakki is permitted to use the logo of the client as well as the produced video and performance metrics in their website and portfolio. For select posts, Kaimakki might request to be tagged in the video description.",
    ],
  },
];

const AGENCY_TIERS = [
  { min: 1, max: 4, price: 170, normalPrice: 197 },
  { min: 5, max: 8, price: 152, normalPrice: null },
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

// Discount curve for extra photos and carousels (similar shape to video tiers)
const EXTRA_PHOTO_BASE = 20;
const CAROUSEL_BASE = 50;

function getExtrasDiscount(count: number): number {
  if (count <= 2) return 0;
  if (count <= 5) return 5;
  if (count <= 10) return 8;
  if (count <= 20) return 12;
  return 15;
}

function calculateExtrasTotal(count: number, basePrice: number): { total: number; discountPct: number } {
  const discountPct = getExtrasDiscount(count);
  const discountedPrice = basePrice * (1 - discountPct / 100);
  return { total: Math.round(count * discountedPrice), discountPct };
}

const MIN_VIDEOS = 4;
const MAX_VIDEOS = 50;
const MAX_PER_WEEK = 3;

const MIN_POSTS = 1;
const MAX_POSTS = 12; // per month

function getFrequencyLabel(postsPerMonth: number): string {
  if (postsPerMonth <= 3) return `${postsPerMonth}× per month`;
  if (postsPerMonth === 4) return "1× per week";
  if (postsPerMonth === 8) return "2× per week";
  if (postsPerMonth === 12) return "3× per week";
  return `${postsPerMonth}× per month`;
}

function TermsAccordion() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className={`accordion-item ${open ? "accordion-open" : ""}`}>
      <button className="accordion-header" onClick={toggle}>
        <div className="accordion-title-row">
          <span className="accordion-title">Collaboration Terms</span>
        </div>
        <span className="accordion-arrow">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="accordion-body">
          {TERMS_SECTIONS.map((section, i) => (
            <div key={i} className="terms-section">
              <h3 className="terms-heading">{section.title}</h3>
              <ul className="accordion-scope">
                {section.items.map((item, j) => (
                  <li key={j}><span>{item}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccordionItem({ stage }: { stage: typeof PRODUCTION_STAGES[number] }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className={`accordion-item accordion-handler-${stage.handler} ${open ? "accordion-open" : ""}`}>
      <button className="accordion-header" onClick={toggle}>
        {stage.handler === "both" ? (
          <span className="handler-thumbs">
            <span className="handler-thumb handler-kaimakki">
              <img src={monogram} alt="Kaimakki" />
            </span>
            <span className="handler-thumb handler-agency handler-thumb-overlap">A</span>
          </span>
        ) : stage.handler === "kaimakki" ? (
          <span className="handler-thumb handler-kaimakki">
            <img src={monogram} alt="Kaimakki" />
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
          {stage.handler === "both" && (
            <span className="accordion-handler-label">Kaimakki <span className="accordion-handler-agency">+ Agency</span></span>
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
              <li key={i}>
                <span>{item.text}</span>
                {item.owner && (
                  <span className={`owner-pill owner-${item.owner}`}>
                    {item.owner === "kaimakki" ? "Kaimakki" : item.owner === "agency" ? "Agency" : "Kaimakki + Agency"}
                  </span>
                )}
              </li>
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
  const [numPhotos, setNumPhotos] = useState(4);
  const [numCarousels, setNumCarousels] = useState(0);
  const [showGif, setShowGif] = useState(false);

  const freePhotos = numVideos; // photos equal to videos are free

  // Lock photo slider minimum to video count
  useEffect(() => {
    setNumPhotos((prev) => Math.max(prev, numVideos));
  }, [numVideos]);

  const extraPhotos = Math.max(0, numPhotos - freePhotos);
  const { total: extraPhotosTotal, discountPct: photoDiscountPct } = calculateExtrasTotal(extraPhotos, EXTRA_PHOTO_BASE);
  const { total: carouselsTotal, discountPct: carouselDiscountPct } = calculateExtrasTotal(numCarousels, CAROUSEL_BASE);

  const perWeek = postsPerMonth / 4.33;
  const { total: baseTotal, normalTotal, breakdown } = useMemo(() => calculateTotal(numVideos), [numVideos]);
  const total = baseTotal + extraPhotosTotal + carouselsTotal;
  const prepayment = total / 2;

  const totalPosts = numVideos + numPhotos + numCarousels;
  const weeksToDeliver = Math.ceil(numVideos / MAX_PER_WEEK);
  const weeksOfContent = perWeek > 0 ? totalPosts / perWeek : 0;
  const monthsOfContent = weeksOfContent / 4.33;

  const avgPrice = numVideos > 0 ? baseTotal / numVideos : 0;
  const savings = normalTotal - baseTotal;
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


            {/* Photo Posts */}
            <section className="card">
              <label className="card-label">Photo posts</label>
              <p className="card-note">{freePhotos} included free{extraPhotos > 0 ? `. Extra at \u20AC${Math.round(EXTRA_PHOTO_BASE * (1 - photoDiscountPct / 100))}/post` : ""}{extraPhotos > 2 ? ` (${photoDiscountPct}% volume discount)` : ""}</p>
              <div className="slider-row">
                <input
                  type="range"
                  min={4}
                  max={100}
                  value={numPhotos}
                  onChange={(e) => setNumPhotos(Math.max(Number(e.target.value), numVideos))}
                  className="slider"
                />
                <div className="slider-value">{numPhotos}</div>
              </div>
              <div className="slider-hints">
                <span>4</span>
                <span>100</span>
              </div>
            </section>

            {/* Carousels */}
            <section className="card">
              <label className="card-label">Carousel posts</label>
              <p className="card-note">&euro;{Math.round(CAROUSEL_BASE * (1 - carouselDiscountPct / 100))}/carousel{numCarousels > 2 ? ` (${carouselDiscountPct}% volume discount)` : ""}</p>
              <div className="slider-row">
                <input
                  type="range"
                  min={0}
                  max={numVideos}
                  value={numCarousels}
                  onChange={(e) => setNumCarousels(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{numCarousels}</div>
              </div>
              <div className="slider-hints">
                <span>0</span>
                <span>{numVideos}</span>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN — Results */}
          <div className="col-right">
            {/* Frequency + Stats */}
            <section className="card">
              <label className="card-label">How often will you post?</label>
              <p className="card-note">Posts include videos, photos and carousels</p>
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
                <span>3×/wk</span>
              </div>

              <div className="stats-grid stats-grid-full">
                <div className="stat-box">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm6.5 4.2a.5.5 0 01.5 0l3.5 2a.5.5 0 010 .87l-3.5 2a.5.5 0 01-.75-.43V7.63a.5.5 0 01.25-.43zM1 20a1 1 0 011-1h20a1 1 0 110 2H2a1 1 0 01-1-1z"/></svg>
                  <div className="stat-number">{numVideos}</div>
                  <div className="stat-label">Short-form Videos</div>
                </div>
                <div className="stat-box">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2H3zm5.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM4.27 19l5.37-7.16a1 1 0 011.6 0l3.4 4.53 1.72-2.3a1 1 0 011.6 0L21 18.5V19a1 1 0 01-1 1H5a1 1 0 01-.73-.31z"/></svg>
                  <div className="stat-number">{numPhotos}</div>
                  <div className="stat-label">Photo Posts</div>
                  {freePhotos > 0 && <div className="stat-bonus">{freePhotos} free</div>}
                </div>
                {numCarousels > 0 && (
                  <div className="stat-box">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm14 3h2a2 2 0 012 2v8a2 2 0 01-2 2h-2V7z"/></svg>
                    <div className="stat-number">{numCarousels}</div>
                    <div className="stat-label">Carousels</div>
                  </div>
                )}
                <div className="stat-box">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2a1 1 0 011 1v1h10V3a1 1 0 112 0v1h2a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h2V3a1 1 0 011-1zM3 10v10h18V10H3z"/></svg>
                  <div className="stat-number">
                    {monthsOfContent >= 1
                      ? `${monthsOfContent.toFixed(1)}`
                      : `${Math.round(weeksOfContent)}`}
                  </div>
                  <div className="stat-label">
                    {monthsOfContent >= 1 ? "Months of Content" : `Week${Math.round(weeksOfContent) !== 1 ? "s" : ""} of Content`}
                  </div>
                </div>
              </div>
            </section>

            {/* Price Breakdown */}
            <section className="card">
              <h2 className="card-label">Price Breakdown</h2>
              <p className="card-note">Pricing is progressive — each tier applies only to videos in that range</p>

              {/* Videos section */}
              <div className="breakdown-section">
                <div className="breakdown-section-header">
                  <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm6.5 4.2a.5.5 0 01.5 0l3.5 2a.5.5 0 010 .87l-3.5 2a.5.5 0 01-.75-.43V7.63a.5.5 0 01.25-.43zM1 20a1 1 0 011-1h20a1 1 0 110 2H2a1 1 0 01-1-1z"/></svg>
                  <span className="breakdown-section-title">Videos</span>
                </div>
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
              </div>

              {/* Photos section */}
              {extraPhotos > 0 && (
                <div className="breakdown-section">
                  <div className="breakdown-section-header">
                    <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2H3zm5.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM4.27 19l5.37-7.16a1 1 0 011.6 0l3.4 4.53 1.72-2.3a1 1 0 011.6 0L21 18.5V19a1 1 0 01-1 1H5a1 1 0 01-.73-.31z"/></svg>
                    <span className="breakdown-section-title">Extra Photos</span>
                  </div>
                  <div className="breakdown-list">
                    <div className="breakdown-row">
                      <span className="breakdown-desc">
                        {extraPhotos} extra photo{extraPhotos > 1 ? "s" : ""} &times; &euro;{Math.round(EXTRA_PHOTO_BASE * (1 - photoDiscountPct / 100))}
                        {photoDiscountPct > 0 && <span className="discount-badge">-{photoDiscountPct}%</span>}
                      </span>
                      <span className="breakdown-amount">&euro;{extraPhotosTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Carousels section */}
              {numCarousels > 0 && (
                <div className="breakdown-section">
                  <div className="breakdown-section-header">
                    <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm14 3h2a2 2 0 012 2v8a2 2 0 01-2 2h-2V7z"/></svg>
                    <span className="breakdown-section-title">Carousels</span>
                  </div>
                  <div className="breakdown-list">
                    <div className="breakdown-row">
                      <span className="breakdown-desc">
                        {numCarousels} carousel{numCarousels > 1 ? "s" : ""} &times; &euro;{Math.round(CAROUSEL_BASE * (1 - carouselDiscountPct / 100))}
                        {carouselDiscountPct > 0 && <span className="discount-badge">-{carouselDiscountPct}%</span>}
                      </span>
                      <span className="breakdown-amount">&euro;{carouselsTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="avg-prices">
                <div className="avg-price-item">
                  <span className="avg-price-label">Avg. per video</span>
                  <span className="avg-price-value">&euro;{Math.round(avgPrice)}</span>
                </div>
                {extraPhotos > 0 && (
                  <div className="avg-price-item">
                    <span className="avg-price-label">Avg. per photo</span>
                    <span className="avg-price-value">&euro;{Math.round(extraPhotosTotal / extraPhotos)}</span>
                  </div>
                )}
                {numCarousels > 0 && (
                  <div className="avg-price-item">
                    <span className="avg-price-label">Avg. per carousel</span>
                    <span className="avg-price-value">&euro;{Math.round(carouselsTotal / numCarousels)}</span>
                  </div>
                )}
              </div>

              <div className="totals">
                <div className="total-row">
                  <span>Total Investment</span>
                  <span className="total-amount">&euro;{total.toLocaleString()}</span>
                </div>
                {savings > 0 && (
                  <div className="savings-row">
                    <span>Agency discount</span>
                    <span>&euro;{savings.toLocaleString()} saved ({discountPct}% off normal pricing)</span>
                  </div>
                )}
              </div>

              <h2 className="card-label" style={{ marginTop: "24px" }}>Extra Perks</h2>
              <div className="perks-grid">
                <div className="perk-item">
                  <svg className="perk-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                  <div>
                    <strong className="perk-title">Two Rounds of Iteration</strong>
                    <p className="perk-desc">Two iterations allowed for both pre-production and post-production (one from agency, one from client)</p>
                  </div>
                </div>
                <div className="perk-item">
                  <svg className="perk-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  <div>
                    <strong className="perk-title">Faster Delivery</strong>
                    <p className="perk-desc">3-day post-shoot delivery (standard is 4–5) for first video</p>
                  </div>
                </div>
                <div className="perk-item">
                  <svg className="perk-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7v4.28l-1.66 3.32A1 1 0 004.23 18h15.54a1 1 0 00.89-1.4L19 13.28V9a7 7 0 00-7-7zm-2 18a2 2 0 004 0h-4z"/></svg>
                  <div>
                    <strong className="perk-title">Urgent Delivery</strong>
                    <p className="perk-desc">Upon request, we can do urgent delivery with 24h post-shoot turnaround</p>
                  </div>
                </div>
                <div className="perk-item">
                  <svg className="perk-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 4.69 2 8v8c0 3.31 4.48 6 10 6s10-2.69 10-6V8c0-3.31-4.48-6-10-6zm0 2c4.42 0 8 1.79 8 4s-3.58 4-8 4-8-1.79-8-4 3.58-4 8-4zM6.5 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/><path d="M15 12l4 2.5V9.5L15 12z"/></svg>
                  <div>
                    <strong className="perk-title">Drone Shots</strong>
                    <p className="perk-desc">Included in all shoots if necessary</p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* FULL WIDTH — Tier Reference */}
        <section className="card card-full">
          <h2 className="card-label">Agency Price Tiers</h2>
          <p className="card-note">Discount compared to our standard pricing</p>
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
                    {tier.min <= 1 ? tier.max : tier.min === tier.max ? tier.min : `${tier.min}-${tier.max}`} videos
                  </div>
                  {tier.normalPrice ? (
                    <div className="tier-normal-price">&euro;{tier.normalPrice}</div>
                  ) : (
                    <div className="tier-na">not available</div>
                  )}
                  <div className="tier-price">&euro;{tier.price}</div>
                  <div className="tier-unit">per video</div>
                  {tier.normalPrice && <div className="tier-discount">~{discount}% off</div>}
                </div>
              );
            })}
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

          <div className="accordion accordion-sm" style={{ marginTop: "24px" }}>
            <TermsAccordion />
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2 className="cta-title">Let's work together?</h2>
          <div className="cta-buttons">
            <button className="cta-btn cta-btn-green" onClick={() => { triggerConfetti(); setShowGif(true); }}>Pameee!</button>
            <button className="cta-btn cta-btn-pink" onClick={() => { triggerConfetti(); setShowGif(true); }}>Let's Gooo!</button>
          </div>
        </section>

        {showGif && (
          <div className="gif-overlay" onClick={() => setShowGif(false)}>
            <img src={celebrationGif} alt="Let's go!" className="gif-image" onClick={(e) => e.stopPropagation()} />
            <a
              href={`mailto:maria@kaimakki.com?subject=${encodeURIComponent("Let's do this!")}&body=${encodeURIComponent("Let's do this! 🎬\n\n")}`}
              className="gif-cta-link"
              onClick={(e) => e.stopPropagation()}
            >
              Email us &rarr;
            </a>
          </div>
        )}

        <footer className="footer-minimal">
          <p>made with meraki by kaimakki 🤍</p>
        </footer>
      </main>
      <div id="confetti-container" />
    </div>
  );
}

function triggerConfetti() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  container.innerHTML = "";

  const colors = ["#DDF073", "#FFB0F1"];
  const shapes = ["circle", "square", "strip"];

  function createParticle(x: number, y: number, vx: number, vy: number, delay: number) {
    const el = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 4 + Math.random() * 8;
    const rotation = Math.random() * 360;
    const duration = 1.5 + Math.random() * 2;

    el.style.cssText = `
      position: fixed; left: ${x}px; top: ${y}px; z-index: 9999; pointer-events: none;
      width: ${shape === "strip" ? size * 0.3 : size}px;
      height: ${shape === "strip" ? size * 2 : size}px;
      background: ${color};
      border-radius: ${shape === "circle" ? "50%" : shape === "strip" ? "2px" : "1px"};
      transform: rotate(${rotation}deg);
      animation: confetti-fly ${duration}s ease-out ${delay}s forwards;
      --vx: ${vx}px; --vy: ${vy}px;
      opacity: 1;
    `;
    container!.appendChild(el);
    setTimeout(() => el.remove(), (duration + delay) * 1000 + 100);
  }

  function spawnTop(delay: number) {
    setTimeout(() => {
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * window.innerWidth;
        const vx = (Math.random() - 0.5) * 200;
        const vy = 300 + Math.random() * 400;
        createParticle(x, -20, vx, vy, Math.random() * 0.3);
      }
    }, delay);
  }

  function spawnBottomLeft(delay: number) {
    setTimeout(() => {
      for (let i = 0; i < 50; i++) {
        const angle = -Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 2;
        const speed = 200 + Math.random() * 400;
        createParticle(50, window.innerHeight - 50, Math.cos(angle) * speed, -Math.sin(angle) * speed, Math.random() * 0.2);
      }
    }, delay);
  }

  function spawnBottomRight(delay: number) {
    setTimeout(() => {
      for (let i = 0; i < 50; i++) {
        const angle = Math.PI / 4 + Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;
        const speed = 200 + Math.random() * 400;
        createParticle(window.innerWidth - 50, window.innerHeight - 50, Math.cos(angle) * speed, -Math.sin(angle) * speed, Math.random() * 0.2);
      }
    }, delay);
  }

  // 9 waves, 250ms apart, no two at the same time
  spawnTop(0);
  spawnBottomLeft(250);
  spawnBottomRight(500);
  spawnTop(750);
  spawnBottomRight(1000);
  spawnBottomLeft(1250);
  spawnTop(1500);
  spawnBottomLeft(1750);
  spawnBottomRight(2000);
}
