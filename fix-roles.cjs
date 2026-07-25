const fs = require('fs');
const path = require('path');

const layouts = [
  { file: 'apps/web/src/app/(dashboards)/sales/layout.tsx', role: 'sales' },
  { file: 'apps/web/src/app/(dashboards)/biller/layout.tsx', role: 'biller' },
  { file: 'apps/web/src/app/(dashboards)/auditor/layout.tsx', role: 'auditor' },
  { file: 'apps/web/src/app/(dashboards)/picker/layout.tsx', role: 'picker' },
  { file: 'apps/web/src/app/(dashboards)/putter/layout.tsx', role: 'putter' },
  { file: 'apps/web/src/app/admin/layout.tsx', role: 'admin' },
  { file: 'apps/web/src/app/manager/layout.tsx', role: 'manager' },
];

let fixed = 0;
for (const { file, role } of layouts) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) { console.log('SKIP:', file); continue; }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace: <AppLayoutWithBranch navItems={...} namespace="...">
  // With:    <AppLayoutWithBranch navItems={...} namespace="..." role="ROLE">
  content = content.replace(
    /(<AppLayoutWithBranch\s[^>]*?)(?:\s+role="[^"]*")?(>)/g,
    `$1 role="${role}"$2`
  );

  // Also handle AppLayout (non-branch variant)
  content = content.replace(
    /(<AppLayout\s[^>]*?)(?:\s+role="[^"]*")?(>)/g,
    `$1 role="${role}"$2`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixed++;
    console.log('Fixed:', file, '->', role);
  } else {
    console.log('No change:', file);
  }
}
console.log('\nTotal fixed:', fixed);
