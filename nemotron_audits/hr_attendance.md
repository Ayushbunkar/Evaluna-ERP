I need to analyze the provided code for HR/ATTENDANCE audit issues. Let me go through the code systematically, focusing on the areas specified in the specialization.

First, let me identify the relevant files for HR/ATTENDANCE:

1. Attendance-related files:
   - apps/web/src/app/hr/attendance/page.tsx
   - apps/web/src/app/manager/attendance/page.tsx
   - apps/web/src/app/admin/attendance/page.tsx
   - apps/web/src/app/(shared)/attendance/page.tsx (self-service attendance)
   - apps/web/src/app/hr/attendance-control/page.tsx
   - apps/web/src/lib/trpc/routers/attendance.ts (in .hrms_disabled)
   - apps/web/src/lib/trpc/util/attendance.ts
   - apps/web/src/lib/attendance-storage.ts
   - apps/web/src/app/api/attendance/upload/route.ts
   - apps/web/src/app/hr/attendance-control/page.tsx
   - apps/web/src/app/(dashboards)/hr/layout.tsx
   - apps/web/src/app/(dashboards)/manager/layout.tsx
   - apps/web/src/app/(dashboards)/admin/layout.tsx
   - apps/web/src/app/hr/layout.tsx
   - apps/web/src/app/manager/layout.tsx
   - apps/web/src/app/admin/layout.tsx
   - apps/web/src/components/layout/Navbar.tsx
   - apps/web/src/app/staff/page.tsx
   - apps/web/src/app/manager/staff/page.tsx
   - apps/web/src/app/admin/staff/page.tsx
   - apps/web/src/scripts/attendance-retention.ts
   - apps/web/src/scripts/provision-attendance.ts
   - packages/db/src/schema/attendance-enhanced.ts
   - packages/db/src/schema/hrms.ts (attendance table)
   - packages/api/src/routers/.hrms_disabled/attendance.router.ts
   - packages/api/src/routers/.hrms_disabled/shifts.router.ts
   - packages/api/src/routers/.hrms_disabled/employees.router.ts
   - packages/api/src/routers/.hrms_disabled/departments.router.ts
   - packages/api/src/routers/.hrms_disabled/designations.router.ts
   - packages/api/src/routers/.hrms_disabled/leave.router.ts
   - packages/api/src/routers/.hrms_disabled/payroll.router.ts
   - packages/api/src/routers/.hrms_disabled/holidays.router.ts
   - packages/db/src/schema/index.ts (exports attendance-enhanced)
   - packages/db/drizzle.config.ts (includes attendance-enhanced schema)
   - packages/api/src/routers/.hrms_disabled/index.ts (exports attendance.router)

Let me now analyze these files for HR/ATTENDANCE issues, focusing on:
- employees
- attendance
- check-in/check-out
- leave
- half-day
- shifts
- working hours
- permissions
- employee assignment
- payroll-related logic
- location restrictions
- duplicate attendance
- concurrent attendance actions

I'll look for CRITICAL and HIGH issues first.

Starting with the attendance-enhanced schema:

In packages/db/src/schema/attendance-enhanced.ts:
- I see the enhancedAttendance table with fields like checkIn, checkOut, checkInGPS, checkOutGPS, etc.
- There's a status field with enum including "present", "absent", "half_day", etc.
- There's a riskScore field and riskReasons
- There's a distanceFromOffice field
- There are relations to employees and branches
- There's an attendanceBreaks table
- There's a registeredDevices table
- There's a branchGeofences table
- There's an attendanceSettings table

This looks comprehensive for an enhanced attendance system.

Now let's look at the attendance router in packages/api/src/routers/.hrms_disabled/attendance.router.ts:

This is the legacy attendance router (marked as .hrms_disabled). It uses the old attendance table from hrms.ts, not the enhanced one.

