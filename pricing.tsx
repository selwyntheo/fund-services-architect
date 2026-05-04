import React, { useState, useMemo, useEffect } from ‘react’;

// ============================================================
// BNY Pricing Workbench — Interactive Prototype
// Design language: classical financial editorial
// Heritage navy + warm parchment + JetBrains Mono / Source Serif 4
// ============================================================

const THEME = {
ink: ‘#0a0e17’,
inkSoft: ‘#2a3142’,
inkMuted: ‘#6b7280’,
bg: ‘#f5f1e8’,
bgCard: ‘#fbf8f0’,
bgInset: ‘#ece6d5’,
rule: ‘#1a2332’,
ruleSoft: ‘#cfc6b0’,
navy: ‘#0f2545’,
navyDeep: ‘#091830’,
teal: ‘#0e6b6b’,
oxblood: ‘#7a1f2b’,
ochre: ‘#b8521f’,
gold: ‘#967319’,
green: ‘#3a5a2c’,
};

// ============================================================
// MOCK DATA — shaped to match the actual schema
// ============================================================
const DEALS = [
{ id: ‘2026S-080892’, client: ‘Northwind Capital’, segment: ‘Alts’, lead: ‘steven.lake’, type: ‘New Business’, status: ‘Pricing Issued’, aum: 4200, ftes: 18, products: 6, activities: 142 },
{ id: ‘2026S-079211’, client: ‘Pinegrove Asset Mgmt’, segment: ‘AO’, lead: ‘rex.dendingeri’, type: ‘Additional Business’, status: ‘Pricing Issued’, aum: 1850, ftes: 9, products: 4, activities: 67 },
{ id: ‘2026S-080610’, client: ‘Halberd Wealth’, segment: ‘BBDI’, lead: ‘sofya.marcus’, type: ‘New Business’, status: ‘In Progress’, aum: 720, ftes: 6, products: 3, activities: 41 },
{ id: ‘2026S-078819’, client: ‘Cardinal Strategies’, segment: ‘Alts’, lead: ‘max.newman’, type: ‘New Business’, status: ‘Pricing Issued’, aum: 3100, ftes: 14, products: 5, activities: 98 },
{ id: ‘2026S-079312’, client: ‘Meridian Funds’, segment: ‘BBDI’, lead: ‘joseph.stewart’, type: ‘Additional Business’, status: ‘Pricing Issued’, aum: 8400, ftes: 22, products: 7, activities: 184 },
{ id: ‘2022OPPTY-521319’, client: ‘Ashfield Holdings’, segment: ‘BBDI’, lead: ‘marko.reimer’, type: ‘New Business’, status: ‘In Progress’, aum: 1200, ftes: 8, products: 4, activities: 73 },
];

const FEE_LINES = {
‘2026S-080892’: [
{ product: ‘Fund Accounting’, category: ‘NAV Production’, activity: ‘Daily NAV Calculation’, feeType: ‘Mandatory’, rateType: ‘bps’, floor: 0.8, std: 1.5, proposed: 1.1, volume: 4200, fees: 462, revShare: 22.4 },
{ product: ‘Fund Accounting’, category: ‘NAV Production’, activity: ‘Estimate NAV’, feeType: ‘Mandatory’, rateType: ‘USD’, floor: 5000, std: 12000, proposed: 9000, volume: 12, fees: 108, revShare: 5.2 },
{ product: ‘Fund Accounting’, category: ‘Reconciliation’, activity: ‘Cash Reconciliation’, feeType: ‘Mandatory’, rateType: ‘USD’, floor: 800, std: 1500, proposed: 1100, volume: 252, fees: 277, revShare: 13.4 },
{ product: ‘Custody’, category: ‘Safekeeping’, activity: ‘Account Maintenance’, feeType: ‘Mandatory’, rateType: ‘bps’, floor: 0.3, std: 0.6, proposed: 0.45, volume: 4200, fees: 189, revShare: 9.2 },
{ product: ‘Custody’, category: ‘Settlement’, activity: ‘SWIFT Messages’, feeType: ‘Pass Through’, rateType: ‘USD’, floor: 2.5, std: 4.0, proposed: 3.2, volume: 18400, fees: 59, revShare: 2.9 },
{ product: ‘Custody’, category: ‘Settlement’, activity: ‘Trade Settlement DTC’, feeType: ‘Mandatory’, rateType: ‘USD’, floor: 8, std: 15, proposed: 11, volume: 8200, fees: 90, revShare: 4.4 },
{ product: ‘Middle Office’, category: ‘Trade Support’, activity: ‘Trade Capture’, feeType: ‘Voluntary’, rateType: ‘USD’, floor: 6, std: 12, proposed: 9, volume: 8200, fees: 74, revShare: 3.6 },
{ product: ‘Middle Office’, category: ‘Collateral Mgmt’, activity: ‘OTC Margin Calls’, feeType: ‘Voluntary’, rateType: ‘USD’, floor: 75, std: 150, proposed: 110, volume: 480, fees: 53, revShare: 2.6 },
{ product: ‘Performance’, category: ‘Reporting’, activity: ‘GIPS Composite’, feeType: ‘Voluntary’, rateType: ‘USD’, floor: 18000, std: 35000, proposed: 24000, volume: 4, fees: 96, revShare: 4.7 },
{ product: ‘Reg Reporting’, category: ‘AIFMD’, activity: ‘Annex IV Filing’, feeType: ‘Mandatory’, rateType: ‘EUR’, floor: 8000, std: 18000, proposed: 14000, volume: 4, fees: 60, revShare: 2.9 },
{ product: ‘Reg Reporting’, category: ‘Form PF’, activity: ‘Quarterly Form PF’, feeType: ‘Mandatory’, rateType: ‘USD’, floor: 12000, std: 25000, proposed: 19000, volume: 4, fees: 76, revShare: 3.7 },
{ product: ‘Tax Services’, category: ‘US 1099’, activity: ‘Form 1099 Generation’, feeType: ‘Pass Through’, rateType: ‘USD’, floor: 8, std: 15, proposed: 11, volume: 2400, fees: 26, revShare: 1.3 },
{ product: ‘Transfer Agency’, category: ‘Investor Servicing’, activity: ‘Subscription Processing’, feeType: ‘Mandatory’, rateType: ‘USD’, floor: 45, std: 95, proposed: 68, volume: 1200, fees: 82, revShare: 4.0 },
{ product: ‘Transfer Agency’, category: ‘Investor Servicing’, activity: ‘Redemption Processing’, feeType: ‘Mandatory’, rateType: ‘USD’, floor: 45, std: 95, proposed: 68, volume: 980, fees: 67, revShare: 3.2 },
{ product: ‘Transfer Agency’, category: ‘AML/KYC’, activity: ‘Investor KYC Refresh’, feeType: ‘Mandatory’, rateType: ‘USD’, floor: 120, std: 220, proposed: 165, volume: 340, fees: 56, revShare: 2.7 },
{ product: ‘Reg Reporting’, category: ‘Form PF’, activity: ‘PF Section 4’, feeType: ‘Voluntary’, rateType: ‘USD’, floor: 6000, std: 14000, proposed: 10000, volume: 4, fees: 40, revShare: 2.0 },
{ product: ‘Custody’, category: ‘Income Collection’, activity: ‘Coupon Processing’, feeType: ‘Pass Through’, rateType: ‘bps’, floor: 0.2, std: 0.4, proposed: 0.3, volume: 1800, fees: 54, revShare: 2.6 },
{ product: ‘Performance’, category: ‘Attribution’, activity: ‘Brinson Attribution’, feeType: ‘Voluntary’, rateType: ‘USD’, floor: 8000, std: 18000, proposed: 13000, volume: 12, fees: 156, revShare: 7.6 },
],
};

