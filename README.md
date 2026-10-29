# AFAMS — Attendance & Focus Academic Management System

AFAMS is a secure academic operations platform for attendance management, student focus and institutional visibility.

## First release

- Student, Lecturer, Administrator and Super Admin role model
- AppDeploy authentication with protected backend routes
- Time-limited attendance sessions with six-character access codes
- One check-in per student per session
- Role-scoped attendance history and dashboard metrics
- Owner-only role assignment and audit trail
- Browser-based Focus Client with study timer
- Responsive dark academic operations interface

## Technology

- React 19, TypeScript, Vite and Tailwind CSS
- AppDeploy managed authentication and database
- AppDeploy backend SDK and API client

## Run locally

```bash
npm install
npm run dev
```

## Security notes

- New accounts default to Student.
- The configured owner account receives Super Admin access.
- Only the owner allowlist can assign institutional roles.
- Attendance is validated on the server; duplicate check-ins are blocked using a deterministic attendance record ID.
- Never commit credentials, tokens or private environment values.

## Deployment

The live application is hosted through AppDeploy. Configure the application owner email allowlist in `backend/index.ts` before using a different owner identity.
