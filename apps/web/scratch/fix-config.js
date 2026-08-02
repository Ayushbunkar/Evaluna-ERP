const fs = require('fs');
let content = fs.readFileSync('next.config.mjs', 'utf8');
content = content.replace(/<task_progress>[\s\S]*?<\/task_progress>/g, '');
fs.writeFileSync('next.config.mjs', content, 'utf8');
console.log('Fixed next.config.mjs');