// Fill other deals with subset
[‘2026S-079211’, ‘2026S-080610’, ‘2026S-078819’, ‘2026S-079312’, ‘2022OPPTY-521319’].forEach(id => {
const base = FEE_LINES[‘2026S-080892’];
const count = Math.max(6, Math.floor(base.length * (0.4 + Math.random() * 0.5)));
FEE_LINES[id] = base.slice(0, count).map(line => ({
…line,
proposed: line.std * (0.5 + Math.random() * 0.45),
volume: line.volume * (0.3 + Math.random() * 1.2),
fees: line.fees * (0.3 + Math.random() * 1.4),
})).map(line => ({ …line, fees: Math.round(line.fees), revShare: line.fees / 100 }));
});

const COMPLEXITY_SUBSCORES = {
‘2026S-080892’: { instrument: 78, valuation: 65, regulatory: 82, operational: 71, dataInterface: 58, changeVelocity: 44 },
‘2026S-079211’: { instrument: 42, valuation: 38, regulatory: 51, operational: 47, dataInterface: 62, changeVelocity: 35 },
‘2026S-080610’: { instrument: 35, valuation: 28, regulatory: 41, operational: 38, dataInterface: 31, changeVelocity: 52 },
‘2026S-078819’: { instrument: 71, valuation: 58, regulatory: 67, operational: 63, dataInterface: 49, changeVelocity: 41 },
‘2026S-079312’: { instrument: 84, valuation: 79, regulatory: 88, operational: 81, dataInterface: 72, changeVelocity: 38 },
‘2022OPPTY-521319’: { instrument: 51, valuation: 45, regulatory: 58, operational: 49, dataInterface: 41, changeVelocity: 47 },
};

const REFERENCE_DEALS = [
{ id: ‘2024S-031142’, client: ‘Comparable A’, similarity: 0.94, won: true, finalBps: 4.2, complexity: 74, ftes: 17 },
{ id: ‘2023S-067881’, client: ‘Comparable B’, similarity: 0.91, won: true, finalBps: 4.6, complexity: 78, ftes: 19 },
{ id: ‘2024S-014520’, client: ‘Comparable C’, similarity: 0.88, won: false, finalBps: 5.1, complexity: 72, ftes: 16 },
{ id: ‘2023S-091203’, client: ‘Comparable D’, similarity: 0.85, won: true, finalBps: 4.0, complexity: 81, ftes: 20 },
{ id: ‘2025S-008844’, client: ‘Comparable E’, similarity: 0.82, won: false, finalBps: 5.4, complexity: 76, ftes: 18 },
];

const SEGMENT_COLORS = {
Alts: THEME.oxblood,
AO: THEME.teal,
BBDI: THEME.navy,
IM: THEME.gold,
};

