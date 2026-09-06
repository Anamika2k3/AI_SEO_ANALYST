'use client';

import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faSpinner, faCheckCircle, faExclamationTriangle, faInfoCircle, faBrain } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '@/lib/api';

interface UrlInspectionResult {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      referringUrls?: string[];
      crawledAs?: string;
      robotsTxtState?: string;
      sitemap?: string[];
    };
    ampResult?: {
      verdict?: string;
      issues?: Array<{
        severity?: string;
        issueMessage?: string;
      }>;
      ampIndexable?: boolean;
    };
    mobileUsabilityResult?: {
      verdict?: string;
      issues?: Array<{
        severity?: string;
        issueMessage?: string;
      }>;
    };
    richResultsResult?: {
      verdict?: string;
      detectedItems?: Array<{
        richResultType?: string;
        items?: Array<{
          name?: string;
          value?: string;
        }>;
      }>;
    };
  };
  error?: string;
}

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

export default function UrlInspectionPage() {
  const { sites, fetchSites } = useData();
  const [inspectionUrl, setInspectionUrl] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlInspectionResult | null>(null);
  const [auditResult, setAuditResult] = useState<PageAuditResult | null>(null);
  const [mode, setMode] = useState<'audit' | 'gsc'>('audit');
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const getAuditInsights = async () => {
    if (!auditResult) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await apiFetch('/api/page-audit-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit: auditResult }),
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
    fetchSites();
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0]);
    }
  }, [fetchSites, sites, selectedSite]);

  const handleInspect = async () => {
    if (!inspectionUrl.trim()) {
      setError('Please enter a URL to inspect');
      return;
    }

    if (!selectedSite) {
      setError('Please select a site');
      return;
    }

    // Validate URL format
    try {
      new URL(inspectionUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com/page)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiFetch('/api/url-inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionUrl: inspectionUrl.trim(),
          siteUrl: selectedSite,
          languageCode: 'en-US'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to inspect URL');
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Error inspecting URL:', err);
      setError('Failed to inspect URL. Make sure the backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageAudit = async () => {
    if (!inspectionUrl.trim()) {
      setError('Please enter a URL to audit');
      return;
    }
    try {
      new URL(inspectionUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com/page)');
      return;
    }
    setLoading(true);
    setError(null);
    setAuditResult(null);
    setAiInsights(null);
    setAiError(null);
    try {
      const response = await apiFetch('/api/page-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inspectionUrl.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to audit page');
        return;
      }
      setAuditResult(data);
    } catch (err) {
      console.error('Error auditing page:', err);
      setError('Failed to audit page. Make sure the backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryUrl = new URLSearchParams(window.location.search).get('url');
    if (!queryUrl) return;
    setInspectionUrl(queryUrl);
    setMode('audit');
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await apiFetch('/api/page-audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: queryUrl })
          });
          const data = await response.json();
          if (!response.ok) setError(data.error || 'Failed to audit page');
          else setAuditResult(data);
        } catch {
          setError('Failed to audit page. Make sure the backend is running on port 5001.');
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const getVerdictColor = (verdict?: string) => {
    if (!verdict) return 'text-gray-600';
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('pass') || lowerVerdict.includes('valid')) {
      return 'text-green-600';
    }
    if (lowerVerdict.includes('fail') || lowerVerdict.includes('error')) {
      return 'text-red-600';
    }
    if (lowerVerdict.includes('warning') || lowerVerdict.includes('partial')) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  const getVerdictIcon = (verdict?: string) => {
    if (!verdict) return faInfoCircle;
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('pass') || lowerVerdict.includes('valid')) {
      return faCheckCircle;
    }
    if (lowerVerdict.includes('fail') || lowerVerdict.includes('error')) {
      return faExclamationTriangle;
    }
    return faInfoCircle;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 URL Inspection
          </h1>
          <p className="text-gray-600">
            Audit technical SEO, content structure, images, and metadata now, or inspect search visibility when GSC is connected.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Analyze URL</h2>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button type="button" onClick={() => setMode('audit')} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === 'audit' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>Page audit</button>
              <button type="button" onClick={() => setMode('gsc')} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === 'gsc' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>GSC inspection</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {mode === 'gsc' && <div>
              <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-2">
                Site ({sites.length} available)
              </label>
              <select
                id="site-select"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a site...</option>
                {sites.map((site) => (
                  <option key={site} value={site}>
                    {site.replace('https://', '').replace('http://', '')}
                  </option>
                ))}
              </select>
            </div>}

            <div>
              <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
                URL to Inspect
              </label>
              <input
                id="url-input"
                type="text"
                value={inspectionUrl}
                onChange={(e) => setInspectionUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    if (mode === 'audit') {
                      handlePageAudit();
                    } else {
                      handleInspect();
                    }
                  }
                }}
              />
            </div>

            <Button
              onClick={mode === 'audit' ? handlePageAudit : handleInspect}
              disabled={loading || !inspectionUrl.trim() || (mode === 'gsc' && !selectedSite)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2" />
                  {mode === 'audit' ? 'Run page audit' : 'Inspect in GSC'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {auditResult && (
          <div className="space-y-6 rounded-lg bg-white p-6 shadow">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Page Audit Report</h2>
                <p className="mt-1 break-all text-sm text-gray-500">{auditResult.url}</p>
              </div>
              <div className="rounded-xl bg-blue-50 px-5 py-3 text-center">
                <div className="text-3xl font-bold text-blue-700">{auditResult.score}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">SEO score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ['Critical', auditResult.summary.critical, 'text-red-700 bg-red-50'],
                ['Warnings', auditResult.summary.warnings, 'text-amber-700 bg-amber-50'],
                ['Info', auditResult.summary.info, 'text-blue-700 bg-blue-50'],
                ['Internal links', auditResult.links.internal, 'text-emerald-700 bg-emerald-50'],
                ['Missing alt', auditResult.images.missingAlt, 'text-purple-700 bg-purple-50']
              ].map(([label, value, styles]) => (
                <div key={label as string} className={`rounded-lg p-3 ${styles}`}>
                  <div className="text-xs font-medium">{label}</div>
                  <div className="mt-1 text-xl font-bold">{value}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-5">
              <Button
                onClick={getAuditInsights}
                disabled={aiLoading}
                className="bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FontAwesomeIcon icon={aiLoading ? faSpinner : faBrain} className={`mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
                {aiLoading ? 'Analyzing…' : aiInsights ? 'Regenerate AI insights' : 'Get AI insights'}
              </Button>
              {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
              {aiInsights && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="mb-3 text-xl font-bold text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold text-gray-900 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-semibold text-gray-800">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 text-sm leading-6 text-gray-700">{children}</p>,
                      ul: ({ children }) => <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-gray-700">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 list-inside list-decimal space-y-1 text-sm text-gray-700">{children}</ol>,
                      li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {aiInsights}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 text-lg font-semibold">Metadata</h3>
                <dl className="space-y-3 text-sm">
                  <div><dt className="font-medium text-gray-500">Title ({auditResult.metadata.titleLength})</dt><dd className="mt-1 text-gray-900">{auditResult.metadata.title || 'Missing'}</dd></div>
                  <div><dt className="font-medium text-gray-500">Description ({auditResult.metadata.descriptionLength})</dt><dd className="mt-1 text-gray-900">{auditResult.metadata.description || 'Missing'}</dd></div>
                  <div><dt className="font-medium text-gray-500">Canonical</dt><dd className="mt-1 break-all text-gray-900">{auditResult.metadata.canonical || 'Not found'}</dd></div>
                  <div><dt className="font-medium text-gray-500">Robots</dt><dd className="mt-1 text-gray-900">{auditResult.metadata.robots || 'Not specified'}</dd></div>
                </dl>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 text-lg font-semibold">Content structure</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded bg-gray-50 p-3"><div className="text-gray-500">H1 headings</div><div className="mt-1 text-xl font-bold">{auditResult.structure.h1.length}</div></div>
                  <div className="rounded bg-gray-50 p-3"><div className="text-gray-500">H2 headings</div><div className="mt-1 text-xl font-bold">{auditResult.structure.h2.length}</div></div>
                  <div className="rounded bg-gray-50 p-3"><div className="text-gray-500">Word count</div><div className="mt-1 text-xl font-bold">{auditResult.structure.wordCount}</div></div>
                  <div className="rounded bg-gray-50 p-3"><div className="text-gray-500">Structured data</div><div className="mt-1 text-xl font-bold">{auditResult.structuredData.items}</div></div>
                </div>
                {auditResult.structuredData.types.length > 0 && <p className="mt-3 text-sm text-gray-600">Types: {auditResult.structuredData.types.join(', ')}</p>}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-lg font-semibold">Recommended fixes</h3>
              {auditResult.issues.length === 0 ? <p className="text-sm text-emerald-700">No issues detected by the page audit.</p> : <div className="space-y-2">{auditResult.issues.map((issue) => <div key={`${issue.title}-${issue.detail}`} className="rounded-lg bg-gray-50 p-3"><div className="flex items-center gap-2"><span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${issue.severity === 'critical' ? 'bg-red-100 text-red-700' : issue.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{issue.severity}</span><span className="font-semibold text-gray-900">{issue.title}</span></div><p className="mt-1 text-sm text-gray-600">{issue.detail}</p></div>)}</div>}
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && result.inspectionResult && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Inspection Results</h2>

            {/* Index Status Result */}
            {result.inspectionResult.indexStatusResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-blue-600" />
                  Index Status
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.indexStatusResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.indexStatusResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.indexStatusResult.verdict)}`}>
                        {result.inspectionResult.indexStatusResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Coverage State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.coverageState || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Indexing State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.indexingState || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Page Fetch State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.pageFetchState || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Last Crawl Time</p>
                    <p className="text-gray-900">{formatDate(result.inspectionResult.indexStatusResult.lastCrawlTime)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Robots.txt State</p>
                    <p className="text-gray-900">{result.inspectionResult.indexStatusResult.robotsTxtState || 'N/A'}</p>
                  </div>

                  {result.inspectionResult.indexStatusResult.googleCanonical && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Google Canonical</p>
                      <p className="text-gray-900 break-all">{result.inspectionResult.indexStatusResult.googleCanonical}</p>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.userCanonical && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">User Canonical</p>
                      <p className="text-gray-900 break-all">{result.inspectionResult.indexStatusResult.userCanonical}</p>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.crawledAs && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Crawled As</p>
                      <p className="text-gray-900">{result.inspectionResult.indexStatusResult.crawledAs}</p>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.referringUrls && result.inspectionResult.indexStatusResult.referringUrls.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Referring URLs</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.inspectionResult.indexStatusResult.referringUrls.map((url, index) => (
                          <li key={index} className="text-gray-900 break-all">{url}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.inspectionResult.indexStatusResult.sitemap && result.inspectionResult.indexStatusResult.sitemap.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Sitemap</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.inspectionResult.indexStatusResult.sitemap.map((sitemap, index) => (
                          <li key={index} className="text-gray-900 break-all">{sitemap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AMP Result */}
            {result.inspectionResult.ampResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AMP Result</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.ampResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.ampResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.ampResult.verdict)}`}>
                        {result.inspectionResult.ampResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {result.inspectionResult.ampResult.ampIndexable !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">AMP Indexable</p>
                      <p className="text-gray-900">{result.inspectionResult.ampResult.ampIndexable ? 'Yes' : 'No'}</p>
                    </div>
                  )}

                  {result.inspectionResult.ampResult.issues && result.inspectionResult.ampResult.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Issues</p>
                      <ul className="space-y-2">
                        {result.inspectionResult.ampResult.issues.map((issue, index) => (
                          <li key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-sm font-medium text-gray-800">
                              {issue.severity || 'Issue'}: {issue.issueMessage || 'N/A'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Usability Result */}
            {result.inspectionResult.mobileUsabilityResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Usability</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.mobileUsabilityResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.mobileUsabilityResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.mobileUsabilityResult.verdict)}`}>
                        {result.inspectionResult.mobileUsabilityResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {result.inspectionResult.mobileUsabilityResult.issues && result.inspectionResult.mobileUsabilityResult.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Issues</p>
                      <ul className="space-y-2">
                        {result.inspectionResult.mobileUsabilityResult.issues.map((issue, index) => (
                          <li key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="text-sm font-medium text-gray-800">
                              {issue.severity || 'Issue'}: {issue.issueMessage || 'N/A'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rich Results Result */}
            {result.inspectionResult.richResultsResult && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rich Results</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Verdict</p>
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getVerdictIcon(result.inspectionResult.richResultsResult.verdict)} 
                        className={`mr-2 ${getVerdictColor(result.inspectionResult.richResultsResult.verdict)}`}
                      />
                      <p className={`font-semibold ${getVerdictColor(result.inspectionResult.richResultsResult.verdict)}`}>
                        {result.inspectionResult.richResultsResult.verdict || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {result.inspectionResult.richResultsResult.detectedItems && result.inspectionResult.richResultsResult.detectedItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Detected Items</p>
                      <div className="space-y-4">
                        {result.inspectionResult.richResultsResult.detectedItems.map((item, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                              Type: {item.richResultType || 'Unknown'}
                            </p>
                            {item.items && item.items.length > 0 && (
                              <ul className="space-y-1">
                                {item.items.map((subItem, subIndex) => (
                                  <li key={subIndex} className="text-sm text-gray-700">
                                    <span className="font-medium">{subItem.name}:</span> {subItem.value}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

