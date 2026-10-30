# AFAMS Master Requirements Tracker

This tracker follows the supplied AFAMS/AFIAMS specification. A feature is not considered complete merely because a navigation item, mock screen, or test scenario exists. Completion requires working UI, authenticated API, persisted data, authorization, validation, and a verified test.

**Current deployed baseline:** https://afams-3karll.v2.appdeploy.ai/  
**Repository:** https://github.com/johncharlessarwi-dot/JOHN-ATTENDANCE-SYSTEM

## Status definitions
- `Implemented`: evidence exists in current source and the feature is wired to an API.
- `Partial`: a foundation exists, but one or more required workflows, data links, validations, or integrations are missing.
- `Not implemented`: no working implementation was found in the current source review.
- `Platform dependent`: requires native Android, a supported device/browser, physical hardware, or external institutional integration.

## Current source audit

| Requirement group | Status | Evidence / remaining work |
|---|---|---|
| Authentication and role-aware dashboards | Partial | AppDeploy authentication and role profile exist. Four required roles exist, with an additional internal Class Representative role. Validate all role-specific screens and authorization boundaries. |
| Student identity and institutional registration verification | Partial — GitHub implementation merged; live deployment and tests pending | Primary institution setup, student registration-number submission, administrator verify/reject queue and identity audit metadata are merged in PR #2. It is a single-primary-institution workflow; no authoritative SIS lookup, tenant isolation or attendance check-in enforcement yet. Live AppDeploy source is still on the previous snapshot until a deployment succeeds. |
| Faculty, department, programme, course, semester setup | Partial | Academic administration CRUD exists. Academic years, lecturers, students, classrooms, course registration and full parent/semester links are incomplete. |
| Course enrolment | Partial | Basic student-course enrollment exists, but not automatic import/verification from institutional records or active-semester enforcement at check-in. |
| Dynamic QR attendance | Partial | Session codes and QR display foundation exist. Verify camera scanning, QR rotation/expiry, replay prevention, rate limits and secure binding to a session. |
| GPS geofencing | Partial | Server-side distance and accuracy checks exist when session geofencing is enabled. Required 10–100m configurable radius and mandatory location permission policy need alignment and tests. |
| NFC attendance | Platform dependent / Partial | Browser/NFC pathway needs real-device validation. RFID UID reader support is not established. |
| Attendance validation | Partial | Active session, duplicate check-in and optional GPS checks exist. Course enrollment and active semester are not enforced in the check-in API. |
| Lecturer attendance review | Implemented foundation | Lecturer/admin review endpoint and review UI exist. Verify lecturer ownership and edge cases end-to-end. |
| Timetable | Partial | Timetable CRUD and role filtering exist. Automatic sync from verified registration, academic calendar, classroom and lecturer directory links remain incomplete. |
| Student profile and digital identity card | Not implemented | No complete digital student ID, registration number, QR identity credential, or institution-verified profile workflow. |
| Focus monitoring | Partial | Browser focus events and policies exist. Browser visibility is not an operating-system app blocker and cannot prove VPN compliance or app force-close events. |
| Android AFAMS Focus Client | Not implemented | A web PWA shell is not a Kotlin/Jetpack Compose Android app. Native VPNService, Android policy controls and background event handling remain to be built and tested. |
| VPN category filtering | Not implemented | No native Android VPNService or maintained domain/category policy engine exists. |
| Engagement score (40/30/20/10) | Not implemented | Current source does not establish the specified weighted score with attendance, participation, assignments and focus compliance. |
| Academic Health Score and risk level | Not implemented | No defensible 0–100 calculation using all required factors or intervention recommendation workflow. |
| Assignment and assessment management | Not implemented | No operational assignment completion or assessment-grade records to power the requested analytics. |
| AI Study Hub and quiz generator | Partial | AI assistant, quiz generation and engagement review exist. They do not yet have verified grades, assignments or complete course material integration. |
| Predictive academic intelligence | Not implemented | No trained/validated risk, failure, dropout or performance forecasting model. |
| Early warning alerts | Not implemented | No threshold-driven alerts to students, lecturers and academic advisors with delivery tracking. |
| Lecturer analytics | Partial | Attendance reporting foundation exists. Participation, ranking, at-risk students, absent-student analysis and engagement trends are incomplete. |
| Institution-wide analytics | Not implemented | No verified faculty/department/classroom utilization analytics across a complete institutional dataset. |
| Non-smartphone attendance | Not implemented | Manual assisted attendance workflow, barcode cards, RFID card assignment and reconciliation are incomplete. |
| Notifications | Partial | Announcement board exists. No complete targeted notification service, push delivery, reminders or delivery receipts. |
| Reports | Partial | Attendance report and CSV/Excel/print-to-PDF foundations exist. Daily/weekly/monthly/semester/faculty/department/institution report filters and verified PDF generation remain incomplete. |
| Security and fraud detection | Partial | Authentication, role checks, audit events, duplicate attendance checks and dynamic session codes exist. Device binding, JWT-specific architecture, API rate limits, stronger QR replay controls and fraud signals remain incomplete. |
| Multi-institution / multi-campus SaaS | Not implemented | No tenant isolation, institution provisioning, tenant-scoped data access or cross-campus analytics. |
| Production database and infrastructure stack | Partial | Current deployment uses AppDeploy-managed persistence. PostgreSQL schema/migrations, Docker/Kubernetes and AWS/Azure deployment architecture are not established in this repository. |
| Parent, advisor and national integrations | Not implemented | Listed as future expansion; no operational integrations found. |

## Required delivery batches

1. **Identity and institution foundation:** institutions/tenants, academic years, verified student and lecturer records, registration-number validation, complete academic hierarchy, classroom records, active-semester enrollment.
2. **Attendance integrity:** dynamic QR lifecycle, camera scanning, course and semester eligibility, geofence radius configuration, location permission checks, assisted/manual attendance, device/session anti-replay and audit.
3. **Timetable and student experience:** verified student profile, digital ID, course registration, timetable sync, upcoming classes, classroom/lecturer details, calendar and reminders.
4. **Lecturer operations:** course roster, session scheduling, live attendance, participation capture, quizzes, assignments, grades and review workflow.
5. **Focus and Android client:** native Kotlin/Jetpack Compose app, Android VPNService feasibility and policy design, allowed/blocked domain lists, focus lifecycle, compliance telemetry and privacy controls.
6. **Scoring and predictive intelligence:** specified engagement formula, Academic Health Score, transparent risk rules, validated prediction pipeline, intervention recommendations and early-warning notifications.
7. **Analytics and reporting:** student, course, lecturer, department, faculty and institution analytics; daily/weekly/monthly/semester reports; verified PDF, Excel and CSV exports.
8. **Security, scale and production:** tenant isolation, device verification, rate limiting, fraud detection, data retention, backups, load tests, observability, deployment and recovery.
9. **Phase 2/3 integrations:** face recognition, parent portal, scholarship monitoring, advisor portal, national university and smart classroom integrations.

## Verification rule

For each batch, record:
- source files and API endpoints changed;
- database entities and constraints added;
- role and tenant authorization rules;
- validation and failure cases;
- automated test results and manual device/browser checks;
- deployment status and known limitations.

Do not mark a requirement complete until the evidence is available. Native VPN enforcement, RFID hardware, institutional registry access and national integrations require the corresponding Android/device/hardware/institutional environment; a web-only mockup is not an acceptable substitute.