// ============================================================
// SHARED COMPONENTS
// ============================================================
const Heading = ({ num, title, subtitle, right }) => (

  <div style={{
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 20,
    borderBottom: `1px solid ${THEME.rule}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.12em',
        color: THEME.ochre,
        fontWeight: 600,
      }}>§ {num}</span>
      <h2 style={{
        fontFamily: 'Source Serif 4, serif',
        fontWeight: 500,
        fontSize: 22,
        letterSpacing: '-0.005em',
        color: THEME.ink,
        margin: 0,
      }}>{title}</h2>
      {subtitle && <span style={{
        fontFamily: 'Source Serif 4, serif',
        fontStyle: 'italic',
        fontSize: 14,
        color: THEME.inkMuted,
      }}>— {subtitle}</span>}
    </div>
    {right}
  </div>
);

const Pill = ({ children, color, bg, soft }) => (
<span style={{
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 9.5,
fontWeight: 600,
letterSpacing: ‘0.08em’,
textTransform: ‘uppercase’,
padding: ‘3px 8px’,
color: color || THEME.ink,
background: bg || (soft ? THEME.bgInset : ‘transparent’),
border: soft ? ‘none’ : `1px solid ${color || THEME.ink}`,
display: ‘inline-block’,
}}>{children}</span>
);

// ============================================================
// 1. DEAL SELECTOR (top bar)
// ============================================================
const DealSelector = ({ deals, selectedId, onSelect }) => (

  <div style={{
    background: THEME.navyDeep,
    color: THEME.bg,
    padding: '20px 32px',
    borderBottom: `2px solid ${THEME.rule}`,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    }}>
      <div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.18em',
          color: THEME.ruleSoft,
          marginBottom: 4,
          textTransform: 'uppercase',
        }}>BNY · Asset Servicing · Pricing</div>
        <div style={{
          fontFamily: 'Source Serif 4, serif',
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: '-0.01em',
        }}>Deal Workbench <span style={{ fontStyle: 'italic', color: THEME.ruleSoft }}>— v0.1</span></div>
      </div>
      <div style={{
        display: 'flex',
        gap: 24,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.08em',
        color: THEME.ruleSoft,
        textTransform: 'uppercase',
      }}>
        <span>Tracker · 2,208 deals</span>
        <span>Active · 47</span>
        <span>This week · 12 issued</span>
      </div>
    </div>
    <div style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      paddingBottom: 4,
    }}>
      {deals.map(d => {
        const sel = d.id === selectedId;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            style={{
              flexShrink: 0,
              padding: '10px 16px',
              background: sel ? THEME.bg : 'transparent',
              color: sel ? THEME.ink : THEME.bg,
              border: `1px solid ${sel ? THEME.bg : 'rgba(245,241,232,0.3)'}`,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '0.05em', marginBottom: 3, opacity: sel ? 0.6 : 0.7 }}>
              {d.id}
            </div>
            <div style={{
              fontFamily: 'Source Serif 4, serif',
              fontSize: 13,
              fontWeight: sel ? 600 : 400,
              marginBottom: 2,
            }}>{d.client}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.06em', opacity: 0.7 }}>
              {d.segment} · ${d.aum}M AUM · {d.ftes} FTE
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// ============================================================
// 2. DEAL HEADER (selected deal at-a-glance)
// ============================================================
const DealHeader = ({ deal }) => {
const stat = (label, value, sub) => (
<div style={{
paddingRight: 24,
paddingLeft: 24,
borderLeft: `1px solid ${THEME.ruleSoft}`,
}}>
<div style={{
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 9.5,
letterSpacing: ‘0.1em’,
color: THEME.inkMuted,
textTransform: ‘uppercase’,
marginBottom: 4,
}}>{label}</div>
<div style={{
fontFamily: ‘Source Serif 4, serif’,
fontSize: 22,
fontWeight: 500,
color: THEME.ink,
lineHeight: 1,
}}>{value}</div>
{sub && <div style={{
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 10,
color: THEME.inkMuted,
marginTop: 4,
}}>{sub}</div>}
</div>
);

return (
<div style={{
background: THEME.bgCard,
borderBottom: `1px solid ${THEME.rule}`,
padding: ‘24px 32px’,
display: ‘flex’,
alignItems: ‘center’,
}}>
<div style={{ flex: ‘0 0 auto’, paddingRight: 32 }}>
<div style={{ display: ‘flex’, alignItems: ‘center’, gap: 10, marginBottom: 6 }}>
<Pill color={SEGMENT_COLORS[deal.segment]}>{deal.segment}</Pill>
<Pill color={THEME.green} bg="rgba(58,90,44,0.1)">{deal.status}</Pill>
<span style={{
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 10,
color: THEME.inkMuted,
letterSpacing: ‘0.05em’,
}}>{deal.id}</span>
</div>
<div style={{
fontFamily: ‘Source Serif 4, serif’,
fontSize: 30,
fontWeight: 400,
letterSpacing: ‘-0.015em’,
color: THEME.ink,
lineHeight: 1.05,
}}>{deal.client}</div>
<div style={{
fontFamily: ‘Source Serif 4, serif’,
fontStyle: ‘italic’,
fontSize: 14,
color: THEME.inkSoft,
marginTop: 4,
}}>{deal.type} · led by {deal.lead}</div>
</div>
{stat(‘AUM’, `$${(deal.aum / 1000).toFixed(1)}B`, ‘expected’)}
{stat(‘Products’, deal.products, ‘service lines’)}
{stat(‘Activities’, deal.activities, ‘fee lines’)}
{stat(‘Ops FTE’, deal.ftes, ‘allocated’)}
</div>
);
};

// ============================================================
// 3. FEE LINE LEDGER — discount heat map
// ============================================================
const FeeLedger = ({ feeLines, multiplier, onMultiplierChange }) => {
const [sortBy, setSortBy] = useState(‘revShare’);
const [filterProduct, setFilterProduct] = useState(‘all’);
const [filterFeeType, setFilterFeeType] = useState(‘all’);

const products = useMemo(() => [‘all’, …new Set(feeLines.map(l => l.product))], [feeLines]);
const feeTypes = useMemo(() => [‘all’, …new Set(feeLines.map(l => l.feeType))], [feeLines]);

const filtered = useMemo(() => {
let list = feeLines;
if (filterProduct !== ‘all’) list = list.filter(l => l.product === filterProduct);
if (filterFeeType !== ‘all’) list = list.filter(l => l.feeType === filterFeeType);
return list.slice().sort((a, b) => b[sortBy] - a[sortBy]);
}, [feeLines, sortBy, filterProduct, filterFeeType]);

const totals = useMemo(() => {
const totalFees = filtered.reduce((s, l) => s + l.fees, 0) * multiplier;
const totalStdFees = filtered.reduce((s, l) => {
const ratio = l.std / l.proposed;
return s + l.fees * ratio;
}, 0);
const discountPct = (1 - (totalFees / multiplier) / totalStdFees) * 100;
return { totalFees, totalStdFees, discountPct };
}, [filtered, multiplier]);

const discountColor = (pct) => {
// 0% = navy (full price), 50%+ = oxblood (deep discount)
if (pct < 10) return { bg: ‘#e8eaf0’, text: THEME.navy };
if (pct < 25) return { bg: ‘#dde0ce’, text: THEME.green };
if (pct < 40) return { bg: ‘#e8d5b8’, text: THEME.gold };
if (pct < 55) return { bg: ‘#e8c8a8’, text: THEME.ochre };
return { bg: ‘#e8b8b0’, text: THEME.oxblood };
};

return (
<div>
<Heading
num=“01”
title=“Fee-line ledger”
subtitle={`${filtered.length} of ${feeLines.length} activities · discount-from-list view`}
right={
<div style={{ display: ‘flex’, gap: 14, alignItems: ‘center’ }}>
<select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} style={selectStyle}>
{products.map(p => <option key={p} value={p}>{p === ‘all’ ? ‘All products’ : p}</option>)}
</select>
<select value={filterFeeType} onChange={e => setFilterFeeType(e.target.value)} style={selectStyle}>
{feeTypes.map(p => <option key={p} value={p}>{p === ‘all’ ? ‘All fee types’ : p}</option>)}
</select>
<select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
<option value="revShare">by revenue share</option>
<option value="fees">by fees (USD)</option>
<option value="proposed">by proposed rate</option>
</select>
</div>
}
/>

```
  {/* Summary strip */}
  <div style={{
    background: THEME.navyDeep,
    color: THEME.bg,
    padding: '14px 20px',
    marginBottom: 0,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 2fr',
    gap: 24,
    alignItems: 'center',
  }}>
    <div>
      <div style={summaryLabelStyle}>Total fees (proposed)</div>
      <div style={summaryValueStyle}>${(totals.totalFees / 1000).toFixed(2)}M</div>
    </div>
    <div>
      <div style={summaryLabelStyle}>Total fees (at list)</div>
      <div style={{ ...summaryValueStyle, color: THEME.ruleSoft }}>${(totals.totalStdFees / 1000).toFixed(2)}M</div>
    </div>
    <div>
      <div style={summaryLabelStyle}>Implied discount</div>
      <div style={{ ...summaryValueStyle, color: '#e8c8a8' }}>{totals.discountPct.toFixed(1)}%</div>
    </div>
    <div>
      <div style={summaryLabelStyle}>Pricing multiplier (drag)</div>
      <input
        type="range"
        min="0.5"
        max="1.5"
        step="0.01"
        value={multiplier}
        onChange={e => onMultiplierChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: THEME.ochre }}
      />
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: THEME.ruleSoft, marginTop: 2 }}>
        × {multiplier.toFixed(2)} applied to all proposed rates
      </div>
    </div>
  </div>

  {/* Table */}
  <div style={{
    background: THEME.bgCard,
    border: `1px solid ${THEME.rule}`,
    borderTop: 'none',
    maxHeight: 480,
    overflowY: 'auto',
  }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
      <thead style={{ position: 'sticky', top: 0, background: THEME.bgInset, zIndex: 1 }}>
        <tr>
          {['Product', 'Activity', 'Fee Type', 'Floor', 'Std', 'Proposed', 'Disc.', 'Vol.', 'Fees ($)', '% Rev'].map(h => (
            <th key={h} style={{
              padding: '10px 12px',
              textAlign: ['Product', 'Activity', 'Fee Type'].includes(h) ? 'left' : 'right',
              fontSize: 9.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: THEME.inkSoft,
              borderBottom: `1px solid ${THEME.rule}`,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((line, i) => {
          const adjustedProposed = line.proposed * multiplier;
          const discPct = (1 - adjustedProposed / line.std) * 100;
          const dc = discountColor(discPct);
          const adjustedFees = line.fees * multiplier;
          return (
            <tr key={i} style={{
              borderBottom: `1px solid ${THEME.ruleSoft}`,
              background: i % 2 === 0 ? THEME.bgCard : THEME.bg,
            }}>
              <td style={tdStyle}>{line.product}</td>
              <td style={{ ...tdStyle, fontFamily: 'Source Serif 4, serif', fontSize: 12.5 }}>
                <div>{line.activity}</div>
                <div style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: THEME.inkMuted, marginTop: 1 }}>
                  {line.category}
                </div>
              </td>
              <td style={tdStyle}>
                <span style={{
                  fontSize: 9,
                  padding: '1px 5px',
                  background: line.feeType === 'Mandatory' ? '#e8d5b8' : line.feeType === 'Voluntary' ? '#dde0ce' : '#e0d8c8',
                  color: line.feeType === 'Mandatory' ? THEME.gold : line.feeType === 'Voluntary' ? THEME.green : THEME.inkSoft,
                }}>{line.feeType}</span>
              </td>
              <td style={tdRight}>{line.floor < 10 ? line.floor.toFixed(2) : line.floor.toLocaleString()}</td>
              <td style={tdRight}>{line.std < 10 ? line.std.toFixed(2) : line.std.toLocaleString()}</td>
              <td style={{ ...tdRight, fontWeight: 600, color: THEME.navy }}>
                {adjustedProposed < 10 ? adjustedProposed.toFixed(2) : Math.round(adjustedProposed).toLocaleString()}
                <span style={{ fontSize: 9, color: THEME.inkMuted, marginLeft: 4 }}>{line.rateType}</span>
              </td>
              <td style={{ ...tdRight, padding: '0' }}>
                <div style={{
                  background: dc.bg,
                  color: dc.text,
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 11,
                }}>{discPct.toFixed(0)}%</div>
              </td>
              <td style={tdRight}>{line.volume.toLocaleString()}</td>
              <td style={{ ...tdRight, fontWeight: 600 }}>${Math.round(adjustedFees).toLocaleString()}</td>
              <td style={{ ...tdRight, color: THEME.ochre }}>{line.revShare.toFixed(1)}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
```

);
};

const tdStyle = { padding: ‘8px 12px’, verticalAlign: ‘top’ };
const tdRight = { padding: ‘8px 12px’, textAlign: ‘right’, verticalAlign: ‘top’ };
const selectStyle = {
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 11,
padding: ‘5px 10px’,
background: THEME.bgCard,
border: `1px solid ${THEME.rule}`,
color: THEME.ink,
cursor: ‘pointer’,
};
const summaryLabelStyle = {
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 9.5,
letterSpacing: ‘0.1em’,
textTransform: ‘uppercase’,
color: THEME.ruleSoft,
marginBottom: 4,
};
const summaryValueStyle = {
fontFamily: ‘Source Serif 4, serif’,
fontSize: 22,
fontWeight: 500,
lineHeight: 1,
};

// ============================================================
// 4. COMPLEXITY DECOMPOSITION (radar-like bars)
// ============================================================
const ComplexityPanel = ({ scores }) => {
const dimensions = [
{ key: ‘instrument’, label: ‘Instrument coverage’ },
{ key: ‘valuation’, label: ‘Valuation (L1/L2/L3)’ },
{ key: ‘regulatory’, label: ‘Regulatory load’ },
{ key: ‘operational’, label: ‘Operational density’ },
{ key: ‘dataInterface’, label: ‘Data interfaces’ },
{ key: ‘changeVelocity’, label: ‘Change velocity’ },
];
const composite = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6);

return (
<div>
<Heading
num=“02”
title=“Complexity decomposition”
subtitle=“six orthogonal sub-scores · weighted from realised cost variance”
right={
<div style={{ textAlign: ‘right’ }}>
<div style={{ fontFamily: ‘JetBrains Mono, monospace’, fontSize: 10, color: THEME.inkMuted, letterSpacing: ‘0.08em’, textTransform: ‘uppercase’ }}>Composite</div>
<div style={{ fontFamily: ‘Source Serif 4, serif’, fontSize: 32, fontWeight: 500, color: composite > 70 ? THEME.oxblood : composite > 50 ? THEME.ochre : THEME.green, lineHeight: 1 }}>
{composite}
</div>
</div>
}
/>
<div style={{ background: THEME.bgCard, border: `1px solid ${THEME.rule}`, padding: 20 }}>
{dimensions.map(d => {
const v = scores[d.key];
const color = v > 70 ? THEME.oxblood : v > 50 ? THEME.ochre : v > 30 ? THEME.gold : THEME.green;
return (
<div key={d.key} style={{ marginBottom: 14, lastChild: { marginBottom: 0 } }}>
<div style={{ display: ‘flex’, justifyContent: ‘space-between’, marginBottom: 5 }}>
<span style={{ fontFamily: ‘Source Serif 4, serif’, fontSize: 13.5, color: THEME.ink }}>{d.label}</span>
<span style={{ fontFamily: ‘JetBrains Mono, monospace’, fontSize: 12, fontWeight: 600, color }}>{v}</span>
</div>
<div style={{ height: 8, background: THEME.bgInset, position: ‘relative’ }}>
<div style={{
height: ‘100%’,
width: `${v}%`,
background: color,
transition: ‘width 0.4s ease’,
}} />
{/* Tick marks */}
{[25, 50, 75].map(t => (
<div key={t} style={{
position: ‘absolute’,
left: `${t}%`,
top: 0,
bottom: 0,
width: 1,
background: ‘rgba(0,0,0,0.15)’,
}} />
))}
</div>
</div>
);
})}
<div style={{
marginTop: 16,
paddingTop: 14,
borderTop: `1px dotted ${THEME.ruleSoft}`,
fontFamily: ‘Source Serif 4, serif’,
fontStyle: ‘italic’,
fontSize: 13,
color: THEME.inkSoft,
lineHeight: 1.5,
}}>
{composite > 70
? ‘High composite complexity. Expect cost-to-serve variance ±18% versus the BBDI median. Recommend senior pricing officer review and L3 valuation desk sign-off before issue.’
: composite > 50
? ‘Moderate complexity. Pricing model confidence is high; the band is ±9% around the recommendation. Standard approval path applies.’
: ‘Low-complexity mandate. Standard pricing playbook applies. Ramp risk is the dominant driver of margin variance.’}
</div>
</div>
</div>
);
};

// ============================================================
// 5. PRICE-VS-WIN CURVE — drag to negotiate
// ============================================================
const PriceCurve = ({ deal, currentPrice, onPriceChange }) => {
const [hoverPrice, setHoverPrice] = useState(null);

// Generate curve: P(win) decreases with price; cost is flat
const basePrice = 4.2; // bps benchmark
const cost = 2.8;
const points = useMemo(() => {
const arr = [];
for (let p = 2.5; p <= 6.5; p += 0.05) {
// Logistic decay
const k = 2.2;
const midpoint = 4.4;
const pWin = 1 / (1 + Math.exp(k * (p - midpoint)));
const margin = (p - cost) * pWin;
arr.push({ price: p, pWin, margin });
}
return arr;
}, []);

const maxMargin = Math.max(…points.map(p => p.margin));
const optimalPoint = points.find(p => p.margin === maxMargin);

const W = 760, H = 320, PAD = 50;
const xScale = (p) => PAD + ((p - 2.5) / 4) * (W - PAD * 2);
const yScaleP = (v) => H - PAD - v * (H - PAD * 2);
const yScaleM = (v) => H - PAD - (v / maxMargin) * (H - PAD * 2);

const winPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.price)} ${yScaleP(p.pWin)}`).join(’ ‘);
const marginPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.price)} ${yScaleM(p.margin)}`).join(’ ’);

const currentPoint = points.reduce((best, p) => Math.abs(p.price - currentPrice) < Math.abs(best.price - currentPrice) ? p : best, points[0]);

return (
<div>
<Heading
num=“03”
title=“Price × win-probability”
subtitle=“optimisation target: E[margin] = (price − cost) × P(win)”
right={
<div style={{ display: ‘flex’, gap: 20 }}>
<div>
<div style={{ fontFamily: ‘JetBrains Mono, monospace’, fontSize: 9.5, letterSpacing: ‘0.1em’, color: THEME.inkMuted, textTransform: ‘uppercase’ }}>Optimum</div>
<div style={{ fontFamily: ‘Source Serif 4, serif’, fontSize: 18, fontWeight: 500, color: THEME.green }}>
{optimalPoint.price.toFixed(2)} bps
</div>
</div>
<div>
<div style={{ fontFamily: ‘JetBrains Mono, monospace’, fontSize: 9.5, letterSpacing: ‘0.1em’, color: THEME.inkMuted, textTransform: ‘uppercase’ }}>Current</div>
<div style={{ fontFamily: ‘Source Serif 4, serif’, fontSize: 18, fontWeight: 500, color: THEME.ochre }}>
{currentPoint.price.toFixed(2)} bps
</div>
</div>
</div>
}
/>

```
  <div style={{ background: THEME.bgCard, border: `1px solid ${THEME.rule}`, padding: 24 }}>
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ cursor: 'crosshair' }}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (W / rect.width);
        const price = 2.5 + ((x - PAD) / (W - PAD * 2)) * 4;
        if (price >= 2.5 && price <= 6.5) setHoverPrice(price);
      }}
      onMouseLeave={() => setHoverPrice(null)}
      onClick={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (W / rect.width);
        const price = 2.5 + ((x - PAD) / (W - PAD * 2)) * 4;
        if (price >= 2.5 && price <= 6.5) onPriceChange(price);
      }}
    >
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(g => (
        <line key={g} x1={PAD} y1={yScaleP(g)} x2={W - PAD} y2={yScaleP(g)} stroke={THEME.ruleSoft} strokeDasharray="2 4" strokeWidth={0.5} />
      ))}
      {[3, 3.5, 4, 4.5, 5, 5.5, 6].map(p => (
        <line key={p} x1={xScale(p)} y1={PAD} x2={xScale(p)} y2={H - PAD} stroke={THEME.ruleSoft} strokeDasharray="2 4" strokeWidth={0.5} />
      ))}

      {/* Margin shaded area */}
      <path d={`${marginPath} L ${xScale(6.5)} ${H - PAD} L ${xScale(2.5)} ${H - PAD} Z`} fill={THEME.ochre} opacity={0.08} />

      {/* Win curve */}
      <path d={winPath} stroke={THEME.navy} strokeWidth={2} fill="none" />

      {/* Margin curve */}
      <path d={marginPath} stroke={THEME.ochre} strokeWidth={2} fill="none" strokeDasharray="4 3" />

      {/* Optimum marker */}
      <line x1={xScale(optimalPoint.price)} y1={PAD} x2={xScale(optimalPoint.price)} y2={H - PAD} stroke={THEME.green} strokeWidth={1} strokeDasharray="3 2" />
      <circle cx={xScale(optimalPoint.price)} cy={yScaleM(optimalPoint.margin)} r={5} fill={THEME.green} stroke={THEME.bgCard} strokeWidth={2} />
      <text x={xScale(optimalPoint.price) + 8} y={yScaleM(optimalPoint.margin) - 8} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.green} fontWeight={600}>
        optimum
      </text>

      {/* Current price marker */}
      <line x1={xScale(currentPoint.price)} y1={PAD} x2={xScale(currentPoint.price)} y2={H - PAD} stroke={THEME.ochre} strokeWidth={1.5} />
      <circle cx={xScale(currentPoint.price)} cy={yScaleP(currentPoint.pWin)} r={6} fill={THEME.ochre} stroke={THEME.bgCard} strokeWidth={2} />
      <circle cx={xScale(currentPoint.price)} cy={yScaleM(currentPoint.margin)} r={6} fill={THEME.ochre} stroke={THEME.bgCard} strokeWidth={2} />

      {/* Hover marker */}
      {hoverPrice && (
        <line x1={xScale(hoverPrice)} y1={PAD} x2={xScale(hoverPrice)} y2={H - PAD} stroke={THEME.ink} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.5} />
      )}

      {/* Axes */}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={THEME.ink} strokeWidth={1} />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={THEME.ink} strokeWidth={1} />

      {/* X labels */}
      {[3, 3.5, 4, 4.5, 5, 5.5, 6].map(p => (
        <text key={p} x={xScale(p)} y={H - PAD + 18} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.inkSoft} textAnchor="middle">{p.toFixed(1)}</text>
      ))}
      <text x={W / 2} y={H - 8} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.inkMuted} textAnchor="middle" letterSpacing="0.1em">PRICE (bps)</text>

      {/* Y left */}
      {[0, 0.25, 0.5, 0.75, 1].map(g => (
        <text key={g} x={PAD - 8} y={yScaleP(g) + 3} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.navy} textAnchor="end">{(g * 100).toFixed(0)}%</text>
      ))}
      <text x={20} y={H / 2} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.navy} textAnchor="middle" transform={`rotate(-90, 20, ${H / 2})`} letterSpacing="0.08em">P(WIN)</text>

      {/* Y right */}
      {[0, 0.5, 1].map(g => (
        <text key={g} x={W - PAD + 8} y={yScaleM(g * maxMargin) + 3} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.ochre}>{(g * maxMargin).toFixed(2)}</text>
      ))}
      <text x={W - 14} y={H / 2} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.ochre} textAnchor="middle" transform={`rotate(90, ${W - 14}, ${H / 2})`} letterSpacing="0.08em">E[MARGIN]</text>
    </svg>

    <div style={{
      marginTop: 14,
      padding: '12px 16px',
      background: THEME.bgInset,
      fontFamily: 'Source Serif 4, serif',
      fontSize: 13,
      color: THEME.inkSoft,
      lineHeight: 1.5,
    }}>
      <span style={{ fontWeight: 600, color: THEME.ink }}>At {currentPoint.price.toFixed(2)} bps:</span>{' '}
      win probability is <span style={{ color: THEME.navy, fontWeight: 600 }}>{(currentPoint.pWin * 100).toFixed(0)}%</span>,
      expected margin is <span style={{ color: THEME.ochre, fontWeight: 600 }}>{currentPoint.margin.toFixed(2)} bps</span>.
      {currentPoint.price > optimalPoint.price + 0.2 && ' Pricing is above optimum — margin is being left on the table by missed wins.'}
      {currentPoint.price < optimalPoint.price - 0.2 && ' Pricing is below optimum — winning more deals at lower margin.'}
      {Math.abs(currentPoint.price - optimalPoint.price) <= 0.2 && ' Within 5bps of expected-margin optimum.'}
      {' '}<em style={{ color: THEME.inkMuted }}>Click curve to set; SHAP rationale on hover.</em>
    </div>
  </div>
