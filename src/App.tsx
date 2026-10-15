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
      "Each video can run 5 seconds longer than the matching plan allows: 45 seconds at Starter level, 50 at Growth level, 55 at Let's go level.",
      "Prices do not include posting or setting up social media accounts. We can propose a content calendar but the marketing agency is to handle both.",
      "We do not handle community management (responding to comments and DMs).",
      "Prices are for a single client. Agency cannot purchase a pack of 20 videos and use it across 2+ clients. This is because there is a fixed cost per client for onboarding, strategy and comms as well as the shooting. It also keeps accounts more tidy.",
      "Each photo post is a complete, ready-to-publish post including caption concept, text and professional design — not just a raw photo.",
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
      "Videos longer than your level's maximum length are subject to an additional charge depending on length and complexity.",
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

// Our monthly plans (kaimakki.com), using the guaranteed (lower) number of videos per month.
// Agencies pay 10% less than the plan matching their posting pace.
const PLANS = [
  { name: "Starter", videos: 4, monthly: 870, quarterly: 740, carousels: 2, maxSeconds: 40 },
  { name: "Growth", videos: 6, monthly: 1160, quarterly: 950, carousels: 2, maxSeconds: 45 },
  { name: "Let's go", videos: 8, monthly: 1390, quarterly: 1180, carousels: 3, maxSeconds: 50 },
];
const AGENCY_DISCOUNT_PCT = 10;
const EXTRA_SECONDS = 5; // agency videos may run this much longer than the matching plan allows
const QUARTERLY_MONTHS = 3; // committing to 3 months unlocks our quarterly price
const MAX_MONTHS = 6;
// Extra discount on top of the quarterly price for committing longer (months → %)
const LONG_TERM_DISCOUNTS: Record<number, number> = { 4: 2, 5: 3, 6: 5 };

// Minimum posting pace: at least this many videos per brand per month
const MIN_PACE = 4;

function getPlanLevel(pace: number) {
  return PLANS.find((p) => pace <= p.videos) ?? PLANS[PLANS.length - 1];
}

function getPlanPrice(plan: (typeof PLANS)[number], quarterly: boolean): number {
  return quarterly ? plan.quarterly : plan.monthly;
}

function getAgencyPlanPrice(plan: (typeof PLANS)[number], quarterly: boolean): number {
  return getPlanPrice(plan, quarterly) * (1 - AGENCY_DISCOUNT_PCT / 100);
}

// Our standard rate: the Starter plan's monthly price per video (its 2 carousels count as 1 video).
// This is the most a video ever costs; everything else is a discount off it.
const STANDARD_VIDEO_RATE = PLANS[0].monthly / (PLANS[0].videos + PLANS[0].carousels / 2);

// Monthly per-video rate at a plan level: a full plan bundle at this pace costs exactly that plan.
// Capped at our standard rate, so a bigger plan level never costs more per video.
function getLevelRate(plan: (typeof PLANS)[number], pace: number): number {
  return Math.min(STANDARD_VIDEO_RATE, plan.monthly / (Math.min(pace, plan.videos) + plan.carousels / 2));
}

// Volume level and commitment for items posted per month per brand. Videos and carousels each
// unlock levels by their own count; a carousel then costs half a video at its level.
function getLevelPricing(count: number, numBrands: number, months: number) {
  const pace = count / numBrands / months;
  const plan = getPlanLevel(pace);
  const levelRate = getLevelRate(plan, pace);
  // If the rate is capped at our standard (Starter) rate, you're paying Starter prices,
  // so the quarterly discount is Starter's too
  const ratePlan = levelRate >= STANDARD_VIDEO_RATE ? PLANS[0] : plan;
  // Commitment: our quarterly price from 3 months, plus a little extra for 4-6 months
  const quarterlyFactor = months >= QUARTERLY_MONTHS ? ratePlan.quarterly / ratePlan.monthly : 1;
  return {
    pace,
    plan,
    levelRate,
    commitmentFactor: quarterlyFactor * (1 - (LONG_TERM_DISCOUNTS[months] ?? 0) / 100),
  };
}

const VOLUME_TIP = "Videos, carousels and photos each get cheaper the more of them you post per month per brand.";
const CREATIVE_DIRECTION_TIP = "You handle topics, formats and pre-production: 12% off.";
const FILMING_TIP = "You shoot the footage, we do the rest: 25% off.";

function eur(amount: number): string {
  return `€${Math.round(amount).toLocaleString()}`;
}

