'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faChartLine,
  faMicroscope,
  faMagnifyingGlass,
  faCog,
  faSitemap,
  faBrain,
  faGaugeHigh,
  faFlag,
  faUsers,
  faNewspaper,
  faBullhorn,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';
import { PRODUCT_COPY } from '@/config/product';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      group: 'Core',
      icon: <FontAwesomeIcon icon={faChartLine} />,
      label: 'Overview',
      href: '/overview',
    },
    {
      group: 'Core',
      icon: <FontAwesomeIcon icon={faGaugeHigh} />,
      label: 'Live Trends',
      href: '/trends-analysis',
    },
    {
      group: 'Core',
      icon: <FontAwesomeIcon icon={faBrain} />,
      label: 'Opportunities',
      href: '/traffic-insights',
    },
    {
      group: 'SEO Intelligence',
      icon: <FontAwesomeIcon icon={faChartBar} />,
      label: 'Search Console',
      href: '/dashboard',
    },
    {
      group: 'SEO Intelligence',
      icon: <FontAwesomeIcon icon={faMicroscope} />,
      label: 'Performance',
      href: '/performance',
    },
    {
      group: 'SEO Intelligence',
      icon: <FontAwesomeIcon icon={faMagnifyingGlass} />,
      label: 'URL Inspection',
      href: '/url-inspection',
    },
    {
      group: 'SEO Intelligence',
      icon: <FontAwesomeIcon icon={faSitemap} />,
      label: 'Sitemap',
      href: '/sitemap',
    },
    {
      group: 'Platform',
      icon: <FontAwesomeIcon icon={faCog} />,
      label: 'Settings',
      href: '/settings',
    }
  ];

  const plannedItems = [
    { icon: faFlag, label: 'PR Intelligence' },
    { icon: faUsers, label: 'Competitors' },
    { icon: faNewspaper, label: 'Publications' },
    { icon: faBullhorn, label: 'Campaigns' },
    { icon: faFileLines, label: 'Reports' },
  ];

  return (
    <aside className={`border-r border-slate-200 bg-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <Image src="/favicon.png" alt={PRODUCT_COPY.productName} width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{PRODUCT_COPY.productName}</h2>
                <p className="text-xs text-slate-500">{PRODUCT_COPY.altName}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        <nav className="space-y-4">
          {['Core', 'SEO Intelligence', 'Platform'].map((group) => (
            <div key={group} className="space-y-2">
              {!collapsed && (
                <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {group}
                </div>
              )}
              {menuItems.filter((item) => item.group === group).map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={`${group}-${index}`}
                    href={item.href}
                    className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-5 h-5">{item.icon}</span>
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}

          {!collapsed && (
            <div className="space-y-2 pt-2">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Planned
              </div>
              {plannedItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-slate-400"
                  title="Planned functionality"
                >
                  <span className="w-5 h-5">
                    <FontAwesomeIcon icon={item.icon} />
                  </span>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em]">Planned</span>
                </div>
              ))}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 
