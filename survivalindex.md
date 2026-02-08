# SurvivalIndex SBOM & License Intelligence MCP Server

## Extension Spec: `survivalindex-guardian`

> *“Because your AI coding agent shouldn’t be the one introducing GPL into your proprietary codebase at 2 AM.”*

-----

## 1. Problem Statement

AI coding agents today have three blind spots when recommending open-source dependencies:

|Blind Spot                  |What Happens                                                   |Real Cost                                                   |
|----------------------------|---------------------------------------------------------------|------------------------------------------------------------|
|**No Systematic Evaluation**|Agent picks the first library it “remembers” from training data|You end up with an unmaintained lib that was popular in 2022|
|**License Blindness**       |Agent suggests a GPL-3.0 lib inside your Apache-2.0 project    |Legal team discovers it 6 months later during due diligence |
|**No SBOM Awareness**       |Agent keeps adding overlapping dependencies                    |47 transitive deps, 3 CVEs, 2 abandoned sub-packages        |

SurvivalIndex already solves “which software will still exist in 10 years.” This extension answers the **next three questions**:

1. **Is it safe to use?** (license compatibility + vulnerability scan)
1. **Is it healthy?** (maintenance signals, bus factor, community vitality)
1. **What does it bring along?** (transitive dependency graph, SBOM impact)

-----

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   AI Coding Agent                        │
│              (Claude Code / Cursor / Copilot)            │
└────────────────────┬────────────────────────────────────┘
                     │ MCP Protocol
                     ▼
┌─────────────────────────────────────────────────────────┐
│            survivalindex-guardian MCP Server              │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │  Survival    │ │  License     │ │  SBOM            │ │
│  │  Index Core  │ │  Engine      │ │  Manager         │ │
│  │  (existing)  │ │  (new)       │ │  (new)           │ │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │
│         │                │                   │           │
│  ┌──────┴────────────────┴───────────────────┴─────────┐ │
│  │              Health Evaluator Engine                  │ │
│  │  (GitHub API · Package Registry · OSV · SPDX)        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Project SBOM Store (per-project)           │ │
│  │  ~/.survivalindex/sbom/<project-hash>.json            │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        ▼            ▼                ▼
   ┌─────────┐ ┌──────────┐  ┌──────────────┐
   │ GitHub  │ │ Package  │  │ Vulnerability │
   │ API     │ │ Registry │  │ Databases     │
   │         │ │ APIs     │  │               │
   │ - stars │ │ - npm    │  │ - OSV.dev     │
   │ - commits│ │ - Maven │  │ - NVD         │
   │ - issues│ │ - PyPI   │  │ - GitHub      │
   │ - contribs│ │ - crates│  │   Advisory    │
   └─────────┘ └──────────┘  └──────────────┘
```

-----

## 3. New MCP Tools

### 3.1 `survivalindex_evaluate` — Systematic Evaluation

**Purpose:** Deep health check of any open-source package before adding it.

```typescript
// Input
{
  package: "io.debezium:debezium-connector-postgres",  // or "express", "@tanstack/query"
  ecosystem: "maven" | "npm" | "pypi" | "crates" | "go",
  context?: {
    projectLicense: "Apache-2.0",  // your project's license
    existingDeps: string[],        // already in your project
    useCase: string                // why you need this
  }
}

