# Monthly Developer Ownership Review — Agent Prompt

Paste this into an agent session with GitLab MCP, SonarQube/SonarCloud MCP, and Veracode MCP connected.

---

## PROMPT

You are running a monthly engineering review for my team. You have GitLab MCP, Sonar MCP, and Veracode MCP available. Use them — do not estimate, infer, or fabricate any number you did not retrieve from a tool call.

**Period:** <START_DATE> to <END_DATE>
**Scope:** GitLab group(s) `<GROUP_PATH>`, Sonar project keys `<KEYS>`, Veracode application(s) `<APP_NAMES>`
**Team:** <list of developers, with their GitLab usernames and commit emails so you can join identities across systems>

### The question I am actually asking

My developers use AI heavily, and that is fine — I encourage it. What is not fine is **shipping code they do not own**: code they cannot explain, did not test, did not review, and do not fix when it breaks. Build me a picture of ownership, not of typing volume.

Do **not** attempt to classify code as AI-generated or human-written. That inference is unreliable and I don't want it. Measure the behaviours that ownership produces, whoever or whatever wrote the first draft.

### Step 1 — Normalise before you compare

- Exclude generated files, lockfiles, vendored deps, schema migrations, and formatting-only commits from all LOC-based metrics. State your exclusion patterns.
- Join identities across GitLab, Sonar, and Veracode. List anyone you could not resolve and exclude them rather than guessing.
- Report every rate metric per 1k lines changed **and** per merge request, and always alongside the team median. Never present a raw absolute as a judgement.

### Step 2 — Pull from GitLab

For each developer:
- MRs authored, merged, closed unmerged. Distribution of lines changed per MR (median, p90, max) and commits per MR.
- Share of MRs merged with zero review comments; share self-merged or self-approved.
- Reviews **given** to others: count, plus comments per review and share that are substantive (a question, a requested change, an alternative) versus approval-only.
- Author responsiveness: median time from a reviewer's substantive comment to the author's reply, and whether replies address the point or just push a commit.
- Rework: share of MRs needing 3+ review rounds.
- Stability: reverts, hotfixes, or follow-up "fix" MRs touching the same files within 14 days of merge.
- Pipeline hygiene: failed pipelines on default branch attributable to the author, and red-build dwell time.
- MR description quality: does it state intent, risk, and test evidence, or is it a bare title? Sample and characterise; don't score it numerically.

### Step 3 — Pull from Sonar

For each developer, on new code in the period:
- New issues introduced by severity and type, per 1k lines changed.
- Coverage on new code, and duplication on new code.
- Cognitive complexity and function-length outliers introduced.
- **Remediation ownership:** of the issues a developer introduced, what share did they fix themselves, what share was fixed by someone else, what share is still open — and median time to fix their own.
- Quality gate failures attributable to their MRs.

### Step 4 — Pull from Veracode

For each developer:
- New flaws introduced by severity (SAST) and new vulnerable or unmaintained dependencies added (SCA).
- Policy-blocking findings caused, and whether they were remediated or waived.
- Mean time to remediate their own flaws, and who actually closed them.
- Re-introduction: previously remediated flaw categories reappearing in their code.

### Step 5 — Synthesise

Produce, per developer:
1. A short narrative (5–8 sentences) of how they worked this month.
2. An **ownership picture** across four dimensions, each with the evidence behind it: *fixes what they break*, *reviews others substantively*, *ships changes reviewers can actually review*, *code holds up after merge*.
3. Two or three specific, evidence-backed things to discuss with them. Cite the MR IIDs, issue keys, and flaw IDs.

Then a team roll-up: trend versus the prior two months on defect escape, remediation-by-author share, review reciprocity, and coverage on new code.

### Step 6 — Flag patterns worth a conversation

Surface, as **conversation prompts and never as verdicts**, any developer showing a cluster of:
- Large single-commit MRs with thin descriptions
- High duplication plus high cognitive complexity on new code
- Low or falling coverage on new code while volume rises
- New dependencies added without a corresponding removal or stated need
- Findings on their code consistently remediated by someone else
- High MR volume authored, near-zero substantive review given to others

A cluster like this means "ask them to walk you through this MR," not "they used AI." Say so explicitly in your output.

### Constraints

- Do not rank or stack-rank developers. Present each against the team median and their own prior months.
- Distinguish clearly between what you retrieved and what you interpreted.
- If an MCP call fails or a metric is unavailable, say so and leave it blank. No estimates.
- Flag any developer whose sample is too small (fewer than ~5 MRs) as not meaningfully measurable this period.

---

## Suggested follow-up: the 1:1 questions

Once the report is out, the ownership signal that actually matters comes from a conversation, not a dashboard. For each developer, pick one non-trivial MR they merged and ask:

- Walk me through why this approach over the alternatives.
- What breaks first if this is under 10x load?
- Which part of this are you least confident about?
- What did you delete or reject before landing this?
- If this pages someone at 2am, what does the runbook say?

Someone who owns their code answers these fluently regardless of what wrote the first draft. Someone who doesn't, can't — and that's the measurement no MCP will give you.
