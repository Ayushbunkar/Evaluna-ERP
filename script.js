const fs = require('fs');
const path = require('path');

const layoutsDir = path.join(process.cwd(), 'apps', 'web', 'src', 'app', '(dashboards)');

const findLayouts = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findLayouts(filePath, fileList);
        } else if (file === 'layout.tsx') {
            fileList.push(filePath);
        }
    }
    return fileList;
};

const layouts = findLayouts(layoutsDir);
console.log('Found', layouts.length, 'layouts');
