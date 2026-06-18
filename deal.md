# Deal Matching Engine — Technical Specification (v2)

**Pattern:** Ingest → Normalize → Filter → Score → Re-rank
**Data source:** User-uploaded flat Excel workbook (`pricing_data_vector_ecrm_final.xlsx`), stored in MongoDB
**Stack:** Python ingestion, MongoDB storage + query, no graph database
**Status:** Draft v2 (supersedes v1)

-----

## 1. What changed from v1

v1 assumed Neo4j for filtering and a clean canonical `DealProfile`. Reality:

- No graph DB. Filtering and scoring run against MongoDB collections populated from a flat Excel upload.
- The source is one wide row per opportunity. **Service line is not a column — it is the set of service fee columns that are populated.** A blank service cell means *that service was not sold on this deal* (a true zero / absent service, not missing data).
- `n.a` / `N/A` in the bps columns is **semantically meaningful**: it means the deal is priced as a **flat fee**, not as a basis-points-on-AuC fee. It must not be coerced to null or to zero — it is a pricing-model flag.
- Three flat tabs are available and joinable: `Consolidated Data` (primary), `eCRM Data`, `Fee Schedule Data`.

-----

## 2. Source data model (from `Consolidated Data`)

One row per opportunity. Columns observed:

### 2.1 Identity & matching dimensions

|Column              |Meaning        |Example values                                                                                                                   |
|--------------------|---------------|---------------------------------------------------------------------------------------------------------------------------------|
|`Opportunity ID` (A)|unique deal key|`2024S-026770`, `2018OPPTY-373439`                                                                                               |
|`Region` (X)        |client region  |US, EMEA, Americas, IB-NY                                                                                                        |
|`Sector` (Y)        |client segment |Investment Managers, Asset Owners, Banks/Broker Dealers & Insurance (BBDI), Alternatives/Hedge Funds, Alternatives/Private Equity|
|`Tier` (Z)          |service tier   |Standard, Enhanced, Premium, N/A                                                                                                 |

### 2.2 Service fee columns (B–N) — populated = service sold

Accounting Services, AIS_Accounting, AIS_Depo, Benefits Disbursements, Custody, Depository, EMEA/APAC TA, Global Custody, GRS, Investment Accounting, Middle Office, Relationship Minimum, US TA.

**Rule:** a non-empty currency value ⇒ that service is in the deal’s service mix. The set of populated service columns is the deal’s `service_set`.

### 2.3 Scale & economics (N–W)

|Column                                          |Meaning                    |Notes                                     |
|------------------------------------------------|---------------------------|------------------------------------------|
|`Total Fees` (O)                                |total annual fee           |currency                                  |
|`Assets` (P)                                    |total assets               |currency, log-scale                       |
|`NIR` (Q)                                       |net interest revenue       |often blank                               |
|`Year 1 Bps`, `Year 2 Bps`, `Year 3 Bps` (R/S/T)|basis-point pricing by year|numeric **or** `n.a`/`N/A` = flat-fee deal|
|`AuA` (U)                                       |assets under administration|currency, log-scale                       |
|`AuA – Middle Office` (V)                       |AuA middle-office slice    |currency                                  |
|`AuC` (W)                                       |assets under custody       |currency, log-scale                       |


> Confirm: any columns to the right of `Tier` (Z) — there is at least one more column (`A...`) cut off in the source image. Add to §2 if present.

### 2.4 Companion tabs (flat, joinable on `Opportunity ID`)

- **`eCRM Data`** — CRM attributes (assumed: client name, prospect vs existing, deal stage, close date, owner). Use for additional filters (e.g. won/lost outcome, client identity) and as the **label source** for the learned re-ranker.
- **`Fee Schedule Data`** — per-service fee schedule detail (assumed: opportunity ID, service, fee basis, rate, minimum). Use to enrich the flat-fee-vs-bps determination and to expose schedule-level comparables.

> These two tabs’ exact columns were not visible. Confirm headers; the join key is assumed to be `Opportunity ID`.

-----

## 3. Architecture

```
  Excel upload (.xlsx, 3 tabs)
        │
        ▼
  ┌─────────────────────────────────────────┐
  │ STAGE 0: INGEST + NORMALIZE (Python)     │
  │  parse 3 sheets → clean → derive fields  │
  │  → write MongoDB collections             │
  └───────────────┬─────────────────────────┘
                  ▼
  ┌─────────────────────────────────────────┐
  │ MongoDB: deals / ecrm / fee_schedule     │
  └───────────────┬─────────────────────────┘
                  ▼
  ┌─────────────────────────────────────────┐
  │ STAGE 1: FILTER (Mongo query)            │
  │  hard predicates → candidate set         │
  └───────────────┬─────────────────────────┘
                  ▼
  ┌─────────────────────────────────────────┐
  │ STAGE 2: SCORE (weighted Gower, Python)  │
  │  per-attribute distance + breakdown      │
  └───────────────┬─────────────────────────┘
                  ▼
  ┌─────────────────────────────────────────┐
  │ STAGE 3: RE-RANK (optional)              │
  │  learned ranker on eCRM outcomes         │
  └───────────────┬─────────────────────────┘
                  ▼
         ranked matches + explanations
```

