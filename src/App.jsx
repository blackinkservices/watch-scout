import { useState, useCallback } from "react";

// ── API call — goes to our Netlify function, never exposes the key ────────────
async function callClaude(payload) {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

// ── Single web search ─────────────────────────────────────────────────────────
async function webSearch(query) {
  const data = await callClaude({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{
      role: "user",
      content: `Search for: ${query}\n\nReturn: store/site name, watch model, reference number, condition, price, and direct URL if possible. Be concise and specific about prices.`
    }]
  });
  return data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "no results";
}

// ── Agent: run all searches then synthesise ───────────────────────────────────
async function runAgent(onStep) {
  const steps = [
    // Tokyo
    { label: "Tudor BB58 in Tokyo",       query: "Tudor Black Bay 58 ref 79030 used price yen Tokyo Komehyo Jackroad Ginza Rasin 2025" },
    { label: "Tudor BB54 in Tokyo",       query: "Tudor Black Bay 54 ref 79000 used price yen Tokyo Komehyo Jackroad 2025" },
    { label: "Tudor on Japanese sites",   query: 'Tudor "ブラックベイ" 中古 価格 東京 コメ兵 ジャックロード 2025' },
    { label: "Rolex Oyster in Tokyo",     query: "Rolex Oyster Perpetual 124300 126000 used price yen Tokyo Komehyo Jackroad Ginza Rasin 2025" },
    { label: "Rolex Explorer in Tokyo",   query: "Rolex Explorer 124270 used price yen Tokyo Komehyo Jackroad Ginza Rasin 2025" },
    // US — each site gets its own targeted query
    { label: "Tudor BB58 — Chrono24",     query: 'Tudor "Black Bay 58" used for sale price USD site:chrono24.com' },
    { label: "Tudor BB54 — Chrono24",     query: 'Tudor "Black Bay 54" used for sale price USD site:chrono24.com' },
    { label: "Rolex Oyster — Chrono24",   query: 'Rolex "Oyster Perpetual" 124300 used for sale price USD site:chrono24.com' },
    { label: "Rolex Explorer — Chrono24", query: 'Rolex Explorer 124270 used for sale price USD site:chrono24.com' },
    { label: "Tudor BB58 — Bob's Watches",   query: 'Tudor "Black Bay 58" used preowned price site:bobswatches.com' },
    { label: "Rolex Oyster — Bob's Watches", query: 'Rolex "Oyster Perpetual" used preowned price site:bobswatches.com' },
    { label: "Tudor BB58 — WatchBox",     query: 'Tudor "Black Bay 58" certified preowned price site:watchbox.com' },
    { label: "Rolex Explorer — WatchBox", query: 'Rolex Explorer 124270 certified preowned price site:watchbox.com' },
    { label: "Tudor — SwissWatchExpo",    query: 'Tudor "Black Bay" used preowned price site:swisswatchexpo.com' },
    { label: "Rolex — SwissWatchExpo",    query: 'Rolex "Oyster Perpetual" OR "Explorer" used price site:swisswatchexpo.com' },
    // Supporting
    { label: "Tokyo store details",       query: "Komehyo Jackroad Ginza Rasin Tokyo watch store address hours tax free English 2025" },
    { label: "Live exchange rate",        query: "USD JPY exchange rate today" },
  ];

  const results = [];
  for (const step of steps) {
    onStep(step.label);
    const result = await webSearch(step.query);
    results.push({ label: step.label, result });
  }

  onStep("Building your report…");

  const synData = await callClaude({
    model: "claude-sonnet-4-20250514",
    max_tokens: 5000,
    messages: [{
      role: "user",
      content: `You are compiling a watch shopping guide for a US tourist going to Tokyo. Here are real web search results:

${results.map(r => `=== ${r.label} ===\n${r.result}`).join("\n\n")}

Rules for compiling the JSON:
- Include any listing where you found a real price OR a price range
- If a search found a range like "$3,200–$3,800", use the midpoint as price_usd and put the range in notes
- If a search found "typically sells for $X" treat that as a valid market price listing
- Include the best/most representative listing per site
- For URLs: use the real URL found, or the site homepage if no specific listing URL was found
- Never leave tudor.us or rolex.us empty if ANY price information was found in the US search results

Return ONLY valid JSON, no markdown:
{
  "rate": 0.0067,
  "rate_source": "xe.com",
  "rate_date": "${new Date().toLocaleDateString()}",
  "tudor": {
    "tokyo": [
      { "store": "Komehyo Shinjuku", "area": "Shinjuku", "model": "Black Bay 58", "ref": "M79030N", "condition": "Excellent", "price_jpy": 480000, "notes": "Box & papers", "url": "https://www.komehyo.co.jp", "store_url": "https://www.komehyo.co.jp" }
    ],
    "us": [
      { "site": "Bob's Watches", "model": "Black Bay 58", "ref": "M79030N", "condition": "Excellent", "price_usd": 3295, "notes": "CPO", "url": "https://bobswatches.com/tudor" }
    ]
  },
  "rolex": {
    "tokyo": [
      { "store": "Ginza Rasin", "area": "Ginza", "model": "Oyster Perpetual 41", "ref": "124300", "condition": "Mint", "price_jpy": 820000, "notes": "2023 card", "url": "https://www.ginzarasin.com", "store_url": "https://www.ginzarasin.com" }
    ],
    "us": [
      { "site": "WatchBox", "model": "Oyster Perpetual 41", "ref": "124300", "condition": "Very Good", "price_usd": 5800, "notes": "", "url": "https://watchbox.com/rolex" }
    ]
  },
  "stores": [
    { "name": "Komehyo", "areas": "Shinjuku & Ginza", "address": "1-chome, Shinjuku", "hours": "10:30–19:30", "tax_free": true, "english": true, "note": "Japan's largest pre-owned luxury chain.", "url": "https://www.komehyo.co.jp", "map": "https://maps.google.com/?q=Komehyo+Shinjuku+Tokyo" }
  ],
  "market_note": "One concise sentence about whether Tokyo or US offers better value right now."
}`
    }]
  });

  const rawText = synData.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";

  let parsed = null;
  try { parsed = JSON.parse(rawText.trim()); } catch {}
  if (!parsed) {
    const m = rawText.match(/\{[\s\S]*"rate"[\s\S]*\}/);
    if (m) try { parsed = JSON.parse(m[0]); } catch {}
  }
  if (!parsed) {
    const s = rawText.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
    try { parsed = JSON.parse(s); } catch {}
  }

  return { data: parsed, rawResults: results, rawText };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const USD  = n => n == null ? "—" : "$" + Math.round(n).toLocaleString();
const JPY  = n => n == null ? "—" : "¥" + Math.round(n).toLocaleString();
const TAX  = 0.08875;
const SHIP = 35;
const allIn  = usd => usd + usd * TAX + SHIP;
const toUSD  = (jpy, rate) => rate ? jpy * rate : null;

// ── Sub-components ────────────────────────────────────────────────────────────
function ExchangeWidget({ rate, source }) {
  const [yen, setYen] = useState(500000);
  const usdVal = rate ? Math.round(yen * rate).toLocaleString() : "—";
  return (
    <div style={S.rateCard}>
      <div style={S.rateLabel}>Live Rate · {source}</div>
      <div style={S.rateMain}>¥1 = ${rate?.toFixed(4)}</div>
      <div style={S.rateRow}>
        <span style={S.rateHint}>Convert:</span>
        <div style={S.rateInputWrap}>
          <span style={S.ratePre}>¥</span>
          <input type="number" value={yen} onChange={e => setYen(Number(e.target.value))} style={S.rateInput} />
        </div>
        <span style={{ color: "#57534e" }}>→</span>
        <div style={S.rateResult}>${usdVal} USD</div>
      </div>
    </div>
  );
}

function SavingsBadge({ tokyoBestJpy, usBestUsd, rate }) {
  const tyoUSD = toUSD(tokyoBestJpy, rate);
  const usAI   = allIn(usBestUsd);
  if (!tyoUSD || !usAI) return null;
  const diff   = usAI - tyoUSD;
  const green  = diff > 0;
  return (
    <div style={{ ...S.savingsBadge, background: green ? "#f0fdf4" : "#fff1f1", border: `1.5px solid ${green ? "#86efac" : "#fca5a5"}` }}>
      <span style={{ fontSize: 22 }}>{green ? "🇯🇵" : "🇺🇸"}</span>
      <div>
        <div style={{ ...S.savingsHead, color: green ? "#15803d" : "#b91c1c" }}>
          {green ? `Tokyo saves you ~${USD(diff)}` : `US is ~${USD(Math.abs(diff))} cheaper`}
        </div>
        <div style={S.savingsSub}>
          Best Tokyo: {JPY(tokyoBestJpy)} ≈ {USD(tyoUSD)} (no tax) &nbsp;·&nbsp;
          Best US all-in: {USD(usAI)} (incl. NYC tax + shipping)
        </div>
      </div>
    </div>
  );
}

function Tag({ children, bg = "#f5f5f4", color = "#57534e" }) {
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 4 }}>{children}</span>;
}

