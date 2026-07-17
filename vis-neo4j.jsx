import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Sankey, Layer, Rectangle, ResponsiveContainer, Tooltip,
} from "recharts";

/* ============================================================
   BNY Competitive Intelligence Console — mock
   Palette derived from BNY 2024 rebrand (teal arrow / black wordmark)
   ============================================================ */

const C = {
  ink: "#0F1214",
  ink2: "#191E21",
  ink3: "#242B2F",
  line: "#2E3639",
  teal: "#00857D",
  tealBright: "#4ECDC4",
  gold: "#B07E25",
  paper: "#F5F4F2",
  muted: "#8A8F94",
  red: "#C0554A",
};

const FONT = "'IBM Plex Sans', -apple-system, system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', monospace";

/* ------------------------- mock data ------------------------- */

const CHANGES = [
  {
    id: "CHG-4471",
    severity: "high",
    headline: "Blackstone Credit shifts €2.4B EMEA mandate to Citco",
    entity: "Blackstone Credit",
    detected: "2026-07-14",
    kind: "Mandate migration",
    why: "N-CEN filing amendment names Citco Fund Services (Ireland) as administrator for four sub-funds previously administered by BNY. Supersedes belief recorded 2025-11-03.",
    confidence: 0.91,
    sources: ["SEC N-CEN 2026-07-11", "GLEIF LEI 549300...", "Fund prospectus supplement"],
    graph: "blackstone",
  },
  {
    id: "CHG-4468",
    severity: "high",
    headline: "State Street wins Nordea Asset Management custody renewal",
    entity: "Nordea AM",
    detected: "2026-07-13",
    kind: "Competitive loss",
    why: "Press release plus updated depositary disclosure. BNY was incumbent on 3 of 11 fund ranges. Est. AUA impact $18B.",
    confidence: 0.84,
    sources: ["Nordea press release", "KIID depositary field delta"],
    graph: "nordea",
  },
  {
    id: "CHG-4465",
    severity: "med",
    headline: "Citco fee schedule revision — sub-$5B PE tier down 12bps",
    entity: "Citco",
    detected: "2026-07-12",
    kind: "Pricing signal",
    why: "Three independent DDQ responses in market show consistent downward revision at the sub-$5B tier. Aggregated, not sourced from any single client.",
    confidence: 0.67,
    sources: ["DDQ corpus n=3", "Consultant channel"],
    graph: "citco",
  },
  {
    id: "CHG-4461",
    severity: "low",
    headline: "Apex Group acquires Luxembourg ManCo (name TBC)",
    entity: "Apex Group",
    detected: "2026-07-10",
    kind: "M&A",
    why: "CSSF register shows control change pending. Target not yet named in public filings.",
    confidence: 0.52,
    sources: ["CSSF register delta"],
    graph: "apex",
  },
];

const SUPERSESSION = [
  {
    fact: "Administrator of record — Blackstone Credit Europe SICAV",
    believed: [
      { t: "2025-11-03", value: "BNY (Ireland)", state: "superseded" },
      { t: "2026-07-14", value: "Citco (Ireland)", state: "current" },
    ],
  },
  {
    fact: "Depositary — Nordea Stable Return Fund",
    believed: [
      { t: "2024-06-01", value: "BNY (Lux)", state: "superseded" },
      { t: "2026-07-13", value: "State Street (Lux)", state: "current" },
    ],
  },
  {
    fact: "AUA — Apex Group EMEA",
    believed: [
      { t: "2025-09-12", value: "$212B", state: "superseded" },
      { t: "2026-03-01", value: "$238B", state: "superseded" },
      { t: "2026-07-02", value: "$244B", state: "current" },
    ],
  },
];

const MATRIX = {
  admins: ["BNY", "State Street", "Citco", "Apex", "SS&C", "Northern Trust"],
  families: ["Blackstone", "Nordea AM", "Amundi", "Schroders", "PIMCO", "Fidelity Intl"],
  // AUA in $B, null = no relationship
  cells: [
    [64, 12, null, 31, 88, 40],
    [null, 18, 22, 8, null, 14],
    [96, null, 41, null, 12, 55],
    [28, 33, null, 19, 7, null],
    [140, 61, 9, null, 44, 22],
    [12, null, 76, 30, null, 18],
  ],
};

