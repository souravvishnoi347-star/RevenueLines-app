"use client";
import React, { useState, useEffect } from 'react';
import { Home, Users, MessageSquare, Settings, HelpCircle, Search, Bell, TrendingUp, Clock, FileText, CheckCircle2, ChevronRight, Moon, Sun, MonitorSmartphone, MapPin, IndianRupee, User, Activity, Building, BarChart3, CreditCard, RefreshCcw, UploadCloud, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LuxAIDashboard() {
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [dateStr, setDateStr] = useState('');
  
  // Real Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setDateStr(new Date().toLocaleDateString('en-US', options));
    
    // Set initial theme on HTML element
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }

    const fetchData = async () => {
      try {
        const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5);
        if (leadsData) setLeads(leadsData);
        
        const { data: invData } = await supabase.from('inventory').select('*').limit(3);
        if (invData) setInventory(invData);
      } catch(e) {}
    };
    fetchData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111318] text-gray-900 dark:text-[#e2e2e8] font-sans antialiased overflow-x-hidden flex selection:bg-[#00f0ff]/30 selection:text-[#00f0ff] transition-colors duration-300">
      
      {/* Sidebar */}
      <nav className="hidden md:flex w-[280px] fixed h-screen left-0 top-0 border-r border-gray-200 dark:border-[#3b494b]/20 bg-white dark:bg-[#0c0e12] flex-col py-8 z-40 transition-colors">
        <div className="px-6 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-100 dark:bg-[#00f0ff]/10 flex items-center justify-center text-blue-600 dark:text-[#00f0ff]">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[#00f0ff] tracking-tight">RevenueLine</h1>
            <p className="text-sm text-gray-500 dark:text-[#b9cacb]">Dubai Real Estate</p>
          </div>
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
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-3 border-l-4 transition-all duration-300 uppercase tracking-widest text-xs font-bold
                  ${activeTab === tab.id 
                    ? 'border-[#00f0ff] bg-gray-100 dark:bg-[#00f0ff]/5 text-blue-600 dark:text-[#00f0ff]' 
                    : 'border-transparent text-gray-500 dark:text-[#b9cacb] hover:bg-gray-100 dark:hover:bg-[#333539]/20 hover:text-blue-600 dark:hover:text-[#dbfcff]'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            </li>
          ))}
        </ul>
        
        <div className="mt-auto px-6 pt-4 border-t border-gray-200 dark:border-[#3b494b]/20">
          <button className="flex items-center gap-4 px-4 py-3 border-l-4 border-transparent text-gray-500 dark:text-[#b9cacb] hover:bg-gray-100 dark:hover:bg-[#333539]/20 hover:text-blue-600 dark:hover:text-[#dbfcff] transition-all duration-300 uppercase tracking-widest text-xs font-bold w-full text-left">
            <HelpCircle size={20}/> Support
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="md:ml-[280px] flex flex-col flex-grow min-h-screen">
        
        {/* Top AppBar */}
        <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-[#3b494b]/10 bg-white/80 dark:bg-[#111318]/80 backdrop-blur-xl flex justify-between items-center px-10 py-4 transition-colors">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#dbfcff] tracking-tight">RevenueLine Automation</h2>
            <span className="text-[10px] text-orange-500 dark:text-[#ffe088] uppercase tracking-widest mt-1 block font-mono">Dashboard</span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="hidden lg:flex items-center bg-gray-100 dark:bg-[#282a2e] rounded-full px-4 py-2 border border-gray-200 dark:border-[#3b494b]/30 focus-within:border-blue-500 dark:focus-within:border-[#00f0ff] focus-within:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all">
              <Search size={18} className="text-gray-500 dark:text-[#b9cacb] mr-2" />
              <input type="text" placeholder="Search leads..." className="bg-transparent border-none outline-none text-sm w-64 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#b9cacb]/50" />
            </div>
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="text-gray-500 dark:text-[#b9cacb] hover:text-blue-600 dark:hover:text-[#00f0ff] transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#282a2e]">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="text-gray-500 dark:text-[#b9cacb] hover:text-blue-600 dark:hover:text-[#00f0ff] transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 dark:bg-[#ffb4ab] rounded-full"></span>
            </button>
            
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-[#3b494b]/20 flex items-center justify-center bg-gray-100 dark:bg-[#282a2e] text-gray-500 dark:text-[#b9cacb] cursor-pointer hover:border-blue-500 dark:hover:border-[#00f0ff] transition-colors">
              <User size={20} />
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 space-y-8 flex-grow">
          
          {activeTab === 'home' && (
            <>
              {/* Header Section */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-bold">Good Morning, <span className="text-blue-600 dark:text-[#00f0ff]">Nikhil!</span></h2>
                  <p className="text-gray-500 dark:text-[#b9cacb] mt-2">{dateStr}</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-[#1e2024] px-4 py-2 rounded-full border border-gray-200 dark:border-[#3b494b]/20 shadow-sm">
                  <span className="w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                  <span className="text-[10px] text-gray-900 dark:text-[#e2e2e8] uppercase tracking-widest font-mono">AI Brokers Operational</span>
                </div>
              </section>

              {/* Metrics Row */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Total Leads Processed', value: '1,284', inc: '12%', icon: <TrendingUp/>, glow: 'group-hover:from-blue-500/0 group-hover:via-blue-500/5 group-hover:to-blue-500/0 dark:group-hover:via-[#00f0ff]/5' },
                  { title: 'AI-Qualified Leads', value: '842', inc: '8%', icon: <CheckCircle2 className="text-orange-500 dark:text-[#ffe088]" />, glow: 'group-hover:from-orange-500/0 group-hover:via-orange-500/5 group-hover:to-orange-500/0 dark:group-hover:via-[#fdd55a]/5', specialGlow: true },
                  { title: 'Minutes Saved This Week', value: '4,120', inc: '15%', icon: <Clock/>, glow: 'group-hover:from-blue-500/0 group-hover:via-blue-500/5 group-hover:to-blue-500/0 dark:group-hover:via-[#00f0ff]/5' }
                ].map((m, i) => (
                  <div key={i} className={`bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-transparent ${i===1?'dark:border-[#fdd55a]/20 border-orange-200':'dark:border-[#3b494b]/10'} rounded-xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none`}>
                    <div className={`absolute -inset-1 bg-gradient-to-r ${m.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}></div>
                    {m.specialGlow && <div className="absolute inset-0 bg-orange-100 dark:bg-[#00f0ff]/5 blur-3xl rounded-full translate-y-1/2 opacity-50"></div>}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] ${i===1?'text-orange-600 dark:text-[#ffe088]':'text-gray-500 dark:text-[#b9cacb]'} uppercase tracking-widest font-mono`}>{m.title}</span>
                        <span className="text-gray-400 dark:text-[#3b494b]">{m.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-bold">{m.value}</span>
                          <span className={`text-sm ${i===1?'text-orange-600 dark:text-[#fdd55a]':'text-blue-600 dark:text-[#00f0ff]'} flex items-center font-medium`}>↑ {m.inc}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Middle Row */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Recent AI Conversations */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-[#3b494b]/10 rounded-xl p-6 flex flex-col shadow-sm dark:shadow-none">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-[#3b494b]/10 pb-4">
                    <h3 className="text-xl font-semibold">Recent AI Conversations</h3>
                    <button onClick={() => setActiveTab('chats')} className="text-[10px] text-blue-600 dark:text-[#00f0ff] hover:text-blue-800 dark:hover:text-[#dbfcff] transition-colors uppercase font-mono tracking-widest">View All</button>
                  </div>
                  
                  <div className="flex flex-col gap-4 flex-grow">
                    {[
                      { n: 'Sarah K.', l: 'Marina Apt', s: 'Qualified & Booked Viewing', c: 'text-emerald-500 dark:text-emerald-400', b: 'bg-emerald-50 dark:bg-emerald-900/30', i: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400', t: '5m ago' },
                      { n: 'Omar D.', l: 'Palm Jumeirah', s: 'Awaiting Client Response', c: 'text-orange-500 dark:text-amber-400', b: 'bg-orange-50 dark:bg-amber-900/30', i: 'bg-orange-100 dark:bg-amber-900/30 border-orange-200 dark:border-amber-500/20 text-orange-600 dark:text-amber-400', t: '12m ago' },
                      { n: 'Maria S.', l: 'Downtown Studio', s: 'Qualified - Shared Brochure', c: 'text-blue-600 dark:text-[#00f0ff]', b: 'bg-blue-50 dark:bg-blue-900/30', i: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-[#00f0ff]/20 text-blue-600 dark:text-[#00f0ff]', t: '20m ago' },
                    ].map((chat, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#1a1c20]/50 hover:bg-gray-100 dark:hover:bg-[#333539]/30 transition-colors border border-gray-100 dark:border-[#3b494b]/5`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${chat.i}`}>
                            <MessageSquare size={18} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{chat.n}</h4>
                            <p className="text-xs text-gray-500 dark:text-[#b9cacb]">{chat.l} • <span className={chat.c}>{chat.s}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 dark:text-[#3b494b] block mb-1 uppercase font-mono">{chat.t}</span>
                          <span className="text-[#25D366] font-bold text-xs">WhatsApp</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Chart Placeholder */}
                <div className="bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-[#3b494b]/10 rounded-xl p-6 flex flex-col justify-between items-center relative overflow-hidden shadow-sm dark:shadow-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-100 dark:bg-[#00f0ff]/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full mb-6 border-b border-gray-100 dark:border-[#3b494b]/10 pb-4 text-left">
                    <h3 className="text-xl font-semibold">Lead Conversion</h3>
                    <span className="text-[10px] text-gray-500 dark:text-[#b9cacb] uppercase tracking-widest mt-1 block font-mono">Past 30 Days</span>
                  </div>
                  
                  <div className="relative w-48 h-48 flex items-center justify-center mb-4 z-10 border-[16px] border-blue-500 dark:border-[#00f0ff] rounded-full border-t-orange-400 dark:border-t-[#fdd55a] border-r-gray-200 dark:border-r-[#333539] shadow-lg">
                    <div className="text-center absolute bg-white dark:bg-[#1e2024] w-32 h-32 rounded-full flex flex-col justify-center items-center">
                      <span className="block text-3xl font-bold">24%</span>
                      <span className="block text-[10px] text-gray-500 dark:text-[#b9cacb] uppercase mt-1 font-mono">Conv. Rate</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'recovery' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-[#3b494b]/20 pb-6">
                <div>
                  <h2 className="text-3xl font-bold">Dead Lead Recovery (AI Reactivation)</h2>
                  <p className="text-gray-500 dark:text-[#b9cacb] mt-2">Turn your old, cold database into new hot opportunities.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#00f0ff] dark:hover:bg-[#00dbe9] text-white dark:text-[#002022] font-semibold px-6 py-3 rounded-lg transition-colors">
                  <PlayCircle size={20} /> Start Reactivation Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e2024] border border-dashed border-gray-300 dark:border-[#3b494b] rounded-xl p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#282a2e] rounded-full flex items-center justify-center text-gray-400 dark:text-[#b9cacb] mb-4">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Upload Old CRM Database</h3>
                  <p className="text-sm text-gray-500 dark:text-[#b9cacb] mb-6">Upload a CSV of stale leads to begin AI qualification over WhatsApp.</p>
                  <button className="text-sm font-semibold text-blue-600 dark:text-[#00f0ff] hover:underline">Select CSV File</button>
                </div>

                <div className="bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-[#3b494b]/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 border-b border-gray-100 dark:border-[#3b494b]/10 pb-4">Recent Reactivation Campaigns</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-[#1a1c20]">
                      <div>
                        <h4 className="font-semibold text-sm">Q1 2025 Stale Leads</h4>
                        <p className="text-xs text-gray-500 dark:text-[#b9cacb]">Sent to 4,200 contacts</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">312 Reactivated</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-[#1a1c20]">
                      <div>
                        <h4 className="font-semibold text-sm">Lost Deals 2024</h4>
                        <p className="text-xs text-gray-500 dark:text-[#b9cacb]">Sent to 1,850 contacts</p>
                      </div>
                      <div className="text-right">
                        <span className="text-orange-500 dark:text-amber-400 font-bold text-sm">45 Reactivated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-[#3b494b]/20 pb-6">
                <div>
                  <h2 className="text-3xl font-bold">AI Sales Intelligence</h2>
                  <p className="text-gray-500 dark:text-[#b9cacb] mt-2">Real-time visibility into pipeline leaks and agent performance.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-[#3b494b]/10 rounded-xl p-6">
                  <h3 className="text-[10px] text-gray-500 dark:text-[#b9cacb] uppercase tracking-widest font-mono mb-4">Avg. AI Response Time</h3>
                  <p className="text-4xl font-bold text-emerald-500 dark:text-[#00f0ff]">&lt; 2 seconds</p>
                  <p className="text-sm text-gray-400 mt-2">Zero leakage from delayed replies.</p>
                </div>
                <div className="bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-[#3b494b]/10 rounded-xl p-6">
                  <h3 className="text-[10px] text-gray-500 dark:text-[#b9cacb] uppercase tracking-widest font-mono mb-4">Lead to Viewing Conv.</h3>
                  <p className="text-4xl font-bold">18%</p>
                  <p className="text-sm text-emerald-500 mt-2">↑ 4% vs last month</p>
                </div>
                <div className="bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-[#3b494b]/10 rounded-xl p-6">
                  <h3 className="text-[10px] text-gray-500 dark:text-[#b9cacb] uppercase tracking-widest font-mono mb-4">Pipeline Leakage Alerts</h3>
                  <p className="text-4xl font-bold text-red-500 dark:text-[#ffb4ab]">3</p>
                  <p className="text-sm text-gray-400 mt-2">Hot leads requiring human escalation.</p>
                </div>
              </div>
            </div>
          )}

          {['leads', 'inventory', 'workflows', 'chats', 'billing', 'settings'].includes(activeTab) && (
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
