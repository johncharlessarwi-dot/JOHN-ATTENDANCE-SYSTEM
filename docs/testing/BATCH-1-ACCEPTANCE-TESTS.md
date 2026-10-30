# AFAMS Batch 1 — Identity Foundation Acceptance Tests

These are release-gate scenarios for the identity and institution foundation. They describe expected behavior; they are not evidence that the tests have already passed.

## Institution isolation
- [ ] A user from Institution A cannot read Institution B students, lecturers, courses, offerings or enrollments by changing an identifier in a request.
- [ ] An Institution A administrator cannot create or edit records under Institution B.
- [ ] A lecturer can only access course offerings assigned to them.
- [ ] A student can only access their own identity, enrollment and timetable data.
- [ ] A Class Representative cannot verify identities, change roles or edit institutional configuration.
- [ ] Cross-institution Super Admin actions create an audit event with actor, target, timestamp and reason.

## Student identity
- [ ] New student identity starts as pending verification.
- [ ] Duplicate registration numbers are rejected within one institution.
- [ ] The same registration number may exist in a different institution without collision.
- [ ] A student cannot self-assign verified status or change their institution/programme.
- [ ] Only an authorized registrar/admin workflow can verify or reject a student record.
- [ ] Verification stores verifier, timestamp, source/reference and decision reason.
- [ ] Rejected identity can only re-enter review through the correction/resubmission flow.

## Lecturer identity
- [ ] Staff number uniqueness is scoped to the institution.
- [ ] Lecturer cannot self-verify or self-assign institutional roles.
- [ ] Lecturer access is limited to assigned departments/offerings according to policy.

## Academic hierarchy
- [ ] Campus belongs to the selected institution.
- [ ] Department belongs to a faculty in the same institution.
- [ ] Programme belongs to a department in the same institution.
- [ ] Course and semester references cannot cross institution boundaries.
- [ ] At most one active academic year exists per institution.
- [ ] Semester dates fall within the configured academic year unless an audited exception is approved.
- [ ] Closed semesters reject new enrollments.

## Course offering and enrollment
- [ ] Course offering references a valid course, semester, campus/classroom and assigned lecturer.
- [ ] A student must be verified and active to enroll.
- [ ] A student cannot have duplicate active enrollment in the same offering.
- [ ] Enrollment is rejected for a closed semester.
- [ ] Attendance check-in is rejected when no active enrollment exists.
- [ ] Attendance history remains readable after an enrollment is withdrawn or archived.

## Security and data handling
- [ ] Missing authentication returns 401.
- [ ] Authenticated but unauthorized access returns 403 (or a deliberate non-disclosing 404 policy).
- [ ] Invalid parent-child combinations return a validation error without writing data.
- [ ] Browser-supplied role and institution fields are ignored as authorization evidence.
- [ ] Sensitive identity data is excluded from ordinary logs and error responses.
- [ ] Verification, role changes and academic configuration writes are auditable.

## Regression
- [ ] Existing single-institution users retain access through an explicit migration/default mapping.
- [ ] Existing attendance sessions and records remain intact after migration.
- [ ] Existing dashboards do not expose cross-institution aggregate data.
- [ ] No secrets, access tokens or private environment values are committed.
- [ ] Build, type-check, API tests and authorization tests pass before release.

## Required evidence per release
Record the commit SHA, migration identifier, test command/output, deployment ID, smoke-test results and any unresolved limitations. Do not mark a checkbox complete without recorded evidence.