-----

## 4. Stage 0 — Ingest & Normalize

This stage is where v1 was thin and where this dataset’s messiness lives. It must be explicit and tested.

### 4.1 Parse

- Read all three sheets with pandas, `dtype=str` initially (do not let pandas infer — it will mangle `n.a`, currency text, and IDs like `2025S-0770328`).
- Strip the workbook’s currency formatting: remove `$`, commas, whitespace; treat `-` (the accounting dash) and empty string as **absent**.

### 4.2 Field derivation per deal

**`service_set`** — for each of the 13 service columns, the service is present iff the cleaned cell is a real number > 0. Emit:

```
service_set: ["Custody", "Investment Accounting"]   // populated columns
service_fees: { "Custody": 25000.00, "Investment Accounting": 212500.00 }
```

A blank or `-` ⇒ service absent (true zero, by your rule). Do not impute.

**`pricing_model`** — derived from the bps columns:

```
if Year1/2/3 Bps are numeric  → pricing_model = "bps",  bps = {y1, y2, y3}
if Year1/2/3 Bps are n.a/N/A  → pricing_model = "flat", bps = null
```

This flag is a **hard filter dimension** (§6) — flat-fee and bps deals are not directly comparable on price.

**Numeric coercion** — `Total Fees`, `Assets`, `AuA`, `AuA-MO`, `AuC`, `NIR`: clean to `Decimal128`. Empty ⇒ null (genuinely unknown), distinct from service `-` (known zero).

**Tier normalization** — map to ordinal rank for distance, preserve original for display:

```
Standard → 1, Enhanced → 2, Premium → 3, "N/A" → null (excluded from tier distance)
```

**Categoricals** — trim/canonicalize `Region` and `Sector` (e.g. unify “BBDI” vs the long form; “IB-NY” vs “US”).

### 4.3 MongoDB documents

`deals` collection, one doc per opportunity:

```json
{
  "_id": "2024S-026770",
  "region": "US",
  "sector": "Asset Owners",
  "tier": "Enhanced",
  "tier_rank": 2,
  "service_set": ["Custody", "Investment Accounting"],
  "service_fees": { "Custody": 25000.0, "Investment Accounting": 212500.0 },
  "pricing_model": "bps",
  "bps": { "y1": 0.896990741, "y2": 0.896990741, "y3": 0.896990741 },
  "total_fees": {"$numberDecimal": "968750.00"},
  "assets":     {"$numberDecimal": "10800000000.00"},
  "aua":        {"$numberDecimal": "10800000000.00"},
  "auc":        null,
  "nir":        null,
  "source_row": 9,
  "ingested_at": "2026-06-18T...",
  "upload_id": "up_2026_06_18_a"
}
```

`ecrm` and `fee_schedule` collections keyed/indexed on `opportunity_id` for join-on-read.

### 4.4 Upload discipline

- Each upload tagged with `upload_id`; ingestion is insert-only (append a new version, don’t mutate prior rows) — keeps the bitemporal discipline you already use elsewhere and makes match results reproducible against the upload they ran on.
- Validation report after each ingest: row count, # flat vs bps, # rows with unparseable cells, distinct regions/sectors/tiers. Fail loudly on schema drift (new/renamed columns).

### 4.5 Indexes

```
deals: { region: 1, sector: 1, tier_rank: 1 }
deals: { pricing_model: 1 }
deals: { service_set: 1 }          // multikey, supports $in on services
deals: { upload_id: 1 }
```

-----

## 5. Match input

A new prospective deal is supplied as the same normalized shape (or as a raw row run through Stage 0). Matching dimensions:

|Dimension    |Source       |Distance                |Default weight|
|-------------|-------------|------------------------|--------------|
|`service_set`|populated B–N|Jaccard                 |0.25          |
|`sector`     |Y            |exact / taxonomy        |0.15          |
|`region`     |X            |exact / taxonomy        |0.10          |
|`tier_rank`  |Z            |ordinal (N/A excluded)  |0.10          |
|`auc`        |W            |log-scaled              |0.10          |
|`aua`        |U            |log-scaled              |0.10          |
|`assets`     |P            |log-scaled              |0.05          |
|`total_fees` |O            |log-scaled              |0.05          |
|`blended_bps`|mean(R,S,T)  |z-score (bps deals only)|0.10          |

Weights sum to 1.0. Service mix is weighted highest because it most defines deal comparability. Tune against a golden set (§9).

-----

## 6. Stage 1 — Filter (MongoDB)

Hard predicates eliminate non-comparables cheaply.

