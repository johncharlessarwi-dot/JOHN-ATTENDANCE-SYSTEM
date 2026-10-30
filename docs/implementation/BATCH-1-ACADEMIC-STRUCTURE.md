# Batch 1 — Academic structure API

## Delivered in this branch

The authenticated academic administration API now supports three additional record types through the existing routes:

- `academicYears`: academic-year name, start date, end date and active/archived status.
- `campuses`: institution-linked campus name, unique campus code, optional address and active status.
- `classrooms`: classroom name, active campus link, building, room code and capacity.

## API contract

Use `GET /api/academic` to retrieve `academicYears`, `campuses` and `classrooms` alongside the existing faculties, departments, programmes, courses, semesters and enrollments.

Create records with `POST /api/academic` using one of these payloads:

- `{ kind: "academicYears", name, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", status?: "active" | "archived" }`
- `{ kind: "campuses", name, code, address? }`
- `{ kind: "classrooms", name, campusId, building?, roomCode?, capacity }`

Delete records through `DELETE /api/academic/:kind/:id`.

All create/delete operations retain the existing Administrator/Super Admin authorization guard and audit trail. Date order, campus-code uniqueness, active-campus references and classroom capacity are validated server-side.

## Deliberate limitations

This is the backend CRUD foundation, not the completed academic lifecycle. The UI forms, academic-year activation rules, semester-to-year foreign-key migration, campus-scoped data isolation, classroom scheduling, and active-enrollment check-in enforcement remain follow-up work. Do not treat these APIs as proof of full multi-campus tenancy.