const SANKEY_DATA = {
  nodes: [
    { name: "BNY" }, { name: "State Street" }, { name: "Citco" }, { name: "Apex" },
    { name: "BNY " }, { name: "State Street " }, { name: "Citco " }, { name: "Apex " },
  ],
  links: [
    { source: 0, target: 4, value: 182 },
    { source: 0, target: 6, value: 24 },
    { source: 0, target: 5, value: 18 },
    { source: 1, target: 5, value: 140 },
    { source: 1, target: 4, value: 11 },
    { source: 2, target: 6, value: 96 },
    { source: 2, target: 4, value: 6 },
    { source: 3, target: 7, value: 71 },
    { source: 3, target: 6, value: 14 },
  ],
};

const GRAPHS = {
  blackstone: {
    nodes: [
      { id: "bx", label: "Blackstone Credit", type: "sponsor", x: 0.5, y: 0.18 },
      { id: "sicav", label: "BXC Europe SICAV", type: "fund", x: 0.5, y: 0.46 },
      { id: "sf1", label: "Sub-fund I", type: "fund", x: 0.22, y: 0.72 },
      { id: "sf2", label: "Sub-fund II", type: "fund", x: 0.5, y: 0.78 },
      { id: "sf3", label: "Sub-fund III", type: "fund", x: 0.78, y: 0.72 },
      { id: "citco", label: "Citco (IE)", type: "rival", x: 0.16, y: 0.32 },
      { id: "bny", label: "BNY (IE)", type: "self", x: 0.86, y: 0.34 },
    ],
    edges: [
      { s: "bx", t: "sicav", label: "sponsors", state: "current" },
      { s: "sicav", t: "sf1", label: "", state: "current" },
      { s: "sicav", t: "sf2", label: "", state: "current" },
      { s: "sicav", t: "sf3", label: "", state: "current" },
      { s: "citco", t: "sicav", label: "administers", state: "current" },
      { s: "bny", t: "sicav", label: "administered", state: "superseded" },
    ],
  },
  nordea: {
    nodes: [
      { id: "n", label: "Nordea AM", type: "sponsor", x: 0.5, y: 0.2 },
      { id: "r1", label: "Stable Return", type: "fund", x: 0.28, y: 0.55 },
      { id: "r2", label: "Global Climate", type: "fund", x: 0.72, y: 0.55 },
      { id: "ss", label: "State Street", type: "rival", x: 0.2, y: 0.85 },
      { id: "bny", label: "BNY", type: "self", x: 0.8, y: 0.85 },
    ],
    edges: [
      { s: "n", t: "r1", label: "", state: "current" },
      { s: "n", t: "r2", label: "", state: "current" },
      { s: "ss", t: "r1", label: "depositary", state: "current" },
      { s: "bny", t: "r1", label: "depositary", state: "superseded" },
      { s: "bny", t: "r2", label: "depositary", state: "current" },
    ],
  },
  citco: {
    nodes: [
      { id: "c", label: "Citco", type: "rival", x: 0.5, y: 0.25 },
      { id: "t1", label: "sub-$5B PE tier", type: "fund", x: 0.28, y: 0.68 },
      { id: "t2", label: "$5–10B tier", type: "fund", x: 0.72, y: 0.68 },
    ],
    edges: [
      { s: "c", t: "t1", label: "−12bps", state: "current" },
      { s: "c", t: "t2", label: "flat", state: "current" },
    ],
  },
  apex: {
    nodes: [
      { id: "a", label: "Apex Group", type: "rival", x: 0.5, y: 0.28 },
      { id: "m", label: "ManCo (unnamed)", type: "unknown", x: 0.5, y: 0.7 },
    ],
    edges: [{ s: "a", t: "m", label: "acquiring", state: "pending" }],
  },
};

/* ------------------------- primitives ------------------------- */

function Eyebrow({ children, tone = C.muted }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em",
      textTransform: "uppercase", color: tone, marginBottom: 10,
    }}>{children}</div>
  );
}

