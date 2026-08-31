const fs = require('fs');
const path = 'd:/Hostbolt/new me/revenueline-app/app/dashboard/page.tsx';
let tsx = fs.readFileSync(path, 'utf-8');

// 1. Fix date options typescript error
tsx = tsx.replace(
  `const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };`,
  `const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };`
);

// 2. Fix aria-checked="true", aria-checked="false"
tsx = tsx.replace(/aria-checked="true"/g, 'aria-checked={true}');
tsx = tsx.replace(/aria-checked="false"/g, 'aria-checked={false}');

// 3. Fix checked="checked" or checked
tsx = tsx.replace(/checked="checked"/g, 'checked={true}');
// Just in case there's checked=""
tsx = tsx.replace(/checked=""/g, 'checked={true}');

// 4. Fix readonly and disabled
tsx = tsx.replace(/readonly/g, 'readOnly');
tsx = tsx.replace(/disabled="disabled"/g, 'disabled={true}');
tsx = tsx.replace(/disabled=""/g, 'disabled={true}');

// 5. Fix tabIndex="0"
tsx = tsx.replace(/tabIndex="0"/g, 'tabIndex={0}');
tsx = tsx.replace(/tabindex="0"/g, 'tabIndex={0}');

// 6. Fix "LuxAI" back to "RevenueLine"
tsx = tsx.replace(/>LuxAI</g, '>RevenueLine<');
tsx = tsx.replace(/LuxAI Automation/g, 'RevenueLine Automation');
tsx = tsx.replace(/LuxAI/g, 'RevenueLine');

// 7. Fix Ahmed -> Nikhil
tsx = tsx.replace(/Ahmed!/g, 'Nikhil!');
tsx = tsx.replace(/Ahmed's/g, "Nikhil's");
tsx = tsx.replace(/Ahmed/g, 'Nikhil');

// 8. Fix style="..." that might still exist. My previous script handled most, but let's check
// In HTML, style="--value:65" (if used in charts). We will just let them be if there are none.

fs.writeFileSync(path, tsx);
console.log('Fixed JSX issues');
