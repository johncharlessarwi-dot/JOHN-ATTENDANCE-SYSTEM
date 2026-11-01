# Attendance reports — operator guide

This guide explains the AFAMS reporting interface for authorized students and academic staff.

## Browse records

1. Sign in through the institution's approved AppDeploy deployment.
2. Open **Attendance reports** to see the summary, course breakdown and detailed records available to your role.
3. Use the report controls to narrow results:
   - **Search:** course name, student identifier or venue (case-insensitive)
   - **Review status:** an exact status from the available records
   - **Course:** records for one chosen course
   - **From / To:** inclusive local-calendar date interval
   - **GPS check:** GPS verified, unverified or all
   - **Sort:** newest, oldest, or course order
4. Use **Previous** and **Next** to browse 20 rows per page.
5. Select **Clear filters** to restore the complete permitted dataset.

The summary totals are based on the server's currently returned permitted records, whereas the detailed table responds to local filters. The backend currently applies read limits, so the totals should **not** be described as all-time institution totals until complete server-side pagination is implemented.

## Export records safely

- **Export filtered CSV** and **Export filtered Excel** include the full filtered set, not only the currently displayed page.
- If no rows match the filters, exports are disabled.
- Untrusted text that resembles spreadsheet formulas is prefixed with a literal apostrophe before export.
- Student identifiers and attendance data are confidential. Share exports only with authorized institutional staff, use approved storage, and delete unneeded local copies.
- The browser Print/PDF action prints the current page layout; it is not a verified archival PDF.

## Verification and troubleshooting

- Use **Refresh** to retrieve the latest records. If the request fails, the interface clears the previous dataset instead of continuing to show potentially outdated authorized records.
- A pending record is not proof of verified attendance. Only the designated reviewer or backend workflow can change its state.
- Location verification denotes a geofence check with a valid browser GPS fix. It is not a guarantee of a person's physical identity or proof against device spoofing.
- For large institutions, ask the administrator about server-side pagination and whether the reporting window has reached its backend record limit.

## Maintainer checklist

- Run `npm test` and `CI=true npm run build` for changes to report filters, exports or layout.
- Check with a Student account and a staff account: student views must remain role-scoped.
- Verify that exports never contain records outside the authenticated user's permitted dataset.
- Do not log raw attendance reports or GPS coordinates in frontend analytics.
- Perform AppDeploy-backed integration testing for any backend permission or geofence change before production deployment.