function WatchRow({ item, isJP, rate }) {
  const jpyUSD = isJP && rate ? toUSD(item.price_jpy, rate) : null;
  const usTot  = !isJP && item.price_usd ? allIn(item.price_usd) : null;
  return (
    <div style={S.watchRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.watchModel}>{item.model}</div>
        <div style={S.watchMeta}>
          {isJP ? `${item.store}${item.area ? ` · ${item.area}` : ""}` : item.site}
          {item.ref       && <Tag>{item.ref}</Tag>}
          {item.condition && <Tag bg="#f0fdf4" color="#15803d">{item.condition}</Tag>}
          {isJP           && <Tag bg="#fefce8" color="#a16207">Tax-Free</Tag>}
        </div>
        {item.notes && <div style={S.watchNotes}>{item.notes}</div>}
        <div style={S.watchLinks}>
          {item.url?.startsWith("http") && <a href={item.url} target="_blank" rel="noopener noreferrer" style={S.link}>View listing →</a>}
          {isJP && item.store_url?.startsWith("http") && <a href={item.store_url} target="_blank" rel="noopener noreferrer" style={S.linkSec}>Store site</a>}
          {isJP && <a href={`https://maps.google.com/?q=${encodeURIComponent((item.store || "") + " Tokyo watch")}`} target="_blank" rel="noopener noreferrer" style={S.linkSec}>📍 Map</a>}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 16 }}>
        {isJP ? (
          <>
            <div style={S.priceMain}>{JPY(item.price_jpy)}</div>
            {jpyUSD && <div style={S.priceSub}>≈ {USD(jpyUSD)} · no tax</div>}
          </>
        ) : (
          <>
            <div style={{ ...S.priceMain, color: "#991b1b" }}>{USD(usTot)}</div>
            <div style={S.priceSub}>
              {USD(item.price_usd)} + {USD(item.price_usd * TAX)} tax<br />+ {USD(SHIP)} shipping
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ isJP }) {
  return (
    <div style={S.empty}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#57534e", marginBottom: 6 }}>No listings found this scan</div>
      <div style={{ fontSize: 12, color: "#a8a29e", lineHeight: 1.6 }}>
        {isJP
          ? "Visit Komehyo, Jackroad, or Ginza Rasin in person — stock changes daily"
          : "Check chrono24.com, bobswatches.com, or watchbox.com directly"}
      </div>
    </div>
  );
}

