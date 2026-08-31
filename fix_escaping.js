const fs = require('fs');
let content = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('app/dashboard/page.tsx', content);
