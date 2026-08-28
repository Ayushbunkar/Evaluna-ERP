const fs = require('fs');
const path = 'D:/Evaluna ERP/apps/web/src/lib/trpc/routers/customer.ts';
let content = fs.readFileSync(path, 'utf8');
let lines = content.split('\n');
// line numbers are 1-indexed, so line 122 is index 121
lines[121] = '\t\t\torderRef: `ORD-${o.id}`,'; // three tabs at start
fs.writeFileSync(path, lines.join('\n'));