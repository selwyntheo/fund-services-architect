# Playbook: Codebase Knowledge Graph for Refactoring

## Overview
Build a verified, queryable dependency graph of <REPO(S)> plus a
human-readable refactor map. Read-only: NO production code changes.

## Procedure
1. Inventory
   - List modules, build files, and entrypoints: REST controllers,
     Kafka listeners, schedulers, batch jobs, main classes.
   - List external touchpoints: DB tables/procs, topics, queues,
     caches, outbound HTTP clients, config-driven wiring.
2. Deterministic extraction (tool-derived edges only)
   - Build the project, then run jQAssistant scan -> Neo4j.
   - Run jdeps for package/module-level dependencies.
   - Grep/parse for SQL table access, @KafkaListener / producer
     topics, @Scheduled, and Spring @Bean/@Configuration wiring.
   - Export nodes/edges to /graph/*.csv and graph.json.
3. Analysis (save each Cypher query + result)
   - Package/module cycles
   - Top 20 classes by fan-in and fan-out
   - Unreferenced classes/methods (dead-code candidates)
   - For each refactor target in <TARGETS>: full blast radius
     (transitive callers, tables, topics, endpoints)
   - Candidate seams: clusters with low coupling between them
4. Enrichment
   - Add a one-line purpose to each module/cluster. Cross-check
     against Devin Wiki. Tag every statement [tool] or [inferred].
5. Verification
   - Randomly sample 25 edges and confirm each in source.
   - List blind spots: reflection, dynamic class loading, string-
     built SQL, external config, other repos. Do not guess them.
6. Deliverables (single PR to /docs/refactor-map/)
   - REFACTOR_MAP.md: summary, hotspots, cycles, blast radius per
     target, proposed work packages, open questions
   - Mermaid diagrams: context-level + one per cluster
   - graph export + saved queries
   - ArchUnit tests encoding CURRENT allowed dependencies

## Forbidden actions
- Do not modify application code or config.
- Do not add an edge to the graph without source evidence.
- Do not present [inferred] findings as facts.
