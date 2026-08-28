# Fix for roleProcedure in @evaluna/api package

## Problem
The `roleProcedure` in the `@evaluna/api` package is incorrectly implemented as a direct procedure instead of a function that accepts role parameters and returns a procedure. This causes a TypeError during OpenAPI document generation when the customer router tries to use `roleProcedure(["admin", "manager", "sales"])`.

## Location
File: `packages/api/src/index.ts`
Function: `roleProcedure` (approximately lines 36-41)

## Current Incorrect Implementation
```typescript
export const roleProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

## Required Fix
```typescript
export const roleProcedure = (allowedRoles: string[]) => {
  return t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
};
```

## Why This Fixes the Issue
1. Changes `roleProcedure` from a direct procedure to a function that accepts role parameters
2. Returns a procedure that properly checks if the user's role is in the allowed roles list
3. Allows the OpenAPI generation process to correctly analyze `roleProcedure(["admin", "manager", "sales"])` as a valid function call
4. Maintains proper role-based access control functionality

## Verification
After applying this fix, the OpenAPI document generation at `/api/openapi.json` should work correctly, and the build error:
```
TypeError: (0 , m.roleProcedure) is not a function
```
will be resolved.