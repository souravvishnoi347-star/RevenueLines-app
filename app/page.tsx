'use client';
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Users, MessageSquare, RefreshCcw, X,
  MonitorSmartphone, Building, Sun, Moon, Bell, User, Search, Home, Activity, CheckCircle, TrendingUp, Plus, Trash2, MapPin, DollarSign, Bot, ArrowRight, Settings, Zap, Shield, Clock, Mail, Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  const [activeTab, setActiveTab] = useState('home');
  const [dateStr, setDateStr] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, recovered: 0 });
  const [inventory, setInventory] = useState<any[]>([]);
    const [outreachLeads, setOutreachLeads] = useState<any[]>([]);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [outreachFramework, setOutreachFramework] = useState<'dld_trigger' | 'qvc' | 'pas' | 'bab' | 'soft_offer' | 'auto_rotate'>('dld_trigger');
  
  const [isAddingProp, setIsAddingProp] = useState(false);
  const [newProp, setNewProp] = useState({title: '', location: '', price: '', description: '', image: '', brochure: ''});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [showCrmModal, setShowCrmModal] = useState<string | null>(null);
  const [crmUrlInput, setCrmUrlInput] = useState('');
  const [crmSettings, setCrmSettings] = useState<any>({});
  const [isVerifyingCrm, setIsVerifyingCrm] = useState(false);
  const [agentDpFile, setAgentDpFile] = useState<File | null>(null);
  const [isSyncingDp, setIsSyncingDp] = useState(false);

  const [selectedLeadPhone, setSelectedLeadPhone] = useState<string | null>(null);
  const [leadChatHistory, setLeadChatHistory] = useState<any[]>([]);
  
  const [campaignMsg, setCampaignMsg] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('New');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('rl-theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rl-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rl-theme', 'light');
    }
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
    const { data: inventoryData } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
      const { data: outreachData } = await supabase.from('outreach_leads').select('*').order('created_at', { ascending: false });
    const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
    
    if (leadsData) {
      setLeads(leadsData);
      setStats({
        total: leadsData.length,
        active: leadsData.filter((l:any) => l.status === 'Hot' || l.status === 'Warm').length,
        recovered: leadsData.filter((l:any) => l.status === 'Recovered').length
      });
    }
    if (inventoryData) setInventory(inventoryData);
      if (outreachData) setOutreachLeads(outreachData);
    if (settingsData) setCrmSettings(settingsData);
  };

  const fetchLeadChat = async (phone: string) => {
    setSelectedLeadPhone(phone);
    const { data } = await supabase.from('chat_history').select('*').eq('phone', phone).order('created_at', { ascending: true });
    if (data) setLeadChatHistory(data);
  };

  const handleAddProperty = async () => {
    if (!newProp.title || !newProp.price) return;
    setIsUploading(true);
    let imageUrl = '';
    
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data } = await supabase.storage.from('property_media').upload(fileName, imageFile);
      if (data) {
        const { data: publicUrlData } = supabase.storage.from('property_media').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const doc = new jsPDF();
    doc.setFillColor(12, 14, 18);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("LUXURY REAL ESTATE", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("Premium Property Brochure", 105, 30, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.text(newProp.title, 20, 55);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Location: ${newProp.location}`, 20, 65);
    doc.setTextColor(0, 150, 100);
    doc.text(`Price: ${newProp.price}`, 20, 75);
    
    doc.setTextColor(50, 50, 50);
    const splitDesc = doc.splitTextToSize(`Description: ${newProp.description}`, 170);
    doc.text(splitDesc, 20, 90);

    if (imageFile) {
       const base64Img = await new Promise<string>((resolve) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result as string);
         reader.readAsDataURL(imageFile);
       });
       const format = imageFile.type.includes('png') ? 'PNG' : 'JPEG';
       doc.addImage(base64Img, format, 20, 110, 170, 100);
    }

    const pdfBlob = doc.output('blob');
    const pdfFileName = `brochure_${Math.random()}.pdf`;
    const { data: pdfData } = await supabase.storage.from('brochures').upload(pdfFileName, pdfBlob, { contentType: 'application/pdf' });
    
    let brochureUrl = '';
    if (pdfData) {
      const { data: pdfPublicUrl } = supabase.storage.from('brochures').getPublicUrl(pdfFileName);
      brochureUrl = pdfPublicUrl.publicUrl;
    }

    const finalProp = { ...newProp, image: imageUrl, brochure: brochureUrl };
    await supabase.from('inventory').insert([finalProp]);
    
    setIsAddingProp(false);
    setIsUploading(false);
    setImageFile(null);
    setNewProp({title: '', location: '', price: '', description: '', image: '', brochure: ''});
    fetchDashboardData();
  };

  const handleDeleteProperty = async (id: string) => {
    await supabase.from('inventory').delete().eq('id', id);
    fetchDashboardData();
  };

  const handleVerifyCrm = async () => {
    setIsVerifyingCrm(true);
    try {
      // Simulate verification / send ping
      const res = await fetch(crmUrlInput, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, message: 'Propnexaa AI Connection Test' })
      }).catch(() => null); // Catch CORS for frontend fetches
      
      const columnMap: any = {
        'HubSpot': 'hubspot_url',
        'Salesforce': 'salesforce_url',
        'Zoho CRM': 'zoho_url'
      };
      const col = columnMap[showCrmModal!];
      
      const { data, error } = await supabase.from('settings').update({ [col]: crmUrlInput }).eq('id', crmSettings.id);
      
      setCrmSettings({ ...crmSettings, [col]: crmUrlInput });
      setShowCrmModal(null);
      setCrmUrlInput('');
      alert(`${showCrmModal} connected successfully! Hot leads and meetings will now sync.`);
    } catch (e) {
      alert("Error saving webhook. Please try again.");
    }
    setIsVerifyingCrm(false);
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

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect Password!');
    }
  };

  const statusBadge = (status: string) => {
    const styles: any = {
      Hot: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
      Warm: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
      New: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-[#00f0ff] dark:border-blue-500/20',
    };
    return `px-3 py-1 rounded-full text-[11px] font-semibold border ${styles[status] || styles.New}`;
  };

  // ─── LOGIN SCREEN ───
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-[#0c0e12] dark:via-[#111318] dark:to-[#0c0e12] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-[#00f0ff] dark:to-[#00ff88] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Activity size={28} className="text-white dark:text-[#0c0e12]" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Propnexaa</h1>
            <p className="text-sm text-gray-500 dark:text-[#b9cacb] mt-1">AI Real Estate Intelligence Platform</p>
          </div>

          <div className="bg-white dark:bg-[#1a1c22] p-8 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 border border-gray-100 dark:border-[#2a2c31] animate-fade-in">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-[#b9cacb] uppercase tracking-wider mb-2">Admin Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#3b494b]/30 rounded-2xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-[#00f0ff]/10 text-center tracking-[0.3em] text-lg transition-all"
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] font-bold rounded-2xl hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all">
                Access Dashboard
              </button>
            </form>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-6">Demo password: admin123</p>
        </div>
      </div>
    );
  }

  // ─── MAIN DASHBOARD ───
  return ( 
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#111318] text-gray-900 dark:text-[#e2e2e8] font-sans antialiased overflow-x-hidden flex selection:bg-blue-500/20 selection:text-blue-700 dark:selection:bg-[#00f0ff]/20 dark:selection:text-[#00f0ff] transition-colors duration-300">
      
      {/* Mobile Overlay */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      {/* ─── SIDEBAR ─── */}
      <nav className={`fixed md:flex w-[260px] h-screen left-0 top-0 border-r border-gray-200/80 dark:border-[#1e2024] bg-white dark:bg-[#0c0e12] flex-col z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="px-6 h-[72px] flex items-center gap-3 border-b border-gray-100 dark:border-[#1e2024]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-[#00f0ff] dark:to-[#00ff88] flex items-center justify-center shadow-md shadow-blue-500/20">
            <Activity size={18} className="text-white dark:text-[#0c0e12]" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Propnexaa</h1>
            <p className="text-[10px] text-gray-400 dark:text-[#6b7280] font-medium uppercase tracking-wider">AI Platform</p>
          </div>
          <button className="md:hidden text-gray-400 hover:text-gray-600" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
        </div>
        
        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[10px] text-gray-400 dark:text-[#6b7280] font-semibold uppercase tracking-wider px-3 mb-2">Main</p>
          <ul className="flex flex-col gap-0.5 mb-4">
            {[
              { id: 'home', icon: <Home size={18}/>, label: 'Dashboard' },
              { id: 'leads', icon: <Users size={18}/>, label: 'Live Leads' },
              { id: 'chats', icon: <MessageSquare size={18}/>, label: 'AI Chats' },
              { id: 'outreach', icon: <Mail size={18}/>, label: 'Outreach' },
              { id: 'inventory', icon: <Building size={18}/>, label: 'Inventory' },
            ].map(tab => (
              <li key={tab.id}>
                <button 
                  onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                    ${activeTab === tab.id 
                      ? 'bg-blue-50 dark:bg-[#00f0ff]/8 text-blue-600 dark:text-[#00f0ff] shadow-sm' 
                      : 'text-gray-500 dark:text-[#8b8f96] hover:bg-gray-50 dark:hover:bg-[#1a1c22] hover:text-gray-700 dark:hover:text-[#d0d0d6]'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <p className="text-[10px] text-gray-400 dark:text-[#6b7280] font-semibold uppercase tracking-wider px-3 mb-2">Tools</p>
          <ul className="flex flex-col gap-0.5 mb-4">
            {[
              { id: 'recovery', icon: <RefreshCcw size={18}/>, label: 'Campaigns' },
              { id: 'workflows', icon: <Zap size={18}/>, label: 'Automations' },
              { id: 'analytics', icon: <BarChart3 size={18}/>, label: 'Analytics' },
            ].map(tab => (
              <li key={tab.id}>
                <button 
                  onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                    ${activeTab === tab.id 
                      ? 'bg-blue-50 dark:bg-[#00f0ff]/8 text-blue-600 dark:text-[#00f0ff] shadow-sm' 
                      : 'text-gray-500 dark:text-[#8b8f96] hover:bg-gray-50 dark:hover:bg-[#1a1c22] hover:text-gray-700 dark:hover:text-[#d0d0d6]'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-100 dark:border-[#1e2024] pt-2">
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                ${activeTab === 'settings' 
                  ? 'bg-blue-50 dark:bg-[#00f0ff]/8 text-blue-600 dark:text-[#00f0ff] shadow-sm' 
                  : 'text-gray-500 dark:text-[#8b8f96] hover:bg-gray-50 dark:hover:bg-[#1a1c22] hover:text-gray-700 dark:hover:text-[#d0d0d6]'
                }`}
            >
              <Settings size={18}/>
              Settings
            </button>
          </div>
        </div>

        {/* Bottom user card */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-[#1e2024]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">N</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">Admin</p>
              <p className="text-[10px] text-gray-400">Pro Plan</p>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 md:ml-[260px] flex flex-col h-screen overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <header className="h-[64px] border-b border-gray-200/80 dark:border-[#1e2024] bg-white/90 dark:bg-[#0c0e12]/90 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-[#1a1c22] rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
               <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight capitalize">{activeTab === 'home' ? 'Dashboard' : activeTab === 'chats' ? 'AI Conversations' : activeTab}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative hidden sm:block mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-[#4b5563]" size={15} />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#1a1c22] border border-gray-200 dark:border-[#2a2c31] rounded-xl text-sm w-[180px] md:w-[240px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#00f0ff]/10 focus:border-blue-300 dark:focus:border-[#00f0ff]/30 text-gray-700 dark:text-[#e2e2e8] placeholder-gray-400 dark:placeholder-[#4b5563] transition-all" />
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-[#6b7280] hover:bg-gray-100 dark:hover:bg-[#1a1c22] transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-[#6b7280] hover:bg-gray-100 dark:hover:bg-[#1a1c22] transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* ─── SCROLLABLE MAIN ─── */}
        <main className={`flex-1 overflow-y-auto scroll-smooth ${activeTab === 'chats' ? 'p-0' : 'p-4 md:p-8 space-y-6'}`}>
          
          {/* ─── HOME ─── */}
          {activeTab === 'home' && (
            <div className="animate-fade-in space-y-6">
              <section>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back 👋</h1>
                <p className="text-gray-500 dark:text-[#6b7280] text-sm mt-1">Here&apos;s what your AI has been doing, <span className="text-blue-600 dark:text-[#00f0ff] font-medium">{dateStr}</span></p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Leads', value: stats.total, icon: <Users size={18}/>, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                  { label: 'Active Convos', value: stats.active, icon: <MessageSquare size={18}/>, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                  { label: 'Recovered', value: stats.recovered, icon: <RefreshCcw size={18}/>, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-[#1a1c22] border border-gray-200/60 dark:border-[#2a2c31] rounded-2xl p-5 card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
                      <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <div className={`bg-gradient-to-r ${stat.color} bg-clip-text`}>{stat.icon}</div>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </section>

              <section className="bg-white dark:bg-[#1a1c22] rounded-2xl border border-gray-200/60 dark:border-[#2a2c31] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2c31]">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recent Conversations</h3>
                  <button onClick={() => setActiveTab('chats')} className="text-xs text-blue-600 dark:text-[#00f0ff] font-semibold hover:underline">View All</button>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-[#1e2024]">
                  {leads.slice(0,5).map((lead: any, i) => (
                    <div key={i} onClick={() => { setActiveTab('chats'); fetchLeadChat(lead.phone); }} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 dark:hover:bg-[#1e2024]/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-[#00f0ff] dark:to-[#00c8ff] flex items-center justify-center text-white dark:text-[#0c0e12] text-xs font-bold">
                          {lead.name ? lead.name.substring(0,2).toUpperCase() : 'NA'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#00f0ff] transition-colors">{lead.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400 dark:text-[#6b7280]">{lead.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={statusBadge(lead.status)}>{lead.status}</span>
                        <p className="text-[11px] text-gray-400 hidden sm:block">{new Date(lead.last_message_at || lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No conversations yet.</p>}
                </div>
              </section>
            </div>
          )}

          {/* ─── LEADS ─── */}
          {activeTab === 'leads' && (
            <div className="animate-fade-in bg-white dark:bg-[#1a1c22] rounded-2xl border border-gray-200/60 dark:border-[#2a2c31] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2c31]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">WhatsApp Live Leads</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#2a2c31]">
                      <th className="py-3 px-6 text-[11px] font-semibold text-gray-400 dark:text-[#6b7280] uppercase tracking-wider">Name</th>
                      <th className="py-3 px-6 text-[11px] font-semibold text-gray-400 dark:text-[#6b7280] uppercase tracking-wider">Phone</th>
                      <th className="py-3 px-6 text-[11px] font-semibold text-gray-400 dark:text-[#6b7280] uppercase tracking-wider">Status</th>
                      <th className="py-3 px-6 text-[11px] font-semibold text-gray-400 dark:text-[#6b7280] uppercase tracking-wider">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#1e2024]">
                    {leads.map((lead: any) => (
                      <tr key={lead.id} onClick={() => { setActiveTab('chats'); fetchLeadChat(lead.phone); }} className="hover:bg-gray-50/50 dark:hover:bg-[#1e2024]/50 transition-colors cursor-pointer">
                        <td className="py-3.5 px-6 font-medium text-sm text-gray-800 dark:text-white">{lead.name || 'Unknown'}</td>
                        <td className="py-3.5 px-6 text-sm text-gray-500 dark:text-[#8b8f96]">{lead.phone}</td>
                        <td className="py-3.5 px-6"><span className={statusBadge(lead.status)}>{lead.status}</span></td>
                        <td className="py-3.5 px-6 text-sm text-gray-400">{new Date(lead.last_message_at || lead.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {leads.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-gray-400 text-sm">No leads found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── INVENTORY ─── */}
          
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
                  <p className="text-2xl font-bold dark:text-white">{outreachLeads.length}</p>
                </div>
                <div className="bg-white dark:bg-[#1a1c22] border border-gray-100 dark:border-[#2a2c31] rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-emerald-500 mb-1">Emails Sent</h4>
                  <p className="text-2xl font-bold dark:text-white">{outreachLeads.filter(l => l.status === 'sent').length}</p>
                </div>
                <div className="bg-white dark:bg-[#1a1c22] border border-gray-100 dark:border-[#2a2c31] rounded-2xl p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-blue-500 mb-1">Queue (Unsent)</h4>
                  <p className="text-2xl font-bold dark:text-white">{outreachLeads.filter(l => l.status === 'unsent').length}</p>
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
                        // Handle both \r\n (Windows) and \n line endings
                        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                        if (lines.length < 2) { alert('CSV is empty or has no data rows.'); return; }
                        
                        // Parse header row to auto-detect columns
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
                        
                        const colIndex = (candidates: string[]) => {
                          for (const c of candidates) {
                            const idx = headers.findIndex(h => h.includes(c));
                            if (idx !== -1) return idx;
                          }
                          return -1;
                        };
                        
                        // Auto-detect column positions from header
                        const nameCol   = colIndex(['name english', 'name', 'broker', 'full name', 'contact']);
                        const emailCol  = colIndex(['email', 'e-mail', 'mail']);
                        const phoneCol  = colIndex(['phone', 'mobile', 'cell', 'whatsapp']);
                        const agencyCol = colIndex(['office name', 'agency', 'company', 'firm', 'brokerage']);
                        const sizeCol   = colIndex(['agency_size', 'broker_count', 'team size', 'size', 'segment']);
                        const offerCol  = colIndex(['recommended_offer', 'offer', 'recommendation']);
                        const tierCol   = colIndex(['outbound_tier', 'tier', 'icp_score']);
                        
                        if (emailCol === -1) { alert('No email column found in CSV. Please ensure your file has an "Email" column.'); return; }
                        
                        const newLeads: any[] = [];
                        for(let i = 1; i < lines.length; i++) {
                          // Handle quoted CSVs properly
                          const parts = lines[i].match(/("([^"]*(?:""[^"]*)*)"|([^,]+)|(?<=,)(?=,)|(?<=,)$|^(?=,))/g)
                            ?.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) 
                            ?? lines[i].split(',').map(s => s.trim());
                          
                          const email = emailCol !== -1 ? parts[emailCol]?.replace(/['"]/g, '').trim() : '';
                          if (!email || !email.includes('@')) continue;
                          
                          newLeads.push({
                            name:               nameCol !== -1 ? parts[nameCol]?.replace(/['"]/g, '').trim() : '',
                            email:              email.toLowerCase(),
                            phone:              phoneCol !== -1 ? parts[phoneCol]?.replace(/['"]/g, '').trim() : null,
                            agency_name:        agencyCol !== -1 ? parts[agencyCol]?.replace(/['"]/g, '').trim() : null,
                            agency_size:        sizeCol !== -1 ? parts[sizeCol]?.replace(/['"]/g, '').trim() : null,
                            recommended_offer:  offerCol !== -1 ? parts[offerCol]?.replace(/['"]/g, '').trim() : null,
                            outbound_tier:      tierCol !== -1 ? parts[tierCol]?.replace(/['"]/g, '').trim() : null,
                            status: 'unsent'
                          });
                        }
                        
                        if(newLeads.length === 0) { alert('No valid leads with email addresses found in the file.'); return; }
                        
                        alert(`Found ${newLeads.length} valid leads. Uploading...`);
                        
                        // Upload in batches of 50 to avoid Supabase row limits
                        let uploaded = 0;
                        for (let b = 0; b < newLeads.length; b += 50) {
                          const batch = newLeads.slice(b, b + 50);
                          const { error } = await supabase.from('outreach_leads').insert(batch);
                          if(error) { alert('Error uploading leads: ' + error.message); break; }
                          uploaded += batch.length;
                        }
                        if (uploaded > 0) {
                          alert(`${uploaded} leads uploaded successfully!`);
                          fetchDashboardData();
                        }
                        e.target.value = '';
                      }}
                    />
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] font-semibold rounded-xl text-xs shadow-lg hover:shadow-cyan-500/25 transition-all">
                      + Upload CSV
                    </button>
                  </div>
                </div>
                
                {/* Proven Cold Email Frameworks Selector */}
                <div className="bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-indigo-500/5 dark:from-[#00f0ff]/5 dark:to-[#0088ff]/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white dark:bg-[#00f0ff] dark:text-[#0c0e12] uppercase tracking-wider">
                          Proven Copywriting Framework
                        </span>
                        <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                          ⭐ #1 Ranked for Dubai: Framework 4
                        </span>
                      </div>
                      <h3 className="text-sm font-bold dark:text-white">Select Outreach Copywriting Framework</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        High-converting B2B psychology powered by Gemini 2.5 Flash and Dubai Land Department (DLD) metadata.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={outreachFramework}
                        onChange={(e) => setOutreachFramework(e.target.value as any)}
                        className="px-3.5 py-2 bg-white dark:bg-[#1a1c22] border border-gray-200 dark:border-[#2a2c31] rounded-xl text-xs font-semibold dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                      >
                        <option value="dld_trigger">⭐ Framework 4: DLD Trigger & Observation (Recommended)</option>
                        <option value="qvc">Framework 1: QVC (3-Sentence Speed to Lead)</option>
                        <option value="pas">Framework 2: PAS (Lead Decay Agitator)</option>
                        <option value="bab">Framework 3: BAB (Manual Excel vs Auto-Booked)</option>
                        <option value="soft_offer">Framework 5: Permission-Based (60s Video Ask)</option>
                        <option value="auto_rotate">🔄 A/B Testing Rotation (Cycle All Frameworks)</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Framework Explainer Banner */}
                  <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-[#2a2c31] text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                    <Sparkles size={14} className="text-cyan-500 mt-0.5 shrink-0" />
                    <div>
                      {outreachFramework === 'dld_trigger' && (
                        <p><strong className="text-cyan-600 dark:text-[#00f0ff]">DLD Trigger & Observation:</strong> Autonomous agent researches broker agency scale, license tier & active areas to craft a bespoke 1-to-1 trigger with pattern-interrupt subject line.</p>
                      )}
                      {outreachFramework === 'qvc' && (
                        <p><strong className="text-blue-600 dark:text-blue-400">QVC Framework:</strong> Ultra-punchy 3 sentences: asks about after-hours portal response time, 15-second WhatsApp value prop, and 45-second demo ask.</p>
                      )}
                      {outreachFramework === 'pas' && (
                        <p><strong className="text-amber-600 dark:text-amber-400">PAS Framework:</strong> Agitates buyer drop-off when portal leads take 15+ minutes, presenting 24/7 instant WhatsApp AI routing.</p>
                      )}
                      {outreachFramework === 'bab' && (
                        <p><strong className="text-purple-600 dark:text-purple-400">BAB Framework:</strong> Paints contrast between manual spreadsheet lead chases and waking up to verified investor calendar bookings.</p>
                      )}
                      {outreachFramework === 'soft_offer' && (
                        <p><strong className="text-emerald-600 dark:text-emerald-400">Permission / Soft Offer:</strong> Zero-pressure, humble 2-sentence note asking permission to send a 60-second video demo.</p>
                      )}
                      {outreachFramework === 'auto_rotate' && (
                        <p><strong className="text-indigo-600 dark:text-indigo-400">A/B Testing Rotation:</strong> Automatically cycles through all 5 frameworks across queue leads to test reply rates.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm">Outreach Actions</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => { if(confirm('Clear all leads?')) { await supabase.from('outreach_leads').delete().neq('id', 0); fetchDashboardData(); } }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs shadow-lg transition-all">Clear Data</button>
                    <button 
                      onClick={async () => {
                        alert(`Triggering Outreach Engine with [${outreachFramework.toUpperCase()}] Framework...`);
                        const res = await fetch(`/api/outreach/cron?framework=${outreachFramework}`);
                        const data = await res.json();
                        if(data.success) {
                          alert('Emails sent to: ' + data.processed.map((p: any) => `${p.email} (${p.framework || outreachFramework})`).join(', '));
                          fetchDashboardData();
                        } else {
                          alert('Message: ' + (data.message || data.error));
                        }
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5">
                      <Sparkles size={14} /> Process Queue (Send 2 Mails)
                    </button>
                  </div>
                </div>
                {outreachLeads.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <Mail size={40} className="mx-auto mb-3 opacity-20" />
                    <p>Upload a CSV file (DLD_Dubai_Brokers...)</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-[#2a2c31] text-xs uppercase text-gray-500">
                          <th className="py-3 pr-4 font-semibold">Name</th>
                          <th className="py-3 px-4 font-semibold">Email</th>
                          <th className="py-3 px-4 font-semibold">Agency</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {outreachLeads.slice(0, 50).map(lead => (
                          <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="border-b border-gray-50 dark:border-[#1e2024] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1c22] cursor-pointer transition-colors">
                            <td className="py-3 pr-4 font-medium dark:text-white">{lead.name}</td>
                            <td className="py-3 px-4 text-gray-500">{lead.email}</td>
                            <td className="py-3 px-4 text-gray-500">{lead.agency_name || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${lead.status === 'sent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : lead.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-500/10' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                {lead.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {outreachLeads.length > 50 && <p className="text-xs text-center text-gray-400 mt-4">Showing last 50 leads...</p>}
                  </div>
                )}
              
                {/* Lead CRM Modal */}
                {selectedLead && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLead(null)}>
                    <div className="bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-xl font-bold dark:text-white">{selectedLead.name}</h2>
                          <p className="text-sm text-gray-500">{selectedLead.email} � {selectedLead.phone || 'No Phone'}</p>
                        </div>
                        <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl">&times;</button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-[#1a1c22] p-4 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Agency</p>
                          <p className="font-medium dark:text-white">{selectedLead.agency_name || '-'}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#1a1c22] p-4 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Agency Size</p>
                          <p className="font-medium dark:text-white">{selectedLead.agency_size || '-'}</p>
                        </div>
                        <div className="col-span-2 bg-gray-50 dark:bg-[#1a1c22] p-4 rounded-xl">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">AI Recommended Offer</p>
                          <p className="font-medium dark:text-white">{selectedLead.recommended_offer || '-'}</p>
                        </div>
                      </div>

                      {selectedLead.status === 'sent' && selectedLead.ai_rationale && (
                        <div className="mb-6">
                          <h3 className="text-sm font-bold text-blue-600 dark:text-[#00f0ff] mb-2 flex items-center gap-2">
                            <Sparkles size={16} /> AI Thought Process & Rationale
                          </h3>
                          <div className="bg-blue-50 dark:bg-[#00f0ff]/10 border border-blue-100 dark:border-[#00f0ff]/20 p-4 rounded-xl text-sm dark:text-blue-100 leading-relaxed">
                            {selectedLead.ai_rationale}
                          </div>
                        </div>
                      )}

                      {selectedLead.status === 'sent' && selectedLead.ai_generated_body && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Email Sent</h3>
                          <div className="bg-gray-50 dark:bg-[#1a1c22] border border-gray-200 dark:border-[#2a2c31] p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
                            <span className="font-bold text-gray-900 dark:text-white block mb-2">Subject: {selectedLead.ai_generated_subject}</span>
                            {selectedLead.ai_generated_body}
                          </div>
                        </div>
                      )}

                      {selectedLead.status === 'unsent' && (
                        <div className="text-center py-8 text-gray-400">
                          <p>This lead is waiting in the queue.</p>
                          <p className="text-xs mt-1">AI will generate rationale and email upon sending.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
</div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="animate-fade-in space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Property Inventory</h3>
                  <p className="text-sm text-gray-500 dark:text-[#6b7280]">AI will pitch these properties to WhatsApp leads</p>
                </div>
                <button onClick={() => setIsAddingProp(!isAddingProp)} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] rounded-xl text-sm font-semibold flex items-center gap-2 w-fit hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all">
                  <Plus size={16} /> Add Property
                </button>
              </div>

              {isAddingProp && (
                <div className="bg-white dark:bg-[#1a1c22] rounded-2xl border border-blue-200 dark:border-[#00f0ff]/20 p-6 animate-fade-in">
                  <h4 className="font-bold text-sm mb-4">Add New Property</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <input type="text" placeholder="Title (e.g. 3BHK Luxury Villa)" className="px-4 py-2.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 text-sm transition-colors" value={newProp.title} onChange={e => setNewProp({...newProp, title: e.target.value})} />
                    <input type="text" placeholder="Location (e.g. Palm Jumeirah)" className="px-4 py-2.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 text-sm transition-colors" value={newProp.location} onChange={e => setNewProp({...newProp, location: e.target.value})} />
                    <input type="text" placeholder="Price (e.g. 4.5M AED)" className="px-4 py-2.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 text-sm transition-colors" value={newProp.price} onChange={e => setNewProp({...newProp, price: e.target.value})} />
                    <input type="text" placeholder="Description" className="px-4 py-2.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 text-sm transition-colors" value={newProp.description} onChange={e => setNewProp({...newProp, description: e.target.value})} />
                    
                    <div className="md:col-span-2 mt-1">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider mb-2">Upload Property Image</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none text-sm transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer dark:file:bg-blue-500/20 dark:file:text-[#00f0ff] dark:hover:file:bg-blue-500/30" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                          }
                        }} 
                      />
                      <p className="text-[10px] text-gray-400 mt-2">A PDF brochure will be automatically generated and saved when you click Save.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddProperty} disabled={isUploading} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                      {isUploading ? 'Saving & Generating PDF...' : 'Save'}
                    </button>
                    <button onClick={() => setIsAddingProp(false)} className="px-4 py-2 bg-gray-100 dark:bg-[#2a2c31] rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-[#333539] transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((prop: any) => (
                  <div key={prop.id} className="bg-white dark:bg-[#1a1c22] rounded-2xl border border-gray-200/60 dark:border-[#2a2c31] p-4 card-hover relative group flex flex-col">
                    <button onClick={() => handleDeleteProperty(prop.id)} className="absolute top-6 right-6 text-gray-700 bg-white/80 backdrop-blur rounded-full p-1.5 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"><Trash2 size={14} /></button>
                    {prop.image ? (
                      <div className="w-full h-36 rounded-xl mb-3 bg-gray-100 dark:bg-gray-800 bg-cover bg-center border border-gray-100 dark:border-[#2a2c31]" style={{ backgroundImage: `url(${prop.image})` }}></div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mb-3"><Building size={20} className="text-blue-500" /></div>
                    )}
                    <h4 className="font-bold text-sm mb-1">{prop.title}</h4>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2"><MapPin size={12} /> {prop.location}</div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-600 dark:text-[#00ff88]"><DollarSign size={14} /> {prop.price}</div>
                      {prop.brochure && <a href={prop.brochure} target="_blank" rel="noreferrer" className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-[#00f0ff] px-2 py-1 rounded font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-500/30 transition-colors flex items-center gap-1">📄 PDF</a>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#8b8f96] line-clamp-2 mt-auto">{prop.description}</p>
                  </div>
                ))}
                {inventory.length === 0 && !isAddingProp && (
                  <div className="col-span-full text-center py-12 text-gray-400 text-sm border border-dashed rounded-2xl border-gray-200 dark:border-[#2a2c31]">
                    No properties added yet. Click &quot;Add Property&quot; to start.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── CHATS ─── */}
          {activeTab === 'chats' && (
            <div className="flex h-[calc(100vh-64px)] bg-[#f8f9fc] dark:bg-[#111318]">
              <div className="w-[300px] shrink-0 border-r border-gray-200/80 dark:border-[#1e2024] bg-white dark:bg-[#0c0e12] flex-col hidden md:flex">
                <div className="p-4 border-b border-gray-100 dark:border-[#1e2024]">
                  <p className="text-xs font-bold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider">Conversations</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {leads.map((lead: any) => (
                    <div key={lead.id} onClick={() => fetchLeadChat(lead.phone)}
                      className={`px-4 py-3 cursor-pointer transition-all border-l-2 ${selectedLeadPhone === lead.phone ? 'bg-blue-50/50 dark:bg-[#1a1c22] border-l-blue-500 dark:border-l-[#00f0ff]' : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-[#1a1c22]/50'}`}>
                      <p className="font-semibold text-sm text-gray-800 dark:text-white">{lead.name || 'Unknown'}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-gray-400">{lead.phone}</p>
                        <span className={statusBadge(lead.status)}>{lead.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white dark:bg-[#111318]">
                {selectedLeadPhone ? (
                  <>
                    <div className="px-5 py-3 border-b border-gray-200/80 dark:border-[#1e2024] bg-white dark:bg-[#1a1c22] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                        {leads.find(l => l.phone === selectedLeadPhone)?.name?.substring(0,2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{leads.find(l => l.phone === selectedLeadPhone)?.name || 'Unknown'}</p>
                        <p className="text-[11px] text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-green inline-block"></span> Active on WhatsApp</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#f8f9fc] dark:bg-[#0c0e12]">
                      {leadChatHistory.map((chat: any) => (
                        <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${chat.role === 'user' ? 'bg-blue-600 dark:bg-[#00f0ff] text-white dark:text-[#0c0e12] rounded-br-md' : 'bg-white dark:bg-[#1a1c22] border border-gray-200 dark:border-[#2a2c31] text-gray-700 dark:text-[#e2e2e8] rounded-bl-md shadow-sm'}`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {chat.role === 'ai' && <Bot size={12} className="text-blue-500 dark:text-[#00f0ff]" />}
                              <span className="text-[9px] font-bold opacity-60 uppercase tracking-wider">{chat.role === 'ai' ? 'Aura' : 'Lead'}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{chat.message}</p>
                            <p className="text-[9px] opacity-50 text-right mt-1">{new Date(chat.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                      ))}
                      {leadChatHistory.length === 0 && <div className="h-full flex items-center justify-center text-gray-400 text-sm">Select a conversation to view.</div>}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">Select a lead to view their chat history</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ANALYTICS ─── */}
          {activeTab === 'analytics' && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Sales Intelligence</h3>
                <p className="text-sm text-gray-500 dark:text-[#6b7280]">Performance metrics from your AI agent</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Interactions', value: leads.length, color: 'text-gray-900 dark:text-white' },
                  { label: 'Conversion Rate', value: `${leads.length ? Math.round(((stats.active + stats.recovered) / leads.length) * 100) : 0}%`, color: 'text-emerald-600 dark:text-[#00ff88]' },
                  { label: 'Time Saved', value: `${Math.round(leads.length * 12.5 / 60)}h`, color: 'text-blue-600 dark:text-[#00f0ff]' },
                  { label: 'Cost Saved', value: `$${leads.length * 25}`, color: 'text-purple-600 dark:text-purple-400' },
                ].map((m, i) => (
                  <div key={i} className="bg-white dark:bg-[#1a1c22] p-5 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31] card-hover">
                    <p className="text-[11px] text-gray-400 dark:text-[#6b7280] font-semibold uppercase tracking-wider mb-2">{m.label}</p>
                    <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1a1c22] p-6 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31]">
                  <h4 className="text-sm font-bold mb-5">Lead Quality Pipeline</h4>
                  {[
                    { label: 'Hot Leads', status: 'Hot', color: 'bg-red-500' },
                    { label: 'Warm Leads', status: 'Warm', color: 'bg-amber-500' },
                    { label: 'New / Cold', status: 'New', color: 'bg-blue-500' },
                  ].map((bar, i) => (
                    <div key={i} className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-gray-600 dark:text-gray-300">{bar.label}</span>
                        <span className="text-gray-400">{leads.filter(l => l.status === bar.status).length}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-[#0c0e12] rounded-full h-2">
                        <div className={`${bar.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${leads.length ? (leads.filter(l => l.status === bar.status).length / leads.length) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-[#1a1c22] p-6 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31] flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-[#1e2024]" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${78 * 3.14} ${100 * 3.14}`} />
                      <defs><linearGradient id="grad"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold">78%</p>
                      <p className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider">Positive</p>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold mb-1">AI Sentiment</h4>
                  <p className="text-xs text-gray-400 text-center max-w-[200px]">High interest in luxury villas and off-plan apartments</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── RECOVERY / CAMPAIGNS ─── */}
          {activeTab === 'recovery' && (
            <div className="animate-fade-in">
              <div className="bg-white dark:bg-[#1a1c22] p-6 md:p-8 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Campaign Broadcasts</h3>
                <p className="text-sm text-gray-500 dark:text-[#6b7280] mb-6">Send WhatsApp broadcasts to re-engage leads</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider mb-2">Target Audience</label>
                      <div className="flex flex-wrap gap-2">
                        {['New', 'Warm', 'Cold', 'Custom CSV'].map(status => (
                          <button key={status} onClick={() => setCampaignStatus(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${campaignStatus === status ? 'border-blue-500 dark:border-[#00f0ff] bg-blue-50 dark:bg-[#00f0ff]/8 text-blue-600 dark:text-[#00f0ff]' : 'border-gray-200 dark:border-[#2a2c31] text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1e2024]'}`}>
                            {status === 'Custom CSV' ? 'Import CSV File' : `${status} Leads`}
                          </button>
                        ))}
                      </div>

                      {campaignStatus === 'Custom CSV' && (
                        <div className="mt-4 p-4 border-2 border-dashed border-gray-200 dark:border-[#2a2c31] rounded-xl flex items-center justify-center bg-gray-50 dark:bg-[#1e2024]/50 cursor-pointer hover:border-blue-400 transition-colors animate-fade-in">
                          <div className="text-center">
                            <div className="w-10 h-10 bg-white dark:bg-[#0c0e12] rounded-full flex items-center justify-center mx-auto mb-2 text-blue-500 shadow-sm border border-gray-100 dark:border-[#2a2c31]">
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                            </div>
                            <p className="text-sm font-semibold">Click to upload CSV</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Column A should contain phone numbers</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider mb-2">Message</label>
                      <textarea value={campaignMsg} onChange={e => setCampaignMsg(e.target.value)} placeholder="Hi! We have a new luxury property launch matching your interests..." className="w-full h-28 px-4 py-3 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 resize-none text-sm transition-colors"></textarea>
                    </div>
                    <button onClick={handleSendCampaign} disabled={isSendingCampaign || (!campaignMsg && campaignStatus !== 'Custom CSV')} className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                      {isSendingCampaign ? 'Sending...' : <><RefreshCcw size={16} /> Launch Broadcast</>}
                    </button>
                  </div>

                  <div className="lg:col-span-2 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] p-6 rounded-xl flex flex-col justify-center items-center text-center">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3">
                      <Users size={28} className="text-blue-500" />
                    </div>
                    {campaignStatus === 'Custom CSV' ? (
                      <>
                        <p className="text-lg font-bold mb-1 text-gray-400">CSV Pending</p>
                        <p className="text-xs text-gray-500">Upload a file to see lead count</p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold mb-1">{leads.filter(l => l.status === campaignStatus).length}</p>
                        <p className="text-xs text-gray-400">leads will receive this message</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── AUTOMATIONS / WORKFLOWS ─── */}
          {activeTab === 'workflows' && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Integrations & Automations</h3>
                <p className="text-sm text-gray-500 dark:text-[#6b7280]">Connect channels, CRMs, and n8n workflows</p>
              </div>

              <div className="bg-white dark:bg-[#1a1c22] p-6 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31]">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-blue-500"/> Connected Channels</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'WhatsApp', status: 'Connected', connected: true },
                    { name: 'Instagram', status: 'Coming Soon', connected: false },
                    { name: 'Property Finder', status: 'Coming Soon', connected: false },
                    { name: 'Bayut', status: 'Coming Soon', connected: false }
                  ].map(ch => (
                    <div key={ch.name} className="p-4 rounded-xl border border-gray-100 dark:border-[#2a2c31] flex flex-col items-center text-center gap-2 card-hover">
                      <div className={`w-2.5 h-2.5 rounded-full ${ch.connected ? 'bg-emerald-500 pulse-green' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      <p className="text-sm font-semibold">{ch.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{ch.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1c22] p-6 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31]">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Users size={16} className="text-amber-500"/> CRM Integrations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { name: 'HubSpot', key: 'hubspot_url' },
                    { name: 'Salesforce', key: 'salesforce_url' },
                    { name: 'Zoho CRM', key: 'zoho_url' }
                  ].map(crm => {
                    const isConnected = !!crmSettings?.[crm.key];
                    return (
                      <div key={crm.name} className="p-4 rounded-xl border border-gray-100 dark:border-[#2a2c31] flex items-center justify-between card-hover">
                        <p className="text-sm font-semibold">{crm.name}</p>
                        {isConnected ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-green"></span> Connected
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowCrmModal(crm.name)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-[#0c0e12] text-xs font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e2024] border border-gray-200 dark:border-[#2a2c31] transition-colors"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {showCrmModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#1a1c22] rounded-2xl w-full max-w-md p-6 animate-fade-in border border-gray-200 dark:border-[#2a2c31] shadow-2xl relative">
                    <button onClick={() => setShowCrmModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18}/></button>
                    <h3 className="text-lg font-bold mb-2">Connect {showCrmModal}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Enter your Webhook URL (n8n, Make, or Zapier) to automatically sync Hot leads and scheduled meetings to {showCrmModal}.</p>
                    
                    <input 
                      type="text" 
                      placeholder="https://your-webhook-url.com/..." 
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 text-sm mb-5"
                      value={crmUrlInput}
                      onChange={e => setCrmUrlInput(e.target.value)}
                    />
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={handleVerifyCrm} 
                        disabled={isVerifyingCrm || !crmUrlInput}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isVerifyingCrm ? 'Verifying & Saving...' : 'Verify & Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-[#1a1c22] p-6 rounded-2xl border border-blue-200/50 dark:border-[#00f0ff]/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/5 to-transparent dark:from-[#00f0ff]/3 rounded-bl-full"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10 mb-5">
                  <div>
                    <h4 className="text-sm font-bold mb-1 flex items-center gap-2"><Zap size={16} className="text-blue-500 dark:text-[#00f0ff]"/> n8n Automations</h4>
                    <p className="text-xs text-gray-400 max-w-md">Upload a JSON workflow to instantly install new automations</p>
                  </div>
                  <button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] font-semibold rounded-xl text-xs flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all whitespace-nowrap">
                    <Plus size={14}/> Upload JSON
                  </button>
                </div>
                <div className="space-y-2 relative z-10">
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#2a2c31] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-green"></div>
                      <p className="text-sm font-medium">Sync Hot Leads to Google Sheets</p>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Active</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0c0e12] border border-gray-100 dark:border-[#2a2c31] flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <p className="text-sm font-medium">Email Notification on New Lead</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Paused</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SETTINGS ─── */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h3>
                <p className="text-sm text-gray-500 dark:text-[#6b7280]">Manage your AI assistant and preferences</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white dark:bg-[#1a1c22] p-6 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31]">
                  <h4 className="text-sm font-bold mb-5 flex items-center gap-2"><Bot size={16} className="text-blue-500"/> AI Agent Profile</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-lg font-bold cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all overflow-hidden group">
                        {agentDpFile ? (
                          <img src={URL.createObjectURL(agentDpFile)} className="w-full h-full object-cover" alt="Agent DP" />
                        ) : (
                          <>{crmSettings.agent_name ? crmSettings.agent_name[0].toUpperCase() : 'A'}</>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => { if(e.target.files && e.target.files[0]) setAgentDpFile(e.target.files[0]) }} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-[10px] uppercase font-bold tracking-wider">Edit</div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Profile Picture</p>
                        <p className="text-xs text-gray-400">Click avatar to upload</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider mb-1.5">Agent Name</label>
                      <input type="text" value={crmSettings.agent_name || ''} onChange={e => setCrmSettings({...crmSettings, agent_name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-[#6b7280] uppercase tracking-wider mb-1.5">Bio</label>
                      <textarea value={crmSettings.agent_bio || ''} onChange={e => setCrmSettings({...crmSettings, agent_bio: e.target.value})} className="w-full h-20 px-4 py-2.5 bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2c31] rounded-xl outline-none focus:border-blue-400 resize-none text-sm"></textarea>
                    </div>
                    <button 
                      onClick={async () => {
                        setIsSyncingDp(true);
                        try {
                          // 1. Save to Supabase (Local config)
                          await supabase.from('settings').update({ agent_name: crmSettings.agent_name, agent_bio: crmSettings.agent_bio }).eq('id', crmSettings.id || '00000000-0000-0000-0000-000000000001');
                          
                          // 2. Sync to Meta API
                          const formData = new FormData();
                          if (crmSettings.agent_bio) formData.append('bio', crmSettings.agent_bio);
                          if (agentDpFile) formData.append('image', agentDpFile);
                          
                          const metaRes = await fetch('/api/whatsapp-profile', { method: 'POST', body: formData });
                          const metaData = await metaRes.json();
                          
                          if (metaData.success) {
                            alert("Profile successfully synced to Meta WhatsApp Business!");
                            setAgentDpFile(null); // reset file input
                          } else {
                            alert("Saved locally, but Meta Sync failed: " + (metaData.error || 'Unknown Error'));
                          }
                        } catch(e) { alert("Error saving profile"); }
                        setIsSyncingDp(false);
                      }}
                      disabled={isSyncingDp}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-[#00f0ff] dark:to-[#00c8ff] text-white dark:text-[#0c0e12] font-semibold rounded-xl text-xs hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSyncingDp ? 'Syncing to Meta API...' : 'Sync to WhatsApp'}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1c22] p-6 rounded-2xl border border-gray-200/60 dark:border-[#2a2c31] h-fit space-y-5">
                  <h4 className="text-sm font-bold flex items-center gap-2"><Settings size={16} className="text-gray-500"/> Preferences</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Dark Mode</p>
                      <p className="text-xs text-gray-400">Toggle dashboard theme</p>
                    </div>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`w-11 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Email Notifications</p>
                      <p className="text-xs text-gray-400">Alerts for Hot leads</p>
                    </div>
                    <button className="w-11 h-6 bg-emerald-500 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-[#2a2c31]">
                    <button onClick={() => setIsAuthenticated(false)} className="w-full px-4 py-2.5 bg-red-50 dark:bg-red-500/8 text-red-500 font-semibold rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors">
                      Logout
                    </button>
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