// Output: Evaluation Report
{
  package: "io.debezium:debezium-connector-postgres",
  survivalScore: 8.7,
  verdict: "RECOMMENDED" | "CAUTION" | "AVOID" | "BLOCKED",
  
  health: {
    overall: 8.7,
    maintenance: {
      score: 9.1,
      lastCommit: "2026-02-01",
      releaseFrequency: "monthly",
      openIssueResponseTime: "2.3 days",
      activeMaintainers: 14,
      busFactor: 8  // contributors with >5% of commits
    },
    community: {
      score: 8.5,
      stars: 11200,
      forks: 2100,
      contributors: 340,
      stackOverflowQuestions: 4200,
      trend: "stable"  // growing | stable | declining
    },
    maturity: {
      score: 8.4,
      age: "8 years",
      majorVersion: 2,
      breakingChangesLastYear: 1,
      documentationQuality: "excellent",
      cncfStatus: "incubating" | null
    }
  },
  
  license: {
    spdxId: "Apache-2.0",
    compatible: true,
    copyleft: false,
    notices: [],
    transitiveLicenseRisks: [
      {
        dependency: "com.google.protobuf:protobuf-java",
        license: "BSD-3-Clause",
        compatible: true
      }
    ]
  },
  
  security: {
    knownVulnerabilities: 0,
    lastAudit: "2026-01-15",
    supplyChainScore: 8.9,  // OpenSSF Scorecard
    sigstoreVerified: true,
    advisories: []
  },
  
  dependencies: {
    direct: 12,
    transitive: 47,
    totalSizeImpact: "4.2 MB",
    overlapWithProject: ["com.fasterxml.jackson-core", "io.netty"],
    abandonedTransitive: [],
    heaviest: [
      { name: "io.netty:netty-all", size: "3.1 MB", shared: true }
    ]
  },
  
  alternatives: [
    {
      name: "Maxwell",
      survivalScore: 7.2,
      reason: "Simpler but MySQL-only, less active maintenance"
    }
  ],
  
  recommendation: "Debezium is a battle-tested CDC platform with strong community backing and active maintenance by Red Hat. License is fully compatible with your Apache-2.0 project. The transitive dependency footprint is moderate - netty is already in your project so actual incremental size is ~1.1 MB. No known vulnerabilities. RECOMMENDED for production use."
}
```

### 3.2 `survivalindex_license_check` — License Compatibility Matrix

**Purpose:** Check if a dependency (and its full tree) is compatible with your project license.

```typescript
// Input
{
  projectLicense: "Apache-2.0",
  packages: [
    { name: "express", ecosystem: "npm" },
    { name: "react", ecosystem: "npm" },
    { name: "chart.js", ecosystem: "npm" }
  ]
}

// Output
{
  projectLicense: "Apache-2.0",
  compatible: true,
  summary: "All 3 packages are compatible with Apache-2.0",
  
  results: [
    {
      package: "express",
      license: "MIT",
      compatible: true,
      copyleft: false,
      obligations: ["Include MIT notice in distribution"],
      transitiveIssues: []
    },
    {
      package: "react",
      license: "MIT",
      compatible: true,
      copyleft: false,
      obligations: ["Include MIT notice in distribution"],
      transitiveIssues: []
    },
    {
      package: "chart.js",
      license: "MIT",
      compatible: true,
      copyleft: false,
      obligations: ["Include MIT notice in distribution"],
      transitiveIssues: []
    }
  ],
  
  licenseMatrix: {
    // Quick reference for the agent
    "MIT": { count: 3, compatible: true },
  },
  
  notices: "No license conflicts detected. All dependencies use permissive licenses."
}
```

**License Compatibility Rules Engine:**

```
PERMISSIVE (always compatible with each other):
  MIT, BSD-2-Clause, BSD-3-Clause, ISC, Apache-2.0, Unlicense, CC0-1.0

WEAK COPYLEFT (file-level, compatible if not modified):
  LGPL-2.1, LGPL-3.0, MPL-2.0, EPL-2.0

STRONG COPYLEFT (project must adopt same license):
  GPL-2.0, GPL-3.0, AGPL-3.0

COMPATIBILITY MATRIX:
  Apache-2.0 project + MIT dep       → ✅ OK
  Apache-2.0 project + GPL-3.0 dep   → ❌ BLOCKED (must relicense to GPL-3.0)
  GPL-3.0 project + MIT dep          → ✅ OK
  MIT project + LGPL-3.0 dep         → ⚠️  CAUTION (OK if dynamically linked)
  Apache-2.0 project + AGPL-3.0 dep  → ❌ BLOCKED (network copyleft)
  Any project + SSPL dep             → ⚠️  CAUTION (not OSI-approved, SaaS restriction)
  Any project + BSL dep              → ⚠️  CAUTION (time-delayed open source)
```

### 3.3 `survivalindex_sbom` — Software Bill of Materials Manager

**Purpose:** Maintain a living SBOM for the project, track changes, flag risks.

```typescript
// Tool: survivalindex_sbom_init
// Scans project files and creates initial SBOM
{
  action: "init",
  projectRoot: "/path/to/project",  // or CWD
  projectLicense: "Apache-2.0",
  output: "cyclonedx" | "spdx"  // standard SBOM format
}

