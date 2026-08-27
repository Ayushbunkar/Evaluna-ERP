---
name: deep-code-verification
description: Perform deep implementation verification after coding changes, including parameter checks, data-flow checks, tests, linting, type checking, builds, integration verification, edge-case analysis, and final diff review.
compatibility: opencode
---

# Deep Code Verification

You are responsible for verifying implementations, not merely reviewing whether the code looks reasonable.

## Objective

After any meaningful implementation, perform a complete engineering verification cycle.

The implementation is not considered finished until the verification process has been completed.

## Phase 1 — Understand

Before verification:

- Read the user's requested behavior.
- Identify the expected result.
- Identify affected functionality.
- Identify affected files.
- Identify dependencies.
- Identify APIs.
- Identify database interactions.
- Identify frontend/backend boundaries where applicable.

## Phase 2 — Inspect

Inspect:

- changed files
- related files
- callers
- callees
- interfaces
- types
- schemas
- configuration
- environment variables
- tests
- API contracts
- database models
- database queries
- error-handling paths

Do not review a changed function in isolation when surrounding code affects its behavior.

## Phase 3 — Parameter Verification

For every changed function or API:

Check:

- parameter names
- parameter types
- optional parameters
- default values
- required parameters
- null handling
- empty values
- invalid values
- returned values
- callers
- downstream consumers

Check that changing one parameter does not silently break another part of the system.

## Phase 4 — Data Flow Verification

Trace important data from:

INPUT
→ validation
→ transformation
→ business logic
→ storage/API
→ response
→ consumer

Verify that:

- data is not lost
- data is not unexpectedly modified
- types remain compatible
- required fields remain present
- errors are handled correctly

## Phase 5 — Edge Cases

Consider applicable cases such as:

- null
- undefined
- empty strings
- empty arrays
- missing fields
- duplicate data
- invalid input
- very large input
- zero
- negative values
- boundary values
- timeout
- network failure
- API failure
- database failure
- permission failure
- concurrent requests

Only test cases relevant to the actual implementation.

## Phase 6 — Automated Verification

Run the project's applicable commands.

Prefer existing project scripts.

Run:

1. tests
2. lint
3. formatting checks
4. type checking
5. build
6. integration tests
7. relevant runtime checks

Do not invent commands blindly.

Inspect package.json, pyproject.toml, Makefile, README, CI configuration, or equivalent project files to determine the correct commands.

## Phase 7 — Failure Handling

When a command fails:

1. Read the complete error.
2. Locate the source of the failure.
3. Determine the root cause.
4. Fix the code.
5. Re-run the failed command.
6. Re-run other affected checks.
7. Inspect the diff again.

Do not stop after fixing the first reported error if additional verification remains.

## Phase 8 — Final Diff Review

Review all changed files.

Check for:

- accidental edits
- debug statements
- temporary code
- hardcoded credentials
- incorrect imports
- unused imports
- unused variables
- incorrect types
- duplicated logic
- dead code
- incomplete branches
- incorrect error handling
- unrelated modifications

## Phase 9 — Requirement Verification

Compare the implementation against the original requirement line by line.

For every requirement:

REQUIREMENT
→ IMPLEMENTED?
→ VERIFIED?
→ TESTED?

A requirement that is implemented but not verified must not be marked fully verified.

## Completion Rule

Use this final classification:

VERIFIED
- all applicable checks pass
- original requirements are satisfied
- final diff reviewed

PARTIALLY VERIFIED
- some checks could not be executed
- clearly state which ones

NOT VERIFIED
- important checks failed
- unresolved implementation problems remain

Never report VERIFIED when mandatory verification failed.