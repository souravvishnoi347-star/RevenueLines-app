'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Users, MessageSquare, RefreshCcw, 
  MonitorSmartphone, Building, Sun, Moon, Bell, User, Search, Home, Activity, CheckCircle, TrendingUp, Plus, Trash2, MapPin, DollarSign, Bot, ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [dateStr, setDateStr] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Real Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, recovered: 0 });
  const [inventory, setInventory] = useState<any[]>([]);
  
  // Inventory Form states
  const [isAddingProp, setIsAddingProp] = useState(false);
  const [newProp, setNewProp] = useState({title: '', location: '', price: '', description: ''});

  // AI Chats states
  const [selectedLeadPhone, setSelectedLeadPhone] = useState<string | null>(null);
  const [leadChatHistory, setLeadChatHistory] = useState<any[]>([]);
  
  // Campaign States
  const [campaignMsg, setCampaignMsg] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('New');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    fetchDashboardData();

    const leadsChannel = supabase.channel('leads_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchDashboardData();
      }).subscribe();

    const chatChannel = supabase.channel('chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_history' }, payload => {
        setLeadChatHistory(prev => {
          if (payload.new.phone === selectedLeadPhone) {
            if (!prev.find(m => m.id === payload.new.id)) return [...prev, payload.new];
          }
          return prev;
        });
      }).subscribe();

    return () => { 
      supabase.removeChannel(leadsChannel); 
      supabase.removeChannel(chatChannel);
    };
  }, [selectedLeadPhone]);

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

    const { data: invData } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (invData) setInventory(invData);
  };

  const fetchLeadChat = async (phone: string) => {
    setSelectedLeadPhone(phone);
    const { data } = await supabase.from('chat_history').select('*').eq('phone', phone).order('created_at', { ascending: true });
    if (data) setLeadChatHistory(data);
  };

  const handleAddProperty = async () => {
    if (!newProp.title || !newProp.price) return;
    await supabase.from('inventory').insert([newProp]);
    setIsAddingProp(false);
    setNewProp({title: '', location: '', price: '', description: ''});
    fetchDashboardData();
  };

  const handleDeleteProperty = async (id: string) => {
    await supabase.from('inventory').delete().eq('id', id);
    fetchDashboardData();
  };

  const handleSendCampaign = async () => {
    if (!campaignMsg) return;
    setIsSendingCampaign(true);
    try {
      const res = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: campaignMsg, targetStatus: campaignStatus })
      });
      const data = await res.json();
      alert(`Campaign sent successfully to ${data.count || 0} leads!`);
      setCampaignMsg('');
    } catch(e) {
      alert("Error sending campaign.");
    }
    setIsSendingCampaign(false);
  };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect Password!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111318] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1e2024] p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-[#3b494b]/30 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-[#00f0ff]/10 rounded-full flex items-center justify-center text-blue-600 dark:text-[#00f0ff] mx-auto mb-6">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">RevenueLine Portal</h1>
          <p className="text-gray-500 mb-8">Enter admin password to access the dashboard.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500 text-center tracking-widest text-lg"
            />
            <button type="submit" className="w-full py-3 bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] font-bold rounded-xl hover:bg-blue-700 transition-colors">
              Access Dashboard
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-6">For demo purposes, password is: admin123</p>
        </div>
      </div>
    );
  }
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
            { id: 'chats', icon: <MessageSquare size={20}/>, label: 'AI Chats' },
            { id: 'inventory', icon: <Building size={20}/>, label: 'Inventory' },
            { id: 'recovery', icon: <RefreshCcw size={20}/>, label: 'Dead Lead Recovery' },
            { id: 'workflows', icon: <MonitorSmartphone size={20}/>, label: 'Automations' },
            { id: 'analytics', icon: <BarChart3 size={20}/>, label: 'AI Intelligence' },
            { id: 'settings', icon: <User size={20}/>, label: 'Settings' },
      
      
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
        <main className={`flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth ${activeTab === 'chats' ? 'p-0 md:p-0' : 'space-y-8'}`}>
          
          {activeTab === 'home' && (
            <>
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Welcome back, Nikhil.</h1>
                  <p className="text-gray-500 dark:text-[#b9cacb] text-sm md:text-base">Here's what your AI has been doing today, <span className="text-[#00f0ff] font-medium">{dateStr}</span>.</p>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Leads Handled', value: stats.total.toString(), icon: <Users size={20} className="text-blue-500 dark:text-[#00f0ff]"/> },
                  { label: 'Active Conversations', value: stats.active.toString(), icon: <MessageSquare size={20} className="text-orange-500 dark:text-[#fdd55a]"/> },
                  { label: 'Dead Leads Recovered', value: stats.recovered.toString(), icon: <RefreshCcw size={20} className="text-green-500 dark:text-[#00ff88]"/> }
                ].map((stat, i) => (
                  <div key={i} className={`bg-white dark:bg-[#1e2024] border border-gray-100 dark:border-transparent ${i===1?'dark:border-[#fdd55a]/20 border-orange-200':'dark:border-[#3b494b]/10'} rounded-xl p-6 relative overflow-hidden group shadow-sm dark:shadow-none`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#3b494b]/30 flex items-center justify-center">
                        {stat.icon}
                      </div>
                      <h3 className="text-gray-500 dark:text-[#b9cacb] font-semibold text-sm uppercase tracking-wider">{stat.label}</h3>
                    </div>
                    <p className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </section>

              <section className="bg-white dark:bg-[#1e2024] rounded-2xl border border-gray-100 dark:border-transparent p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8]">Recent AI Conversations</h3>
                </div>
                
                <div className="space-y-4">
                  {leads.slice(0,5).map((lead: any, i) => (
                    <div key={i} onClick={() => { setActiveTab('chats'); fetchLeadChat(lead.phone); }} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#3b494b]/20 hover:border-gray-300 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-[#1e2024] flex items-center justify-center text-blue-600 dark:text-[#00f0ff] font-bold">
                          {lead.name ? lead.name.substring(0,2).toUpperCase() : 'NA'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-[#00f0ff]">{lead.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500 dark:text-[#b9cacb]">{lead.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'Hot' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : lead.status === 'Warm' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-[#00f0ff]'}`}>
                          {lead.status}
                        </span>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500 dark:text-[#b9cacb]">{new Date(lead.last_message_at || lead.created_at).toLocaleTimeString()}</p>
                        </div>
                        <ArrowRight size={18} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-[#b9cacb] py-8">No conversations yet.</p>
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
                      <tr key={lead.id} onClick={() => { setActiveTab('chats'); fetchLeadChat(lead.phone); }} className="border-b border-gray-50 dark:border-[#3b494b]/10 hover:bg-gray-50 dark:hover:bg-[#2a2c31] transition-colors cursor-pointer">
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
                        <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-[#b9cacb]">No leads found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1e2024] rounded-2xl border border-gray-100 dark:border-transparent p-6 shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8]">Property Inventory</h3>
                  <p className="text-sm text-gray-500 dark:text-[#b9cacb]">AI will pitch these properties to WhatsApp leads.</p>
                </div>
                <button 
                  onClick={() => setIsAddingProp(!isAddingProp)}
                  className="px-4 py-2 bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] rounded-xl text-sm font-bold flex items-center gap-2 w-fit"
                >
                  <Plus size={16} /> Add Property
                </button>
              </div>

              {isAddingProp && (
                <div className="bg-gray-50 dark:bg-[#1e2024] rounded-2xl border border-blue-200 dark:border-[#00f0ff]/30 p-6 shadow-sm animate-in slide-in-from-top-4">
                  <h4 className="font-bold mb-4">Add New Property</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                      type="text" placeholder="Title (e.g. 3BHK Luxury Villa)" 
                      className="px-4 py-2 bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500"
                      value={newProp.title} onChange={e => setNewProp({...newProp, title: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="Location (e.g. Palm Jumeirah)" 
                      className="px-4 py-2 bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500"
                      value={newProp.location} onChange={e => setNewProp({...newProp, location: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="Price (e.g. 4.5M AED)" 
                      className="px-4 py-2 bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500"
                      value={newProp.price} onChange={e => setNewProp({...newProp, price: e.target.value})}
                    />
                    <input 
                      type="text" placeholder="Description/Highlights" 
                      className="px-4 py-2 bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500"
                      value={newProp.description} onChange={e => setNewProp({...newProp, description: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddProperty} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Save to Database</button>
                    <button onClick={() => setIsAddingProp(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl text-sm font-bold">Cancel</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map((prop: any) => (
                  <div key={prop.id} className="bg-white dark:bg-[#1e2024] rounded-2xl border border-gray-100 dark:border-transparent p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                    <button onClick={() => handleDeleteProperty(prop.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </button>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-[#0c0e12] rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-[#00f0ff]">
                      <Building size={24} />
                    </div>
                    <h4 className="font-bold text-lg mb-1">{prop.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#b9cacb] mb-1">
                      <MapPin size={14} /> {prop.location}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-green-600 dark:text-[#00ff88] mb-3">
                      <DollarSign size={14} /> {prop.price}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#e2e2e8]/70 line-clamp-2">{prop.description}</p>
                  </div>
                ))}
                {inventory.length === 0 && !isAddingProp && (
                  <div className="col-span-full text-center py-12 text-gray-500 border border-dashed rounded-2xl border-gray-300 dark:border-[#3b494b]/30">
                    No properties added yet. Click "Add Property" to build your inventory.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="flex h-[calc(100vh-90px)] -m-4 md:-m-10 bg-gray-50 dark:bg-[#111318]">
              <div className="w-[320px] shrink-0 border-r border-gray-200 dark:border-[#3b494b]/20 bg-white dark:bg-[#1e2024] flex flex-col hidden md:flex">
                <div className="p-4 border-b border-gray-200 dark:border-[#3b494b]/20 font-bold text-lg">
                  Conversations
                </div>
                <div className="flex-1 overflow-y-auto">
                  {leads.map((lead: any) => (
                    <div 
                      key={lead.id} 
                      onClick={() => fetchLeadChat(lead.phone)}
                      className={`p-4 border-b border-gray-100 dark:border-[#3b494b]/10 cursor-pointer transition-colors ${selectedLeadPhone === lead.phone ? 'bg-blue-50 dark:bg-[#0c0e12] border-l-4 border-l-blue-600 dark:border-l-[#00f0ff]' : 'hover:bg-gray-50 dark:hover:bg-[#2a2c31] border-l-4 border-l-transparent'}`}
                    >
                      <p className="font-bold text-gray-900 dark:text-white">{lead.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-[#b9cacb] mb-2">{lead.phone}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lead.status === 'Hot' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : lead.status === 'Warm' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-[#00f0ff]'}`}>{lead.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white dark:bg-[#111318]">
                {selectedLeadPhone ? (
                  <>
                    <div className="p-4 border-b border-gray-200 dark:border-[#3b494b]/20 bg-white dark:bg-[#1e2024] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-[#0c0e12] flex items-center justify-center text-blue-600 dark:text-[#00f0ff] font-bold">
                          {leads.find(l => l.phone === selectedLeadPhone)?.name?.substring(0,2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{leads.find(l => l.phone === selectedLeadPhone)?.name || 'Unknown'}</p>
                          <p className="text-xs text-green-500">Active on WhatsApp</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-[#0c0e12]">
                      {leadChatHistory.map((chat: any) => (
                        <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${chat.role === 'user' ? 'bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] rounded-tr-sm' : 'bg-white dark:bg-[#1e2024] border border-gray-200 dark:border-[#3b494b]/30 text-gray-800 dark:text-[#e2e2e8] rounded-tl-sm'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {chat.role === 'ai' && <Bot size={14} className="text-blue-600 dark:text-[#00f0ff]" />}
                              <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">{chat.role === 'ai' ? 'Aura (AI)' : 'Lead'}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{chat.message}</p>
                            <p className="text-[10px] opacity-60 text-right mt-1">{new Date(chat.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                      {leadChatHistory.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-500">No chat history available.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-[#b9cacb]">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p>Select a lead to view their AI conversation history.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8]">AI Sales Intelligence</h3>
                  <p className="text-sm text-gray-500 dark:text-[#b9cacb]">Performance metrics and insights from your AI Agent.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e2024] p-5 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-[#b9cacb] mb-1 font-semibold uppercase tracking-wider">Total Interactions</p>
                  <p className="text-3xl font-black">{leads.length}</p>
                </div>
                <div className="bg-white dark:bg-[#1e2024] p-5 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-[#b9cacb] mb-1 font-semibold uppercase tracking-wider">Conversion Rate</p>
                  <p className="text-3xl font-black text-green-600 dark:text-[#00ff88]">
                    {leads.length ? Math.round(((stats.active + stats.recovered) / leads.length) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white dark:bg-[#1e2024] p-5 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-[#b9cacb] mb-1 font-semibold uppercase tracking-wider">Human Time Saved</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-[#00f0ff]">{Math.round(leads.length * 12.5 / 60)} hrs</p>
                  <p className="text-[10px] text-gray-400 mt-1">Based on 12.5 mins per lead</p>
                </div>
                <div className="bg-white dark:bg-[#1e2024] p-5 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-[#b9cacb] mb-1 font-semibold uppercase tracking-wider">Brokerage Saved</p>
                  <p className="text-3xl font-black text-purple-600 dark:text-[#b088ff]">${leads.length * 25}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Estimated at $25/lead handling</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                  <h4 className="font-bold mb-4">Lead Quality Pipeline</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-red-500">Hot Leads (Ready to Buy)</span>
                        <span>{leads.filter(l => l.status === 'Hot').length}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-[#0c0e12] rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${leads.length ? (leads.filter(l => l.status === 'Hot').length / leads.length) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-orange-500">Warm Leads (Interested)</span>
                        <span>{leads.filter(l => l.status === 'Warm').length}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-[#0c0e12] rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${leads.length ? (leads.filter(l => l.status === 'Warm').length / leads.length) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-blue-500">New / Cold Leads</span>
                        <span>{leads.filter(l => l.status === 'New').length}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-[#0c0e12] rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${leads.length ? (leads.filter(l => l.status === 'New').length / leads.length) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                  <h4 className="font-bold mb-4">AI Sentiment Analysis</h4>
                  <div className="flex items-center justify-center h-40">
                    <div className="relative w-40 h-40 rounded-full border-[16px] border-green-500 flex items-center justify-center">
                      <div className="absolute inset-0 border-[16px] border-gray-100 dark:border-[#0c0e12] rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)' }}></div>
                      <div className="text-center z-10">
                        <p className="text-3xl font-black">78%</p>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Positive</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-4">Buyers are showing high interest in luxury villas and off-plan apartments this week.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recovery' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8] mb-2">Dead Lead Recovery Campaigns</h3>
                <p className="text-sm text-gray-500 dark:text-[#b9cacb] mb-6">Send a broadcast WhatsApp message to a specific segment of leads to re-engage them automatically.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Select Target Audience</label>
                    <div className="flex gap-2 mb-6">
                      {['New', 'Warm', 'Cold'].map(status => (
                        <button 
                          key={status}
                          onClick={() => setCampaignStatus(status)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${campaignStatus === status ? 'border-blue-600 dark:border-[#00f0ff] bg-blue-50 dark:bg-[#00f0ff]/10 text-blue-600 dark:text-[#00f0ff]' : 'border-gray-200 dark:border-[#3b494b]/30 text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2a2c31]'}`}
                        >
                          {status} Leads
                        </button>
                      ))}
                    </div>

                    <label className="block text-sm font-semibold mb-2">Campaign Message</label>
                    <textarea 
                      value={campaignMsg}
                      onChange={e => setCampaignMsg(e.target.value)}
                      placeholder="Hi there! We have a new luxury property launch matching your previous interests. Would you like the brochure?"
                      className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500 mb-4 resize-none"
                    ></textarea>

                    <button 
                      onClick={handleSendCampaign}
                      disabled={isSendingCampaign || !campaignMsg}
                      className="w-full py-3 bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSendingCampaign ? 'Sending...' : <><RefreshCcw size={18} /> Launch Broadcast</>}
                    </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 p-6 rounded-xl flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-[#00f0ff]/10 rounded-full flex items-center justify-center text-blue-600 dark:text-[#00f0ff] mb-4">
                      <Users size={32} />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Targeting {leads.filter(l => l.status === campaignStatus).length} Leads</h4>
                    <p className="text-sm text-gray-500 max-w-[250px]">Your message will be sent instantly to these leads via WhatsApp. Replies will be handled by the AI.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

                           {activeTab === 'workflows' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8]">Integrations & Automations</h3>
                <p className="text-sm text-gray-500 dark:text-[#b9cacb]">Connect your AI agent to external CRMs, channels, and custom n8n workflows.</p>
              </div>

              {/* Connected Channels */}
              <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                <h4 className="font-bold mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-blue-500"/> Connected Channels</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'WhatsApp', status: 'Connected', color: 'bg-green-500' },
                    { name: 'Instagram', status: 'Coming Soon', color: 'bg-gray-300 dark:bg-gray-600' },
                    { name: 'Property Finder', status: 'Coming Soon', color: 'bg-gray-300 dark:bg-gray-600' },
                    { name: 'Bayut', status: 'Coming Soon', color: 'bg-gray-300 dark:bg-gray-600' }
                  ].map(channel => (
                    <div key={channel.name} className="p-4 rounded-xl border border-gray-100 dark:border-[#3b494b]/30 flex flex-col items-center justify-center text-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                      <p className="font-semibold text-sm">{channel.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{channel.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CRMs */}
              <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                <h4 className="font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-orange-500"/> CRM Integrations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['HubSpot', 'Salesforce', 'Zoho CRM'].map(crm => (
                    <div key={crm} className="p-4 rounded-xl border border-gray-100 dark:border-[#3b494b]/30 flex items-center justify-between">
                      <p className="font-semibold text-sm">{crm}</p>
                      <button className="px-3 py-1 bg-gray-100 dark:bg-[#0c0e12] text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2c31] transition-colors">Connect</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* n8n Workflows */}
              <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-blue-100 dark:border-[#00f0ff]/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-[#00f0ff]/5 rounded-bl-full"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h4 className="font-bold mb-1 flex items-center gap-2"><MonitorSmartphone size={18} className="text-blue-600 dark:text-[#00f0ff]"/> Advanced n8n Automations</h4>
                    <p className="text-xs text-gray-500 max-w-md mb-6">Upload a JSON workflow file provided by your agency to instantly install new automations (e.g., Google Sheets sync, Auto-Emails).</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-500/30">
                    <Plus size={16}/> Upload JSON Workflow
                  </button>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#3b494b]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <p className="font-semibold text-sm">Sync Hot Leads to Google Sheets</p>
                    </div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#3b494b]/30 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <p className="font-semibold text-sm">Send Email Notification on New Lead</p>
                    </div>
                    <span className="text-xs text-gray-500">Paused</span>
                  </div>
                </div>
              </div>

            </div>
          )}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#e2e2e8]">Portal & Bot Settings</h3>
                <p className="text-sm text-gray-500 dark:text-[#b9cacb]">Manage your AI Assistant profile and dashboard preferences.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Profile Settings */}
                <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm">
                  <h4 className="font-bold mb-6 flex items-center gap-2"><Bot size={18} className="text-blue-500"/> AI Agent Profile (WhatsApp)</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-[#0c0e12] flex items-center justify-center text-blue-600 dark:text-[#00f0ff] border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors">
                        <Plus size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Profile Picture</p>
                        <p className="text-xs text-gray-500">Upload a professional avatar</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Agent Name</label>
                      <input type="text" defaultValue="Aura" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2">WhatsApp Business Bio</label>
                      <textarea defaultValue="Hi, I am Aura, your 24/7 AI Real Estate Assistant. Ask me anything about Dubai properties!" className="w-full h-24 px-4 py-2 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-xl outline-none focus:border-blue-500 resize-none"></textarea>
                    </div>

                    <button className="px-4 py-2 bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors">
                      Sync to Meta WhatsApp
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2">*Note: Syncing requires Meta Business API approval.</p>
                  </div>
                </div>

                {/* Dashboard Preferences */}
                <div className="bg-white dark:bg-[#1e2024] p-6 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm h-fit">
                  <h4 className="font-bold mb-6 flex items-center gap-2"><User size={18} className="text-orange-500"/> Admin Preferences</h4>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Dark Mode</p>
                        <p className="text-xs text-gray-500">Toggle dashboard theme</p>
                      </div>
                      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Email Notifications</p>
                        <p className="text-xs text-gray-500">Get alerts for 'Hot' leads</p>
                      </div>
                      <button className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                      </button>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-[#3b494b]/30">
                      <button onClick={() => setIsAuthenticated(false)} className="w-full px-4 py-2 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm hover:bg-red-200 transition-colors">
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
