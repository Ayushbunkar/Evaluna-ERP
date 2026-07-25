const fs = require('fs');
const path = require('path');

const targetFiles = [
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

  // 1. Merge duplicate react-query imports  
  content = content.replace(
    /import \{ useQuery \} from "@tanstack\/react-query";(\r?\n)import \{ useQueryClient \} from "@tanstack\/react-query";/g,
    'import { useQuery, useQueryClient } from "@tanstack/react-query";'
  );
  content = content.replace(
    /import \{ useQueryClient \} from "@tanstack\/react-query";(\r?\n)import \{ useQueryClient \} from "@tanstack\/react-query";/g,
    'import { useQueryClient } from "@tanstack/react-query";'
  );
  // Remove standalone duplicate toast if another exists
  const toastCount = (content.match(/import \{ toast \} from "sonner";/g) || []).length;
  if (toastCount > 1) {
    // Remove first occurrence (the duplicate added by script)
    content = content.replace(/import \{ toast \} from "sonner";\n/, '');
  }

  // 2. Fix malformed arrow lines: lines that are just "      => setXxx(false;" 
  // These result from regex capture group spill: "=> setIsDialogOpen(false;"
  // Replace: <whitespace>=> setXxx(something;
  // With:    <whitespace>setXxx(something);
  content = content.replace(/^(\s*)=> (set[A-Za-z]+\([^)]*);$/mg, '$1$2);');
  
  // Also handle if closing paren was preserved: => setXxx(false)
  content = content.replace(/^(\s*)=> (set[A-Za-z]+\([^)]*\));$/mg, '$1$2;');

  // 3. Fix remaining useCrudMutation calls that still use mutationOptions
  // Replace:
  //   const NAME = useCrudMutation({
  //     mutationOptions: trpc.NS.PROC.mutationOptions(),
  //     invalidateKeys,
  //     successMessage: SUCC,
  //     errorMessage: ERR,
  //     onSuccess: () => CALLBACK,   <- single-expression callback
  //   });
  // With direct trpc hook
  content = content.replace(
    /const (\w+) = useCrudMutation\(\{\s*mutationOptions: trpc\.(\w+)\.(\w+)\.mutationOptions\(\),\s*invalidateKeys,\s*successMessage: (t\("[^"]+"\)),\s*errorMessage: (t\("[^"]+"\)),\s*onSuccess: \(\) => ([^,}]+),\s*\}\);/gs,
    (_, varName, ns, proc, succ, err, onSucc) => {
      const cb = onSucc.trim().replace(/;$/, '');
      return `const ${varName} = trpc.${ns}.${proc}.useMutation({\r\n    onSuccess: () => {\r\n      queryClient.invalidateQueries({ queryKey: invalidateKeys[0] });\r\n      toast.success(${succ});\r\n      ${cb};\r\n    },\r\n    onError: () => { toast.error(${err}); },\r\n  });`;
    }
  );

  // Without onSuccess callback:
  content = content.replace(
    /const (\w+) = useCrudMutation\(\{\s*mutationOptions: trpc\.(\w+)\.(\w+)\.mutationOptions\(\),\s*invalidateKeys,\s*successMessage: (t\("[^"]+"\)),\s*errorMessage: (t\("[^"]+"\)),\s*\}\);/gs,
    (_, varName, ns, proc, succ, err) => {
      return `const ${varName} = trpc.${ns}.${proc}.useMutation({\r\n    onSuccess: () => {\r\n      queryClient.invalidateQueries({ queryKey: invalidateKeys[0] });\r\n      toast.success(${succ});\r\n    },\r\n    onError: () => { toast.error(${err}); },\r\n  });`;
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