// Plain-text table for the email draft; a null row draws a separator line
function asciiTable(rows: ([string, string] | null)[]): string {
  const cells = rows.filter((r): r is [string, string] => r !== null);
  const w1 = Math.max(...cells.map((r) => r[0].length));
  const w2 = Math.max(...cells.map((r) => r[1].length));
  const line = `+${"-".repeat(w1 + 2)}+${"-".repeat(w2 + 2)}+`;
  return [line, ...rows.map((r) => (r ? `| ${r[0].padEnd(w1)} | ${r[1].padStart(w2)} |` : line)), line].join("\n");
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="info-tip" tabIndex={0} role="note" aria-label={text} data-tip={text}>
      i
    </span>
  );
}

function DiscountRow({ label, tip, amount, sub }: { label: string; tip: string; amount: number; sub?: boolean }) {
  return (
    <div className={`savings-row${sub ? " savings-sub" : ""}`}>
      <span>
        {label} <InfoTip text={tip} />
      </span>
      <span className="savings-amount">{amount > 0 ? `-${eur(amount)}` : "€0"}</span>
    </div>
  );
}

// Photo posts (carousels are priced at half the video rate)
const EXTRA_PHOTO_BASE = 20;

// Photo volume discount by photos per month per brand: like videos, none at a Starter-sized pace
const PHOTO_TIERS = [
  { label: "1–5", min: 1, discount: 0 },
  { label: "6–10", min: 6, discount: 8 },
  { label: "11–20", min: 11, discount: 12 },
  { label: "21+", min: 21, discount: 15 },
];

const PHOTO_VOLUME_TIP =
  "Photos per brand per month: " +
  PHOTO_TIERS.filter((t) => t.discount > 0)
    .map((t) => `${t.discount}% off from ${t.min}`)
    .join(", ") +
  ".";

function getPhotoDiscount(photosPerMonth: number): number {
  return [...PHOTO_TIERS].reverse().find((t) => photosPerMonth >= t.min)?.discount ?? 0;
}

function calculatePhotosTotal(numPhotos: number, photosPerMonth: number): { total: number; discountPct: number } {
  const discountPct = getPhotoDiscount(photosPerMonth);
  return { total: Math.round(numPhotos * EXTRA_PHOTO_BASE * (1 - discountPct / 100)), discountPct };
}

const MIN_VIDEOS = 4;
const MAX_VIDEOS = 50;
const MAX_PHOTOS = 100;
const MAX_PER_WEEK = 3;

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

// The calculator's state lives in the URL, so any link reproduces the exact quote
const initialParams = new URLSearchParams(window.location.search);