Key issues I notice:
1. In the checkIn procedure:
   - It checks for existing attendance with isNull(attendance.checkOut) to prevent duplicate check-in
   - It checks for holidays and week offs
   - It sets status based on holiday/week off
   - It inserts a new attendance record

2. In the checkOut procedure:
   - It updates the attendance record setting checkOut time
   - It checks for existing check-in with isNull(attendance.checkOut)

3. There are startBreak and endBreak procedures

4. There are getDaily, getMonthly, and getStatus procedures

Potential issues:
- The checkIn procedure doesn't seem to check if the employee is already checked out for the day (it only checks for null checkOut)
- However, it does check for isNull(attendance.checkOut) which should prevent duplicate check-in if there's an existing check-in without check-out
- But what if there's a completed attendance record (with both checkIn and checkOut)? The query would not find it because it requires isNull(attendance.checkOut), so it would allow a new check-in for the same day even after a previous shift was completed.

Let me check the query again:
```typescript
const existing = await db.query.attendance.findFirst({
  where: and(
    eq(attendance.employeeId, input.employeeId),
    eq(attendance.date, date),
    isNull(attendance.checkOut),
  ),
});
```

This only prevents check-in if there's an existing record for today with no check-out time. If an employee has already completed a shift (both check-in and check-out), this query would return null, allowing a new check-in for the same day.

This could be intentional (allowing multiple shifts per day), but typically attendance systems prevent multiple check-ins per day without managerial approval.

However, looking at the enhanced attendance system, it seems designed for a single shift per day with the enhancedAttendance table.

Let me check the enhanced attendance router - but I don't see one in the provided code. The attendance router in .hrms_disabled seems to be the legacy one.

Now let's look at the self-service attendance page: apps/web/src/app/(shared)/attendance/page.tsx

This uses the enhanced attendance system via trpc.attendance.* procedures.

Key parts:
- It captures GPS and image
- It calls checkIn/checkOut mutations
- It has startBreak/endBreak mutations
- It uses server time for calculations

Let me check the TRPC util for attendance: apps/web/src/lib/trpc/util/attendance.ts

This contains the backend-authoritative attendance logic.

Key functions:
- loadSettings: loads attendance settings
- validateGeofence: validates GPS against branch geofence
- assessRisk: calculates risk score for spoofing detection
- isDeviceApproved: checks if device is registered/approved
- getShift: resolves current shift state
- assertShiftTransition: guards shift transitions
- serverDateParts: gets date/time parts
- resolveEmployeeId: resolves employee ID from email

This looks solid for preventing spoofing and ensuring proper shift transitions.

Now let's look at the attendance storage: apps/web/src/lib/attendance-storage.ts

This handles image storage for attendance check-in/check-out.

Key functions:
- storeAttendanceImage: stores attendance images with validation
- purgeExpiredImages: deletes old attendance image files while keeping metadata

This looks good - it follows the same pattern as the finance upload route with MIME whitelist, size limits, etc.

Now let's look at the attendance upload route: apps/web/src/app/api/attendance/upload/route.ts

This handles image upload for attendance.

Key points:
- It requires authentication
- It validates the file is an image
- It calls storeAttendanceImage
- It returns the attachment ID

This looks correct.

Now let's look at the provisioning script: apps/web/src/scripts/provision-attendance.ts

This provisions the attendance module:
1. Syncs role permissions
2. Ensures attendance settings row exists
3. Provisions employees from staff
4. Adds unique index on enhanced_attendance(employee_id, date)

The unique index is important for preventing duplicate attendance records at the database level.

However, I notice a potential issue: the provisioning script tries to add a unique index, but if there are existing duplicate rows, it will skip the index creation with a warning.

Let me check if there's any other duplicate prevention.

In the attendance util, I see in getShift function:
```typescript
const rows = await db
  .select()
  .from(enhancedAttendance)
  .where(
    and(
      eq(enhancedAttendance.employeeId, employeeId),
      eq(enhancedAttendance.date, date),
    ),
  )
  .limit(1);
```

