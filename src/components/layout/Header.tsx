'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { PRODUCT_COPY } from '@/config/product';
import IndustrySelector from '@/components/layout/IndustrySelector';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/favicon.png" alt={PRODUCT_COPY.productName} width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {PRODUCT_COPY.altName}
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold text-slate-950">
                {PRODUCT_COPY.productName}
              </h1>
              <span className="text-sm text-slate-500">{PRODUCT_COPY.tagline}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <IndustrySelector />
          <div className="relative">
            <input
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-400">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
