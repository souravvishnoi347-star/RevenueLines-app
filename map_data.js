const fs = require('fs');
let tsx = fs.readFileSync('d:/Hostbolt/new me/revenueline-app/app/dashboard/page.tsx', 'utf-8');

// 1. In Leads tab, replace the tbody content with a map
const leadsTbodyStart = `<tbody className="font-body-sm text-body-sm">`;
const leadsTbodyEnd = `</tbody>`;

// We will replace everything between these with:
const leadsMap = `
{leads.map((lead) => (
  <tr key={lead.id} className="border-b border-outline-variant/10 hover:bg-surface/50 transition-colors">
  <td className="p-4">
  <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container font-semibold">
                                              {lead.name.substring(0,2).toUpperCase()}
                                          </div>
  <div>
  <div className="font-semibold text-text-primary">{lead.name}</div>
  <div className="text-outline text-[12px]">{lead.phone || 'No phone'}</div>
  </div>
  </div>
  </td>
  <td className="p-4 text-on-surface">{lead.property_interest || 'General'}</td>
  <td className="p-4">
  <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${lead.ai_score > 70 ? 'bg-tertiary-container/20 text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant'}\`}>
                                          {lead.status}
                                      </span>
  </td>
  <td className="p-4">
  <div className="flex items-center gap-2 text-primary-container">
  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                                          {lead.ai_summary ? lead.ai_summary.substring(0, 50) + '...' : 'AI active'}
                                      </div>
  </td>
  <td className="p-4 text-right">
  <button className="text-outline hover:text-primary transition-colors">
  <span className="material-symbols-outlined">more_vert</span>
  </button>
  </td>
  </tr>
))}
`;

const tbodyRegex = /<tbody className="font-body-sm text-body-sm">[\s\S]*?<\/tbody>/;
tsx = tsx.replace(tbodyRegex, '<tbody className="font-body-sm text-body-sm">' + leadsMap + '</tbody>');

// Also fix the Home Dashboard "Recent AI Conversations" mapping
// In the Home dashboard, it looks like this:
// <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container hover:bg-surface-variant transition-colors border border-outline-variant">
// Sarah K.

const homeChatsRegex = /<div className="flex flex-col gap-4 flex-grow">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Right: Chart -->/m;

const homeChatsMap = `
<div className="flex flex-col gap-4 flex-grow">
  {leads.map(lead => (
    <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg bg-surface-container hover:bg-surface-variant transition-colors border border-outline-variant">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200">
          <span className="material-symbols-outlined text-[20px]">forum</span>
        </div>
        <div>
          <h4 className="font-body-md text-body-md text-on-surface">{lead.name}</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{lead.property_interest || 'General'} • <span className="text-emerald-700">{lead.status}</span></p>
        </div>
      </div>
      <div className="text-right">
        <span className="font-label-caps text-label-caps text-outline-variant block mb-1">Recent</span>
        <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
      </div>
    </div>
  ))}
</div>
</div>
<!-- Right: Chart -->`;

tsx = tsx.replace(homeChatsRegex, homeChatsMap);


fs.writeFileSync('d:/Hostbolt/new me/revenueline-app/app/dashboard/page.tsx', tsx);
console.log('Mapped leads state!');