// Tool: survivalindex_sbom_add
// Evaluate + add a dependency to the SBOM
{
  action: "add",
  package: "lodash",
  ecosystem: "npm",
  version: "4.17.21",
  justification: "Utility functions for data transformation"
}

// Tool: survivalindex_sbom_audit
// Full audit of current SBOM
{
  action: "audit"
}

// Audit Output
{
  totalDependencies: {
    direct: 24,
    transitive: 187,
    total: 211
  },
  
  licenses: {
    distribution: {
      "MIT": 142,
      "Apache-2.0": 38,
      "BSD-3-Clause": 19,
      "ISC": 8,
      "LGPL-2.1": 3,
      "GPL-3.0": 1  // ⚠️ 
    },
    issues: [
      {
        severity: "critical",
        package: "some-obscure-lib@2.1.0",
        license: "GPL-3.0",
        path: "express → body-parser → some-obscure-lib",
        message: "GPL-3.0 dependency found in Apache-2.0 project. This requires relicensing your entire project under GPL-3.0 or removing this dependency."
      }
    ]
  },
  
  security: {
    vulnerabilities: {
      critical: 0,
      high: 1,
      medium: 3,
      low: 7
    },
    findings: [
      {
        severity: "high",
        package: "nth-check@1.0.2",
        cve: "CVE-2024-XXXXX",
        fixAvailable: "2.0.1",
        path: "css-select → nth-check"
      }
    ]
  },
  
  health: {
    abandoned: [
      {
        package: "request@2.88.2",
        lastPublish: "2020-02-11",
        status: "deprecated",
        alternative: "node-fetch or undici"
      }
    ],
    lowMaintenance: [
      {
        package: "colors@1.4.0",
        reason: "Known supply chain incident (Jan 2022), author sabotaged package",
        alternative: "chalk or picocolors"
      }
    ]
  },
  
  duplicates: [
    {
      name: "lodash",
      versions: ["4.17.21", "4.17.15"],
      resolution: "Deduplicate to 4.17.21"
    }
  ],
  
  sizeAnalysis: {
    totalSize: "48.2 MB",
    heaviest: [
      { name: "typescript", size: "12.1 MB", isDev: true },
      { name: "webpack", size: "8.3 MB", isDev: true },
      { name: "moment", size: "4.2 MB", isDev: false, alternative: "dayjs (2KB)" }
    ]
  }
}
```

### 3.4 `survivalindex_recommend` — Enhanced with Guardian Intelligence

**Purpose:** Upgrade the existing `should_build_or_reuse` tool with license/SBOM awareness.

```typescript
// Input (enhanced)
{
  intent: "I need a PDF generation library for Java",
  projectLicense: "Apache-2.0",
  existingDeps: ["spring-boot", "jackson", "netty"],
  constraints: {
    maxTransitiveDeps: 50,
    blockedLicenses: ["GPL-3.0", "AGPL-3.0"],
    preferredLicenses: ["Apache-2.0", "MIT"],
    maxSizeImpact: "10 MB"
  }
}

// Output
{
  recommendations: [
    {
      rank: 1,
      name: "Apache PDFBox",
      package: "org.apache.pdfbox:pdfbox",
      survivalScore: 9.1,
      license: "Apache-2.0",
      licenseCompatible: true,
      transitiveDeps: 5,
      sizeImpact: "6.2 MB",
      verdict: "RECOMMENDED",
      reason: "Apache Foundation backed, same license as your project, minimal dependency footprint, 15+ years of battle-testing."
    },
    {
      rank: 2,
      name: "iText",
      package: "com.itextpdf:itext7-core",
      survivalScore: 8.4,
      license: "AGPL-3.0",
      licenseCompatible: false,
      verdict: "BLOCKED",
      reason: "Strong copyleft license (AGPL-3.0) is incompatible with your Apache-2.0 project. Commercial license available but costly."
    },
    {
      rank: 3,
      name: "OpenPDF",
      package: "com.github.librepdf:openpdf",
      survivalScore: 7.6,
      license: "LGPL-2.1 + MPL-2.0",
      licenseCompatible: true,
      transitiveDeps: 3,
      sizeImpact: "3.8 MB",
      verdict: "CAUTION",
      reason: "Fork of iText 4. Smaller and compatible via weak copyleft, but smaller community (bus factor: 3). Good if you need a lighter option."
    }
  ],
  
  sbomImpact: {
    beforeDeps: 187,
    afterDeps: 192,  // with PDFBox
    newTransitive: ["commons-io", "commons-logging", "fontbox", "pdfbox", "pdfbox-tools"],
    alreadyPresent: [],
    newLicenses: {}  // all Apache-2.0, already in project
  }
}
```

-----

## 4. Data Sources & API Integration

### 4.1 Package Registry APIs

|Ecosystem|Registry API              |Data Retrieved                            |
|---------|--------------------------|------------------------------------------|
|npm      |`registry.npmjs.org`      |versions, dependencies, license, downloads|
|Maven    |`search.maven.org`        |groupId, artifacts, versions, license     |
|PyPI     |`pypi.org/pypi/{pkg}/json`|versions, requires_dist, license          |
|Crates   |`crates.io/api/v1/crates` |versions, deps, license, downloads        |
|Go       |`proxy.golang.org`        |module info, versions                     |

### 4.2 GitHub API (for health metrics)

```
GET /repos/{owner}/{repo}
  → stars, forks, open_issues, created_at, pushed_at, license

