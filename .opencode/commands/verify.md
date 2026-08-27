---
description: Deeply verify the current implementation and fix discovered issues
---

Perform a complete engineering verification of the current project changes.

Follow the deep-code-verification workflow.

Inspect the implementation and surrounding code.

Check:

- requirements
- architecture
- parameters
- types
- inputs
- outputs
- data flow
- error handling
- edge cases
- dependencies
- APIs
- database interactions
- frontend/backend contracts
- security-sensitive mistakes where relevant

Run all applicable project verification commands.

If anything fails:

1. identify the root cause
2. fix it
3. rerun the failed check
4. rerun all affected checks
5. review the final diff

Do not declare the work complete until verification has passed or every unexecutable check has been explicitly reported.