const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'apps/web/src/app'));

let totalFixed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern to replace trpcUtils.router.procedure.getQueryKey() with raw array key
    // Also remove const trpcUtils = trpc.useUtils(); if it's there
    content = content.replace(
        /const trpcUtils = trpc\.useUtils\(\);\s*const invalidateKeys = trpcUtils\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.getQueryKey\(\);/g,
        "const invalidateKeys = [['$1', '$2']];"
    );
    
    // In case trpcUtils is used elsewhere or spacing is different:
    content = content.replace(
        /const invalidateKeys = trpcUtils\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.getQueryKey\(\);/g,
        "const invalidateKeys = [['$1', '$2']];"
    );

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        totalFixed++;
        console.log('Fixed', file);
    }
});

console.log('Total key files fixed:', totalFixed);
