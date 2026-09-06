'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Gauge, Link2, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { PRODUCT_COPY } from '@/config/product';
import RevealOnScroll from '@/components/ui/RevealOnScroll';

const benefits = [
  { icon: Gauge, title: 'Technical clarity', text: 'See what slows a page down, blocks discovery, or weakens its search foundation.' },
  { icon: Search, title: 'Content intelligence', text: 'Understand keywords, headings, intent, image alt text, and the gaps your page can close.' },
  { icon: Link2, title: 'Compare with context', text: 'Put your page beside similar pages and see which signals create a stronger result.' },
];

const auditItems = ['Loading speed', 'Technical SEO', 'Keywords and headings', 'Images and alt text', 'Structured data', 'Competitor comparison'];

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setSignedIn(localStorage.getItem('seoplus-demo-user') === 'true');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const startAudit = (event: FormEvent) => {
    event.preventDefault();
    const value = url.trim();
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      setError('');
      router.push(`/report?url=${encodeURIComponent(value)}`);
    } catch {
      setError('Enter a complete URL, like https://yourwebsite.com');
    }
  };

  const showAuth = (mode: 'create' | 'sign in') => {
    localStorage.setItem('seoplus-demo-user', 'true');
    setSignedIn(true);
    setAuthMessage(`${mode === 'create' ? 'Welcome to SEOplus.' : 'Welcome back.'} Your local demo account is ready.`);
  };

  return (
    <div className="seo-home min-h-screen overflow-hidden bg-[#f6f8f5] text-[#10263d]">
      <div className={`fixed inset-x-0 top-0 z-50 px-4 transition-all duration-300 ${scrolled ? 'pt-2' : 'pt-4'}`}>
        <header className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl border transition-all duration-300 lg:px-7 ${scrolled ? 'border-white/10 bg-[#0c2035]/95 px-5 py-3 shadow-xl shadow-black/30 backdrop-blur-xl' : 'border-white/15 bg-white/[0.08] px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur-xl'}`}>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/favicon.png" alt="SEOplus" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" priority />
            <span><strong className="block text-lg tracking-tight text-white">SEOplus</strong><span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a9bacb]">Intelligence</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#c5d2df] md:flex">
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#difference" className="hover:text-white">Why SEOplus</a>
            {signedIn ? <Link href="/overview" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8774f] text-xs text-white">A</span> Dashboard</Link> : <><button type="button" onClick={() => showAuth('sign in')} className="hover:text-white">Sign in</button><button type="button" onClick={() => showAuth('create')} className="rounded-full bg-[#e8774f] px-5 py-2.5 text-white shadow-lg shadow-[#e8774f]/20 transition hover:-translate-y-0.5 hover:bg-[#d96540]">Create account</button></>}
          </nav>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-white/20 p-2 text-white md:hidden" aria-label="Open menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        {menuOpen && <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/15 bg-[#142e49]/95 p-4 text-white shadow-xl backdrop-blur-xl md:hidden"><div className="flex flex-col gap-4 text-sm font-semibold"><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#difference" onClick={() => setMenuOpen(false)}>Why SEOplus</a><button type="button" onClick={() => showAuth('sign in')} className="text-left">Sign in</button><button type="button" onClick={() => showAuth('create')} className="rounded-lg bg-[#e8774f] px-4 py-3 text-left text-white">Create account</button></div></div>}
      </div>

      <main>
        <section className="relative grid min-h-[760px] items-center overflow-hidden bg-[#0c2035] px-6 pb-24 pt-40 text-white lg:grid-cols-[1.05fr_0.95fr] lg:px-[max(2.5rem,calc((100vw-80rem)/2))] lg:pb-32 lg:pt-44">
          <div className="relative z-10 animate-seo-reveal">
            <h1 className="max-w-3xl font-serif text-6xl leading-[0.96] tracking-[-0.045em] text-white sm:text-7xl lg:text-[6.6rem]">Know what your page is saying <em className="font-normal text-[#f08b68]">to search.</em></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#b9c8d5]">SEOplus turns a website link into a plain-English SEO report: speed, technical health, content signals, image quality, and the next fixes worth making.</p>
            <form onSubmit={startAudit} className="mt-9 max-w-xl">
              <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.1] p-2 shadow-xl backdrop-blur-md sm:flex-row sm:rounded-full">
                <div className="flex flex-1 items-center gap-3 px-4"><Link2 size={18} className="text-[#f08b68]" /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste your website URL" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#9eb1c1]" aria-label="Website URL" /></div>
                <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-[#e8774f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#d96540] sm:rounded-full">Get free insights <ArrowRight size={16} /></button>
              </div>
              {error && <p className="mt-2 pl-4 text-sm font-medium text-[#c44c3b]">{error}</p>}
              {authMessage && <p className="mt-2 pl-4 text-sm font-medium text-[#34716f]">{authMessage}</p>}
              <p className="mt-3 pl-4 text-xs text-[#90a5b6]">No account needed to start. Your URL is analyzed on demand.</p>
            </form>
          </div>

          <div className="relative min-h-[430px] animate-seo-float lg:min-h-[520px]">
            <div className="absolute right-0 top-8 w-[min(100%,430px)] rounded-[2rem] border border-white/80 bg-[#102f4d] p-5 text-white shadow-2xl shadow-[#173b58]/25 sm:right-8">
              <div className="flex items-center justify-between border-b border-white/15 pb-4"><div><div className="text-[10px] uppercase tracking-[0.24em] text-[#9ccac3]">Live page readout</div><div className="mt-1 text-sm font-semibold">yourwebsite.com</div></div><div className="rounded-full bg-[#d9f0e9] px-3 py-1 text-xs font-bold text-[#23615e]">Ready</div></div>
              <div className="mt-7 flex items-end gap-5"><div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-[#e8774f] bg-[#173b58]"><div className="text-center"><div className="text-5xl font-bold">82</div><div className="text-[10px] uppercase tracking-widest text-[#aac0cb]">page score</div></div></div><div className="flex-1 space-y-4">{[['Technical SEO', 'Good', 'bg-[#8bd1bf]'], ['Content signals', 'Needs focus', 'bg-[#f0bd73]'], ['Page speed', 'Improve', 'bg-[#ef8c75]']].map(([label, value, color]) => <div key={label}><div className="mb-1 flex justify-between text-xs text-[#c5d3da]"><span>{label}</span><span>{value}</span></div><div className="h-2 rounded-full bg-white/10"><div className={`h-full rounded-full ${color}`} style={{ width: value === 'Good' ? '88%' : value === 'Needs focus' ? '61%' : '43%' }} /></div></div>)}</div></div>
              <div className="mt-7 rounded-xl bg-white/10 p-3 text-sm leading-6 text-[#dce7eb]"><span className="mr-2 text-[#f4bf7c]">●</span> Your fastest win: improve image descriptions and strengthen the page title around one clear topic.</div>
            </div>
            <div className="absolute bottom-8 left-0 rounded-2xl border border-[#d5e5e0] bg-white p-4 shadow-xl sm:left-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#e3f2ec] p-2 text-[#317b70]"><ShieldCheck size={19} /></div><div><div className="text-xs font-bold text-[#102f4d]">Actionable, not abstract</div><div className="mt-1 text-[11px] text-[#708394]">Fixes ranked by impact</div></div></div></div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-[#e0e7e1] bg-[#fbfcf8] px-6 py-20 lg:px-10"><div className="mx-auto max-w-7xl"><RevealOnScroll className="max-w-2xl"><div className="text-xs font-bold uppercase tracking-[0.24em] text-[#e8774f]">One link. A sharper plan.</div><h2 className="mt-4 font-serif text-4xl tracking-[-0.03em] text-[#102f4d] sm:text-5xl">Everything your page needs to be understood.</h2></RevealOnScroll><div className="mt-12 grid gap-5 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }, index) => <RevealOnScroll key={title} delayMs={index * 100}><article className="group rounded-2xl border border-[#dce6e2] bg-white p-6 transition hover:-translate-y-1 hover:border-[#b8d2cc] hover:shadow-xl hover:shadow-[#173b58]/5"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f2ed] text-[#317b70] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"><Icon size={21} /></div><span className="font-serif text-4xl text-[#d6e4df]">0{index + 1}</span></div><h3 className="mt-7 text-lg font-bold text-[#102f4d]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#687d8c]">{text}</p></article></RevealOnScroll>)}</div></div></section>

        <section id="difference" className="bg-[#102f4d] px-6 py-24 text-white lg:px-10"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><RevealOnScroll><div className="text-xs font-bold uppercase tracking-[0.24em] text-[#9ccac3]">Why SEOplus</div><h2 className="mt-4 max-w-lg font-serif text-5xl leading-tight tracking-[-0.035em]">Less dashboard noise. More useful decisions.</h2><p className="mt-6 max-w-lg text-base leading-7 text-[#c1d0d6]">Most SEO tools hand you a long list of checks. SEOplus connects the checks, the page, and the competition so you know what to do first.</p></RevealOnScroll><div className="grid gap-3 sm:grid-cols-2">{auditItems.map((item, index) => <RevealOnScroll key={item} delayMs={index * 70}><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/25 hover:bg-white/10"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9ccac3] text-[#102f4d]"><Check size={14} strokeWidth={3} /></span><span className="text-sm font-medium text-[#e0eaec]">{item}</span></div></RevealOnScroll>)}<RevealOnScroll delayMs={auditItems.length * 70} className="sm:col-span-2"><div className="rounded-xl border border-[#e8774f]/40 bg-[#e8774f]/10 p-4"><div className="text-sm font-bold text-[#ffd1bd]">With a free account</div><div className="mt-1 text-sm leading-6 text-[#d4e0e4]">Save your sites, revisit reports, connect Search Console later, and build a personal queue of improvements.</div></div></RevealOnScroll></div></div></section>

        <section className="bg-[#f6f8f5] px-6 py-20 lg:px-10"><RevealOnScroll className="mx-auto max-w-4xl text-center"><div className="text-xs font-bold uppercase tracking-[0.24em] text-[#e8774f]">Start with the page you care about</div><h2 className="mt-4 font-serif text-4xl tracking-[-0.03em] text-[#102f4d] sm:text-5xl">Your next improvement is probably easier to see than you think.</h2><a href="#top" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e8774f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#e8774f]/20 transition hover:-translate-y-0.5 hover:bg-[#d96540]">Run another audit <ArrowRight size={16} /></a></RevealOnScroll></section>
      </main>

      <footer className="border-t border-[#dfe7e1] bg-[#f6f8f5] px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#667c8d] sm:flex-row sm:items-center sm:justify-between"><div><span className="font-semibold text-[#102f4d]">SEOplus.</span> All rights reserved.</div><div>Project by your friendly neighbourhood <span className="font-serif text-lg italic text-[#e8774f]">Anamika</span></div></div></footer>
    </div>
  );
}
