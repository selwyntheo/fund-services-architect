# Windsurf Workflow: Code Quality Automation

## Overview

This workflow automates detection and remediation of **code smells**, **security vulnerabilities**, and **test coverage gaps** using Windsurf’s AI-powered cascade system. It is designed for Java Spring Boot microservices but can be adapted for other stacks.

-----

## Workflow 1: Code Smell Detection & Refactoring

### Trigger

Run manually or on file save in Windsurf.

### Cascade Prompt

```
@cascade

You are a senior software engineer performing a code quality review.

Tasks:
1. Scan all Java files under src/main/java/ for the following code smells:
   - Long methods (>30 lines)
   - Large classes (>300 lines)
   - Duplicate code blocks
   - Feature envy (methods accessing other class data excessively)
   - God classes
   - Magic numbers and string literals
   - Deep nesting (>3 levels)
   - Excessive method parameters (>4 params)

2. For each smell found:
   - Report: file path, line number, smell type, severity (HIGH/MEDIUM/LOW)
   - Suggest a refactored version with explanation

3. Auto-refactor LOW severity smells if confidence > 90%.

4. Generate a report: code-smells-report.md in the project root.

Output format per issue:
## [SEVERITY] <SmellType> — <ClassName>
- **File**: path/to/File.java
- **Lines**: 45–92
- **Issue**: Description
- **Fix**: Suggested refactoring
```

### Expected Output

- `code-smells-report.md` — Full smell inventory
- Inline refactored code for low-severity issues

-----

## Workflow 2: Security Vulnerability Scan

### Trigger

Run before every commit or PR creation.

### Cascade Prompt

```
@cascade

You are a security-focused code reviewer. Perform a comprehensive vulnerability scan.

Tasks:
1. Scan src/ for the following vulnerability categories:
   - SQL Injection (unparameterized queries)
   - Hardcoded credentials, API keys, secrets
   - Insecure deserialization
   - Path traversal vulnerabilities
   - Missing input validation / sanitization
   - Insecure random number usage (Math.random vs SecureRandom)
   - Dependency vulnerabilities (check pom.xml / build.gradle for known CVEs)
   - Missing authentication/authorization checks in REST endpoints
   - Sensitive data logged to console

2. For each vulnerability:
   - Report severity: CRITICAL / HIGH / MEDIUM / LOW
   - Show vulnerable code snippet
   - Provide secure replacement code
   - Reference OWASP category

3. Auto-fix MEDIUM and LOW severity issues if a clear safe fix exists.

4. Generate: security-vulnerability-report.md

Do NOT auto-fix CRITICAL or HIGH — flag them for manual review.
```

### Expected Output

- `security-vulnerability-report.md`
- Patched code for medium/low issues
- CRITICAL/HIGH items highlighted with red flags in the report

-----

## Workflow 3: Test Coverage Analysis & Generation

### Trigger

Run after any feature development or refactoring session.

### Cascade Prompt

```
@cascade

You are a QA engineer focused on maximizing test coverage.

Tasks:
1. Analyze existing test files under src/test/java/

2. Identify coverage gaps:
   - Public methods with no unit tests
   - Edge cases not tested (null inputs, empty collections, boundary values)
   - Exception paths not covered
   - Integration test gaps for REST endpoints
   - Missing repository/DAO layer tests

3. For each gap:
   - Generate a complete JUnit 5 test class with:
     - @DisplayName annotations
     - Mockito mocks where needed
     - AssertJ fluent assertions
     - Happy path + edge cases + exception scenarios
   - Place generated test in the correct package under src/test/java/

4. Generate: test-coverage-report.md listing:
   - Classes with 0% coverage
   - Classes with partial coverage and what's missing
   - Classes with full coverage (✅)

Use @SpringBootTest for integration tests and @ExtendWith(MockitoExtension.class) for unit tests.
```

### Expected Output

- Auto-generated test files in `src/test/java/`
- `test-coverage-report.md`

-----

## Workflow 4: Full Code Quality Pipeline (Combined)

### Cascade Prompt (All-in-One)

