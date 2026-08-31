const fs = require('fs');

const views = JSON.parse(fs.readFileSync('d:/Hostbolt/new me/revenueline-app/views.json', 'utf-8'));

const pageTsx = `"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RevenueLineDashboard() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setDateStr(new Date().toLocaleDateString('en-US', options));
    
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
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

  const navItems = [
    { id: 'home', icon: 'dashboard', label: 'Home' },
    { id: 'leads', icon: 'person_search', label: 'Leads' },
    { id: 'workflows', icon: 'account_tree', label: 'Workflows' },
    { id: 'chats', icon: 'forum', label: 'AI Chats' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden selection:bg-primary-container/30 selection:text-primary-container transition-colors duration-300">
      
      {/* SideNavBar */}
      <nav className="hidden md:flex w-[280px] h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface-container-lowest flex-col py-margin-mobile z-40 transition-colors">
        <div className="px-gutter mb-margin-desktop flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container">apartment</span>
          </div>
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container tracking-tight">RevenueLine</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Dubai Real Estate</p>
          </div>
        </div>
        
        <ul className="flex flex-col gap-2 flex-grow">
          {navItems.map(item => (
            <li key={item.id}>
              <button 
                onClick={() => setActiveTab(item.id)}
                className={\`w-full flex items-center gap-4 px-gutter py-3 border-l-4 transition-all duration-300 \${activeTab === item.id ? 'border-tertiary-container bg-primary-container/5 text-primary-container' : 'border-transparent text-on-surface-variant hover:bg-surface-variant/20 hover:text-primary'}\`}
              >
                <span className="material-symbols-outlined" style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="font-label-caps text-label-caps uppercase">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        
        <div className="mt-auto">
          <button className="w-full flex items-center gap-4 px-gutter py-3 border-l-4 border-transparent text-on-surface-variant hover:bg-surface-variant/20 hover:text-primary transition-all duration-300">
            <span className="material-symbols-outlined">help_center</span>
            <span className="font-label-caps text-label-caps uppercase">Support</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="md:ml-[280px] min-h-screen flex flex-col">
        
        {/* TopAppBar */}
        <header className="docked full-width top-0 sticky z-50 border-b border-outline-variant bg-background/80 backdrop-blur-xl flex justify-between items-center px-margin-desktop py-margin-mobile transition-colors">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">RevenueLine Automation</h2>
            <span className="font-label-caps text-label-caps text-tertiary-container uppercase tracking-widest mt-1 block">Dashboard</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-surface-container rounded-full px-4 py-2 border border-outline-variant focus-within:border-primary-container transition-all">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
              <input type="text" placeholder="Search leads, properties..." className="bg-transparent border-none outline-none focus:ring-0 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 w-64" />
            </div>
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="text-on-surface-variant hover:text-primary-container transition-colors relative">
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <button className="text-on-surface-variant hover:text-primary-container transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
            </button>
            
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant overflow-hidden cursor-pointer hover:border-primary-container flex items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
          </div>
        </header>

        {activeTab === 'home' && (
            ${views.home.replace(/class=/g, 'className=').replace(/<!--.*?-->/g, '').replace(/id="current-date">.*?<\/p>/g, '>{dateStr}</p>').replace(/<svg/g, '<svg suppressHydrationWarning').split('\n').join('\n            ')}
        )}

        {activeTab === 'chats' && (
            ${(views.chats || '<div>Placeholder</div>').replace(/class=/g, 'className=').replace(/<!--.*?-->/g, '').replace(/<svg/g, '<svg suppressHydrationWarning').split('\n').join('\n            ')}
        )}

        {activeTab === 'leads' && (
            ${(views.leads || '<div>Placeholder</div>').replace(/class=/g, 'className=').replace(/<!--.*?-->/g, '').replace(/<svg/g, '<svg suppressHydrationWarning').split('\n').join('\n            ')}
        )}

        {activeTab === 'workflows' && (
            ${(views.workflows || '<div>Placeholder</div>').replace(/class=/g, 'className=').replace(/<!--.*?-->/g, '').replace(/<svg/g, '<svg suppressHydrationWarning').split('\n').join('\n            ')}
        )}

        {activeTab === 'settings' && (
            ${(views.settings || '<div>Placeholder</div>').replace(/class=/g, 'className=').replace(/<!--.*?-->/g, '').replace(/<svg/g, '<svg suppressHydrationWarning').split('\n').join('\n            ')}
        )}
        
      </div>
    </div>
  );
}
`;

fs.writeFileSync('d:/Hostbolt/new me/revenueline-app/app/dashboard/page.tsx', pageTsx);
console.log('Regenerated page.tsx with all tabs!');
