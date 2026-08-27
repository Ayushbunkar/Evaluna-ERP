# Engineering Rules

## Core Rule

Never consider a coding task complete immediately after writing code.

Every implementation must go through a complete verification cycle.

## Mandatory Workflow

For every coding task:

1. Understand the user's requirement.
2. Inspect the relevant project structure.
3. Identify existing code that will be affected.
4. Trace callers, callees, inputs, outputs, APIs, database operations, and dependencies.
5. Identify risks and edge cases.
6. Make the smallest correct implementation.
7. Review every changed file.
8. Review every changed function.
9. Review every changed parameter.
10. Verify type compatibility.
11. Verify data flow.
12. Verify error handling.
13. Verify null/empty/missing/invalid inputs.
14. Verify boundary conditions.
15. Verify external API assumptions.
16. Verify database assumptions.
17. Verify authentication/authorization assumptions where applicable.

## Verification

After implementation, run all applicable project checks:

- tests
- lint
- formatting
- type checking
- build
- relevant integration checks
- relevant runtime checks

Do not skip checks simply because the change appears small.

## Failure Loop

If any verification fails:

1. Read the failure.
2. Identify the root cause.
3. Fix the implementation.
4. Run the failed check again.
5. Run all other relevant checks again.
6. Review the final diff again.

Repeat until all applicable checks pass.

## No False Completion

Never say that a task is complete when:

- tests are failing
- the build is failing
- type checking is failing
- linting is failing
- an important verification step was skipped
- an implementation assumption has not been verified
- a known bug remains

If a check cannot be executed, explicitly state that it could not be executed.

Do not hide skipped verification.

## Code Quality

Prefer:

- simple implementations
- existing project patterns
- reusable functions
- clear error handling
- correct typing
- minimal unnecessary changes
- backward compatibility where appropriate

Avoid:

- unnecessary rewrites
- speculative changes
- duplicated logic
- ignoring existing abstractions
- changing unrelated files

## Final Review

Before declaring completion:

1. Inspect the final diff.
2. Check for accidental changes.
3. Check for debugging code.
4. Check for hardcoded secrets.
5. Check imports.
6. Check unused variables.
7. Check error handling.
8. Check API contracts.
9. Check database queries/migrations when relevant.
10. Check frontend/backend compatibility when relevant.
11. Confirm that the original requirement is actually satisfied.

Only after this review may the task be considered complete.

## Final Report

At the end of every implementation task, provide:

### Changes
What was changed.

### Verification
- Tests: PASS/FAIL/SKIPPED
- Lint: PASS/FAIL/SKIPPED
- Typecheck: PASS/FAIL/SKIPPED
- Build: PASS/FAIL/SKIPPED
- Integration: PASS/FAIL/SKIPPED

### Problems Found
List problems discovered during verification.

### Fixes Applied
List fixes made after verification.

### Remaining Issues
List anything that could not be verified.

### Final Status
VERIFIED / PARTIALLY VERIFIED / NOT VERIFIED




    