</div>
```

);
};

// ============================================================
// 6. REFERENCE DEALS
// ============================================================
const ReferencePanel = ({ refs, currentBps }) => (

  <div>
    <Heading num="04" title="Closest reference deals" subtitle="top-K nearest in canonical-deal-object embedding space" />
    <div style={{ background: THEME.bgCard, border: `1px solid ${THEME.rule}` }}>
      {refs.map((r, i) => (
        <div key={r.id} style={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 80px 1fr 90px 80px',
          gap: 16,
          padding: '14px 18px',
          alignItems: 'center',
          borderBottom: i < refs.length - 1 ? `1px solid ${THEME.ruleSoft}` : 'none',
          background: i % 2 === 0 ? THEME.bgCard : THEME.bg,
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: THEME.inkMuted }}>{r.id}</div>
          <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 14 }}>{r.client}</div>
          <div>
            <Pill color={r.won ? THEME.green : THEME.oxblood}>{r.won ? 'Won' : 'Lost'}</Pill>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: THEME.bgInset, position: 'relative' }}>
                <div style={{ height: '100%', width: `${r.similarity * 100}%`, background: THEME.navy }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: THEME.navy, fontWeight: 600 }}>
                {(r.similarity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'right' }}>
            <span style={{ color: r.finalBps > currentBps ? THEME.green : THEME.oxblood, fontWeight: 600 }}>{r.finalBps.toFixed(1)}</span>
            <span style={{ color: THEME.inkMuted, marginLeft: 3 }}>bps</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: THEME.inkSoft, textAlign: 'right' }}>
            cx {r.complexity} · {r.ftes}fte
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// 7. MONTE CARLO SIMULATION
// ============================================================
const SimulationPanel = ({ basePrice }) => {
const [iterations, setIterations] = useState(0);
const [scenario, setScenario] = useState(‘base’);
const [results, setResults] = useState([]);

const runSim = () => {
setIterations(0);
setResults([]);
const sims = [];
let i = 0;
const N = 1000;

```
const params = {
  base: { aumGrowth: [0.05, 0.12], feeCompression: [0.0, 0.03], l3Drift: [0.0, 0.05] },
  stress: { aumGrowth: [-0.10, 0.05], feeCompression: [0.04, 0.10], l3Drift: [0.05, 0.20] },
  upside: { aumGrowth: [0.10, 0.20], feeCompression: [-0.02, 0.02], l3Drift: [-0.02, 0.02] },
}[scenario];