- `pricing_model` **must** match (flat vs bps) — your rule: a flat-fee deal is not comparable to a bps deal on price.
- `service_set` must intersect the target’s (`$in` on at least one shared service).
- `sector` must match exactly.
- `tier_rank` within ±1 (skip if either tier is N/A).
- `region` within compatible family (allow-list; e.g. {US, Americas, IB-NY} compatible; EMEA separate by default).
- Restrict to the chosen `upload_id`.

```python
candidate_query = {
  "upload_id": upload_id,
  "pricing_model": target["pricing_model"],
  "service_set": {"$in": target["service_set"]},
  "sector": target["sector"],
  "region": {"$in": compatible_regions[target["region"]]},
  "tier_rank": {"$gte": target["tier_rank"] - 1,
                "$lte": target["tier_rank"] + 1},
  "_id": {"$ne": target["_id"]},
}
candidates = db.deals.find(candidate_query)
```

If the set is too small, relax in a defined order (drop region family → tier ±2 → drop tier) and record which relaxations were applied so the explanation reflects them.

-----

## 7. Stage 2 — Score

```
similarity(t, c) = 1 - Σ_i ( w_i * d_i(t, c) )
```

each `d_i ∈ [0,1]`, weights renormalized over attributes present on both sides.

Distance functions:

- **`service_set`** — Jaccard distance `1 - |A∩B|/|A∪B|`.
- **`sector`, `region`** — taxonomy distance: exact = 0; same parent family = 0.3; unrelated = 1.0. Maintain a small lookup table (e.g. the two Alternatives sub-sectors share a parent).
- **`tier_rank`** — `|rank_t - rank_c| / 2` (range Standard..Premium). Excluded if either is N/A.
- **`auc`, `aua`, `assets`, `total_fees`** — log-scaled: `|log10(x_t+ε) - log10(x_c+ε)| / log_range`, where `log_range` is computed per column over the current upload. Excluded pairwise if either side is null.
- **`blended_bps`** — z-score distance, **only when both deals are bps-priced** (the §6 filter already guarantees this within a candidate set).

Missing handling: exclude the attribute for that pair and renormalize remaining weights; record excluded attributes in the breakdown.

Output per candidate: `similarity`, full per-attribute `breakdown` (weight, distance, contribution), `attributes_scored`, `attributes_excluded`, `filters_relaxed`. Sort desc, take top-N.

-----

## 8. Stage 3 — Re-rank (optional, once labels exist)

Use the **`eCRM Data`** tab as the label source — deal stage / won-lost / close outcome joined on `Opportunity ID`.

- Model: LightGBM `LambdaRank` (or XGBoost `rank:pairwise`).
- Features: the Stage-2 per-attribute distances.
- Label: relevance grade from outcome (won+healthy = 3, won = 2, lost = 1, no-bid = 0), grouped by query deal.
- Explainability: SHAP per match preserves the contribution story.
- Fallback: Stage-2 weighted score when the model is unavailable or for cold-start sectors.

Semantic re-rank (embeddings) is **not needed here** — there is no free-text narrative column in this dataset. Skip it unless eCRM carries notes worth embedding.

-----

## 9. Testing

- **Stage 0 normalization tests** (highest priority): `n.a`/`N/A` → flat-fee flag, not null; `-`/blank service → absent; currency text → Decimal; ID strings preserved; null (unknown) vs zero (not sold) kept distinct.
- **Golden set**: SME-curated (target → expected top-k); regression-gate on NDCG@10.
- **Determinism**: same input + upload_id + config ⇒ identical ranking.
- **Filter correctness**: flat vs bps never cross-match; service intersection enforced.
- **Distance bounds**: each `d_i ∈ [0,1]` at boundaries.
- **Weight-sum validation** at config load.
- **Re-ingest idempotency**: same workbook ⇒ same normalized docs.

-----

## 10. Build sequence

1. Stage 0 ingestion: parse 3 tabs, normalization rules, derive `service_set` / `pricing_model`, write Mongo, validation report.
1. Indexes + upload versioning.
1. Stage 1 Mongo filter + relaxation logic.
1. Stage 2 scorer + breakdown emission.
1. API + config (weights, taxonomies, region allow-list) with versioning.
1. Golden-set harness.
1. (Later) Stage 3 learned ranker on eCRM outcomes.

Ship 1–6 first. Stage 3 is an upgrade that needs accumulated labels.

-----

## Open items to confirm

1. Column(s) to the right of `Tier` (Z) cut off in the source image.
1. Exact headers of `eCRM Data` and `Fee Schedule Data`, and the join key (assumed `Opportunity ID`).
1. Whether `Relationship Minimum` should count as a “service” in `service_set` or be treated as a separate pricing-floor attribute (leaning: separate attribute, not a service).
1. Region compatibility families (which of US / Americas / IB-NY / EMEA are mutually comparable).