function readNumberParam(key: string, min: number, max: number, fallback: number): number {
  const value = Number(initialParams.get(key));
  return initialParams.has(key) && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

export default function App() {
  // Everything is ordered per month; the months slider only sets how long they commit
  const [videosPerMonth, setVideosPerMonth] = useState(() => readNumberParam("v", MIN_VIDEOS, MAX_VIDEOS, 4));
  const [months, setMonths] = useState(() => readNumberParam("m", 1, MAX_MONTHS, 1));
  const [photosPerMonth, setPhotosPerMonth] = useState(() => readNumberParam("p", 0, MAX_PHOTOS, 0));
  const [carouselsPerMonth, setCarouselsPerMonth] = useState(() => readNumberParam("c", 0, MAX_VIDEOS, 0));
  const [showGif, setShowGif] = useState(false);
  const [creativeDirection, setCreativeDirection] = useState(() => initialParams.get("cd") === "1");
  const [handleFilming, setHandleFilming] = useState(() => initialParams.get("f") === "1");
  const [numBrands, setNumBrands] = useState(() => readNumberParam("b", 1, MAX_VIDEOS, 1));
  const [linkCopied, setLinkCopied] = useState(false);

  const shareParams = new URLSearchParams({
    v: String(videosPerMonth),
    m: String(months),
    b: String(numBrands),
    c: String(carouselsPerMonth),
    p: String(photosPerMonth),
  });
  if (creativeDirection) shareParams.set("cd", "1");
  if (handleFilming) shareParams.set("f", "1");
  const shareUrl = `${window.location.origin}${window.location.pathname}?${shareParams}`;

  // Keep the address bar in sync so copying it also copies the quote
  useEffect(() => {
    window.history.replaceState(null, "", shareUrl);
  }, [shareUrl]);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt("Copy this link to share the quote:", shareUrl);
    }
  }

  const numVideos = videosPerMonth * months;
  const numPhotos = photosPerMonth * months;
  const numCarousels = carouselsPerMonth * months;

  // Enforce the minimum pace: at least MIN_PACE videos per brand per month
  const maxBrands = Math.max(1, Math.floor(videosPerMonth / MIN_PACE));

  // When videos per month drop, reduce brands and carousels to stay within limits
  useEffect(() => {
    if (numBrands > maxBrands) setNumBrands(maxBrands);
    if (carouselsPerMonth > videosPerMonth) setCarouselsPerMonth(videosPerMonth);
  }, [maxBrands, numBrands, carouselsPerMonth, videosPerMonth]);

  const photoPace = photosPerMonth / numBrands;
  const { total: numPhotosTotal, discountPct: photoDiscountPct } = calculatePhotosTotal(numPhotos, photoPace);

  const video = useMemo(() => getLevelPricing(numVideos, numBrands, months), [numVideos, numBrands, months]);
  const carousel = useMemo(() => getLevelPricing(numCarousels, numBrands, months), [numCarousels, numBrands, months]);
  const { pace, plan, levelRate } = video;
  // A carousel costs half a video at the level its own count unlocks (2 carousels = 1 video)
  const carouselLevelRate = carousel.levelRate / 2;

  // The receipt: everything at our standard rates, then each discount in turn
  const videosStandard = numVideos * STANDARD_VIDEO_RATE;
  const carouselsStandard = (numCarousels * STANDARD_VIDEO_RATE) / 2;
  const photosStandard = numPhotos * EXTRA_PHOTO_BASE;
  const standardTotal = Math.round(videosStandard + carouselsStandard + photosStandard);

  const videosAfterVolume = numVideos * levelRate;
  const carouselsAfterVolume = numCarousels * carouselLevelRate;
  const afterVolume = videosAfterVolume + carouselsAfterVolume + numPhotosTotal;
  const commitmentSavings =
    videosAfterVolume * (1 - video.commitmentFactor) + carouselsAfterVolume * (1 - carousel.commitmentFactor);
  const afterCommitment = afterVolume - commitmentSavings;
  const agencyFactor = 1 - AGENCY_DISCOUNT_PCT / 100;
  const afterAgency = afterCommitment * agencyFactor;

  const cdDiscount = creativeDirection ? 0.88 : 1;
  const filmingDiscount = handleFilming ? 0.75 : 1;

  // Videos, carousels and photos each get their own volume discount, set by their own monthly count
  const volumeLine = Math.round(videosStandard - videosAfterVolume);
  const carouselVolumeLine = Math.round(carouselsStandard - carouselsAfterVolume);
  const photoVolumeLine = photosStandard - numPhotosTotal;
  const totalVolumeLine = volumeLine + carouselVolumeLine + photoVolumeLine;
  const commitmentLine = Math.round(commitmentSavings);
  const agencyLine = Math.round(afterCommitment - afterAgency);
  const cdLine = Math.round(afterAgency * (1 - cdDiscount));
  const filmingLine = Math.round(afterAgency * cdDiscount * (1 - filmingDiscount));
  // The total is the receipt itself, so the lines always add up exactly
  const total = standardTotal - totalVolumeLine - commitmentLine - agencyLine - cdLine - filmingLine;
  const perMonth = Math.round(total / months);
  const prepayment = total / 2;

  const weeksToDeliver = Math.ceil(numVideos / MAX_PER_WEEK);

  // What you pay per item after volume, commitment and agency discounts (before the toggles)
  const videoRate = levelRate * video.commitmentFactor * agencyFactor;
  const carouselRate = carouselLevelRate * carousel.commitmentFactor * agencyFactor;
  const photoRate = numPhotos > 0 ? (numPhotosTotal / numPhotos) * agencyFactor : 0;

  const avgPrice = videoRate;
  const avgPriceDiscounted = avgPrice * cdDiscount * filmingDiscount;
  const toggleDiscountActive = creativeDirection || handleFilming;

  const longTermValues = Object.values(LONG_TERM_DISCOUNTS);
  const commitmentPct = Math.round((1 - video.commitmentFactor) * 100);
  const volumeTip =
    volumeLine > 0
      ? `More videos a month, lower price per video. You're at ${plan.name} level: ${eur(levelRate)} instead of ${eur(STANDARD_VIDEO_RATE)}.`
      : `More videos a month, lower price per video. Starts from 6 videos a month per brand.`;
  const carouselVolumeTip =
    carouselVolumeLine > 0
      ? `More carousels a month, lower price per carousel. You're at ${carousel.plan.name} level: ${eur(carouselLevelRate)} instead of ${eur(STANDARD_VIDEO_RATE / 2)}.`
      : `More carousels a month, lower price per carousel. Starts from 6 carousels a month per brand.`;
  const photoVolumeTip =
    PHOTO_VOLUME_TIP + (photoDiscountPct > 0 ? ` You get ${photoDiscountPct}%.` : ` You're at ${photoPace.toFixed(1)}.`);
  const commitmentTip =
    `${QUARTERLY_MONTHS} months: our quarterly price. ${QUARTERLY_MONTHS + 1}–${MAX_MONTHS} months: an extra ${Math.min(...longTermValues)}–${Math.max(...longTermValues)}% on top.` +
    (commitmentPct > 0 ? ` You get ${commitmentPct}% off videos and carousels.` : "");
  const agencyTip = `${AGENCY_DISCOUNT_PCT}% off everything, compared with our client prices.`;

  const emailBody = [
    "Let's do this! 🎬",
    "",
    `Here's what I put together in the calculator: ${videosPerMonth} videos a month for ${months} month${months > 1 ? "s" : ""} ` +
      `(${numVideos} in total) for ${numBrands} brand${numBrands > 1 ? "s" : ""}, ${pace.toFixed(1)} videos per month per brand, ${plan.name} level.`,
    "",
    asciiTable([
      ["Item", "Amount"],
      null,
      [`${numVideos} videos x ${eur(STANDARD_VIDEO_RATE)}`, eur(videosStandard)],
      ...(numCarousels > 0 ? [[`${numCarousels} carousels x ${eur(STANDARD_VIDEO_RATE / 2)}`, eur(carouselsStandard)] as [string, string]] : []),
      ...(numPhotos > 0 ? [[`${numPhotos} photo posts x ${eur(EXTRA_PHOTO_BASE)}`, eur(photosStandard)] as [string, string]] : []),
      null,
      ["Standard price", eur(standardTotal)],
      ["Volume discount", `-${eur(totalVolumeLine)}`],
      ...(volumeLine > 0 ? [["  videos", `-${eur(volumeLine)}`] as [string, string]] : []),
      ...(carouselVolumeLine > 0 ? [["  carousels", `-${eur(carouselVolumeLine)}`] as [string, string]] : []),
      ...(photoVolumeLine > 0 ? [["  photos", `-${eur(photoVolumeLine)}`] as [string, string]] : []),
      ["Long-term commitment discount", `-${eur(commitmentLine)}`],
      [`Agency discount (${AGENCY_DISCOUNT_PCT}%)`, `-${eur(agencyLine)}`],
      ...(creativeDirection ? [["Creative direction discount (12%)", `-${eur(cdLine)}`] as [string, string]] : []),
      ...(handleFilming ? [["Filming discount (25%)", `-${eur(filmingLine)}`] as [string, string]] : []),
      null,
      ["Total", eur(total)],
      [`Per month (${months} month${months > 1 ? "s" : ""})`, eur(perMonth)],
    ]),
    "",
    `See it in the calculator: ${shareUrl}`,
    "",
  ].join("\n");

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <a href="https://kaimakki.com" target="_blank" rel="noopener noreferrer" className="logo-link">
          <img src={logo} alt="Kaimakki" className="logo-img" />
        </a>
        <p className="subtitle">Agency Pricing Calculator</p>
        <p className="header-note">These videos can be used for multiple of your accounts but the minimum is 4 videos per account per month. All content must be posted within the period you choose (up to six months).</p>
      </header>

      <main className="main">
        {/* Discount Toggles */}
        <div className="two-col">
          {/* Creative Direction Toggle */}
          <section className="card creative-direction-card">
            <label className="card-label">Will you handle creative direction?</label>
            <p className="card-note">You will be deciding what topics + formats will be executed as well as preproduction. We execute for you from that point on.</p>
            <div className="toggle-row">
              <button
                className={`toggle ${creativeDirection ? "toggle-on" : ""}`}
                onClick={() => setCreativeDirection((v) => !v)}
                role="switch"
                aria-checked={creativeDirection}
              >
                <span className="toggle-knob" />
              </button>
              <span className="toggle-label">
                {creativeDirection ? "Yes — " : "No"}
                {creativeDirection && <span className="toggle-discount">12% discount applied</span>}
                {creativeDirection && <InfoTip text={CREATIVE_DIRECTION_TIP} />}
              </span>
            </div>
          </section>

          {/* Filming Toggle */}
          <section className="card creative-direction-card">
            <label className="card-label">Will you handle filming?</label>
            <p className="card-note">You will be shooting the footage yourself. We handle the rest from that point on.</p>
            <div className="toggle-row">
              <button
                className={`toggle ${handleFilming ? "toggle-on" : ""}`}
                onClick={() => setHandleFilming((v) => !v)}
                role="switch"
                aria-checked={handleFilming}
              >
                <span className="toggle-knob" />
              </button>
              <span className="toggle-label">
                {handleFilming ? "Yes — " : "No"}
                {handleFilming && <span className="toggle-discount">25% discount applied</span>}
                {handleFilming && <InfoTip text={FILMING_TIP} />}
              </span>
            </div>
          </section>
        </div>

        <div className="two-col">
          {/* LEFT COLUMN — Inputs */}
          <div className="col-left">
            {/* Video Count */}
            <section className="card">
              <label className="card-label">How many videos per month?</label>
              <p className="card-note">Up to {plan.maxSeconds + EXTRA_SECONDS} seconds each at your posting pace</p>
              <div className="slider-row">
                <input
                  type="range"
                  min={MIN_VIDEOS}
                  max={MAX_VIDEOS}
                  value={videosPerMonth}
                  onChange={(e) => setVideosPerMonth(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{videosPerMonth}</div>
              </div>
              <div className="slider-hints">
                <span>{MIN_VIDEOS}</span>
                <span>{MAX_VIDEOS}</span>
              </div>
            </section>


            {/* Photo Posts */}
            <section className="card">
              <label className="card-label">Photo posts per month</label>
              <p className="card-note">&euro;{Math.round(EXTRA_PHOTO_BASE * (1 - photoDiscountPct / 100))}/post{photoDiscountPct > 0 ? ` (${photoDiscountPct}% volume discount)` : ""} <InfoTip text={PHOTO_VOLUME_TIP} /></p>
              <div className="slider-row">
                <input
                  type="range"
                  min={0}
                  max={MAX_PHOTOS}
                  value={photosPerMonth}
                  onChange={(e) => setPhotosPerMonth(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{photosPerMonth}</div>
              </div>
              <div className="slider-hints">
                <span>0</span>
                <span>{MAX_PHOTOS}</span>
              </div>
            </section>

            {/* Carousels */}
            <section className="card">
              <label className="card-label">Carousel posts per month</label>
              <p className="card-note">&euro;{Math.round(carouselRate)}/carousel · up to 6 slides · cheaper from 6 a month per brand</p>
              <div className="slider-row">
                <input
                  type="range"
                  min={0}
                  max={videosPerMonth}
                  value={carouselsPerMonth}
                  onChange={(e) => setCarouselsPerMonth(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{carouselsPerMonth}</div>
              </div>
              <div className="slider-hints">
                <span>0</span>
                <span>{videosPerMonth}</span>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN — Results */}
          <div className="col-right">
            {/* Frequency + Stats */}
            <section className="card">
              <label className="card-label">For how many months?</label>
              <p className="card-note">Your posting pace sets your plan level (minimum {MIN_PACE} videos per brand per month). Commit to {QUARTERLY_MONTHS} months for our quarterly rate, and up to {MAX_MONTHS} months for an extra {LONG_TERM_DISCOUNTS[MAX_MONTHS]}% off</p>
              <div className="slider-row">
                <input
                  type="range"
                  min={1}
                  max={MAX_MONTHS}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value slider-value-sm">{months} month{months > 1 ? "s" : ""}</div>
              </div>
              <div className="slider-hints">
                <span>1 month</span>
                <span>{MAX_MONTHS} months</span>
              </div>

              <label className="card-label" style={{ marginTop: "24px" }}>How many brands will you use these for?</label>
              <p className="card-note">Minimum {MIN_PACE} videos per brand per month</p>
              <div className="slider-row">
                <input
                  type="range"
                  min={1}
                  max={maxBrands}
                  value={numBrands}
                  onChange={(e) => setNumBrands(Number(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{numBrands}</div>
              </div>
              <div className="slider-hints">
                <span>1</span>
                <span>{maxBrands}</span>
              </div>

              <div className="stats-grid stats-grid-full" style={{ marginTop: "16px" }}>
                <div className="stat-box">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm6.5 4.2a.5.5 0 01.5 0l3.5 2a.5.5 0 010 .87l-3.5 2a.5.5 0 01-.75-.43V7.63a.5.5 0 01.25-.43zM1 20a1 1 0 011-1h20a1 1 0 110 2H2a1 1 0 01-1-1z"/></svg>
                  <div className="stat-number">{numVideos}</div>
                  <div className="stat-label">Short-form Videos in Total</div>
                </div>
                <div className="stat-box">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2H3zm5.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM4.27 19l5.37-7.16a1 1 0 011.6 0l3.4 4.53 1.72-2.3a1 1 0 011.6 0L21 18.5V19a1 1 0 01-1 1H5a1 1 0 01-.73-.31z"/></svg>
                  <div className="stat-number">{numPhotos}</div>
                  <div className="stat-label">Photo Posts in Total</div>
                </div>
                {numCarousels > 0 && (
                  <div className="stat-box">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm14 3h2a2 2 0 012 2v8a2 2 0 01-2 2h-2V7z"/></svg>
                    <div className="stat-number">{numCarousels}</div>
                    <div className="stat-label">Carousels in Total</div>
                  </div>
                )}
                <div className="stat-box">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2a1 1 0 011 1v1h10V3a1 1 0 112 0v1h2a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h2V3a1 1 0 011-1zM3 10v10h18V10H3z"/></svg>
                  <div className="stat-number">{pace.toFixed(1)}</div>
                  <div className="stat-label">Videos per Month{numBrands > 1 ? " per Brand" : ""}</div>
                </div>
              </div>
            </section>

            {/* Price Breakdown */}
            <section className="card">
              <h2 className="card-label">Price Breakdown</h2>
              <p className="card-note">Everything is listed at our standard rates, with each discount you get shown underneath. Hover the i to see where each one comes from</p>

              {/* Videos section */}
              <div className="breakdown-section">
                <div className="breakdown-section-header">
                  <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm6.5 4.2a.5.5 0 01.5 0l3.5 2a.5.5 0 010 .87l-3.5 2a.5.5 0 01-.75-.43V7.63a.5.5 0 01.25-.43zM1 20a1 1 0 011-1h20a1 1 0 110 2H2a1 1 0 01-1-1z"/></svg>
                  <span className="breakdown-section-title">Videos</span>
                </div>
                <div className="breakdown-list">
                  <div className="breakdown-row">
                    <span className="breakdown-desc">
                      {numVideos} videos &times; {eur(STANDARD_VIDEO_RATE)}
                    </span>
                    <span className="breakdown-amount">{eur(videosStandard)}</span>
                  </div>
                </div>
              </div>

              {/* Photos section */}
              {numPhotos > 0 && (
                <div className="breakdown-section">
                  <div className="breakdown-section-header">
                    <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2H3zm5.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM4.27 19l5.37-7.16a1 1 0 011.6 0l3.4 4.53 1.72-2.3a1 1 0 011.6 0L21 18.5V19a1 1 0 01-1 1H5a1 1 0 01-.73-.31z"/></svg>
                    <span className="breakdown-section-title">Photo Posts</span>
                  </div>
                  <div className="breakdown-list">
                    <div className="breakdown-row">
                      <span className="breakdown-desc">
                        {numPhotos} photo post{numPhotos > 1 ? "s" : ""} &times; {eur(EXTRA_PHOTO_BASE)}
                      </span>
                      <span className="breakdown-amount">{eur(photosStandard)}</span>
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
                        {numCarousels} carousel{numCarousels > 1 ? "s" : ""} &times; {eur(STANDARD_VIDEO_RATE / 2)}
                        <span className="discount-badge">&frac12; video</span>
                      </span>
                      <span className="breakdown-amount">{eur(carouselsStandard)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="avg-prices">
                <div className="avg-price-item">
                  <span className="avg-price-label">Avg. per video</span>
                  <span className="avg-price-value">
                    {toggleDiscountActive && (
                      <span className="price-normal">&euro;{Math.round(avgPrice)}</span>
                    )}{" "}
                    &euro;{Math.round(toggleDiscountActive ? avgPriceDiscounted : avgPrice)}
                  </span>
                </div>
                {numPhotos > 0 && (
                  <div className="avg-price-item">
                    <span className="avg-price-label">Avg. per photo post</span>
                    <span className="avg-price-value">{eur(photoRate)}</span>
                  </div>
                )}
                {numCarousels > 0 && (
                  <div className="avg-price-item">
                    <span className="avg-price-label">Avg. per carousel</span>
                    <span className="avg-price-value">{eur(carouselRate)}</span>
                  </div>
                )}
              </div>

              <div className="totals">
                <div className="total-row prepay-row">
                  <span>Standard price</span>
                  <span>{eur(standardTotal)}</span>
                </div>
                <DiscountRow label="Volume discount" tip={VOLUME_TIP} amount={totalVolumeLine} />
                {volumeLine > 0 && <DiscountRow sub label="Videos" tip={volumeTip} amount={volumeLine} />}
                {carouselVolumeLine > 0 && <DiscountRow sub label="Carousels" tip={carouselVolumeTip} amount={carouselVolumeLine} />}
                {photoVolumeLine > 0 && <DiscountRow sub label="Photos" tip={photoVolumeTip} amount={photoVolumeLine} />}
                <DiscountRow label="Long-term commitment discount" tip={commitmentTip} amount={commitmentLine} />
                <DiscountRow label={`Agency discount (${AGENCY_DISCOUNT_PCT}%)`} tip={agencyTip} amount={agencyLine} />
                {creativeDirection && <DiscountRow label="Creative direction discount (12%)" tip={CREATIVE_DIRECTION_TIP} amount={cdLine} />}
                {handleFilming && <DiscountRow label="Filming discount (25%)" tip={FILMING_TIP} amount={filmingLine} />}
                <div className="total-row">
                  <span>Total</span>
                  <span className="total-amount">{eur(total)}</span>
                </div>
                <div className="total-row prepay-row">
                  <span>Per month{months > 1 ? ` (over ${months} months)` : ""}</span>
                  <span>{eur(perMonth)}</span>
                </div>
                <button className="share-btn" onClick={copyShareLink}>
                  {linkCopied ? "Link copied!" : "Copy link to this quote"}
                </button>
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
                <div className="perk-item">
                  <svg className="perk-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v4.59l3.2 3.2-1.41 1.42L11 12.41V7h2z"/></svg>
                  <div>
                    <strong className="perk-title">{EXTRA_SECONDS} Extra Seconds per Video</strong>
                    <p className="perk-desc">Videos can run {EXTRA_SECONDS} seconds longer than on our plans: up to {plan.maxSeconds + EXTRA_SECONDS}s at your level</p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* FULL WIDTH — Tier Reference */}
        <section className="card card-full">
          <h2 className="card-label">Agency Pricing</h2>
          <p className="card-note">Your posting pace (videos per month, per brand) matches one of our plan levels, and you pay {AGENCY_DISCOUNT_PCT}% less than that plan. Commit to {QUARTERLY_MONTHS} months and it's {AGENCY_DISCOUNT_PCT}% less than our quarterly price, with a bit more off up to {MAX_MONTHS} months. Highlighted is your level. <InfoTip text={`Struck through: our client price. Big number: your agency price (${AGENCY_DISCOUNT_PCT}% less).`} /></p>

          <h3 className="tier-row-label">
            <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm6.5 4.2a.5.5 0 01.5 0l3.5 2a.5.5 0 010 .87l-3.5 2a.5.5 0 01-.75-.43V7.63a.5.5 0 01.25-.43zM1 20a1 1 0 011-1h20a1 1 0 110 2H2a1 1 0 01-1-1z"/></svg>
            Videos — plan levels, per brand per month
          </h3>
          <div className="tiers-grid">
            {PLANS.map((p, i) => {
              const from = i === 0 ? MIN_PACE : PLANS[i - 1].videos + 1;
              const range = i === PLANS.length - 1 ? `${from}+` : from === p.videos ? `${from}` : `${from}–${p.videos}`;
              return (
                <div key={p.name} className={`tier-box ${p.name === plan.name ? "tier-active" : ""}`}>
                  <div className="tier-range">{range} videos / mo · {p.name}</div>
                  <div className="tier-normal-price">&euro;{p.monthly.toLocaleString()}</div>
                  <div className="tier-price">&euro;{Math.round(getAgencyPlanPrice(p, false)).toLocaleString()}</div>
                  <div className="tier-unit">per month for {p.videos} videos + {p.carousels} carousels, up to {p.maxSeconds + EXTRA_SECONDS}s each</div>
                  <div className="tier-discount">{QUARTERLY_MONTHS} months: &euro;{Math.round(getAgencyPlanPrice(p, true)).toLocaleString()} / mo</div>
                  <div className="tier-discount">{MAX_MONTHS} months: {eur(getAgencyPlanPrice(p, true) * (1 - LONG_TERM_DISCOUNTS[MAX_MONTHS] / 100))} / mo</div>
                </div>
              );
            })}
          </div>

          <h3 className="tier-row-label">
            <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2H3zm5.5 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM4.27 19l5.37-7.16a1 1 0 011.6 0l3.4 4.53 1.72-2.3a1 1 0 011.6 0L21 18.5V19a1 1 0 01-1 1H5a1 1 0 01-.73-.31z"/></svg>
            Photo Posts
          </h3>
          <p className="card-note">Each photo post is a complete post with caption, concept and design — not just a raw photo. Priced at &euro;{EXTRA_PHOTO_BASE}/post, cheaper the more you post per month for each brand</p>
          <div className="tiers-grid tiers-grid-4">
            {PHOTO_TIERS.map((t) => (
              <div key={t.label} className={`tier-box ${numPhotos > 0 && photoPace >= t.min ? "tier-active" : ""}`}>
                <div className="tier-range">{t.label} photos / mo</div>
                <div className="tier-price">&euro;{Math.round(EXTRA_PHOTO_BASE * (1 - t.discount / 100))}</div>
                <div className="tier-unit">per photo post</div>
                {t.discount > 0 && <div className="tier-discount">-{t.discount}%</div>}
              </div>
            ))}
          </div>

          <h3 className="tier-row-label">
            <svg className="breakdown-section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm14 3h2a2 2 0 012 2v8a2 2 0 01-2 2h-2V7z"/></svg>
            Carousels
          </h3>
          <p className="card-note">Each carousel (up to 6 slides) costs half a video. The more carousels you post per month per brand, the cheaper they get</p>
          <div className="tiers-grid">
            {PLANS.map((p, i) => {
              const from = i === 0 ? 1 : PLANS[i - 1].videos + 1;
              const range = i === PLANS.length - 1 ? `${from}+` : `${from}–${p.videos}`;
              const carouselPlanRate = getLevelRate(p, p.videos) / 2;
              return (
                <div key={p.name} className={`tier-box ${numCarousels > 0 && p.name === carousel.plan.name ? "tier-active" : ""}`}>
                  <div className="tier-range">{range} carousels / mo</div>
                  <div className="tier-normal-price">{eur(carouselPlanRate)}</div>
                  <div className="tier-price">{eur(carouselPlanRate * agencyFactor)}</div>
                  <div className="tier-unit">per carousel</div>
                  <div className="tier-discount">{QUARTERLY_MONTHS} months: {eur(carouselPlanRate * (p.quarterly / p.monthly) * agencyFactor)}</div>
                  <div className="tier-discount">{MAX_MONTHS} months: {eur(carouselPlanRate * (p.quarterly / p.monthly) * (1 - LONG_TERM_DISCOUNTS[MAX_MONTHS] / 100) * agencyFactor)}</div>
                </div>
              );
            })}
          </div>
        </section>


        {/* FULL WIDTH — Production Stages */}
        <section className="card card-full">
          <h2 className="card-label">How It Works — Production Stages</h2>
          <div className="accordion">
            {PRODUCTION_STAGES.map((stage, idx) => {
              const effectiveStage = creativeDirection && idx <= 1
                ? { ...stage, handler: "agency" as const }
                : stage;
              return <AccordionItem key={stage.title} stage={effectiveStage} />;
            })}
          </div>

          <div className="accordion accordion-sm" style={{ marginTop: "24px" }}>
            <TermsAccordion />
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2 className="cta-title">Let's work together?</h2>
          <div className="cta-buttons">
            <button className="cta-btn cta-btn-green" onClick={() => { triggerConfetti(); setShowGif(true); }}>Παμεεεε!</button>
            <button className="cta-btn cta-btn-pink" onClick={() => { triggerConfetti(); setShowGif(true); }}>Let's Gooo!</button>
          </div>
        </section>

        {showGif && (
          <div className="gif-overlay" onClick={() => { setShowGif(false); stopConfetti(); }}>
            <img src={celebrationGif} alt="Let's go!" className="gif-image" onClick={(e) => e.stopPropagation()} />
            <a
              href={`mailto:maria@kaimakki.com?subject=${encodeURIComponent("Let's do this!")}&body=${encodeURIComponent(emailBody)}`}
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

  function playSequence(offset: number) {
    spawnTop(offset);
    spawnBottomLeft(offset + 250);
    spawnBottomRight(offset + 500);
    spawnTop(offset + 750);
    spawnBottomRight(offset + 1000);
    spawnBottomLeft(offset + 1250);
    spawnTop(offset + 1500);
    spawnBottomLeft(offset + 1750);
    spawnBottomRight(offset + 2000);
  }

  // Play first sequence immediately, then loop every 2.5s
  playSequence(0);
  const loopId = setInterval(() => playSequence(0), 2500);
  // Store interval ID so it can be stopped
  (window as any).__confettiLoop = loopId;
}

function stopConfetti() {
  if ((window as any).__confettiLoop) {
    clearInterval((window as any).__confettiLoop);
    (window as any).__confettiLoop = null;
  }
}