const interval = setInterval(() => {
  for (let j = 0; j < 25 && i < N; j++, i++) {
    const aumG = params.aumGrowth[0] + Math.random() * (params.aumGrowth[1] - params.aumGrowth[0]);
    const compr = params.feeCompression[0] + Math.random() * (params.feeCompression[1] - params.feeCompression[0]);
    const l3 = params.l3Drift[0] + Math.random() * (params.l3Drift[1] - params.l3Drift[0]);

    const yr1 = basePrice * (1 - compr) * 4.2;
    const yr2 = yr1 * (1 + aumG) * (1 - compr) * (1 + l3 * 0.3);
    const yr3 = yr2 * (1 + aumG) * (1 - compr) * (1 + l3 * 0.5);
    const cost1 = 2.8 * 4.2 * (1 + l3 * 0.6);
    const cost2 = cost1 * (1 + aumG * 0.7);
    const cost3 = cost2 * (1 + aumG * 0.7);

    const npv = (yr1 - cost1) + (yr2 - cost2) / 1.08 + (yr3 - cost3) / 1.166;
    sims.push(npv);
  }
  setIterations(i);
  if (i >= N) {
    clearInterval(interval);
    setResults(sims.slice().sort((a, b) => a - b));
  }
}, 30);
```

};

const stats = useMemo(() => {
if (results.length === 0) return null;
const p10 = results[Math.floor(results.length * 0.1)];
const p50 = results[Math.floor(results.length * 0.5)];
const p90 = results[Math.floor(results.length * 0.9)];
return { p10, p50, p90, min: results[0], max: results[results.length - 1] };
}, [results]);

// Build histogram
const histogram = useMemo(() => {
if (results.length === 0) return [];
const buckets = 30;
const min = results[0], max = results[results.length - 1];
const bw = (max - min) / buckets;
const bins = Array(buckets).fill(0);
results.forEach(r => {
const idx = Math.min(buckets - 1, Math.floor((r - min) / bw));
bins[idx]++;
});
return bins.map((count, i) => ({ x: min + i * bw, count }));
}, [results]);

return (
<div>
<Heading
num=“05”
title=“Monte Carlo simulation”
subtitle=“3-year NPV distribution under AUM ramp · fee compression · L3 drift”
right={
<div style={{ display: ‘flex’, gap: 8 }}>
{[‘base’, ‘stress’, ‘upside’].map(s => (
<button key={s} onClick={() => setScenario(s)} style={{
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 10,
padding: ‘6px 12px’,
background: scenario === s ? THEME.navy : THEME.bgCard,
color: scenario === s ? THEME.bg : THEME.ink,
border: `1px solid ${THEME.rule}`,
cursor: ‘pointer’,
letterSpacing: ‘0.08em’,
textTransform: ‘uppercase’,
}}>{s}</button>
))}
<button onClick={runSim} style={{
fontFamily: ‘JetBrains Mono, monospace’,
fontSize: 10,
padding: ‘6px 14px’,
background: THEME.ochre,
color: THEME.bg,
border: ‘none’,
cursor: ‘pointer’,
letterSpacing: ‘0.08em’,
textTransform: ‘uppercase’,
fontWeight: 600,
}}>Run · 1,000</button>
</div>
}
/>
<div style={{ background: THEME.bgCard, border: `1px solid ${THEME.rule}`, padding: 24, minHeight: 280 }}>
{iterations > 0 && iterations < 1000 && (
<div style={{ marginBottom: 16 }}>
<div style={{ fontFamily: ‘JetBrains Mono, monospace’, fontSize: 10, color: THEME.inkSoft, letterSpacing: ‘0.08em’ }}>
Running… {iterations} / 1,000
</div>
<div style={{ height: 4, background: THEME.bgInset, marginTop: 6 }}>
<div style={{ height: ‘100%’, width: `${iterations / 10}%`, background: THEME.ochre, transition: ‘width 0.1s’ }} />
</div>
</div>
)}
{stats && (
<>
<div style={{
display: ‘grid’,
gridTemplateColumns: ‘repeat(3, 1fr)’,
gap: 24,
marginBottom: 20,
paddingBottom: 16,
borderBottom: `1px solid ${THEME.ruleSoft}`,
}}>
{[
{ label: ‘P10 (downside)’, value: stats.p10, color: THEME.oxblood },
{ label: ‘P50 (median)’, value: stats.p50, color: THEME.navy },
{ label: ‘P90 (upside)’, value: stats.p90, color: THEME.green },
].map(s => (
<div key={s.label}>
<div style={{ fontFamily: ‘JetBrains Mono, monospace’, fontSize: 9.5, letterSpacing: ‘0.1em’, color: THEME.inkMuted, textTransform: ‘uppercase’, marginBottom: 4 }}>{s.label}</div>
<div style={{ fontFamily: ‘Source Serif 4, serif’, fontSize: 26, fontWeight: 500, color: s.color, lineHeight: 1 }}>
${(s.value / 1000).toFixed(2)}M
</div>
</div>
))}
</div>

```
        <svg width="100%" viewBox="0 0 760 200">
          {histogram.map((b, i) => {
            const maxCount = Math.max(...histogram.map(h => h.count));
            const bw = 760 / histogram.length;
            const h = (b.count / maxCount) * 160;
            const isP10 = b.x <= stats.p10;
            const isP90 = b.x >= stats.p90;
            const color = isP10 ? THEME.oxblood : isP90 ? THEME.green : THEME.navy;
            return (
              <rect key={i} x={i * bw} y={180 - h} width={bw - 1} height={h} fill={color} opacity={0.7} />
            );
          })}
          {/* Median line */}
          {(() => {
            const min = histogram[0].x, max = histogram[histogram.length - 1].x;
            const x = ((stats.p50 - min) / (max - min)) * 760;
            return (
              <>
                <line x1={x} y1={10} x2={x} y2={180} stroke={THEME.ink} strokeWidth={1.5} strokeDasharray="3 3" />
                <text x={x + 6} y={20} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.ink} fontWeight={600}>P50</text>
              </>
            );
          })()}
          <line x1={0} y1={180} x2={760} y2={180} stroke={THEME.ink} strokeWidth={1} />
          <text x={0} y={196} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.inkMuted}>
            ${(histogram[0].x / 1000).toFixed(1)}M
          </text>
          <text x={760} y={196} fontFamily="JetBrains Mono, monospace" fontSize={10} fill={THEME.inkMuted} textAnchor="end">
            ${(histogram[histogram.length - 1].x / 1000).toFixed(1)}M
          </text>
        </svg>
      </>
    )}
    {!stats && iterations === 0 && (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        fontFamily: 'Source Serif 4, serif',
        fontStyle: 'italic',
        fontSize: 14,
        color: THEME.inkMuted,
      }}>
        Select a scenario and run the simulation to generate a 3-year NPV distribution.<br />
        P10 / P50 / P90 bands feed the credit-committee approval pack.
      </div>
    )}
  </div>
