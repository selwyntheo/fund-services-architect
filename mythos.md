Here's a prompt you can use to drive a dynamic (DAST) penetration test against a microservices + React app. It's structured so an agent (or a human tester) can work through it systematically.

---

**Dynamic Penetration Test — Microservices App with React UI**

You are a penetration tester performing an authorized dynamic security assessment (DAST) of a running application. Scope: a React single-page frontend backed by multiple microservices behind an API gateway. Test only against the provided environment and in-scope hosts/endpoints. Do not perform destructive actions, data exfiltration beyond proof-of-concept, or denial-of-service.

Work through these phases and report findings as you go:

**1. Reconnaissance & mapping**
- Enumerate the React app's routes, bundled JS, and exposed API endpoints (parse source maps, network calls, hardcoded URLs/keys).
- Map the service topology reachable through the gateway: list endpoints, HTTP methods, expected auth, and version headers.
- Identify tech stack, frameworks, and any leaked internal service names or hostnames.

**2. Authentication & session**
- Test login, token issuance, refresh, and logout flows (JWT/OAuth/session cookies).
- Check for weak JWT validation (alg:none, key confusion, missing signature/exp checks), token replay, and improper session invalidation.
- Test cookie flags (HttpOnly, Secure, SameSite) and CSRF protection on state-changing requests.

**3. Authorization (the big one for microservices)**
- Test BOLA/IDOR: swap object IDs across accounts and roles.
- Test BFLA: call privileged/admin endpoints as a low-privilege user.
- Probe service-to-service trust: can you hit an internal microservice directly, bypassing the gateway, or forge internal auth headers (e.g., a trusted `X-User-Id`)?

**4. Input handling & injection**
- Per endpoint, test injection: SQLi/NoSQLi, command injection, SSRF (especially on URL/webhook/image-fetch params), XXE, template injection.
- Test the React UI for DOM/reflected/stored XSS, and check the API's output encoding and content-type handling.

**5. API & gateway**
- Test rate limiting, mass assignment, excessive data exposure, and improper error handling (stack traces, verbose messages).
- Check CORS config, HTTP method tampering, and inconsistent auth enforcement between gateway and services.

**6. Config & transport**
- TLS config, security headers (CSP, HSTS, X-Content-Type-Options), exposed actuator/debug/health/metrics endpoints, default credentials.

**Output:** For each finding provide: title, affected endpoint(s), severity (CVSS), reproduction steps, evidence (request/response), impact, and remediation. Prioritize by exploitability and business impact. End with a summary table and a prioritized remediation roadmap.

---

A couple of things worth tailoring: what auth mechanism are you using (JWT, OAuth2, session cookies)? And are the microservices meant to be reachable only through the gateway, or do some have direct ingress? Those two answers sharpen the authorization and gateway sections considerably.

Note that this is a prompt for testing systems you own or are explicitly authorized to test — make sure you have written authorization for the target environment before running any active scanning.
