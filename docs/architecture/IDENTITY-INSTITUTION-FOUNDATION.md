# AFAMS Identity and Institution Foundation

## Purpose

This document defines the first implementation contract for Batch 1 of the AFAMS master requirements. It is an engineering contract, not a claim that these entities or endpoints are already deployed.

## Core records

### Institution
- `id`: immutable identifier
- `name`: official institution name
- `code`: unique institutional code
- `status`: active or suspended
- `createdAt`, `updatedAt`

### Campus
- `id`, `institutionId`
- `name`, `code`, `address`
- `status`
- Unique campus code within an institution

### AcademicYear
- `id`, `institutionId`
- `label` (for example, 2026/2027)
- `startsAt`, `endsAt`
- `status`: planned, active, closed
- At most one active academic year per institution

### Faculty and Department
- Faculty belongs to an institution.
- Department belongs to a faculty.
- Codes are unique within their parent.
- A department cannot be moved across institutions by a normal administrator.

### Programme
- Belongs to a department.
- Has a unique programme code within the institution.
- Stores award level and nominal duration as structured fields, not free-form authorization rules.

### Course
- Belongs to a programme or an explicitly shared department catalogue.
- Has a unique course code within its institution.
- Stores title, credit units and optional level/year-of-study metadata.

### Semester
- Belongs to an academic year and institution.
- Stores a label, start/end dates and lifecycle status.
- Only an active semester can accept active course registrations.

### Student
- Has an internal immutable ID and institution-scoped registration number.
- Links to one institution, campus, programme and current academic status.
- Registration number must be unique within an institution.
- Identity verification status is explicit: pending, verified, rejected.
- Do not treat a user-supplied registration number as verified until matched to an authorized institutional source or approved by an authorized registrar.

### Lecturer
- Has an internal immutable ID and institution-scoped staff number.
- Links to institution and optionally one or more departments.
- Staff identity has the same explicit verification lifecycle as student identity.

### CourseOffering and Enrollment
- CourseOffering binds a course, semester, campus/classroom and assigned lecturer(s).
- Enrollment binds a verified student to a course offering.
- Enforce one active enrollment per student and course offering.
- Attendance check-in must resolve to an active course offering and active enrollment.

### Classroom
- Belongs to a campus.
- Stores a human-readable room code and optional capacity.
- Capacity must be positive when supplied.

## Authorization boundaries

- Super Admin: platform-wide institution provisioning and support operations; all cross-tenant access must be explicitly audited.
- Administrator: records and academic configuration only inside their institution.
- Lecturer: offerings assigned to them and the enrolled roster for those offerings.
- Student: their own verified profile, enrollment, timetable and attendance records.
- Class Representative: only explicitly delegated class-level functions; never identity verification, role assignment or institutional configuration.

Every tenant-owned read and write must derive institution scope from the authenticated server-side identity. Never trust an `institutionId`, `studentId`, `lecturerId` or role supplied by the browser as proof of access.

## Required API behavior

1. Resolve the authenticated principal server-side.
2. Resolve the principal's active institution membership.
3. Verify the requested resource belongs to that institution.
4. Apply role and resource-level authorization.
5. Validate lifecycle state and parent-child relationships.
6. Write an audit event for identity verification, role changes and academic-record changes.
7. Return the minimum personal data required by the caller.

## Identity verification lifecycle

`pending -> verified` or `pending -> rejected`.

A rejected record may only be resubmitted through an explicit correction flow. Verification must record verifier identity, timestamp, source/reference and reason. Do not store raw national identity documents or sensitive identifiers unless the institution has an approved legal and security basis.

## Data integrity rules

- Foreign keys must preserve institution boundaries.
- Academic date ranges must be valid and non-overlapping where the institution's policy requires it.
- Closed academic years and semesters are read-only except for audited correction workflows.
- Deleting academic records with attendance history should be restricted; prefer archival/status transitions.
- Enrollment changes after attendance has been recorded must preserve historical snapshots and audit history.

## Implementation sequence

1. Introduce institution and campus scope without breaking the current single-institution deployment.
2. Add academic year and complete faculty/department/programme/course/semester relationships.
3. Add student and lecturer verification records and registrar workflow.
4. Add course offerings and active-semester enrollment enforcement.
5. Update attendance check-in to validate offering, enrollment, institution scope and lifecycle.
6. Add tests for cross-institution access denial and historical record preservation.

## Release gate

Batch 1 is not complete until the persistent data model, authenticated APIs, UI workflows, authorization tests and deployment verification all pass. This document alone does not satisfy implementation acceptance.
