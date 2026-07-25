const fs = require('fs');
const path = require('path');

const targetFiles = [
  'apps/web/src/app/(dashboards)/sales/customers/page.tsx',
  'apps/web/src/app/(dashboards)/sales/orders/page.tsx',
  'apps/web/src/app/admin/cashier/page.tsx',
  'apps/web/src/app/admin/customers/page.tsx',
  'apps/web/src/app/admin/orders/page.tsx',
  'apps/web/src/app/admin/payment-methods/page.tsx',
  'apps/web/src/app/admin/products/page.tsx',
  'apps/web/src/app/manager/cashier/page.tsx',
  'apps/web/src/app/manager/customers/page.tsx',
  'apps/web/src/app/manager/inventory/page.tsx',
  'apps/web/src/app/manager/orders/page.tsx',
  'apps/web/src/app/manager/products/page.tsx',
];

let totalFixed = 0;

for (const relPath of targetFiles) {
  const file = path.join(__dirname, relPath);
  if (!fs.existsSync(file)) { console.log('SKIP (not found)', file); continue; }
  
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace:  mutationOptions: trpc.A.B.mutationOptions(),
  // With:     mutationFn: (variables: Parameters<typeof trpc.A.B.useMutation>[0]) => trpc.A.B.useMutation().mutateAsync(variables),
  // 
  // Actually, the correct pattern in React component is to use the useMutation hook at top level.
  // The simplest correct fix: replace  mutationOptions: trpc.A.B.mutationOptions()
  //                           with:    mutationFn: trpc.A.B.useMutation
  // But that also won't work since useMutation returns a result object, not a fn.
  //
  // Best approach: just inline all the useMutation calls replacing useCrudMutation blocks completely.
  // 
  // Pattern we have:
  //   const xMutation = useCrudMutation({
  //     mutationOptions: trpc.A.B.mutationOptions(),
  //     invalidateKeys,
  //     successMessage: t("xxx"),
  //     errorMessage: t("xxx"),
  //     onSuccess: () => ...,    <- optional
  //   });
  //
  // Replace with:
  //   const xMutation = trpc.A.B.useMutation({
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: invalidateKeys[0] });
  //       toast.success(t("xxx"));
  //       // optional onSuccess callback
  //     },
  //     onError: () => { toast.error(t("xxx")); },
  //   });
  //
  // This requires adding queryClient and toast imports.

  // Step 1: Convert mutationOptions: trpc.A.B.mutationOptions() -> mutationFn via temporary marker
  // We'll do a line-by-line replacement of the useCrudMutation call blocks.

  // Simple approach: regex replace just the mutationOptions property line
  // mutationOptions: trpc.A.B.mutationOptions(),
  // -> [TRPC_MUTATION: A.B]
  // Then reassemble as useMutation call.

  // Actually the simplest fix that will work: 
  // Keep useCrudMutation wrapper but give it a mutationFn that wraps an async call.
  // The problem is we need to call trpc.A.B.mutate which requires the hook pattern.
  //
  // REAL SOLUTION: Replace useCrudMutation with direct trpc hook calls.
  // Since each page has a fixed set of mutations, we can do this with regex.

  // Match pattern: 
  //   const NAME = useCrudMutation({
  //     mutationOptions: trpc.NAMESPACE.PROC.mutationOptions(),
  //     invalidateKeys,
  //     successMessage: SUCCESS,
  //     errorMessage: ERROR,
  //     onSuccess: ONSUCCESS,   <- optional
  //   });
  //
  // Replace with:
  //   const NAME = trpc.NAMESPACE.PROC.useMutation({
  //     onSuccess: () => { queryClient.invalidateQueries({ queryKey: invalidateKeys[0] }); toast.success(SUCCESS); ONSUCCESS },
  //     onError: () => { toast.error(ERROR); },
  //   });

  // We'll need to ensure queryClient and toast are imported.
  // Add imports if needed.

  // Replace useCrudMutation import with direct hook usage
  content = content.replace(
    /import \{ useCrudMutation \} from "@\/hooks\/use-crud-mutation";\r?\n/,
    'import { useQueryClient } from "@tanstack/react-query";\nimport { toast } from "sonner";\n'
  );

  // If useQueryClient is already imported, avoid duplicate
  content = content.replace(
    /import \{ useQueryClient \} from "@tanstack\/react-query";\nimport \{ useQueryClient \} from "@tanstack\/react-query";/,
    'import { useQueryClient } from "@tanstack/react-query";'
  );
  // Same for toast
  content = content.replace(
    /import \{ toast \} from "sonner";\nimport \{ toast \} from "sonner";/,
    'import { toast } from "sonner";'
  );

  // Add queryClient = useQueryClient() inside the component if not present
  // We'll add it after the trpc = useTRPC() line
  if (!content.includes('const queryClient = useQueryClient()')) {
    content = content.replace(
      /(const trpc = useTRPC\(\);)/,
      '$1\n  const queryClient = useQueryClient();'
    );
  }

  // Now replace each useCrudMutation block
  // Pattern with onSuccess:
  content = content.replace(
    /const (\w+) = useCrudMutation\(\{\s*mutationOptions: trpc\.(\w+)\.(\w+)\.mutationOptions\(\),\s*invalidateKeys,\s*successMessage: ([^,]+),\s*errorMessage: ([^,]+),\s*onSuccess: ([^}]+),\s*\}\);/gs,
    (match, varName, ns, proc, succ, err, onSucc) => {
      return `const ${varName} = trpc.${ns}.${proc}.useMutation({\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: invalidateKeys[0] });\n      toast.success(${succ.trim()});\n      ${onSucc.trim().replace(/^[\(\)\s]+/, '').replace(/[\(\)\s]+$/, '')};\n    },\n    onError: () => { toast.error(${err.trim()}); },\n  });`;
    }
  );

  // Pattern without onSuccess:
  content = content.replace(
    /const (\w+) = useCrudMutation\(\{\s*mutationOptions: trpc\.(\w+)\.(\w+)\.mutationOptions\(\),\s*invalidateKeys,\s*successMessage: ([^,]+),\s*errorMessage: ([^,\}]+),\s*\}\);/gs,
    (match, varName, ns, proc, succ, err) => {
      return `const ${varName} = trpc.${ns}.${proc}.useMutation({\n    onSuccess: () => {\n      queryClient.invalidateQueries({ queryKey: invalidateKeys[0] });\n      toast.success(${succ.trim()});\n    },\n    onError: () => { toast.error(${err.trim()}); },\n  });`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log('Fixed:', relPath);
  } else {
    console.log('No change:', relPath);
  }
}

console.log('\nTotal fixed:', totalFixed);
