<div align="center">
  <img src="assets/readme/project-motion.svg" width="100%" alt="AFAMS animated overview banner" />
</div>

# AFAMS — Attendance & Focus Academic Management System

[![AFAMS build](https://github.com/johncharlessarwi-dot/JOHN-ATTENDANCE-SYSTEM/actions/workflows/afams-build.yml/badge.svg)](https://github.com/johncharlessarwi-dot/JOHN-ATTENDANCE-SYSTEM/actions/workflows/afams-build.yml)

**Secure check-ins · Academic attendance review · Focus tools · Institution reporting**

AFAMS is an academic operations platform for institutions that need controlled attendance sessions, student focus tracking and institution-wide oversight. Developed by **John Charles Sarwi**, founder of **JOHN ONLINE SERVICES AND APPLICATIONS**.

## Main capabilities

| Module | Capabilities |
| --- | --- |
| Authentication and roles | Student, Lecturer, Class Representative, Administrator, Super Admin |
| Attendance sessions | Time-limited codes, owner controls, QR support, server-side validation |
| Geofenced attendance | Optional location checks with bounds and GPS accuracy validation |
| Review | Lecturer review of pending attendance outcomes |
| Academic workspace | Timetable, announcements, class-representative tools, admin workflows |
| Reports | Course and status overview; student, course, date, GPS and text filters; sorting, pagination; filtered CSV and Excel exports |
| Focus | Browser study timer and focus-event monitoring where enabled |

## Technology and architecture

- React 19 + Vite + TypeScript + Tailwind CSS
- AppDeploy managed identity, backend router and database
- Vitest unit tests for report filters, pagination, exports and geofence helpers
- GitHub Actions builds a CI-only frontend using a restricted browser-client stand-in

The CI mock at `src/testing/appdeploy-client.ts` is **not an authentication implementation** and cannot be used to access production data. The live backend runs inside AppDeploy. GitHub Pages publishes project documentation in `docs/`, not the authenticated application.

## Local development

```bash
npm ci
npm test
CI=true npm run build
```

You can start the Vite interface with `npm run dev`, but AppDeploy-specific authentication and data calls require the hosted runtime. Do not interpret a successful local build as a complete backend integration test.

## Security expectations

- Newly created users default to Student; the configured owner allowlist controls Super Admin assignment.
- Backend routes require authentication and role checks for protected operations.
- One check-in per student and session is enforced server-side using a deterministic record key.
- Location-bound sessions reject invalid coordinates, negative or low-quality GPS accuracy, and out-of-radius check-ins.
- CSV and Excel exports neutralize spreadsheet-formula-like text.
- Exported reports can contain student identifiers: only authorized staff should download, share, and retain them.
- Never put passwords, private keys, access tokens, or student data exports in Git.

See [implementation audit](docs/IMPLEMENTATION-AUDIT.md), [requirements tracking](docs/REQUIREMENTS-COMPLIANCE.md) and [reporting guide](docs/REPORTS-GUIDE.md).

## Roadmap

1. Broader backend authorization and security integration tests
2. Paginated data retrieval for very large institutions
3. Offline-safe pending actions with clear conflict resolution
4. Export auditing and institution-wide retention policies
5. End-to-end deployment QA in the AppDeploy environment

## Developer

- [John Charles Sarwi — portfolio](https://john-charles-sarwi-portfolio.vercel.app/)
- [GitHub](https://github.com/johncharlessarwi-dot)
- [WhatsApp](https://wa.me/255698170989)

*Digital Solutions. Simplified. · Tunahudumia Tanzania nzima.*
