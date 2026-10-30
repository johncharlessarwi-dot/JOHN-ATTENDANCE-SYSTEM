# Batch 1 implementation note — institution registry and identity verification

## Included in this change

- A platform-owner-only institution registry setup screen and API.
- A single primary institution record with official name, institution code and main campus.
- A student registration identity submission workflow.
- An administrator verification queue with verify/reject decisions and review notes.
- Student profile fields for institution assignment, registration number, identity status and verification audit metadata.
- Duplicate registration-number checks against known user profiles and pending identity requests.
- Audit events for institution configuration, student submissions and identity decisions.

## API surface

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/institution` | Read the primary institution and caller identity state |
| POST | `/api/institution` | Create/update the primary institution; owner allowlist only |
| POST | `/api/identity/request` | Submit a student's registration number for review |
| GET | `/api/identity/requests` | List identity requests; administrator/super admin only |
| POST | `/api/identity/:id/review` | Verify or reject a pending request; administrator/super admin only |

## Important scope and limitations

This is the first single-institution registry workflow. It is **not** multi-tenant SaaS isolation and does not yet connect to an authoritative university student information system. Registration details are submitted by the student and reviewed by an authorized AFAMS administrator; verification therefore means an administrator approved the submitted details, not that an external registry automatically authenticated them.

This change does not yet:
- enforce verified identity and active course enrollment at attendance check-in;
- create academic-year, campus, classroom or course-offering lifecycle records;
- add tenant-scoped access to every existing data collection;
- migrate existing student records into a verified institutional registry.

Those are subsequent Batch 1 tasks. Existing users remain usable; their identity state is shown as not submitted until they initiate the workflow.

## Verification status

- Source change: committed on the feature branch.
- Automated build: pending execution in the project deployment environment.
- API integration and authorization tests: pending.
- Live deployment: pending AppDeploy credit availability and successful QA.

Do not mark the full Batch 1 requirement as complete until those release gates pass.
