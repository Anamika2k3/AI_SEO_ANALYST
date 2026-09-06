'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faArrowRight, faBrain, faSpinner } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '@/lib/api';
import { PRODUCT_COPY } from '@/config/product';
import ScoreRing from '@/components/ui/ScoreRing';

interface PageAuditResult {
  url: string;
  statusCode: number;
  score: number;
  summary: { critical: number; warnings: number; info: number };
  metadata: { title: string; titleLength: number; description: string; descriptionLength: number; canonical: string; robots: string; ogTitle: string; ogDescription: string };
  structure: { h1: string[]; h2: string[]; h3: string[]; wordCount: number };
  links: { total: number; internal: number; external: number };
  images: { total: number; missingAlt: number };
  structuredData: { items: number; types: string[] };
  issues: Array<{ severity: string; title: string; detail: string }>;
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PageAuditResult | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const getAiInsights = async () => {
    if (!result) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await apiFetch('/api/page-audit-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit: result }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAiError(data.error || 'Failed to generate insights');
      } else {
        setAiInsights(data.insights);
      }
    } catch {
      setAiError('Failed to reach the backend. Make sure it is running on port 5001.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError('No URL provided. Go back and paste a website link to audit.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch('/api/page-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(data.error || 'Failed to audit page');
        } else {
          setResult(data);
        }
      } catch {
        if (!cancelled) setError('Failed to audit page. Make sure the backend is running on port 5001.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="min-h-screen bg-[#f6f8f5] text-[#10263d]">
      <header className="border-b border-[#e0e7e1] bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/favicon.png" alt={PRODUCT_COPY.productName} width={32} height={32} className="h-8 w-8 rounded-lg object-cover" priority />
            <span className="text-lg font-semibold text-[#102f4d]">{PRODUCT_COPY.productName}</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-[#317b70] hover:text-[#255a53]">
            Run another audit
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {loading && (
          <div className="animate-seo-fade-in space-y-6">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#dce6e2] bg-white p-6 text-center">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e8774f] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#e8774f]" />
              </span>
              <p className="text-sm text-[#667c8d]">Analyzing <span className="font-medium text-[#10263d]">{url}</span>…</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-40 rounded-2xl border border-[#dce6e2] bg-white p-5">
                <div className="seo-skeleton h-4 w-24 rounded" />
                <div className="mt-4 space-y-3">
                  <div className="seo-skeleton h-3 w-full rounded" />
                  <div className="seo-skeleton h-3 w-5/6 rounded" />
                  <div className="seo-skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
              <div className="h-40 rounded-2xl border border-[#dce6e2] bg-white p-5">
                <div className="seo-skeleton h-4 w-32 rounded" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="seo-skeleton h-12 rounded" />
                  <div className="seo-skeleton h-12 rounded" />
                  <div className="seo-skeleton h-12 rounded" />
                  <div className="seo-skeleton h-12 rounded" />
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="animate-seo-pop rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mb-3 text-2xl text-red-600" />
            <p className="font-medium text-red-800">{error}</p>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e8774f] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#d96540]">
              Back to homepage
            </Link>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-6">
            <div className="animate-seo-pop rounded-2xl border border-[#dce6e2] bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#e8774f]">Page audit report</div>
                  <p className="mt-1 break-all text-sm text-[#667c8d]">{result.url}</p>
                </div>
                <ScoreRing score={result.score} size={110} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                {[
                  ['Critical', result.summary.critical, 'text-red-700 bg-red-50'],
                  ['Warnings', result.summary.warnings, 'text-amber-700 bg-amber-50'],
                  ['Info', result.summary.info, 'text-blue-700 bg-blue-50'],
                  ['Internal links', result.links.internal, 'text-emerald-700 bg-emerald-50'],
                  ['Missing alt', result.images.missingAlt, 'text-purple-700 bg-purple-50'],
                ].map(([label, value, styles], index) => (
                  <div
                    key={label as string}
                    className={`animate-seo-pop rounded-lg p-3 transition hover:-translate-y-0.5 ${styles}`}
                    style={{ animationDelay: `${100 + index * 60}ms` }}
                  >
                    <div className="text-xs font-medium">{label}</div>
                    <div className="mt-1 text-xl font-bold">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-[#e0e7e1] pt-5">
                <button
                  type="button"
                  onClick={getAiInsights}
                  disabled={aiLoading}
                  className="flex items-center gap-2 rounded-lg bg-[#102f4d] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#173b58] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FontAwesomeIcon icon={aiLoading ? faSpinner : faBrain} className={aiLoading ? 'animate-spin' : ''} />
                  {aiLoading ? 'Analyzing…' : aiInsights ? 'Regenerate AI insights' : 'Get AI insights'}
                </button>
                {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
                {aiInsights && (
                  <div className="animate-seo-fade-in mt-4 rounded-xl border border-[#dce6e2] bg-[#f6f8f5] p-4">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="mb-3 text-xl font-bold text-[#102f4d]">{children}</h1>,
                        h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold text-[#102f4d] first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-semibold text-[#173b58]">{children}</h3>,
                        p: ({ children }) => <p className="mb-3 text-sm leading-6 text-[#10263d]">{children}</p>,
                        ul: ({ children }) => <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-[#10263d]">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-3 list-inside list-decimal space-y-1 text-sm text-[#10263d]">{children}</ol>,
                        li: ({ children }) => <li className="text-sm text-[#10263d]">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-[#102f4d]">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {aiInsights}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="animate-seo-pop rounded-2xl border border-[#dce6e2] bg-white p-5 shadow-sm" style={{ animationDelay: '120ms' }}>
                <h3 className="mb-3 text-lg font-semibold text-[#102f4d]">Metadata</h3>
                <dl className="space-y-3 text-sm">
                  <div><dt className="font-medium text-[#667c8d]">Title ({result.metadata.titleLength})</dt><dd className="mt-1 text-[#10263d]">{result.metadata.title || 'Missing'}</dd></div>
                  <div><dt className="font-medium text-[#667c8d]">Description ({result.metadata.descriptionLength})</dt><dd className="mt-1 text-[#10263d]">{result.metadata.description || 'Missing'}</dd></div>
                  <div><dt className="font-medium text-[#667c8d]">Canonical</dt><dd className="mt-1 break-all text-[#10263d]">{result.metadata.canonical || 'Not found'}</dd></div>
                  <div><dt className="font-medium text-[#667c8d]">Robots</dt><dd className="mt-1 text-[#10263d]">{result.metadata.robots || 'Not specified'}</dd></div>
                </dl>
              </div>
              <div className="animate-seo-pop rounded-2xl border border-[#dce6e2] bg-white p-5 shadow-sm" style={{ animationDelay: '180ms' }}>
                <h3 className="mb-3 text-lg font-semibold text-[#102f4d]">Content structure</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded bg-[#f6f8f5] p-3"><div className="text-[#667c8d]">H1 headings</div><div className="mt-1 text-xl font-bold text-[#10263d]">{result.structure.h1.length}</div></div>
                  <div className="rounded bg-[#f6f8f5] p-3"><div className="text-[#667c8d]">H2 headings</div><div className="mt-1 text-xl font-bold text-[#10263d]">{result.structure.h2.length}</div></div>
                  <div className="rounded bg-[#f6f8f5] p-3"><div className="text-[#667c8d]">Word count</div><div className="mt-1 text-xl font-bold text-[#10263d]">{result.structure.wordCount}</div></div>
                  <div className="rounded bg-[#f6f8f5] p-3"><div className="text-[#667c8d]">Structured data</div><div className="mt-1 text-xl font-bold text-[#10263d]">{result.structuredData.items}</div></div>
                </div>
                {result.structuredData.types.length > 0 && <p className="mt-3 text-sm text-[#667c8d]">Types: {result.structuredData.types.join(', ')}</p>}
              </div>
            </div>

            <div className="animate-seo-pop rounded-2xl border border-[#dce6e2] bg-white p-5 shadow-sm" style={{ animationDelay: '240ms' }}>
              <h3 className="mb-3 text-lg font-semibold text-[#102f4d]">Recommended fixes</h3>
              {result.issues.length === 0 ? (
                <p className="text-sm text-emerald-700">No issues detected by the page audit.</p>
              ) : (
                <div className="space-y-2">
                  {result.issues.map((issue, index) => (
                    <div
                      key={`${issue.title}-${issue.detail}`}
                      className="animate-seo-reveal rounded-lg bg-[#f6f8f5] p-3 transition hover:-translate-x-0.5"
                      style={{ animationDelay: `${280 + index * 70}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${issue.severity === 'critical' ? 'bg-red-100 text-red-700' : issue.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{issue.severity}</span>
                        <span className="font-semibold text-[#10263d]">{issue.title}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#667c8d]">{issue.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="animate-seo-pop rounded-2xl border border-[#e8774f]/40 bg-[#e8774f]/10 p-6 text-center" style={{ animationDelay: '320ms' }}>
              <div className="text-sm font-bold text-[#b4552f]">Want more?</div>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5b4033]">
                Create a free account to save this report, connect Google Search Console for real ranking data, and track fixes over time.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('seoplus-demo-user', 'true');
                  router.push('/overview');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e8774f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#e8774f]/20 transition hover:-translate-y-0.5 hover:bg-[#d96540] animate-seo-pulse-ring"
              >
                Create free account <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f8f5]">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e8774f] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#e8774f]" />
          </span>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