function Panel({ title, sub, children, style }) {
  return (
    <section style={{
      background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 3,
      padding: "18px 18px 20px", ...style,
    }}>
      {title && (
        <div style={{ marginBottom: 14 }}>
          <Eyebrow>{title}</Eyebrow>
          {sub && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{sub}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

const sevColor = (s) => (s === "high" ? C.red : s === "med" ? C.gold : C.muted);

/* ------------------------- change feed ------------------------- */

function ChangeFeed({ items, selected, onSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((c) => {
        const on = c.id === selected;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              textAlign: "left", background: on ? C.ink3 : "transparent",
              border: "none", borderLeft: `2px solid ${on ? C.tealBright : "transparent"}`,
              padding: "13px 14px", cursor: "pointer", fontFamily: FONT,
              transition: "background 140ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: sevColor(c.severity),
                flexShrink: 0,
              }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.06em" }}>
                {c.id} · {c.kind}
              </span>
            </div>
            <div style={{
              fontSize: 13.5, lineHeight: 1.45, color: on ? C.paper : "#C8CDD0",
              fontWeight: on ? 500 : 400,
            }}>{c.headline}</div>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 7,
              display: "flex", gap: 12,
            }}>
              <span>{c.detected}</span>
              <span style={{ color: c.confidence > 0.8 ? C.tealBright : C.gold }}>
                conf {c.confidence.toFixed(2)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------- scoped graph ------------------------- */

function ScopedGraph({ spec }) {
  const W = 340, H = 240;
  const pos = useMemo(() => {
    const m = {};
    spec.nodes.forEach((n) => { m[n.id] = { x: n.x * W, y: n.y * H }; });
    return m;
  }, [spec]);

  const nodeFill = (t) =>
    t === "self" ? C.teal : t === "rival" ? C.red : t === "sponsor" ? "#3A4448" : C.ink3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {spec.edges.map((e, i) => {
        const a = pos[e.s], b = pos[e.t];
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const sup = e.state === "superseded";
        const pend = e.state === "pending";
        return (
          <g key={i}>
            <line
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={sup ? C.gold : pend ? C.muted : C.line}
              strokeWidth={sup ? 1.2 : 1}
              strokeDasharray={sup ? "3 3" : pend ? "1 4" : "none"}
              opacity={sup ? 0.75 : 1}
            />
            {e.label && (
              <text
                x={mx} y={my - 4} textAnchor="middle"
                fontFamily={MONO} fontSize={7.5}
                fill={sup ? C.gold : C.muted}
                style={{ textDecoration: sup ? "line-through" : "none" }}
              >{e.label}</text>
            )}
          </g>
        );
      })}
      {spec.nodes.map((n) => {
        const p = pos[n.id];
        return (
          <g key={n.id}>
            <circle
              cx={p.x} cy={p.y} r={n.type === "sponsor" ? 7 : 5.5}
              fill={nodeFill(n.type)}
              stroke={n.type === "unknown" ? C.muted : "none"}
              strokeDasharray={n.type === "unknown" ? "2 2" : "none"}
            />
            <text
              x={p.x} y={p.y + 17} textAnchor="middle"
              fontFamily={FONT} fontSize={8.5} fill="#B4BABE"
            >{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------- supersession rail ------------------------- */
/* The signature element: bitemporal belief revision made legible. */

function SupersessionRail() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {SUPERSESSION.map((row, i) => (
        <div key={i}>
          <div style={{ fontSize: 12, color: "#C8CDD0", marginBottom: 12 }}>{row.fact}</div>
          <div style={{ position: "relative", paddingLeft: 2 }}>
            <div style={{
              position: "absolute", left: 0, right: 0, top: 5, height: 1,
              background: C.line,
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              {row.believed.map((b, j) => {
                const sup = b.state === "superseded";
                return (
                  <div key={j} style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    flex: 1,
                  }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: sup ? C.ink : C.tealBright,
                      border: `1.5px solid ${sup ? C.gold : C.tealBright}`,
                      marginBottom: 9, marginTop: 1,
                    }} />
                    <div style={{
                      fontFamily: MONO, fontSize: 9.5, color: C.muted, marginBottom: 3,
                    }}>{b.t}</div>
                    <div style={{
                      fontSize: 12, color: sup ? C.gold : C.paper,
                      textDecoration: sup ? "line-through" : "none",
                      opacity: sup ? 0.72 : 1,
                    }}>{b.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      <div style={{
        fontFamily: MONO, fontSize: 9.5, color: C.muted, lineHeight: 1.7,
        borderTop: `1px solid ${C.line}`, paddingTop: 12, marginTop: 2,
      }}>
        <span style={{ color: C.gold }}>◦ struck</span> = superseded belief, retained
        <br />
        <span style={{ color: C.tealBright }}>● solid</span> = current belief
        <br />
        Insert-only. Nothing is deleted; corrections append.
      </div>
    </div>
  );
}

/* ------------------------- matrix ------------------------- */

function Matrix() {
  const [sortBy, setSortBy] = useState(null);
  const max = 140;

  const order = useMemo(() => {
    const idx = MATRIX.families.map((_, i) => i);
    if (sortBy === null) return idx;
    return idx.sort((a, b) => (MATRIX.cells[b][sortBy] ?? -1) - (MATRIX.cells[a][sortBy] ?? -1));
  }, [sortBy]);

  const cellBg = (v, isBny) => {
    if (v === null) return "transparent";
    const t = v / max;
    return isBny
      ? `rgba(0,133,125,${0.18 + t * 0.8})`
      : `rgba(192,85,74,${0.12 + t * 0.62})`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 460 }}>
        <thead>
          <tr>
            <th style={{ width: 100 }} />
            {MATRIX.admins.map((a, i) => (
              <th key={a} onClick={() => setSortBy(i)} style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 400, color: sortBy === i ? C.tealBright : C.muted,
                padding: "0 0 9px", cursor: "pointer", textAlign: "center",
                letterSpacing: "0.04em", whiteSpace: "nowrap",
              }}>
                {a === "BNY" ? <span style={{ color: C.tealBright }}>BNY</span> : a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.map((r) => (
            <tr key={r}>
              <td style={{
                fontSize: 11, color: "#B4BABE", paddingRight: 10, whiteSpace: "nowrap",
              }}>{MATRIX.families[r]}</td>
              {MATRIX.cells[r].map((v, ci) => (
                <td key={ci} style={{
                  background: cellBg(v, ci === 0),
                  border: `1px solid ${C.ink2}`,
                  height: 30, textAlign: "center",
                  fontFamily: MONO, fontSize: 9.5,
                  color: v === null ? C.line : v > 70 ? C.paper : "#C8CDD0",
                }}>
                  {v === null ? "·" : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.muted, marginTop: 12 }}>
        AUA $B · tap a column to rank · <span style={{ color: C.tealBright }}>teal</span> BNY,
        {" "}<span style={{ color: C.red }}>red</span> rival
      </div>
    </div>
  );
}

/* ------------------------- sankey ------------------------- */

function FlowNode({ x, y, width, height, index, payload }) {
  const isBny = payload.name.trim() === "BNY";
  const right = x > 200;
  return (
    <Layer key={`n${index}`}>
      <Rectangle
        x={x} y={y} width={width} height={height}
        fill={isBny ? C.teal : C.ink3}
        stroke={isBny ? C.tealBright : C.line}
        strokeWidth={1}
      />
      <text
        x={right ? x - 7 : x + width + 7}
        y={y + height / 2}
        textAnchor={right ? "end" : "start"}
        dominantBaseline="middle"
        fontFamily={MONO} fontSize={9.5}
        fill={isBny ? C.tealBright : C.muted}
      >{payload.name.trim()}</text>
    </Layer>
  );
}

function FlowLink(props) {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, payload } = props;
  const retained = payload.source.name.trim() === payload.target.name.trim();
  const fromBny = payload.source.name.trim() === "BNY";
  const stroke = retained ? (fromBny ? C.teal : C.line) : fromBny ? C.red : C.tealBright;
  return (
    <path
      key={`l${index}`}
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none" stroke={stroke} strokeWidth={linkWidth}
      strokeOpacity={retained ? 0.22 : 0.62}
    />
  );
}

function FlowChart() {
  return (
    <>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={SANKEY_DATA}
            node={<FlowNode />}
            link={<FlowLink />}
            nodePadding={22}
            margin={{ top: 8, right: 62, bottom: 8, left: 42 }}
          >
            <Tooltip
              contentStyle={{
                background: C.ink, border: `1px solid ${C.line}`, borderRadius: 2,
                fontFamily: MONO, fontSize: 11, color: C.paper,
              }}
              formatter={(v) => [`$${v}B`, "AUA"]}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.muted, marginTop: 10, lineHeight: 1.7 }}>
        Left: administrator, Q1 2026 · Right: administrator, Q3 2026
        <br />
        <span style={{ color: C.red }}>red</span> = mandate left BNY ·{" "}
        <span style={{ color: C.tealBright }}>teal</span> = mandate won
      </div>
    </>
  );
}

/* ------------------------- brief header ------------------------- */

function Masthead() {
  return (
    <header style={{
      borderBottom: `1px solid ${C.line}`, paddingBottom: 20, marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 13 L10 5 L17 13" stroke={C.tealBright} strokeWidth="2.4" fill="none" strokeLinecap="square" />
          </svg>
          <span style={{
            fontFamily: FONT, fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: C.paper,
          }}>BNY</span>
        </div>
        <div style={{
          width: 1, height: 16, background: C.line, alignSelf: "center",
        }} />
        <span style={{
          fontFamily: FONT, fontSize: 15, color: "#C8CDD0", letterSpacing: "-0.01em",
        }}>Competitive Intelligence</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>
          week of 2026-07-13 · 27 sources · 4 changes
        </span>
      </div>
    </header>
  );
}

/* ------------------------- app ------------------------- */

export default function App() {
  const [sel, setSel] = useState(CHANGES[0].id);
  const active = CHANGES.find((c) => c.id === sel);

  return (
    <div style={{
      background: C.ink, color: C.paper, minHeight: "100vh",
      fontFamily: FONT, padding: "26px 22px 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        button:focus-visible, th:focus-visible {
          outline: 2px solid ${C.tealBright}; outline-offset: 1px;
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <Masthead />

        {/* ---- HERO: what changed, not the graph ---- */}
        <div style={{
          display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(0, 1.25fr)",
          gap: 20, marginBottom: 20,
        }}>
          <Panel title="What changed" sub="Ranked by estimated revenue impact. Push, not pull.">
            <div style={{ margin: "0 -18px" }}>
              <ChangeFeed items={CHANGES} selected={sel} onSelect={setSel} />
            </div>
          </Panel>

          <Panel title={`Dossier · ${active.entity}`}>
            <div style={{
              fontSize: 17, lineHeight: 1.4, fontWeight: 500, letterSpacing: "-0.01em",
              marginBottom: 14, color: C.paper,
            }}>{active.headline}</div>

            <div style={{
              fontSize: 13, lineHeight: 1.65, color: "#B4BABE", marginBottom: 18,
              borderLeft: `2px solid ${C.teal}`, paddingLeft: 13,
            }}>{active.why}</div>

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start",
            }}>
              <div>
                <Eyebrow>Scoped subgraph · 2 hops</Eyebrow>
                <div style={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 2, padding: 6 }}>
                  <ScopedGraph spec={GRAPHS[active.graph]} />
                </div>
              </div>
              <div>
                <Eyebrow>Evidence</Eyebrow>
                <ol style={{
                  margin: 0, padding: 0, listStyle: "none",
                  display: "flex", flexDirection: "column", gap: 9,
                }}>
                  {active.sources.map((s, i) => (
                    <li key={i} style={{
                      fontSize: 11.5, color: "#B4BABE", lineHeight: 1.5,
                      display: "flex", gap: 8,
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.teal, paddingTop: 2 }}>
                        [{i + 1}]
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <div style={{
                  marginTop: 16, paddingTop: 13, borderTop: `1px solid ${C.line}`,
                  fontFamily: MONO, fontSize: 10, color: C.muted, lineHeight: 1.8,
                }}>
                  detected {active.detected}
                  <br />
                  confidence{" "}
                  <span style={{ color: active.confidence > 0.8 ? C.tealBright : C.gold }}>
                    {active.confidence.toFixed(2)}
                  </span>
                  <br />
                  {active.confidence < 0.7 && (
                    <span style={{ color: C.gold }}>below action threshold</span>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* ---- SIGNATURE: supersession rail ---- */}
        <Panel
          title="Belief revision · bitemporal rail"
          sub="Valid time on the horizontal. Transaction time is what moved the marker."
          style={{ marginBottom: 20 }}
        >
          <SupersessionRail />
        </Panel>

        {/* ---- posture + flow ---- */}
        <div style={{
          display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 20,
        }}>
          <Panel title="Competitive posture" sub="Administrator × fund family. Where rivals are winning.">
            <Matrix />
          </Panel>
          <Panel title="Mandate flow · trailing 2 quarters" sub="Who moved, and to whom.">
            <FlowChart />
          </Panel>
        </div>

        <footer style={{
          marginTop: 28, paddingTop: 16, borderTop: `1px solid ${C.line}`,
          fontFamily: MONO, fontSize: 9.5, color: C.muted, lineHeight: 1.8,
        }}>
          Mock. All entities, figures and filings are fabricated for layout purposes.
          <br />
          Graph substrate: Neo4j, insert-only supersession · Synthesis: GraphRAG · Sources: 27
        </footer>
      </div>
    </div>
  );
}