GET /repos/{owner}/{repo}/stats/contributors
  → contributor list, commit counts (bus factor calculation)

GET /repos/{owner}/{repo}/stats/commit_activity
  → weekly commit frequency (maintenance signal)

GET /repos/{owner}/{repo}/releases
  → release frequency, latest release date

GET /repos/{owner}/{repo}/community/profile
  → code of conduct, contributing guide, issue templates
```

### 4.3 Vulnerability Databases

|Source         |API                                       |Coverage                          |
|---------------|------------------------------------------|----------------------------------|
|OSV.dev        |`api.osv.dev/v1/query`                    |Cross-ecosystem, Google-maintained|
|GitHub Advisory|`api.github.com/advisories`               |npm, pip, maven, go, rust         |
|NVD            |`services.nvd.nist.gov/rest/json/cves/2.0`|CVE database                      |

### 4.4 License Database

|Source                                             |Purpose                           |
|---------------------------------------------------|----------------------------------|
|SPDX License List                                  |Canonical license identifiers     |
|`license-checker` / `license-compatibility-checker`|npm transitive license scanning   |
|`licensee` (GitHub)                                |License detection from repo files |
|ClearlyDefined                                     |Curated license + attribution data|

### 4.5 OpenSSF Scorecard

```
GET https://api.securityscorecards.dev/projects/github.com/{owner}/{repo}
  → Supply chain security score (0-10)
  → Checks: branch protection, CI/CD, fuzzing, SAST, signed releases, etc.
```

-----

## 5. SBOM Storage Format

Using CycloneDX 1.5 as the standard, stored locally:

```
~/.survivalindex/
├── config.json              # Global config (API keys, defaults)
├── cache/                   # Cached API responses (TTL: 24h)
│   ├── github/
│   ├── npm/
│   ├── maven/
│   └── osv/
└── projects/
    └── <project-hash>/
        ├── sbom.cdx.json    # CycloneDX SBOM
        ├── audit-history/   # Historical audit snapshots
        │   ├── 2026-02-08.json
        │   └── 2026-02-01.json
        └── decisions.json   # Why each dep was included
