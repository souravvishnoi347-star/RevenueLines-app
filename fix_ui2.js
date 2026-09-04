const fs = require('fs');
let html = fs.readFileSync('app/page.tsx', 'utf8');

const regex = /<button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-\[#00f0ff\] dark:to-\[#00c8ff\] text-white dark:text-\[#0c0e12\] font-semibold rounded-xl text-xs shadow-lg hover:shadow-cyan-500\/25 transition-all">\s*\+ Upload CSV\s*<\/button>/;

const newButtons = `<button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] font-semibold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/25 transition-all">
                      + Upload CSV
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={async () => {
                      alert('Triggering Outreach Engine...');
                      const res = await fetch('/api/outreach/cron');
                      const data = await res.json();
                      if(data.success) {
                        alert('Emails sent to: ' + data.processed.map(p => p.email).join(', '));
                      } else {
                        alert('Message: ' + (data.message || data.error));
                      }
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs shadow-lg transition-all">
                    ? Process Queue (Send 2 Mails)
                  </button>`;

html = html.replace(regex, newButtons);
fs.writeFileSync('app/page.tsx', html, 'utf8');
console.log('Added trigger button');