function WatchSection({ title, subtitle, tokyoItems, usItems, rate }) {
  const bestTJpy = tokyoItems.filter(x => x.price_jpy).length ? Math.min(...tokyoItems.filter(x => x.price_jpy).map(x => x.price_jpy)) : null;
  const bestUUsd = usItems.filter(x => x.price_usd).length    ? Math.min(...usItems.filter(x => x.price_usd).map(x => x.price_usd))    : null;

  return (
    <section style={S.section}>
      <h2 style={S.sectionTitle}>{title}</h2>
      <div style={S.sectionSub}>{subtitle}</div>
      <SavingsBadge tokyoBestJpy={bestTJpy} usBestUsd={bestUUsd} rate={rate} />
      <div style={S.cols}>
        <div style={S.col}>
          <div style={{ ...S.colHead, background: "#052e16", color: "#86efac" }}>
            <span>🗼 Tokyo</span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>{tokyoItems.length} listing{tokyoItems.length !== 1 ? "s" : ""} · no tax</span>
          </div>
          {tokyoItems.length === 0 ? <EmptyState isJP /> : tokyoItems.map((item, i) => <WatchRow key={i} item={item} isJP rate={rate} />)}
        </div>
        <div style={S.col}>
          <div style={{ ...S.colHead, background: "#450a0a", color: "#fca5a5" }}>
            <span>🗽 United States</span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>{usItems.length} listing{usItems.length !== 1 ? "s" : ""} · NYC tax + ship</span>
          </div>
          {usItems.length === 0 ? <EmptyState isJP={false} /> : usItems.map((item, i) => <WatchRow key={i} item={item} isJP={false} rate={rate} />)}
        </div>
      </div>
    </section>
  );
}