```

### `decisions.json` — Dependency Decision Log

```json
{
  "decisions": [
    {
      "package": "org.apache.pdfbox:pdfbox",
      "version": "3.0.1",
      "addedAt": "2026-02-08T10:30:00Z",
      "addedBy": "claude-code",
      "justification": "PDF generation for quarterly fund reports",
      "survivalScore": 9.1,
      "licenseVerified": true,
      "securityCleared": true,
      "alternatives_considered": ["iText (AGPL blocked)", "OpenPDF (lower community)"]
    }
  ]
}
```

This decision log means **auditors and compliance teams** can see exactly why every dependency was chosen — critical for financial services environments like BNY.

-----

## 6. Implementation Plan

### Phase 1: License Engine (Week 1-2)

```
survivalindex-guardian/
├── src/
│   ├── server.ts                  # MCP server entry
│   ├── tools/
│   │   ├── evaluate.ts            # survivalindex_evaluate
│   │   ├── license-check.ts       # survivalindex_license_check
│   │   ├── sbom.ts                # survivalindex_sbom (init/add/audit)
│   │   └── recommend.ts           # enhanced recommend
│   ├── engines/
│   │   ├── license-engine.ts      # SPDX compatibility matrix
│   │   ├── health-engine.ts       # GitHub + registry health scoring
│   │   ├── security-engine.ts     # OSV + NVD + Scorecard
│   │   └── dependency-engine.ts   # Transitive dep resolution
│   ├── sbom/
│   │   ├── store.ts               # Local SBOM persistence
│   │   ├── cyclonedx.ts           # CycloneDX format handling
│   │   └── scanner.ts             # Project file scanner (pom.xml, package.json, etc.)
│   ├── registries/
│   │   ├── npm.ts
│   │   ├── maven.ts
│   │   ├── pypi.ts
│   │   └── crates.ts
│   └── utils/
│       ├── cache.ts               # API response caching
│       └── rate-limiter.ts        # GitHub API rate limiting
├── data/
│   ├── spdx-licenses.json         # SPDX license list
│   ├── compatibility-matrix.json  # License compatibility rules
│   └── survival-index.json        # Core survival ratings
├── package.json
├── tsconfig.json
└── README.md
```

### Phase 2: Health Evaluator (Week 3)

- GitHub API integration for maintenance signals
- Package registry integration for download trends
- Bus factor calculation
- Community vitality scoring

### Phase 3: SBOM Manager (Week 4)

- Project scanner (detect `pom.xml`, `package.json`, `build.gradle`, `requirements.txt`, `Cargo.toml`, `go.mod`)
- CycloneDX SBOM generation
- Transitive dependency resolution per ecosystem
- Decision log tracking

### Phase 4: Security & Vulnerability (Week 5)

- OSV.dev integration
- OpenSSF Scorecard integration
- Supply chain risk scoring
- CVE alerting on SBOM contents

### Phase 5: Agent Integration & Polish (Week 6)

- MCP resource for SBOM (agents can read project SBOM as context)
- MCP prompt templates (pre-built prompts for common workflows)
- CI/CD integration guide (run SBOM audit in GitHub Actions)
- Documentation + npm publish

-----

## 7. MCP Resources (Read Context)

Beyond tools, expose the project’s SBOM as an MCP **resource** so agents have it as background context:

```typescript
server.registerResource(
  "sbom://current",
  {
    title: "Current Project SBOM",
    description: "The project's current Software Bill of Materials with license and health data",
    mimeType: "application/json"
  },
  async () => {
    const sbom = await loadProjectSBOM();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(sbom, null, 2)
      }]
    };
  }
);
```

This means when an agent is about to suggest `npm install something`, it already knows:

- What’s in your project
- What licenses are in play
- What’s already flagged as risky

-----

## 8. MCP Prompts (Pre-built Workflows)

```typescript
server.registerPrompt(
  "dependency-review",
  {
    title: "Dependency Review",
    description: "Comprehensive review before adding a new dependency"
  },
  async ({ package, ecosystem }) => ({
    messages: [{
      role: "user",
      content: `Before adding ${package} (${ecosystem}) to this project:
1. Run survivalindex_evaluate to check health, license, and security
2. Run survivalindex_license_check against our project license
3. Run survivalindex_sbom with action "add" to see SBOM impact
4. Provide a recommendation with alternatives if there are concerns
5. If approved, update the SBOM decision log with justification`
    }]
  })
);

server.registerPrompt(
  "sbom-audit",
  {
    title: "SBOM Audit",
    description: "Full audit of project dependencies"
  },
  async () => ({
    messages: [{
      role: "user",
      content: `Run a complete SBOM audit:
1. Scan the project for all dependency files
2. Resolve full transitive dependency tree
3. Check all licenses for compatibility
4. Scan for known vulnerabilities
5. Identify abandoned or deprecated packages
6. Flag duplicate dependencies
7. Report size impact analysis
8. Generate a summary with action items`
    }]
  })
);
```

-----

## 9. Agent Workflow Examples

### Workflow 1: Agent Wants to Add a Dependency

```
Agent thinking: "User needs PDF generation, let me suggest iText..."

→ Agent calls survivalindex_evaluate({ package: "com.itextpdf:itext7-core", ecosystem: "maven", context: { projectLicense: "Apache-2.0" }})

→ Response: BLOCKED — AGPL-3.0 incompatible with Apache-2.0

