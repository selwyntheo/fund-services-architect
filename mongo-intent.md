# Natural-Language Querying over Three Snapshot Report Collections

**Design Document**

|                       |                                                                   |
|-----------------------|-------------------------------------------------------------------|
|Status                 |Draft for review                                                   |
|Scope                  |NL → MongoDB query system over Reports A, B, C                     |
|Consumption context    |Feeds reporting / decisions (regulated, audited, deterministic)    |
|Versioning model       |Point-in-time snapshots (full state per as-of date)                |
|Collection relationship|Three independent report-shaped fact collections sharing dimensions|

-----

## 1. Core Principle

Two layers with a hard contract between them. The LLM’s only job is to translate natural language into a typed **QueryIntent** object. A deterministic compiler turns that QueryIntent into a MongoDB aggregation pipeline. The LLM never emits pipeline operators, never sees raw Mongo, and cannot inject `$where` or `$function`.

```
NL question
   |  (LLM, non-deterministic)
   v
QueryIntent (typed, validated JSON)   <-- AUDIT LINE
   |  (deterministic compiler, pure function)
   v
MongoDB aggregation pipeline
   |
   v
Execution (read-only, capped, timed)
   |
   v
Result + provenance envelope
```

The audit line is the decisive idea for a regulated context. The QueryIntent and the compiled pipeline are logged together. Because `compile(intent)` is deterministic, it always yields the same pipeline, so an auditor can reproduce any number exactly from the stored intent.

-----

## 2. Why the Snapshot Model Simplifies Temporal Logic

Point-in-time snapshots make temporal handling far simpler than a bitemporal model. Every query resolves to **exactly one `asOfDate` per collection**. There is no valid-time / transaction-time reconciliation and no `validFrom <= t < validTo` range logic. The rule is: pick the snapshot date, filter `asOfDate == resolvedDate`, done.

The only genuine temporal decisions are:

- **As-of resolution.** Phrases like “last quarter”, “as of March”, or “latest” must resolve to a concrete snapshot date that actually exists. A snapshot calendar (a small `_snapshot_dates` collection or a `distinct` query) lets the resolver snap a requested date to the nearest available snapshot per a documented rule (exact, or most-recent-on-or-before). The LLM never invents a date.
- **Cross-collection date alignment.** A question spanning Report B and Report C must resolve both to the same snapshot date, or it compares data from different periods. This is an explicit field with an explicit default (`align_across_reports: true`).
- **Comparisons across time** (“vs prior quarter”) become two resolved snapshot dates, two sub-queries, and one diff — handled as a first-class intent type, not free-form.

-----

## 3. The QueryIntent Schema

This is the contract. Everything the LLM can express must fit here; anything it cannot express is refused rather than guessed.

```json
{
  "intent_type": "aggregate | compare_over_time | breakdown | lookup",
  "report": "A | B | C",
  "as_of": {
    "mode": "latest | explicit | relative",
    "value": "2026-03-31 | last_quarter | null",
    "align_across_reports": true
  },
  "filters": [
    { "field": "region", "op": "eq", "value": "US" },
    { "field": "client_type", "op": "in", "value": ["DefinedBenefit"] }
  ],
  "bucket": {
    "field": "asset_value",
    "edges": [0, 1000000000, 5000000000],
    "edge_rule": "lower_inclusive_upper_exclusive"
  },
  "metrics": [
    { "name": "client_count", "agg": "count_distinct", "field": "client_id" },
    { "name": "asset_value", "agg": "sum", "field": "aum_usd" }
  ],
  "group_by": ["bucket", "client_type"],
  "compare": null
}
```

The asset-size bucketing is explicit and structured: `edges` plus an `edge_rule`. The reports are full of “<$1B / $1-5B / >$5B” style buckets, and the silent killer there is boundary handling — is exactly $1B in the first bucket or the second? Encoding `edge_rule` once, deterministically, eliminates the most common subtle error and makes it auditable. The LLM proposes edges from the NL; the compiler enforces them identically every time.

-----

## 4. The Semantic Layer (Per-Report Metadata)

Between the LLM and the compiler sits a hand-authored metadata file per report. This is the single source of truth and the artifact auditors actually review.

For each report it defines: the collection name; the `asOfDate` field name; logical fields and their physical paths; allowed aggregations per field; allowed filter fields with types and enums; units (USD vs thousands vs millions — the reports mix MM/BB notation, so unit normalization belongs here); and canonical bucket definitions where standardized.

```yaml
report_B:
  collection: ao_client_breakdown
  as_of_field: snapshot_date
  grain:
    one_doc_per: [client_id, snapshot_date]
  fields:
    client_id:   { path: clientId, type: id }
    region:      { path: domicile.country, type: enum, values: [US, UK] }
    client_type: { path: classification, type: enum,
                   values: [AssetOwner, PublicFund, TaftHartley,
                            EndowmentFoundation, Corporate, Other] }
    aum_usd:     { path: aum, type: money, unit: USD }
  metrics:
    client_count:     { agg: count_distinct, field: client_id }
    aggregate_assets: { agg: sum, field: aum_usd }
```