function StoreGuide({ stores }) {
  const list = stores?.length > 0 ? stores : [
    { name: "Komehyo", areas: "Shinjuku & Ginza", tax_free: true, english: true, note: "Japan's largest pre-owned luxury chain. Huge watch floor, reliable authentication, English-speaking staff.", url: "https://www.komehyo.co.jp", map: "https://maps.google.com/?q=Komehyo+Shinjuku+Tokyo" },
    { name: "Jackroad", areas: "Shinjuku & Harajuku", tax_free: true, english: true, note: "Specialist used watch dealer. Competitive prices, strong Tudor & Rolex inventory.", url: "https://www.jackroad.co.jp", map: "https://maps.google.com/?q=Jackroad+Shinjuku+Tokyo" },
    { name: "Ginza Rasin", areas: "Ginza", tax_free: true, english: true, note: "Premium used watches in top condition. Higher-end pieces. Excellent for Rolex.", url: "https://www.ginzarasin.com", map: "https://maps.google.com/?q=Ginza+Rasin+Tokyo" },
    { name: "Daikokuya", areas: "Ueno & Asakusa", tax_free: true, english: false, note: "Budget-friendly. Inconsistent stock but sometimes great deals. Worth a quick browse.", url: "https://www.e-daikokuya.com", map: "https://maps.google.com/?q=Daikokuya+Ueno+Tokyo" },
  ];
  return (
    <section style={S.section}>
      <h2 style={S.sectionTitle}>Where to Shop in Tokyo</h2>
      <div style={S.sectionSub}>Store addresses, hours &amp; notes — ready to navigate from your phone</div>
      <div style={S.storeGrid}>
        {list.map((s, i) => (
          <div key={i} style={S.storeCard}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1c1917", marginBottom: 8 }}>{s.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#78716c" }}>📍 {s.areas}</span>
              {s.tax_free && <Tag bg="#fefce8" color="#a16207">Tax-Free</Tag>}
              {s.english  && <Tag bg="#eff6ff" color="#1d4ed8">English OK</Tag>}
            </div>
            {s.address && <div style={{ fontSize: 12, color: "#57534e", marginBottom: 4 }}>{s.address}</div>}
            {s.hours   && <div style={{ fontSize: 12, color: "#57534e", marginBottom: 8 }}>🕐 {s.hours}</div>}
            <div style={{ fontSize: 13, color: "#44403c", lineHeight: 1.6, marginBottom: 12 }}>{s.note}</div>
            <div style={{ display: "flex", gap: 14 }}>
              {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={S.link}>Website →</a>}
              {s.map && <a href={s.map} target="_blank" rel="noopener noreferrer" style={S.link}>Open in Maps →</a>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TipsSection() {
  const tips = [
    { icon: "🛂", title: "Bring your passport", body: "Required for tax-free purchases. The store stamps a receipt attached to your passport — customs may check on exit." },
    { icon: "💴", title: "Cards are fine — tell your bank", body: "Visa/Mastercard accepted at all major stores. Call your bank before travel so large purchases aren't flagged." },
    { icon: "🔍", title: "Ask to see paperwork", body: "Request the certificate of authenticity, warranty card, and service history. Reputable shops authenticate before listing." },
    { icon: "💬", title: "Politely ask for a deal", body: '"Sukoshi yasuku narimasu ka?" (少し安くなりますか？) — "Could you lower the price a little?" Usually nets ¥5,000–20,000 off.' },
    { icon: "📦", title: "Full set matters", body: "Original box and papers adds resale value and makes customs easier. Ask even if not listed in the description." },
    { icon: "🛃", title: "US customs rules", body: "$800 duty-free exemption per person. Watches above that are taxed ~6.5%. Declare honestly — serial numbers are trackable." },
    { icon: "🗺️", title: "Plan a half-day route", body: "Prices are within ¥10,000–30,000 of each other across stores, but selection varies daily. Shinjuku + Ginza covers the most ground." },
    { icon: "📸", title: "Photograph everything", body: "Snap the model, ref number, serial, and condition of watches you like. Makes cross-store comparison much easier." },
  ];
  return (
    <section style={S.section}>
      <h2 style={S.sectionTitle}>Tips for Buying in Tokyo</h2>
      <div style={S.sectionSub}>What every US tourist should know before walking in</div>
      <div style={S.tipsGrid}>
        {tips.map((t, i) => (
          <div key={i} style={S.tipCard}>
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: "#57534e", lineHeight: 1.6 }}>{t.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:      { minHeight: "100vh", background: "#fafaf8", fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif", color: "#1c1917" },
  header:    { background: "#1c1917", color: "#fff", padding: "36px 40px 32px" },
  headerInner: { maxWidth: 960, margin: "0 auto" },
  eyebrow:   { fontSize: 11, letterSpacing: "0.3em", color: "#a8956a", textTransform: "uppercase", marginBottom: 10 },
  h1:        { margin: "0 0 10px", fontSize: 28, fontWeight: 400, lineHeight: 1.25 },
  h1gold:    { color: "#d4a855" },
  headerSub: { fontSize: 13, color: "#78716c", lineHeight: 1.6, margin: 0 },
  metaStrip: { display: "flex", gap: 28, flexWrap: "wrap", marginTop: 28, paddingTop: 24, borderTop: "1px solid #292524" },
  runBtn: r  => ({ background: r ? "#292524" : "#d4a855", color: r ? "#57534e" : "#1c1917", border: "none", borderRadius: 6, padding: "13px 28px", fontSize: 14, fontWeight: 700, cursor: r ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s" }),
  // content
  content:   { maxWidth: 960, margin: "0 auto", padding: "0 40px 60px" },
  section:   { paddingTop: 44, paddingBottom: 4 },
  sectionTitle: { margin: "0 0 4px", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: "#1c1917" },
  sectionSub:   { fontSize: 13, color: "#78716c", marginBottom: 20 },
  divider:   { border: "none", borderTop: "1px solid #e7e5e4", margin: "8px 0 0" },
  // savings
  savingsBadge: { display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 8, marginBottom: 20 },
  savingsHead:  { fontSize: 16, fontWeight: 700, marginBottom: 3 },
  savingsSub:   { fontSize: 12, color: "#57534e" },
  // cols
  cols:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  col:       { border: "1px solid #e7e5e4", borderRadius: 8, overflow: "hidden" },
  colHead:   { padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em" },
  // watch rows
  watchRow:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 18px", borderBottom: "1px solid #f5f5f4" },
  watchModel:{ fontSize: 15, fontWeight: 600, marginBottom: 5 },
  watchMeta: { fontSize: 12, color: "#78716c", display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" },
  watchNotes:{ fontSize: 11, color: "#a8a29e", fontStyle: "italic", marginTop: 5 },
  watchLinks:{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" },
  priceMain: { fontSize: 20, fontWeight: 700, color: "#14532d", marginBottom: 2 },
  priceSub:  { fontSize: 11, color: "#a8a29e", lineHeight: 1.5 },
  link:      { fontSize: 12, color: "#1d4ed8", textDecoration: "none", borderBottom: "1px solid #bfdbfe", paddingBottom: 1 },
  linkSec:   { fontSize: 12, color: "#57534e", textDecoration: "none", borderBottom: "1px solid #d6d3d1", paddingBottom: 1 },
  empty:     { padding: "40px 20px", textAlign: "center" },
  // rate widget
  rateCard:  { background: "#1c1917", border: "1px solid #292524", borderRadius: 8, padding: "20px 24px", marginBottom: 28 },
  rateLabel: { fontSize: 11, color: "#78716c", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 },
  rateMain:  { fontSize: 24, fontWeight: 400, color: "#d4a855", marginBottom: 14 },
  rateRow:   { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  rateHint:  { fontSize: 12, color: "#78716c" },
  rateInputWrap: { display: "flex", alignItems: "center", background: "#292524", border: "1px solid #44403c", borderRadius: 4, overflow: "hidden" },
  ratePre:   { padding: "7px 10px", color: "#a8a29e", fontSize: 14, borderRight: "1px solid #44403c" },
  rateInput: { background: "transparent", border: "none", color: "#e7e5e4", fontSize: 14, padding: "7px 12px", width: 120, outline: "none", fontFamily: "inherit" },
  rateResult:{ fontSize: 18, fontWeight: 600, color: "#d4a855" },
  // stores
  storeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  storeCard: { background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, padding: "18px 20px" },
  // tips
  tipsGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  tipCard:   { display: "flex", gap: 14, background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, padding: "16px 18px" },
};

const ALL_STEPS = [
  "Tudor BB58 in Tokyo","Tudor BB54 in Tokyo","Tudor on Japanese sites",
  "Rolex Oyster in Tokyo","Rolex Explorer in Tokyo",
  "Tudor BB58 — Chrono24","Tudor BB54 — Chrono24","Rolex Oyster — Chrono24","Rolex Explorer — Chrono24",
  "Tudor BB58 — Bob's Watches","Rolex Oyster — Bob's Watches",
  "Tudor BB58 — WatchBox","Rolex Explorer — WatchBox",
  "Tudor — SwissWatchExpo","Rolex — SwissWatchExpo",
  "Tokyo store details","Live exchange rate","Building your report…",
];

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [status, setStatus]   = useState("idle");
  const [step, setStep]       = useState("");
  const [done, setDone]       = useState([]);
  const [data, setData]       = useState(null);
  const [rawResults, setRaw]  = useState([]);
  const [error, setError]     = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const run = useCallback(async () => {
    setStatus("running"); setStep(""); setDone([]); setData(null); setError(null); setRaw([]);
    try {
      const { data: d, rawResults: rr } = await runAgent(s => { setStep(s); setDone(p => [...p, s]); });
      setData(d); setRaw(rr); setLastRun(new Date()); setStatus("done");
    } catch (e) {
      setError(e.message); setStatus("error");
    }
  }, []);

  const rate = data?.rate;
  const running = status === "running";

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div style={{ ...S.headerInner, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={S.eyebrow}>Pre-Owned Watch Price Tracker</div>
            <h1 style={S.h1}>Tokyo vs. US — <span style={S.h1gold}>Your Watch Buying Guide</span></h1>
            <p style={S.headerSub}>Tudor Black Bay BB58 & BB54 &nbsp;·&nbsp; Rolex Oyster Perpetual & Explorer<br />Live prices · tax-free Tokyo · NYC all-in cost</p>
          </div>
          <button onClick={run} disabled={running} style={S.runBtn(running)}>
            {running ? "⟳ Scanning…" : lastRun ? "↻ Refresh" : "▶ Run Scout"}
          </button>
        </div>

        <div style={{ ...S.headerInner, ...S.metaStrip }}>
          {[
            ["Tokyo",      "Tax-free · 9 stores searched"],
            ["US",         "NYC tax 8.875% + $35 shipping"],
            ["Rate",       rate ? `¥1 = $${rate.toFixed(4)}` : "Run scout to fetch"],
            ["Updated",    lastRun ? lastRun.toLocaleString() : "Not yet run"],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: "#57534e", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: "#e7e5e4" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      {running && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e7e5e4", padding: "20px 40px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              Searching… <span style={{ color: "#a8a29e", fontWeight: 400 }}>~60 seconds</span>
            </div>
            <div style={{ background: "#f5f5f4", borderRadius: 4, height: 4, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ background: "#d4a855", height: "100%", width: `${(done.length / ALL_STEPS.length) * 100}%`, transition: "width 0.4s ease", borderRadius: 4 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px 24px" }}>
              {ALL_STEPS.map((s, i) => {
                const isDone   = done.includes(s);
                const isActive = step === s && !isDone;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: isDone ? "#16a34a" : isActive ? "#d4a855" : "#e7e5e4", transition: "background 0.3s" }} />
                    <span style={{ color: isDone ? "#16a34a" : isActive ? "#1c1917" : "#a8a29e", fontWeight: isActive ? 600 : 400 }}>
                      {isDone ? "✓ " : ""}{s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "#fff1f2", borderBottom: "1px solid #fecdd3", padding: "14px 40px", color: "#be123c", fontSize: 14 }}>
          ⚠ {error}
        </div>
      )}

      {/* Idle */}
      {status === "idle" && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>⌚</div>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: "#44403c", margin: "0 0 14px" }}>Ready when you are</h2>
          <p style={{ fontSize: 15, color: "#78716c", maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.8 }}>
            Click <strong style={{ color: "#1c1917" }}>▶ Run Scout</strong> to search Tokyo stores and US websites for live used watch prices, then compare total costs side by side.
          </p>
          <div style={{ display: "inline-flex", gap: 32, background: "#fff", border: "1px solid #e7e5e4", borderRadius: 8, padding: "20px 32px", fontSize: 13, color: "#78716c" }}>
            <div>🗼 <strong>9</strong> Tokyo stores</div>
            <div>🗽 <strong>6</strong> US sites</div>
            <div>🔍 <strong>17</strong> searches</div>
            <div>💱 Live rate</div>
          </div>
        </div>
      )}

      {/* Report */}
      {status === "done" && data && (
        <div style={S.content}>
          <div style={{ paddingTop: 36 }}>
            <ExchangeWidget rate={rate} source={data.rate_source} />
          </div>

          {data.market_note && (
            <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderLeft: "4px solid #d4a855", borderRadius: 4, padding: "14px 18px", marginBottom: 8, fontSize: 14, color: "#44403c", lineHeight: 1.7 }}>
              📊 {data.market_note}
            </div>
          )}

          <hr style={S.divider} />
          <WatchSection title="Tudor Black Bay" subtitle="BB58 (ref. M79030) · BB54 (ref. M79000)" tokyoItems={data.tudor?.tokyo || []} usItems={data.tudor?.us || []} rate={rate} />
          <hr style={S.divider} />
          <WatchSection title="Rolex Oyster Perpetual & Explorer" subtitle="Oyster Perpetual (ref. 124300) · Explorer (ref. 124270)" tokyoItems={data.rolex?.tokyo || []} usItems={data.rolex?.us || []} rate={rate} />
          <hr style={S.divider} />
          <StoreGuide stores={data.stores} />
          <hr style={S.divider} />
          <TipsSection />

          <div style={{ paddingTop: 28 }}>
            <button onClick={() => setShowRaw(p => !p)} style={{ background: "none", border: "1px solid #e7e5e4", borderRadius: 4, padding: "8px 16px", fontSize: 12, color: "#78716c", cursor: "pointer", fontFamily: "inherit" }}>
              {showRaw ? "Hide" : "Show"} raw search data
            </button>
            {showRaw && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {rawResults.map((r, i) => (
                  <div key={i} style={{ background: "#f5f5f4", border: "1px solid #e7e5e4", borderRadius: 6, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#78716c", textTransform: "uppercase", marginBottom: 6 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: "#57534e", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{r.result}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e7e5e4", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, fontSize: 12, color: "#a8a29e", lineHeight: 1.7 }}>
            <div><strong style={{ color: "#78716c" }}>Tokyo pricing</strong> — Japan's 10% consumption tax is waived for foreign tourists on purchases over ¥5,000. Show your passport at checkout.</div>
            <div><strong style={{ color: "#78716c" }}>US pricing</strong> — All-in total includes NYC sales tax (8.875%) and $35 estimated insured domestic shipping.</div>
            <div><strong style={{ color: "#78716c" }}>US Customs</strong> — $800 duty-free exemption per person. Watches over that are taxed ~6.5%. Always declare at the border.</div>
          </div>
        </div>
      )}

      {/* Raw fallback */}
      {status === "done" && !data && rawResults.length > 0 && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px" }}>
          <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6, padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "#664d03" }}>
            ⚠ Couldn't auto-structure the report. Raw results below — try running again.
          </div>
          {rawResults.map((r, i) => (
            <div key={i} style={{ background: "#f5f5f4", border: "1px solid #e7e5e4", borderRadius: 6, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#78716c", textTransform: "uppercase", marginBottom: 6 }}>{r.label}</div>
              <div style={{ fontSize: 13, color: "#57534e", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{r.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