This assumes at most one record per employee per day, which aligns with the unique index intention.

But in the legacy attendance router, there's no such protection at the DB level - only the application-level check for existing check-in without check-out.

Now let's look for specific issues:

CRITICAL issues would be things that could lead to security vulnerabilities, data corruption, or major functionality failures.

HIGH issues would be significant bugs or weaknesses that could cause problems but aren't catastrophic.

Let me go through the code more carefully.

First, let's check the legacy attendance router for duplicate check-in issue:

In packages/api/src/routers/.hrms_disabled/attendance.router.ts, checkIn procedure:

```typescript
// Check if already checked in today
const existing = await db.query.attendance.findFirst({
  where: and(
    eq(attendance.employeeId, input.employeeId),
    eq(attendance.date, date),
    isNull(attendance.checkOut),
  ),
});

if (existing) {
  throw new TRPCError({
    code: "CONFLICT",
    message: "Already checked in today",
  });
}
```

This prevents check-in if there's an existing record for today with no check-out time. However, if an employee has already completed a shift (both check-in and check-out recorded), this query would return null, allowing a new check-in for the same day.

Is this intended? In many attendance systems, employees can have multiple shifts per day (e.g., morning and evening shifts). But typically, this would require some kind of approval or be restricted to certain roles.

However, looking at the enhanced attendance system, it seems designed for a single shift per day:
- The enhancedAttendance table has one checkIn and one checkOut per record
- The provisioning script adds a unique index on (employee_id, date)
- The getShift function in the util assumes at most one record per employee per day

This suggests that the legacy attendance router might be inconsistent with the intended design.

But wait - the legacy attendance router is in .hrms_disabled, which suggests it's disabled or deprecated. Let me check if it's actually being used.

Looking at packages/api/src/routers/.hrms_disabled/index.ts:
```typescript
export * from "./attendance.router";
export * from "./departments.router";
export * from "./designations.router";
export * from "./employees.router";
export * from "./holidays.router";
export * from "./leave.router";
// export * from "./overtime.router";
export * from "./payroll.router";
export * from "./shifts.router";
```

And in packages/api/src/routers/index.ts (not shown in provided code, but likely exists), it probably doesn't include the .hrms_disabled routers.

Let me check if there's a main routers index:

Not directly provided, but in apps/web/src/lib/trpc/init.ts (not shown), it likely imports from the main routers.

Given that the attendance router is in .hrms_disabled, it's probably not being used in the current implementation. The current implementation likely uses the enhanced attendance system via the TRPC procedures in apps/web/src/lib/trpc/util/attendance.ts and the corresponding TRPC router.

Let me look for the enhanced attendance TRPC router.

I don't see an explicit attendance router in the provided code that uses the enhanced attendance system. However, looking at apps/web/src/app/(shared)/attendance/page.tsx, it uses:

```typescript
const { data: today, isLoading } = trpc.attendance.getToday.useQuery(undefined, {
  refetchInterval: 60000,
});
```

And mutations like:
```typescript
const checkIn = trpc.attendance.checkIn.useMutation({
  // ...
});
```

So there must be an attendance TRPC router somewhere.

Let me search for it in the provided code...

I don't see a specific attendance router file, but looking at apps/web/src/lib/trpc/routers/index.ts:

```typescript
import { router } from "../init";
import { clientSettingsRouter } from "./client-settings";
import { permissionsRouter } from "./permissions";
import { settingsRouter } from "./settings";
import { salaryRouter } from "./salary";
import { payslipRouter } from "./payslip";
import { paymentBatchRouter } = from "./payment-batch";
import { payrollVarianceRouter } = from "./payroll-variance";
import { payrollLockRouter } = from "./payroll-lock";
import { payrollEnhancedRouter } = from "./payroll-enhanced";

export const appRouter = router({
  settings: settingsRouter,
  clientSettings: clientSettingsRouter,
  permissions: permissionsRouter,
  salary: salaryRouter,
  payslip: payslipRouter,
  paymentBatch: paymentBatchRouter,
  payrollVariance: payrollVarianceRouter,
  payrollLock: payrollLockRouter,
  payrollEnhanced: payrollEnhancedRouter,
});
```