</div>
```

);
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
const [selectedId, setSelectedId] = useState(‘2026S-080892’);
const [multiplier, setMultiplier] = useState(1.0);
const [currentPrice, setCurrentPrice] = useState(4.2);

const deal = DEALS.find(d => d.id === selectedId);
const feeLines = FEE_LINES[selectedId] || [];
const scores = COMPLEXITY_SUBSCORES[selectedId];

return (
<div style={{
minHeight: ‘100vh’,
background: THEME.bg,
fontFamily: ‘Source Serif 4, Georgia, serif’,
color: THEME.ink,
}}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap'); body { margin: 0; } * { box-sizing: border-box; }`}</style>

```
  <DealSelector deals={DEALS} selectedId={selectedId} onSelect={setSelectedId} />
  <DealHeader deal={deal} />

  <div style={{
    padding: '32px',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 32,
    maxWidth: 1600,
    margin: '0 auto',
  }}>
    <div>
      <FeeLedger feeLines={feeLines} multiplier={multiplier} onMultiplierChange={setMultiplier} />
    </div>
    <div>
      <ComplexityPanel scores={scores} />
    </div>
    <div style={{ gridColumn: '1 / -1' }}>
      <PriceCurve deal={deal} currentPrice={currentPrice} onPriceChange={setCurrentPrice} />
    </div>
    <div>
      <ReferencePanel refs={REFERENCE_DEALS} currentBps={currentPrice} />
    </div>
    <div>
      <SimulationPanel basePrice={currentPrice} />
    </div>
  </div>

  <footer style={{
    marginTop: 60,
    padding: '24px 32px',
    background: THEME.navyDeep,
    color: THEME.ruleSoft,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    display: 'flex',
    justifyContent: 'space-between',
  }}>
    <span>BNY · Pricing Workbench v0.1 · Internal</span>
    <span>SR 11-7 governed · ContextSubstrate ADR-00001</span>
    <span>Last sync · {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
  </footer>
</div>
```

);
}
