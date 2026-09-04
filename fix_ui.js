const fs = require('fs');
let html = fs.readFileSync('app/page.tsx', 'utf8');

const outreachUI = `
          {/* ?? OUTREACH TAB */}
          {activeTab === 'outreach' && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Email Outreach</h3>
                <p className="text-sm text-gray-500 dark:text-[#6b7280]">Hyper-personalized cold emails sent securely via your Gmail.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1a1c22] border border-gray-100 dark:border-[#2a2c31] rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Total Leads</h4>
                  <p className="text-2xl font-bold dark:text-white">34,000</p>
                </div>
                <div className="bg-white dark:bg-[#1a1c22] border border-gray-100 dark:border-[#2a2c31] rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-emerald-500 mb-1">Emails Sent</h4>
                  <p className="text-2xl font-bold dark:text-white">0</p>
                </div>
                <div className="bg-white dark:bg-[#1a1c22] border border-gray-100 dark:border-[#2a2c31] rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-blue-500 mb-1">Queue (Daily Limit: 50)</h4>
                  <p className="text-2xl font-bold dark:text-white">Active</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#1a1c22] border border-gray-100 dark:border-[#2a2c31] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm">Campaign Leads</h4>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".csv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if(!file) return;
                        
                        const text = await file.text();
                        const lines = text.split('\\n').filter(line => line.trim() !== '');
                        
                        // Assuming header: Name,Email,Phone,Agency Name
                        // Skip header (i=1)
                        const newLeads = [];
                        for(let i=1; i<lines.length; i++) {
                          const parts = lines[i].split(',').map(s => s?.trim());
                          if(parts.length >= 2) {
                            newLeads.push({
                              name: parts[0]?.replace(/['"]/g, '') || '',
                              email: parts[1]?.replace(/['"]/g, '') || '',
                              phone: parts[2] ? parts[2].replace(/['"]/g, '') : null,
                              agency_name: parts[3] ? parts[3].replace(/['"]/g, '') : null,
                              status: 'unsent'
                            });
                          }
                        }
                        
                        if(newLeads.length > 0) {
                          alert('Found ' + newLeads.length + ' leads. Uploading...');
                          // Assuming supabase is available in this scope
                          const { error } = await supabase.from('outreach_leads').insert(newLeads);
                          if(error) alert('Error uploading leads: ' + error.message);
                          else {
                            alert('Leads uploaded successfully!');
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] font-semibold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/25 transition-all">
                      + Upload CSV
                    </button>
                  </div>
                </div>
                <div className="text-center py-10 text-gray-400 text-sm">
                  <Mail size={40} className="mx-auto mb-3 opacity-20" />
                  <p>Upload a CSV file with columns: <b>Name, Email, Phone, Agency Name</b></p>
                </div>
              </div>
            </div>
          )}
`;

html = html.replace("{activeTab === 'inventory' && (", outreachUI + '\n          {activeTab === \'inventory\' && (');
fs.writeFileSync('app/page.tsx', html, 'utf8');
console.log('UI Block Added!');