No attendance router here. But in the navbar, we see:

```typescript
const { data: statusData } = trpc.attendance.myStatus.useQuery();
```

And in apps/web/src/app/hr/layout.tsx, there's a link to "/hr/attendance".

Let me check if there's an attendance router in the main trpc routers...

Actually, looking at apps/web/src/lib/trpc/routers/__tests__/attendance.test.ts, it imports:

```typescript
const { attendanceRouter } = await import("../attendance");
```

So there should be an attendance router at apps/web/src/lib/trpc/routers/attendance.ts.

But I don't see that file in the provided code. Let me double-check...

Looking through the provided code snippets, I don't see apps/web/src/lib/trpc/routers/attendance.ts.

However, I do see:
- apps/web/src/lib/trpc/routers/attendance.test.ts (which tests the attendance router)
- apps/web/src/lib/trpc/util/attendance.ts (the utility functions)

This suggests the attendance router might be missing from the provided code snippets, or it's elsewhere.

Let me check if it's in the .hrms_disabled folder but actually being used...

No, the .hrms_disabled folder is explicitly for disabled routers.

Let me look for any reference to attendance in the main routers...

Actually, in apps/web/src/lib/trpc/routers/index.ts, I don't see attendance, but let me check if there's another file.

Wait, I see in the provided code:
apps/web/src/lib/trpc/routers/payroll.ts
apps/web/src/lib/trpc/routers/payroll-lock.ts
apps/web/src/lib/trpc/routers/payroll-variance.ts
apps/web/src/lib/trpc/routers/payroll-enhanced.ts

But no attendance router.

However, in apps/web/src/app/(shared)/attendance/page.tsx, it's using trpc.attendance.*, so the router must exist.

Let me look for it in the provided code again... I might have missed it.

Actually, looking at the very beginning of the provided code, I see:

===== apps\web\src\lib\trpc\routers\index.ts =====

But that doesn't include attendance.

Let me check if there's a separate attendance router file that wasn't included in the provided snippets...

Given that there's an attendance.test.ts file that imports "../attendance", there must be an attendance.ts file in the same directory.

Since it's not in the provided code, I'll have to assume it exists and works correctly, or note it as an uncertain item.

But for the audit, I should focus on what's provided.

Let me look at the attendance util again for potential issues.

In apps/web/src/lib/trpc/util/attendance.ts, the getShift function:

```typescript
export async function getShift(db: DB, employeeId: number, date: string) {
  const rows = await db
    .select()
    .from(enhancedAttendance)
    .where(
      and(
        eq(enhancedAttendance.employeeId, employeeId),
        eq(enhancedAttendance.date, date),
      ),
    )
    .limit(1);
  const row = rows[0] ?? null;

  // ... rest of function
}
```

This uses .limit(1) and takes the first row, assuming there's at most one record per employee per day.

This is consistent with the unique index that the provisioning script tries to create.

Now, let's look at the assertShiftTransition function:

```typescript
export function assertShiftTransition(
  current: ShiftState,
  allowedFrom: ShiftState[],
  action: string,
): void {
  if (!allowedFrom.includes(current)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Cannot ${action}: shift is "${current}" (allowed from: ${allowedFrom.join(", ")}).`,
    });
  }
}
```

This properly guards against illegal state transitions.

Now, let's look at the checkIn and checkOut mutations in the self-service attendance page to see how they use these functions.

But since I don't have the actual TRPC router implementation for attendance, I'll have to infer from the util and the usage.

From apps/web/src/app/(shared)/attendance/page.tsx:

```typescript
const checkIn = trpc.attendance.checkIn.useMutation({
  onSuccess: (r) => {
    stopCamera();
    utils.attendance.getToday.invalidate();
    toast.success(
      r.flagged
        ? "Checked in — flagged for HR review (verification pending)."
        : `Checked in at ${r.checkInTime} (${r.distance ?? 0}m from site).`,
    );
  },
  onError: (e) => toast.error(e.message),
});
```

And the doCheck function:

```typescript
const doCheck = useCallback(
  async (kind: "checkIn" | "checkOut") => {
    if (kind === "checkIn" && !activeBranchId) {
      toast.error("Select your branch first.");
      return;
    }
    setBusy(true);
    try {
      const gps = await captureGps();
      const imageAttachmentId = await captureAndUpload(kind);
      const device = deviceFingerprint();
      if (kind === "checkIn")
        await checkIn.mutateAsync({
          branchId: activeBranchId as number,
          gps,
          imageAttachmentId,
          device,
        });
      else await checkOut.mutateAsync({ gps, imageAttachmentId, device });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  },
  [activeBranchId, captureAndUpload, checkIn, checkOut],
);
```

This shows that the checkIn mutation expects branchId, gps, imageAttachmentId, and device.

Now, let's look for potential issues in the provided code.

One thing I notice in the attendance util: in the assessRisk function, there's:

```typescript
if (input.gps.deviceTimestamp) {
  const drift = Math.abs(
    input.serverNow.getTime() - new Date(input.gps.deviceTimestamp).getTime(),
  );
  if (drift > 5 * 60 * 1000) {
    score += 25;
    reasons.push("device_clock_drift");
  }
}
```

This checks for device clock drift > 5 minutes, which seems reasonable.

Another thing: in validateGeofence:

```typescript
export async function validateGeofence(
  db: DB,
  branchId: number,
  gps: GpsEvidence,
  minAccuracy: number,
): Promise<GeoResult> {
  if (gps.accuracy == null || gps.accuracy <= 0 || gps.accuracy > minAccuracy) {
    return { ok: false, distance: null, radius: null, reason: "gps_error" };
  }

  const rows = await db
    .select()
    .from(branchGeofences)
    .where(
      and(
        eq(branchGeofences.branchId, branchId),
        eq(branchGeofences.isActive, true),
      ),
    )
    .limit(1);
  const fence = rows[0];
  if (!fence) {
    return { ok: false, distance: null, radius: null, reason: "no_geofence" };
  }

  const distance = haversineDistance(
    gps.latitude,
    gps.longitude,
    Number(fence.latitude),
    Number(fence.longitude),
  );
  const radius = fence.radius ?? 100;
  return {
    ok: distance <= radius,
    distance: Math.round(distance * 100) / 100,
    radius,
    reason: distance <= radius ? undefined : "outside_geofence",
  };
}
```

This looks correct - it validates GPS accuracy first, then checks if there's an active geofence for the branch, then calculates distance.

Now, let's look at the attendance storage for issues.

In apps/web/src/lib/attendance-storage.ts, the storeAttendanceImage function:

```typescript
export async function storeAttendanceImage(
  db: DB,
  params: {
    buffer: Buffer;
    mime: string;
    originalName: string;
    branchId: number | null;
    entityType: string;
    uploadedBy: string;
  },
): Promise<{ id: number; storagePath: string }> {
  const ext = ATTENDANCE_ALLOWED_MIME[params.mime];
  if (!ext) {
    throw new Error("Unsupported image type. Allowed: JPG, PNG, WEBP.");
  }
  if (params.buffer.length <= 0 || params.buffer.length > ATTENDANCE_MAX_BYTES) {
    throw new Error("Image must be between 1 byte and 8 MB.");
  }

  const branchSeg = params.branchId != null ? `b${params.branchId}` : "shared";
  const storedName = `${randomUUID()}${ext}`;
  const relDir = path.join(branchSeg, params.entityType);
  const absDir = path.join(attendanceUploadRoot(), relDir);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, storedName), params.buffer);

  const relPath = path.join(relDir, storedName).split(path.sep).join("/");
  const [row] = await db
    .insert(attachments)
    .values({
      branch_id: params.branchId ?? null,
      entity_type: params.entityType,
      entity_id: null,
      file_name: params.originalName.slice(0, 255),
      stored_name: storedName,
      mime_type: params.mime,
      file_size: params.buffer.length,
      storage_path: relPath,
      uploaded_by: params.uploadedBy,
    })
    .returning();
  return { id: row.id, storagePath: relPath };
}
```

This looks good - it validates MIME type and size, uses random stored name, creates directory if needed, writes file, and inserts into attachments table.

The purgeExpiredImages function:

```typescript
export async function purgeExpiredImages(db: DB): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays());

  const rows = await db
    .select({
      id: attachments.id,
      storagePath: attachments.storage_path,
      entityType: attachments.entity_type,
      isDeleted: attachments.is_deleted,
    })
    .from(attachments)
    .where(lt(attachments.created_at, cutoff));

  let purged = 0;
  for (const r of rows) {
    if (
      r.isDeleted === true ||
      r.storagePath == null ||
      !String(r.entityType ?? "").startsWith("attendance_")
    ) {
      continue;
    }
    try {
      await unlink(path.join(attendanceUploadRoot(), r.storagePath));
    } catch {
      // file may already be gone; still mark metadata below
    }
    await db
      .update(attachments)
      .set({ is_deleted: true, deleted_at: new Date() })
      .where(eq(attachments.id, r.id));
    purged++;
  }
  return purged;
}
```

This marks images as deleted in the database after deleting the file, which is good for audit trail.

Now, let's look at the attendance upload route:

apps/web/src/app/api/attendance/upload/route.ts

```typescript
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") || "checkIn");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No image provided" }, { status: 400 });

  const entityType =
    kind === "checkOut" ? ATTENDANCE_ENTITY.checkOut : ATTENDANCE_ENTITY.checkIn;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await storeAttendanceImage(db, {
      buffer,
      mime: file.type,
      originalName: file.name || "attendance.jpg",
      branchId: user.branchId ?? null,
      entityType,
      uploadedBy: user.userId,
    });
    return NextResponse.json({ id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

This looks correct - it authenticates the user, validates the file, and calls storeAttendanceImage.

Now, let's look at the provisioning script for potential issues:

apps/web/src/scripts/provision-attendance.ts

```typescript
async function addUniqueIndex() {
  try {
    await db.execute(
      sql.raw(
        `CREATE UNIQUE INDEX IF NOT EXISTS uniq_enhanced_attendance_emp_date ON enhanced_attendance (employee_id, date);`,
      ),
    );
    console.log("  enhanced_attendance: (employee_id, date) unique index ensured");
  } catch (err) {
    console.warn(
      `  ! unique index skipped (existing duplicates?): ${
        err instanceof Error ? err.message : String(err)
      }. App-level duplicate check still applies.`,
    );
  }
}
```

This tries to create a unique index, but if it fails (likely due to existing duplicates), it just warns and continues.

The comment says "App-level duplicate check still applies", but let's check if there is an app-level duplicate check.

In the attendance util, the getShift function assumes at most one record per employee per day (by using .limit(1)), but it doesn't actively prevent creating duplicates - it just uses the first one it finds.

However, if there's a unique index at the DB level, duplicates would be prevented by the database.

But if the index creation fails due to existing duplicates, and there's no app-level prevention, then duplicates could still be created.

Let me check if there's any app-level prevention of duplicate enhancedAttendance records.

Looking at the attendance util, I don't see a function that checks for existing enhancedAttendance records before creating a new one.

The getShift function fetches the existing record, but it's used to determine the current state, not to prevent duplicates.

In the self-service attendance page, when checking in, it doesn't seem to check if there's already an attendance record for today - it just proceeds to call the checkIn mutation.

This suggests that the duplicate prevention is relying solely on the database unique index.

If the unique index creation fails due to existing duplicates, and there's no app-level check, then the system could allow duplicate attendance records for the same employee on the same day.

This could be a HIGH issue.

Let me verify this by looking at how the checkIn mutation is implemented.

Since I don't have the actual TRPC router for attendance, I'll have to look for clues.

In apps/web/src/lib/trpc/util/attendance.ts, there's no checkIn function - it's all in the util for validation, but the actual mutation would be in the TRPC router.

However, I do see in the util:

```typescript
/** Guard a shift transition; throws CONFLICT for an illegal move. */
export function assertShiftTransition(
  current: ShiftState,
  allowedFrom: ShiftState[],
  action: string,
): void {
  if (!allowedFrom.includes(current)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Cannot ${action}: shift is "${current}" (allowed from: ${allowedFrom.join(", ")}).`,
    });
  }
}
```

And in getShift:

```typescript
export async function getShift(db: DB, employeeId: number, date: string) {
  const rows = await db
    .select()
    .from(enhancedAttendance)
    .where(
      and(
        eq(enhancedAttendance.employeeId, employeeId),
        eq(enhancedAttendance.date, date),
      ),
    )
    .limit(1);
  const row = rows[0] ?? null;

  let activeBreak: { id: number; type: string } | null = null;
  if (row) {
    const br = await db
      .select({ id: attendanceBreaks.id, type: attendanceBreaks.type })
      .from(attendanceBreaks)
      .where(
        and(
          eq(attendanceBreaks.attendanceId, row.id),
          isNull(attendanceBreaks.endTime),
        ),
      )
      .limit(1);
    activeBreak = br[0] ?? null;
  }

  let state: ShiftState = "NOT_STARTED";
  if (row) {
    if (row.checkOut) state = "COMPLETED";
    else if (activeBreak)
      state = activeBreak.type === "lunch" ? "ON_LUNCH" : "ON_BREAK";
    else if (row.checkIn) state = "CHECKED_IN";
  }
  return { row, activeBreak, state };
}
```

This suggests that the checkIn mutation would:
1. Get the current shift state using getShift
2. Assert that the transition from current state to CHECKED_IN is allowed
3. If allowed, create a new enhancedAttendance record or update an existing one?

Wait, if getShift returns a row (meaning there's already an attendance record for today), then:
- If row.checkOut exists, state is COMPLETED
- If activeBreak exists, state is ON_BREAK or ON_LUNCH
- If row.checkIn exists but no checkOut and no activeBreak, state is CHECKED_IN

For a checkIn action to be valid, the current state should be NOT_STARTED (from the shift lifecycle).

Let me think about the shift lifecycle:
- NOT_STARTED -> CHECKED_IN (valid)
- CHECKED_IN -> ON_BREAK or ON_LUNCH (valid)
- ON_BREAK -> CHECKED_IN (valid, after break)
- ON_LUNCH -> CHECKED_IN (valid, after lunch)
- CHECKED_IN -> COMPLETED (valid, via checkOut)

So checkIn should only be allowed from NOT_STARTED state.

If there's already an attendance record for today with no checkOut (CHECKED_IN state), then checkIn should not be allowed.

If there's already an attendance record for today with checkOut (COMPLETED state), then checkIn should not be allowed (unless multiple shifts per day are allowed).

If there's already an attendance record for today with an active break (ON_BREAK or ON_LUNCH), then checkIn should not be allowed (should end break first).

So the getShift function, combined with assertShiftTransition, should prevent invalid checkIn attempts.

But what about creating a new record vs updating an existing one?

If there's already an attendance record for today (e.g., from a previous incomplete shift), then checkIn should update that record's checkIn time, not create a new record.

If there's no attendance record for today, then checkIn should create a new record.

The unique index on (employee_id, date) would prevent creating a second record for the same employee and date, which is correct.

So if the unique index exists, duplicates are prevented at the DB level.

If the unique index doesn't exist (because creation failed due to existing duplicates), then the app-level logic should still prevent creating a second record by:
- When checking in, if there's already a record for today, update it instead of creating a new one
- But only if the current state allows transitioning to CHECKED_IN

Let me see if the attendance util has logic for this.

I don't see the actual mutation implementation, but based on the getShift function and the shift logic, it seems designed to work with at most one record per employee per day.

Now, let's look at the provisioning script warning: "App-level duplicate check still applies"

This suggests that the developers believe there is an app-level duplicate check.

Let me see if I can find it.

In the attendance util, there's no explicit function that prevents creating a duplicate record, but the shift logic implicitly does it by only allowing checkIn from NOT_STARTED state, and if there's already a record, the state wouldn't be NOT_STARTED.

Specifically:
- If there's a completed record (checkIn and checkOut), state is COMPLETED -> checkIn not allowed
- If there's a record with checkIn but no checkOut and no active break, state is CHECKED_IN -> checkIn not allowed
- If there's a record with an active break, state is ON_BREAK or ON_LUNCH -> checkIn not allowed
- Only if there's no record (state NOT_STARTED) or perhaps a record that's been abandoned in some way? would checkIn be allowed

Wait, what if there's a record with checkIn and checkOut (COMPLETED), but the employee wants to start a new shift? That would be a different scenario.

But for the standard case of one shift per day, the logic should prevent duplicate checkIn.

However, there's a potential edge case: what if there's a record with checkIn but no checkOut (CHECKED_IN state), but the checkIn was from a previous day due to a bug? No, the record is keyed by date, so it's for today.

Actually, the record is for a specific date, so if it's COMPLETED, it means the shift was completed today, so checkIn for a new shift today shouldn't be allowed.

If the business allows multiple shifts per day, then the system would need to be designed differently, but the unique index on (employee_id, date) suggests it's intended for one shift per day.

Given that, the app-level logic in getShift and assertShiftTransition should prevent invalid state transitions, which includes preventing checkIn when not in NOT_STARTED state.

So even if the unique index creation fails, the app-level logic should prevent creating a second record for the same employee and date, because:
- To create a second record, you'd have to be in a state that allows checkIn (NOT_STARTED)
- But if there's already a record for today, the state wouldn't be NOT_STARTED (it would be CHECKED_IN, COMPLETED, ON_BREAK, or ON_LUNCH)
- So assertShiftTransition would throw a CONFLICT error

Therefore, the app-level duplicate check does exist through the state machine.

The provisioning script's comment is correct.

Now, let's look for other issues.

Let me check the leave functionality, since it's part of HR/ATTENDANCE.

In packages/api/src/routers/.hrms_disabled/leave.router.ts:

This is the legacy leave router.

Key procedures:
- getLeaveTypes
- createLeaveType
- applyLeave
- approveLeave
- rejectLeave
- getEmployeeLeaves
- getTeamLeaves
- getLeaveBalance

In applyLeave:
```typescript
// Check if dates are valid
if (input.startDate > input.endDate) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "End date must be after start date",
  });
}

// Check leave balance
const leaveType = await db.query.leaveTypes.findFirst({
  where: eq(leaveTypes.id, input.leaveTypeId),
});

if (!leaveType) {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Leave type not found",
  });
}

// Calculate days
const days =
  Math.ceil(
    (input.endDate.getTime() - input.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
  ) + 1;

// Check if employee has enough balance
// (This would be more complex in a real system with leave balance tracking)

const [application] = await db
  .insert(leaveApplications)
  .values({
    employeeId: input.employeeId,
    leaveTypeId: input.leaveTypeId,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    status: "pending",
  })
  .returning();

return application;
```

I notice it calculates days but doesn't actually check the