const fs = require('fs');
let html = fs.readFileSync('app/page.tsx', 'utf8');

// Update UI badges to handle "failed"
html = html.replace(
  `\${lead.status === 'sent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`,
  `\${lead.status === 'sent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : lead.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-500/10' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`
);

// Add clear queue button next to Process Queue
html = html.replace(
  `<button \n                    onClick={async () => {`,
  `<button onClick={async () => { if(confirm('Clear all leads?')) { await supabase.from('outreach_leads').delete().neq('id', 0); fetchDashboardData(); } }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs shadow-lg transition-all mr-2">Clear Data</button>\n                  <button \n                    onClick={async () => {`
);

fs.writeFileSync('app/page.tsx', html, 'utf8');
console.log('Fixed UI status badge and Clear button');
