# Complete Fix for Procedure Implementation Issues in @evaluna/api package

## Problem Summary
Multiple procedure functions in the `@evaluna/api` package are incorrectly implemented as direct procedures instead of parameterized functions that return procedures. This causes TypeErrors during OpenAPI document generation when these procedures are called with parameters.

## Root Cause
In `packages/api/src/index.ts`, the following procedures are incorrectly implemented:
- `roleProcedure` - should accept allowed roles array
- `permissionProcedure` - should accept permission string  
- And potentially others that follow the same pattern

They are currently implemented as:
```typescript
export const someProcedure = t.procedure.use(async ({ ctx, next }) => {
  // ... implementation
});
```

But they should be implemented as parameterized functions that return procedures:
```typescript
export const someProcedure = (params) => {
  return t.procedure.use(async ({ ctx, next }) => {
    // ... implementation using params
  });
};
```

## Specific Fixes Needed

### 1. Fix roleProcedure
**Current (incorrect):**
```typescript
export const roleProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Should be:**
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

### 2. Fix permissionProcedure
**Current (incorrect):**
```typescript
export const permissionProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

**Should be:**
```typescript
export const permissionProcedure = (permission: string) => {
  return t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (!ctx.user.permissions?.includes(permission)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
};
```

### 3. Verify customerProcedure and protectedProcedure
These should remain as they are (direct procedures) since they are used without parameters:
- `customerProcedure` - used as `customerProcedure.method(...)`
- `protectedProcedure` - used as `protectedProcedure.method(...)`

## Why This Fixes the Build Errors
1. **Original Error**: `TypeError: (0 , m.roleProcedure) is not a function`
   - Occurred when OpenAPI generator tried to call `roleProcedure(["admin", "manager", "sales"])`
   - Fixed by making `roleProcedure` a function that accepts parameters

2. **New Error**: `TypeError: (0 , u.permissionProcedure) is not a function`  
   - Occurred when OpenAPI generator tried to call `permissionProcedure(somePermissionString)`
   - Fixed by making `permissionProcedure` a function that accepts parameters

## Files to Modify
- `packages/api/src/index.ts` - Fix both `roleProcedure` and `permissionProcedure` implementations

## Verification
After applying these fixes, the OpenAPI document generation at `/api/openapi.json` should work correctly, resolving both TypeError messages:
- `TypeError: (0 , m.roleProcedure) is not a function`
- `TypeError: (0 , u.permissionProcedure) is not a function`

## Implementation Notes
1. The `roleProcedure` fix checks if `ctx.user.role` is in the `allowedRoles` array
2. The `permissionProcedure` fix checks if `ctx.user.permissions` includes the specified permission
3. Both procedures maintain the initial authentication check (`if (!ctx.user)`)
4. Both procedures follow the same pattern as the working `superadminProcedure` and `requirePermission` functions