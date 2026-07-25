const fs = require('fs');
const path = require('path');

const managerDir = path.join(__dirname, 'src', 'app', '(dashboards)', 'manager');

const subRoutes = [
  'sales', 'billing', 'orders', 'customers', 'inventory', 
  'warehouse', 'staff', 'cashbook', 'expenses', 'reports', 'notifications'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(managerDir);

subRoutes.forEach(route => {
  const routeDir = path.join(managerDir, route);
  ensureDir(routeDir);

  const Title = route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const ComponentName = Title.replace(/\s+/g, '');

  const PageContent = `export default function Manager${ComponentName}Page() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">${Title}</h1>
        <p className="text-muted-foreground">Manage branch ${Title.toLowerCase()} operations.</p>
      </div>
      <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">${Title} module pending implementation</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            This module will be built out in the upcoming phases.
          </p>
        </div>
      </div>
    </div>
  );
}`;
  fs.writeFileSync(path.join(routeDir, 'page.tsx'), PageContent);
});

console.log('Manager sub-routes scaffolded.');