This is the DSL-as-contract discipline applied to query semantics. The LLM receives a *digest* of this metadata (field names, enums, units) as context so its intents stay inside the allowed surface. The compiler uses the full file to resolve logical to physical paths and to reject anything off-list.

-----

## 5. The Compiler (Deterministic Core)

A pure function, heavily unit-tested, with no model calls. Stages:

1. **Validate intent** against JSON Schema. Reject malformed input structurally.
1. **Resolve report** to load its semantic metadata.
1. **Resolve as-of** to concrete snapshot date(s) via the snapshot calendar and the documented snapping rule. Fail loudly if no snapshot exists.
1. **Resolve fields** from logical names to physical paths; reject any field absent from metadata. This is the injection / hallucination guard.
1. **Build `$match`** with the as-of filter first (index hit), then user filters with type and enum checks.
1. **Build bucketing** with `$bucket`, the explicit edges, and the edge rule; map bucket index to labels.
1. **Build `$group`**, mapping metrics to accumulators (`$sum`; `$addToSet` + `$size` for distinct counts, noting cost at scale).
1. **Normalize units** to a canonical unit per metadata so MM/BB never leak into a sum.
1. **Append guards**: `$limit`, plus `maxTimeMS` and read preference at execution.
1. **Emit** the pipeline plus a human-readable explanation of what it will compute.

### Cross-Collection Cases

Because Reports A, B, and C are independent fact collections sharing dimension keys, prefer **separate queries plus a deterministic merge step** over `$lookup`. `$lookup` is where LLM-style join logic goes wrong, and it is unnecessary when each report answers independently and joins occur on resolved keys (same as-of date, same region/client) in application code. Reserve `$lookup` for genuinely nested parent/child structures, which this data does not have.

-----

## 6. Execution and Provenance

Read-only connection (a separate Mongo user with the `read` role only), `maxTimeMS` cap, `$limit` ceiling, and a result-size guard. Every run emits a provenance envelope:

```json
{
  "question": "US defined benefit clients over $5B, last quarter",
  "query_intent": { },
  "resolved_as_of": "2026-03-31",
  "compiled_pipeline": [ ],
  "semantic_version": "report_B@v4",
  "row_count": 412,
  "executed_at": "2026-06-02T14:00:00Z",
  "executed_by": "user-id"
}
```

For a decision and reporting use case this envelope is the audit trail. Stored, it lets anyone reproduce a number from intent plus pipeline plus semantic-layer version.

-----

## 7. Handling Ambiguity

Three resolutions, never a silent guess:

- **Resolvable with a documented default** — proceed, but surface the assumption in the explanation (e.g. “interpreting ‘last quarter’ as snapshot 2026-03-31; buckets lower-inclusive”).
- **Genuinely ambiguous** (which client type? which date among several?) — return a clarification, not a number. A wrong number is worse than a follow-up question.
- **Out of surface** (a field or metric not in the semantic layer) — refuse and state what is available. The model must not improvise a field path.

-----

## 8. Build Plan

### Phase 0 — Semantic Layer First

Author the three YAML metadata files by hand. Highest-leverage work; forces field semantics, units, and bucket definitions to be nailed before any code. Build the snapshot-calendar query. No LLM yet.

### Phase 1 — Compiler and Execution, No LLM

Hand-write QueryIntent JSON, compile, execute, and validate against known-good numbers from existing reports. Golden-test bucket boundaries and distinct counts rigorously. When hand-written intents reliably reproduce existing report figures, the deterministic core is trustworthy.

### Phase 2 — Add the LLM (NL to Intent Only)

Provide the metadata digest, the QueryIntent schema, and few-shot examples. Constrain output to the schema via structured output / tool-call with the intent as the argument. The model can emit nothing but a QueryIntent. Evaluate on a question bank with expected intents.

### Phase 3 — Ambiguity, Comparisons, Provenance

Clarification flow, `compare_over_time`, full provenance logging, and the explanation surface.

### Phase 4 — Hardening

Read-only credentials, timeouts and limits, semantic-layer versioning, audit-log retention, and a “show me the pipeline before running” mode for sensitive queries.

-----

## 9. Honest Gaps and Risks

- **Distinct counts at snapshot scale.** `$addToSet` + `$size` can be memory-heavy. Large snapshots may require pre-aggregated counts in the snapshot or `allowDiskUse`. Test early.
- **The semantic layer is ongoing work.** Not a one-off. Every schema change to the three collections must update the YAML or the system silently drifts. Treat the YAML as versioned, reviewed artifacts.
- **NL to intent will never be 100%.** The Phase 2 eval set reveals true accuracy. Plan for the clarification path to carry meaningful traffic — a feature in a regulated flow, not a failure.
- **“Latest” is a moving target.** If snapshots land mid-conversation, “latest” can change between two questions. Resolve once per session or stamp the resolved date into provenance so results stay reproducible.

-----

## 10. Open Inputs Needed to Make This Concrete

To write the three semantic-layer YAML files and the compiler skeleton for this specific case:

1. Actual collection names for Reports A, B, and C.
1. The snapshot-date field name(s) and their format.
1. The canonical asset-size bucket definitions in Reports B and C, including boundary rules.
1. Whether asset values are stored in USD, millions, or billions per collection.
