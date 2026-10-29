# AFAMS implementation audit and delivery plan

This checklist is grounded in the supplied AFIAMS/AFAMS specification. It distinguishes the current verified first release from features that still require implementation and institutional data.

## Current verified first release
- [x] React + TypeScript responsive web workspace.
- [x] Four roles: Student, Lecturer, Administrator, Super Admin.
- [x] AppDeploy-managed authentication and backend API.
- [x] Lecturer/admin can create time-limited attendance sessions.
- [x] Six-character session code check-in; duplicate check-ins blocked.
- [x] Role-scoped dashboards, attendance history and audit trail.
- [x] Browser focus timer.
- [x] Live AppDeploy deployment: https://afams-3karll.v2.appdeploy.ai/

## Critical correctness and security work
- [ ] Replace attendance-rate calculation. The current implementation divides attendance records by session count; that is not a valid attendance percentage without course enrolment/eligible-student denominators. Do not present it as a real rate.
- [ ] Replace Math.random session codes with cryptographically secure, collision-checked codes and rate-limit attempts.
- [ ] Enforce course enrollment, active semester, session ownership, session schedule and classroom policy at the API boundary.
- [ ] Add institutional identity verification; do not allow unverified self-registration to gain institutional status.
- [ ] Add server-side audit events for sensitive administrative actions and retention controls.
- [ ] Add automated API and browser tests; current release validation is not proof of complete end-to-end workflow coverage.

## Academic administration
- [ ] Faculties, departments, programmes, courses and classrooms.
- [ ] Academic years, semesters and timetable scheduling.
- [ ] Student and lecturer records and bulk import.
- [ ] Course enrollment and registration-number verification against an authorized institutional source.
- [ ] Student profile and digital student ID / identity QR.
- [ ] Notifications and academic calendar.

## Attendance and verification
- [ ] Dynamic rotating QR code with expiry and server-side signature.
- [ ] GPS permission and configurable 10–100m classroom geofence.
- [ ] NFC, RFID/barcode and lecturer-assisted/manual attendance.
- [ ] Device/risk signals, replay protection and fraud review.
- [ ] Real-time lecturer attendance monitoring.
- [ ] Correct attendance percentages using enrolled eligible students and scheduled sessions.
- [ ] Daily, weekly, monthly, semester, department and institution reports.
- [ ] PDF, XLSX and CSV exports.

## Focus, engagement and intelligence
- [ ] Android AFAMS Focus Client (Kotlin + Jetpack Compose).
- [ ] Focus session lifecycle linked to a validated attendance session.
- [ ] Network filtering/VPN only through an explicitly installed Android VPN service, with transparent consent and institution policy; a web page cannot silently activate a device VPN or reliably observe force-closes.
- [ ] Focus compliance event model and lecturer reporting.
- [ ] Engagement score using the supplied weights: attendance 40%, participation 30%, assignments 20%, focus compliance 10%.
- [ ] Academic Health Score, risk levels and intervention recommendations.
- [ ] Early-warning rules (below 70%, three consecutive absences, declining engagement).
- [ ] Predictive models only after sufficient, representative historical data exists; predictions must be explainable and reviewed by staff.

## Data and platform architecture
- [ ] PostgreSQL schema for users, students, lecturers, faculties, departments, programmes, courses, enrollments, sessions, attendance, notifications, academic years, semesters and classrooms.
- [ ] Migration from the current AppDeploy-managed data store to PostgreSQL if PostgreSQL is the institutional deployment requirement.
- [ ] Tenant isolation for multiple universities/campuses.
- [ ] Backups, restore drills, monitoring, rate limits, incident response and privacy/retention policies.
- [ ] Load and security testing for the target scale (hundreds of thousands of students).

## Deployment split
- GitHub Pages hosts the static public entry site in `docs/`.
- The authenticated AFAMS application and API remain at the AppDeploy URL until a server-capable host is selected for the full application.
- GitHub Pages cannot execute Next.js Server Actions, API routes, server-side authentication, background workers or PostgreSQL.
- The Pages workflow deploys automatically on changes under `docs/` or its workflow file.