→ Agent calls survivalindex_recommend({ intent: "PDF generation for Java", projectLicense: "Apache-2.0" })

→ Response: Recommends Apache PDFBox (Apache-2.0, survival score 9.1)

→ Agent calls survivalindex_sbom({ action: "add", package: "org.apache.pdfbox:pdfbox", version: "3.0.1", justification: "PDF generation for quarterly fund reports" })

→ SBOM updated, decision logged

→ Agent: "I'm recommending Apache PDFBox instead of iText. iText uses AGPL-3.0 which would require relicensing your entire project..."
```

### Workflow 2: Regular SBOM Audit in CI

```yaml
# .github/workflows/sbom-audit.yml
name: SBOM Audit
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday 9 AM
  pull_request:
    paths:
      - 'pom.xml'
      - 'package.json'
      - 'requirements.txt'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: survivalindex/guardian-action@v1
        with:
          project-license: Apache-2.0
          blocked-licenses: GPL-3.0,AGPL-3.0,SSPL-1.0
          fail-on: critical-vulnerability,license-violation
```

### Workflow 3: Fund Administration Context (BNY)

```
Developer: "I need a library to parse SWIFT MT messages in Java"

Agent reads sbom://current resource → sees project is Apache-2.0 with Spring Boot stack

Agent calls survivalindex_recommend({
  intent: "SWIFT MT message parsing Java",
  projectLicense: "Apache-2.0",
  existingDeps: ["spring-boot", "jackson"],
  constraints: {
    blockedLicenses: ["GPL-3.0", "AGPL-3.0"],  // enterprise compliance
    preferredLicenses: ["Apache-2.0", "MIT"]
  }
})

→ Evaluates prowide-core (Apache-2.0), wife (LGPL), etc.
→ Recommends prowide-core with full license/security/SBOM analysis
→ Logs decision with justification for audit trail
```

-----

## 10. Competitive Positioning

|Capability               |Snyk   |Dependabot|Socket.dev|FOSSA  |SurvivalIndex Guardian|
|-------------------------|-------|----------|----------|-------|----------------------|
|Vulnerability Scanning   |✅      |✅         |✅         |✅      |✅                     |
|License Compliance       |✅      |❌         |❌         |✅      |✅                     |
|SBOM Generation          |✅      |❌         |❌         |✅      |✅                     |
|Health/Survival Scoring  |❌      |❌         |Partial   |❌      |✅                     |
|AI Agent Native (MCP)    |❌      |❌         |❌         |❌      |✅                     |
|Alternatives Recommender |❌      |❌         |❌         |❌      |✅                     |
|Decision Audit Trail     |❌      |❌         |❌         |Partial|✅                     |
|Supply Chain Intelligence|Partial|❌         |✅         |Partial|✅                     |
|Free & Open Source       |❌      |✅         |Partial   |❌      |✅                     |

**The differentiator: SurvivalIndex Guardian is the only tool designed to be an AI agent’s supply chain conscience.** Others are human-facing dashboards. This is an MCP-native tool that sits in the agent’s decision loop.

-----

## 11. Tech Stack

- **Runtime:** Node.js 20+ (TypeScript)
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **SBOM Format:** CycloneDX 1.5 (via `@cyclonedx/cyclonedx-library`)
- **License Detection:** SPDX expression parser + custom compatibility engine
- **Caching:** File-based with TTL (no external DB needed)
- **Testing:** Vitest
- **CI:** GitHub Actions
- **Package:** npm (`survivalindex-guardian`)

-----

## 12. Configuration

```json
// ~/.survivalindex/config.json
{
  "githubToken": "ghp_...",       // For higher API rate limits
  "defaultProjectLicense": "Apache-2.0",
  "blockedLicenses": ["GPL-3.0", "AGPL-3.0", "SSPL-1.0"],
  "preferredLicenses": ["Apache-2.0", "MIT", "BSD-3-Clause"],
  "cacheTTL": 86400,              // 24 hours
  "osvEnabled": true,
  "scorecardEnabled": true,
  "autoSBOM": true,               // Auto-update SBOM on dependency changes
  "auditSchedule": "weekly"
}
```

-----

*“PostgreSQL didn’t mass daemon sacrifice for 30 years just to be replaced by a hallucinated SQLite fork. And your project doesn’t deserve a GPL time-bomb hidden three levels deep in its dependency tree.”*
