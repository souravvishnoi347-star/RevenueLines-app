'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Users, MessageSquare, RefreshCcw, 
  MonitorSmartphone, Building, Sun, Moon, Bell, User, Search, Home, Activity, CheckCircle, TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [dateStr, setDateStr] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Real Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, recovered: 0 });

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    fetchDashboardData();

    // Subscribe to realtime updates from Supabase
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, payload => {
        fetchDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDashboardData = async () => {
    const { data: leadsData } = await supabase.from('leads').select('*').order('last_message_at', { ascending: false });
    if (leadsData) {
      setLeads(leadsData);
      setStats({
        total: leadsData.length,
        active: leadsData.filter((l:any) => l.status === 'Hot' || l.status === 'Warm').length,
        recovered: leadsData.filter((l:any) => l.status === 'Recovered').length
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111318] text-gray-900 dark:text-[#e2e2e8] font-sans antialiased overflow-x-hidden flex selection:bg-[#00f0ff]/30 selection:text-[#00f0ff] transition-colors duration-300">
      
      {/* Sidebar */}
      <div className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <nav className={`fixed md:flex w-[280px] h-screen left-0 top-0 border-r border-gray-200 dark:border-[#3b494b]/20 bg-white dark:bg-[#0c0e12] flex-col py-8 z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-6 mb-8 flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-100 dark:bg-[#00f0ff]/10 flex items-center justify-center text-blue-600 dark:text-[#00f0ff]">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-[#00f0ff] tracking-tight">RevenueLine</h1>
              <p className="text-sm text-gray-500 dark:text-[#b9cacb]">Dubai Real Estate</p>
            </div>
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
        </div>
        
        <ul className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {[
            { id: 'home', icon: <Home size={20}/>, label: 'Home' },
            { id: 'leads', icon: <Users size={20}/>, label: 'Live Leads' },
            { id: 'recovery', icon: <RefreshCcw size={20}/>, label: 'Dead Lead Recovery' },
            { id: 'inventory', icon: <Building size={20}/>, label: 'Inventory' },
            { id: 'workflows', icon: <MonitorSmartphone size={20}/>, label: 'Automations' },
            { id: 'chats', icon: <MessageSquare size={20}/>, label: 'AI Chats' },
            { id: 'analytics', icon: <BarChart3 size={20}/>, label: 'AI Intelligence' },
          ].map(tab => (
            <li key={tab.id}>
              <button 
                onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-6 py-3 border-l-4 transition-all duration-300 uppercase tracking-widest text-xs font-bold
                  ${activeTab === tab.id 
                    ? 'border-[#00f0ff] bg-gray-100 dark:bg-[#00f0ff]/5 text-blue-600 dark:text-[#00f0ff]' 
                    : 'border-transparent text-gray-500 dark:text-[#b9cacb] hover:bg-gray-100 dark:hover:bg-[#333539]/20 hover:text-blue-600 dark:hover:text-[#dbfcff]'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        
        <div className="px-6 mt-8">
          <div className="bg-gray-100 dark:bg-[#3b494b]/10 rounded-2xl p-4 border border-gray-200 dark:border-[#3b494b]/30">
            <p className="text-xs text-gray-500 dark:text-[#b9cacb] mb-2 uppercase font-bold tracking-wider">AI Engine Status</p>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-[#00f0ff] font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-[#00f0ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 dark:bg-[#00f0ff]"></span>
              </span>
              Gemini Pro Active
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col h-screen overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <header className="h-[90px] border-b border-gray-200 dark:border-[#3b494b]/20 bg-white/80 dark:bg-[#0c0e12]/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-10 shrink-0 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-500 p-2" onClick={() => setIsMobileMenuOpen(true)}>
               <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-[#e2e2e8] tracking-tight">RevenueLine Automation</h2>
              <p className="text-[#f56c36] text-xs font-bold tracking-widest uppercase mt-1">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#b9cacb]/50" size={16} />
              <input type="text" placeholder="Search leads..." className="pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-[#1e2024] border-none rounded-xl text-sm w-[200px] md:w-[300px] focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/30 text-gray-900 dark:text-[#e2e2e8] placeholder-gray-400 dark:placeholder-[#b9cacb]/50 transition-all" />
            </div>
            
            <div className="flex items-center gap-1 md:gap-3">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-[#b9cacb] hover:bg-gray-100 dark:hover:bg-[#333539]/40 transition-colors">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-[#b9cacb] hover:bg-gray-100 dark:hover:bg-[#333539]/40 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0c0e12]"></span>
              </button>
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#333539]/40 flex items-center justify-center border border-gray-200 dark:border-[#3b494b]/30 ml-2">
                <User size={20} className="text-gray-600 dark:text-[#b9cacb]" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth">
          
          {activeTab === 'home' && (
            <>
              {/* Header Section */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Welcome back, Nikhil.</h1>
                  <p className="text-gray-500 dark:text-[#b9cacb] text-sm md:text-base">Here's what your AI has been doing today, <span className="text-[#00f0ff] font-medium">{dateStr}</span>.</p>
                </div>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 bg-gray-100 dark:bg-[#1e2024] border border-gray-200 dark:border-[#3b494b]/30 text-gray-700 dark:text-[#e2e2e8] rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-[#2a2c31] transition-all shadow-sm">
                    View Reports
                  </button>
                  <button className="px-5 py-2.5 bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-[#00d0dd] transition-all shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2">
                    <TrendingUp size={16} /> Campaign
                  </button>
                </div>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Leads Handled', value: stats.total.toString(), desc: '+12% from yesterday', icon: <Users size={20} className="text-blue-500 dark:text-[#00f0ff]"/> },
                  { label: 'Active Conversations', value: stats.active.toString(), desc: 'Currently talking to AI', icon: <MessageSquare size={20} className="text-orange-500 dark:text-[#fdd55a]"/> },
                  { label: 'Dead Leads Recovered', value: stats.recovered.toString(), desc: 'Re-engaged this week', icon: <RefreshCcw size={20} className="text-green-500 dark:text-[#00ff88]"/> }
                ].map((stat, i) => (
                  <div key={i} className={`bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-transparent ${i===1?'dark:border-[#fdd55a]/20 border-orange-200':'dark:border-[#3b494b]/10'} rounded-xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none`}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 dark:opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                      {stat.icon}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#3b494b]/30 flex items-center justify-center">
                        {stat.icon}
                      </div>
                      <h3 className="text-gray-500 dark:text-[#b9cacb] font-semibold text-sm uppercase tracking-wider">{stat.label}</h3>
                    </div>
                    <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{stat.value}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-[#b9cacb]">{stat.desc}</p>
                  </div>
                ))}
              </section>

              {/* Recent AI Conversations */}
              <section className="bg-white dark:bg-[#1e2024] rounded-2xl border border-gray-100 dark:border-transparent p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8]">Recent AI Conversations</h3>
                  <button className="text-sm font-semibold text-blue-600 dark:text-[#00f0ff] hover:underline">View All</button>
                </div>
                
                <div className="space-y-4">
                  {leads.slice(0,5).map((lead: any, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#3b494b]/20 hover:border-gray-300 dark:hover:border-[#00f0ff]/40 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-[#1e2024] border border-gray-200 dark:border-[#3b494b]/30 flex items-center justify-center text-blue-600 dark:text-[#00f0ff] font-bold">
                          {lead.name ? lead.name.substring(0,2).toUpperCase() : 'NA'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-[#00f0ff] transition-colors">{lead.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500 dark:text-[#b9cacb]">{lead.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'Hot' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : lead.status === 'Warm' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-[#00f0ff]'}`}>
                          {lead.status}
                        </span>
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-gray-900 dark:text-white font-medium">Last active</p>
                          <p className="text-xs text-gray-500 dark:text-[#b9cacb]">{new Date(lead.last_message_at || lead.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-[#b9cacb] py-8">No conversations yet. AI is waiting for messages!</p>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'leads' && (
            <div className="bg-white dark:bg-[#1e2024] rounded-2xl border border-gray-100 dark:border-transparent p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8] mb-6">WhatsApp Live Leads</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#3b494b]/20 text-gray-500 dark:text-[#b9cacb] text-sm">
                      <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                      <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Phone</th>
                      <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                      <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Last Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead: any) => (
                      <tr key={lead.id} className="border-b border-gray-50 dark:border-[#3b494b]/10 hover:bg-gray-50 dark:hover:bg-[#2a2c31] transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{lead.name || 'Unknown'}</td>
                        <td className="py-4 px-4 text-gray-500 dark:text-[#b9cacb]">{lead.phone}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'Hot' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : lead.status === 'Warm' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-[#00f0ff]'}`}>{lead.status}</span>
                        </td>
                        <td className="py-4 px-4 text-gray-500 dark:text-[#b9cacb] text-sm">
                          {new Date(lead.last_message_at || lead.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-[#b9cacb]">No leads found. Send a WhatsApp message to start!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {['inventory', 'workflows', 'chats', 'billing', 'settings'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
               <div className="w-16 h-16 bg-gray-100 dark:bg-[#282a2e] rounded-full flex items-center justify-center text-gray-400 dark:text-[#b9cacb] mb-4">
                  <Activity size={32} />
               </div>
               <h3 className="text-xl font-semibold mb-2 capitalize">{activeTab} Module</h3>
               <p className="text-gray-500 dark:text-[#b9cacb]">This service is connected to your backend but UI is under construction.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
