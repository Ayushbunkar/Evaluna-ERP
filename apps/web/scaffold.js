const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', '(dashboards)');
const sharedDir = path.join(__dirname, 'src', 'app', '(shared)');
const componentsDir = path.join(__dirname, 'src', 'components', 'shared');

const roles = ['admin', 'manager', 'auditor', 'putter', 'picker', 'biller', 'sales'];
const sharedRoutes = ['settings', 'profile', 'notifications', 'sync'];

const componentsFolders = [
  'layouts',
  'cards',
  'tables',
  'charts',
  'feedback'
];

const componentsFiles = {
  'layouts': ['shell.tsx', 'header-base.tsx', 'sidebar-base.tsx'],
  'cards': ['kpi-card.tsx', 'activity-card.tsx', 'empty-state.tsx'],
  'tables': ['data-table.tsx', 'table-actions.tsx', 'table-filters.tsx'],
  'charts': ['bar-chart.tsx', 'line-chart.tsx', 'donut-chart.tsx'],
  'feedback': ['page-loader.tsx', 'error-state.tsx', 'unauthorized-state.tsx']
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 1. Scaffold Dashboard Roles
ensureDir(baseDir);
roles.forEach(role => {
  const roleDir = path.join(baseDir, role);
  ensureDir(roleDir);

  const LayoutContent = `export default function ${role.charAt(0).toUpperCase() + role.slice(1)}Layout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-screen overflow-hidden"><main className="flex-1 overflow-y-auto">{children}</main></div>;
}`;
  fs.writeFileSync(path.join(roleDir, 'layout.tsx'), LayoutContent);

  const PageContent = `export default function ${role.charAt(0).toUpperCase() + role.slice(1)}Dashboard() {
  return <div className="p-6"><h1>${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h1></div>;
}`;
  fs.writeFileSync(path.join(roleDir, 'page.tsx'), PageContent);

  const LoadingContent = `export default function Loading() { return <div className="p-6">Loading...</div>; }`;
  fs.writeFileSync(path.join(roleDir, 'loading.tsx'), LoadingContent);

  const ErrorContent = `"use client";\nexport default function Error() { return <div className="p-6 text-red-500">An error occurred</div>; }`;
  fs.writeFileSync(path.join(roleDir, 'error.tsx'), ErrorContent);

  const UnauthorizedContent = `export default function Unauthorized() { return <div className="p-6 text-amber-500">Unauthorized access</div>; }`;
  fs.writeFileSync(path.join(roleDir, 'unauthorized.tsx'), UnauthorizedContent);
});

// 2. Scaffold Shared Routes
ensureDir(sharedDir);
sharedRoutes.forEach(route => {
  const routeDir = path.join(sharedDir, route);
  ensureDir(routeDir);
  const PageContent = `export default function ${route.charAt(0).toUpperCase() + route.slice(1)}Page() {
  return <div className="p-6"><h1>${route.charAt(0).toUpperCase() + route.slice(1)}</h1></div>;
}`;
  fs.writeFileSync(path.join(routeDir, 'page.tsx'), PageContent);
});

// 3. Scaffold Shared Components
ensureDir(componentsDir);
Object.entries(componentsFiles).forEach(([folder, files]) => {
  const folderPath = path.join(componentsDir, folder);
  ensureDir(folderPath);
  files.forEach(file => {
    const ComponentName = file.split('-').map(p => p.replace('.tsx', '')).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    const content = `export function ${ComponentName}() { return <div>${ComponentName}</div>; }`;
    fs.writeFileSync(path.join(folderPath, file), content);
  });
});

console.log('Scaffolding complete.');