```
@cascade

Run the full code quality pipeline in this order:

## Step 1 — Code Smell Analysis
[Paste Workflow 1 prompt here]

## Step 2 — Security Vulnerability Scan
[Paste Workflow 2 prompt here]

## Step 3 — Test Coverage Generation
[Paste Workflow 3 prompt here]

## Step 4 — Summary Report
Create a master report: quality-dashboard.md with:
- Executive summary (counts by severity for each category)
- Top 5 critical issues requiring immediate attention
- Estimated effort to resolve all issues (story points)
- Coverage percentage before and after test generation
```

-----

## Configuration File

Create `.windsurf/quality-config.yaml` in your project root:

```yaml
code_quality:
  smells:
    max_method_lines: 30
    max_class_lines: 300
    max_parameters: 4
    max_nesting_depth: 3
    auto_fix_severity: [LOW]

  security:
    scan_paths:
      - src/main/java
      - src/main/resources
    check_dependencies: true
    auto_fix_severity: [LOW, MEDIUM]
    secrets_patterns:
      - "password\\s*=\\s*['\"][^'\"]+['\"]"
      - "api[_-]?key\\s*=\\s*['\"][^'\"]+['\"]"

  coverage:
    target_percentage: 80
    test_framework: junit5
    mocking_framework: mockito
    assertion_library: assertj
    generate_for:
      - service
      - controller
      - repository
      - util

  reports:
    output_dir: reports/quality
    formats: [markdown, html]
```

-----

## GitHub Actions Integration

Add `.github/workflows/code-quality.yml` to run this automatically on PRs:

```yaml
name: Code Quality Gate

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run Tests with Coverage
        run: mvn test jacoco:report

      - name: Check Coverage Threshold
        run: |
          COVERAGE=$(python3 scripts/parse_jacoco.py target/site/jacoco/jacoco.xml)
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage below 80%"
            exit 1
          fi

      - name: OWASP Dependency Check
        run: mvn org.owasp:dependency-check-maven:check

      - name: SpotBugs Analysis
        run: mvn spotbugs:check

      - name: Upload Quality Reports
        uses: actions/upload-artifact@v4
        with:
          name: quality-reports
          path: reports/quality/
```

-----

## Maven Dependencies to Add

Add to `pom.xml` to support the full quality pipeline:

```xml
<!-- Test Coverage -->
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>test</phase>
      <goals><goal>report</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>

<!-- Security Scan -->
<plugin>
  <groupId>org.owasp</groupId>
  <artifactId>dependency-check-maven</artifactId>
  <version>9.0.9</version>
</plugin>

<!-- Code Smell / Static Analysis -->
<plugin>
  <groupId>com.github.spotbugs</groupId>
  <artifactId>spotbugs-maven-plugin</artifactId>
  <version>4.8.3.1</version>
  <dependencies>
    <dependency>
      <groupId>com.h3xstream.findsecbugs</groupId>
      <artifactId>findsecbugs-plugin</artifactId>
      <version>1.12.0</version>
    </dependency>
  </dependencies>
</plugin>
```

-----

## Quick Reference — Windsurf Shortcuts

|Action                      |Windsurf Cascade Command                                 |
|----------------------------|---------------------------------------------------------|
|Scan for smells             |`@cascade detect code smells in src/`                    |
|Fix a specific smell        |`@cascade refactor [ClassName] to remove god class smell`|
|Scan vulnerabilities        |`@cascade run security scan on src/main/java/`           |
|Generate tests for a class  |`@cascade generate unit tests for [ServiceName]`         |
|Increase coverage for a file|`@cascade add edge case tests for [ClassName]`           |
|Full pipeline               |`@cascade run full quality pipeline`                     |

-----

## Report Artifact Structure

After running the full pipeline, your project will contain:

```
reports/quality/
├── code-smells-report.md
├── security-vulnerability-report.md
├── test-coverage-report.md
└── quality-dashboard.md        ← Master summary
```

-----

*Generated for BNY Fund Services — Java Spring Boot / Distributed Systems Stack*
