'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Chart from 'chart.js/auto';
import { useData } from '@/contexts/DataContext';
import { getDemoDataForIndustry } from '@/lib/demo-intelligence';
import { getIndustryConfig } from '@/config/industries';
import { PRODUCT_COPY } from '@/config/product';
import { apiFetch, apiUrl } from '@/lib/api';
import type { Trend } from '@/types/trend';

interface GSCRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCData {
  rows: GSCRow[];
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
}

interface SiteOverviewData {
  site: string;
  data: GSCData | null;
  timeSeriesData: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

type OpportunityStatus = 'new' | 'in-progress' | 'completed' | 'dismissed';

const stageStyles: Record<string, string> = {
  EMERGING: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  ACCELERATING: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  PEAK: 'bg-violet-100 text-violet-800 ring-1 ring-violet-200',
  DECLINING: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  NORMAL: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
};

export default function OverviewPage() {
  const {
    sites,
    overviewData,
    setOverviewData,
    topSites,
    setTopSites,
    overviewPeriod,
    setOverviewPeriod,
    overviewDevice,
    setOverviewDevice,
    overviewSecondaryMetric,
    setOverviewSecondaryMetric,
    overviewLoading,
    setOverviewLoading,
    selectedIndustry,
    error,
    setError
  } = useData();
  const demoData = getDemoDataForIndustry(selectedIndustry);
  const industryConfig = getIndustryConfig(selectedIndustry);

  const opportunityTracks = [...demoData.trends]
    .map((trend) => {
      const seoScore = Math.min(100, Math.round((trend.search_momentum * 0.7) + ((100 - trend.competitor_coverage) * 0.3)));
      const prScore = Math.min(100, Math.round((trend.news_momentum * 0.6) + (trend.social_momentum * 0.4)));
      const overallScore = Math.min(100, Math.round((seoScore * 0.6) + (prScore * 0.4)));
      const action =
        trend.trend_stage === 'ACCELERATING'
          ? `Publish a fast follow-up asset on ${trend.title}`
          : trend.trend_stage === 'EMERGING'
            ? `Build a targeting brief and early content cluster around ${trend.title}`
            : trend.trend_stage === 'PEAK'
              ? `Capture share of voice before the topic saturates`
              : `Refresh and repurpose content to protect existing visibility`;

      return {
        ...trend,
        seoScore,
        prScore,
        overallScore,
        action,
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore);

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [opportunityStatuses, setOpportunityStatuses] = useState<Record<string, OpportunityStatus>>({});
  const [opportunityQuery, setOpportunityQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | Trend['trend_stage']>('ALL');
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    const storageKey = `seoplus-opportunities-${selectedIndustry}`;
    try {
      const stored = localStorage.getItem(storageKey);
      setOpportunityStatuses(stored ? JSON.parse(stored) : {});
    } catch {
      setOpportunityStatuses({});
    }
  }, [selectedIndustry]);

  const updateOpportunityStatus = (id: string, status: OpportunityStatus) => {
    setOpportunityStatuses((current) => {
      const next = { ...current, [id]: status };
      localStorage.setItem(`seoplus-opportunities-${selectedIndustry}`, JSON.stringify(next));
      return next;
    });
  };

  const visibleOpportunityTracks = opportunityTracks.filter((trend) => {
    const query = opportunityQuery.trim().toLowerCase();
    const matchesQuery = !query || `${trend.title} ${trend.description} ${trend.category} ${trend.country}`.toLowerCase().includes(query);
    const matchesStage = stageFilter === 'ALL' || trend.trend_stage === stageFilter;
    const matchesStatus = showDismissed || opportunityStatuses[trend.id] !== 'dismissed';
    return matchesQuery && matchesStage && matchesStatus;
  });
  const actNowList = visibleOpportunityTracks.slice(0, 3);
  const radarList = visibleOpportunityTracks.slice(0, 6);
  const avgSeo = Math.round(opportunityTracks.reduce((sum, item) => sum + item.seoScore, 0) / Math.max(opportunityTracks.length, 1));
  const avgPr = Math.round(opportunityTracks.reduce((sum, item) => sum + item.prScore, 0) / Math.max(opportunityTracks.length, 1));

  const selectedOpportunity = opportunityTracks.find((trend) => trend.id === selectedOpportunityId) || actNowList[0];
  const selectedStatus = selectedOpportunity ? opportunityStatuses[selectedOpportunity.id] || 'new' : 'new';
  const selectedActionLabel = selectedOpportunity?.trend_stage === 'ACCELERATING'
    ? 'Publish a rapid-response page and pitch the data angle to relevant publications.'
    : selectedOpportunity?.trend_stage === 'EMERGING'
      ? 'Create a focused content brief, then validate demand with a small search campaign.'
      : 'Refresh the strongest existing asset and add current examples, data, and internal links.';

  const exportOpportunityBrief = () => {
    if (!selectedOpportunity) return;
    const brief = [
      `# ${selectedOpportunity.title}`,
      '',
      `Industry: ${industryConfig.label}`,
      `Country: ${selectedOpportunity.country}`,
      `Category: ${selectedOpportunity.category}`,
      `Stage: ${selectedOpportunity.trend_stage}`,
      `SEO score: ${selectedOpportunity.seoScore}/100`,
      `PR score: ${selectedOpportunity.prScore}/100`,
      `Overall score: ${selectedOpportunity.overallScore}/100`,
      '',
      '## Context',
      selectedOpportunity.description,
      '',
      '## Recommended next step',
      selectedActionLabel,
      '',
      '## Signals',
      `Search momentum: ${selectedOpportunity.search_momentum}/100`,
      `News momentum: ${selectedOpportunity.news_momentum}/100`,
      `Social momentum: ${selectedOpportunity.social_momentum}/100`,
      `Competitor coverage: ${selectedOpportunity.competitor_coverage}/100`,
    ].join('\n');
    const blob = new Blob([brief], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedOpportunity.id}-brief.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Refs for chart canvases
  const overviewChartRefs = useRef<{[key: string]: HTMLCanvasElement | null}>({});
  const overviewChartInstances = useRef<{[key: string]: Chart}>({});

  // Date range options
  const dateRangeOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '180', label: '6 months' },
    { value: '365', label: '1 year' },
    { value: '480', label: '16 months' }
  ];

  // Device options
  const deviceOptions = [
    { value: 'all', label: 'All Devices' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' }
  ];

  // Load overview sites from settings, don't auto-select
  useEffect(() => {
    if (sites.length > 0 && topSites.length === 0) {
      apiFetch('/api/settings')
        .then(res => res.json())
        .then(settingsData => {
          if (settingsData.overviewSites && settingsData.overviewSites.length > 0) {
            setTopSites(settingsData.overviewSites);
          }
        })
        .catch(() => {
          // If settings fetch fails, don't auto-select
        });
    }
  }, [sites, topSites, setTopSites]);

  const createOverviewCharts = useCallback(() => {
    overviewData.forEach((siteData, index) => {
      if (!siteData.timeSeriesData.length) return;

      const chartKey = `overview-${index}`;
      const canvasRef = overviewChartRefs.current[chartKey];

      if (!canvasRef) return;

      if (overviewChartInstances.current[chartKey]) {
        overviewChartInstances.current[chartKey].destroy();
      }

      const ctx = canvasRef.getContext('2d');
      if (!ctx) return;

      const labels = siteData.timeSeriesData.map((item) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const datasets: any[] = [
        {
          label: 'Clicks',
          data: siteData.timeSeriesData.map((item) => item.clicks),
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F620',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Impressions',
          data: siteData.timeSeriesData.map((item) => item.impressions),
          borderColor: '#10B981',
          backgroundColor: '#10B98120',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y1'
        }
      ];

      if (overviewSecondaryMetric === 'ctr') {
        datasets.push({
          label: 'CTR (%)',
          data: siteData.timeSeriesData.map((item) => item.ctr * 100),
          borderColor: '#F59E0B',
          backgroundColor: '#F59E0B20',
          borderWidth: 1,
          fill: false,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 3,
          borderDash: [5, 5]
        });
      } else if (overviewSecondaryMetric === 'position') {
        datasets.push({
          label: 'Position',
          data: siteData.timeSeriesData.map((item) => item.position),
          borderColor: '#EF4444',
          backgroundColor: '#EF444420',
          borderWidth: 1,
          fill: false,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 3,
          borderDash: [5, 5]
        });
      }

      overviewChartInstances.current[chartKey] = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: false
            }
          },
          scales: {
            x: {
              title: { display: false },
              grid: { color: '#E5E7EB' }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: { display: true, text: 'Clicks', color: '#3B82F6' },
              grid: { color: '#E5E7EB' }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: { display: true, text: 'Impressions', color: '#10B981' },
              grid: { drawOnChartArea: false }
            }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    });
  }, [overviewData, overviewSecondaryMetric]);

  useEffect(() => {
    if (overviewData.length > 0) {
      createOverviewCharts();
    }

    return () => {
      Object.values(overviewChartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
      overviewChartInstances.current = {};
    };
  }, [overviewData, overviewSecondaryMetric, createOverviewCharts]);

  const fetchOverviewData = async () => {
    if (topSites.length === 0) return;

    setOverviewLoading(true);
    const newOverviewData: any[] = [];

    try {
      for (const site of topSites) {
        const daysBack = parseInt(overviewPeriod);
        const startDateOverview = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDateOverview = new Date().toISOString().split('T')[0];

        const params = new URLSearchParams({
          siteUrl: site,
          startDate: startDateOverview,
          endDate: endDateOverview,
          dimensions: 'date',
          fetchAll: 'false'
        });

        if (overviewDevice !== 'all') {
          params.append('device', overviewDevice);
        }

        const response = await fetch(apiUrl(`/api/data?${params}`));

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP ${response.status}: ${errorText}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            // Use the raw text.
          }
          newOverviewData.push({
            site,
            data: null,
            timeSeriesData: [],
            error: errorMessage
          });
          continue;
        }

        const result = await response.json();

        if (!result.error) {
          const gscData = result as GSCData;
          const timeSeriesData = processTimeSeriesData(gscData);

          newOverviewData.push({
            site,
            data: gscData,
            timeSeriesData
          });
        } else {
          newOverviewData.push({
            site,
            data: null,
            timeSeriesData: []
          });
        }
      }

      setOverviewData(newOverviewData);
      setError('');
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError('Failed to fetch data. Please check if the backend is running.');
    } finally {
      setOverviewLoading(false);
    }
  };

  const processTimeSeriesData = (gscData: GSCData) => {
    if (!gscData.rows) return [];

    const dateMap = new Map<string, { date: string; clicks: number; impressions: number; ctr: number; position: number }>();

    gscData.rows.forEach((row: GSCRow) => {
      const date = row.keys?.[0] || 'Unknown';

      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        existing.clicks += row.clicks;
        existing.impressions += row.impressions;
        const totalImpressions = existing.impressions + row.impressions;
        existing.ctr = totalImpressions > 0
          ? ((existing.ctr * existing.impressions) + (row.ctr * row.impressions)) / totalImpressions
          : 0;
        existing.position = totalImpressions > 0
          ? ((existing.position * existing.impressions) + (row.position * row.impressions)) / totalImpressions
          : 0;
      } else {
        dateMap.set(date, {
          date,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position
        });
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const getSiteName = (url: string): string => url.replace('https://', '').replace('http://', '');

  const handleRefreshData = () => {
    fetchOverviewData();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                {PRODUCT_COPY.altName}
              </div>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                What should improve on your website right now?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {industryConfig.label} website intelligence built from technical SEO signals, content structure, search momentum, competitor coverage, and content gaps.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-sm">
              {industryConfig.description}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Rising trends</div>
              <div className="mt-3 text-3xl font-bold text-slate-950">{opportunityTracks.filter(item => item.trend_stage === 'ACCELERATING' || item.trend_stage === 'EMERGING').length}</div>
              <div className="mt-1 text-sm text-slate-600">High-priority opportunity windows</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Avg SEO score</div>
              <div className="mt-3 text-3xl font-bold text-blue-700">{avgSeo}</div>
              <div className="mt-1 text-sm text-slate-600">Search demand and competition fit</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Avg PR score</div>
              <div className="mt-3 text-3xl font-bold text-violet-700">{avgPr}</div>
              <div className="mt-1 text-sm text-slate-600">News and media momentum</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Best action</div>
              <div className="mt-3 text-lg font-bold text-slate-950">{actNowList[0]?.title}</div>
              <div className="mt-1 text-sm text-slate-600">Opportunity score {actNowList[0]?.overallScore}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center">
            <label className="flex-1">
              <span className="sr-only">Search opportunities</span>
              <input
                value={opportunityQuery}
                onChange={(event) => setOpportunityQuery(event.target.value)}
                placeholder="Search opportunities, countries, or categories"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label>
              <span className="sr-only">Filter by trend stage</span>
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value as typeof stageFilter)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="ALL">All stages</option>
                <option value="ACCELERATING">Accelerating</option>
                <option value="EMERGING">Emerging</option>
                <option value="PEAK">Peak</option>
                <option value="NORMAL">Normal</option>
                <option value="DECLINING">Declining</option>
              </select>
            </label>
            <label className="flex items-center gap-2 px-1 text-sm text-slate-600">
              <input type="checkbox" checked={showDismissed} onChange={(event) => setShowDismissed(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
              Show dismissed
            </label>
            <span className="text-xs font-medium text-slate-500">{visibleOpportunityTracks.length} of {opportunityTracks.length} shown</span>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">ACT NOW</div>
              <div className="mt-2 text-xl font-semibold text-amber-950">Top opportunity queue</div>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">Priority ranking</div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {actNowList.map((trend, index) => (
              <div key={trend.id} className={`rounded-xl border bg-white p-4 ${selectedOpportunity?.id === trend.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-950">{index + 1}. {trend.title}</div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${stageStyles[trend.trend_stage] || stageStyles.NORMAL}`}>
                    {trend.trend_stage}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>SEO</span>
                  <span className="font-semibold text-blue-700">{trend.seoScore}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>PR</span>
                  <span className="font-semibold text-violet-700">{trend.prScore}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${trend.overallScore}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-700">{trend.action}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium capitalize text-slate-500">{opportunityStatuses[trend.id] || 'new'}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunityId(trend.id)}
                    className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Review opportunity
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedOpportunity && (
            <div className="mt-5 grid gap-4 rounded-xl border border-amber-200 bg-white p-5 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">Action brief</div>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{selectedOpportunity.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedOpportunity.description}</p>
                <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                  <span className="font-semibold">Recommended next step:</span> {selectedActionLabel}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-blue-50 p-3"><div className="text-blue-700">SEO</div><div className="mt-1 text-lg font-bold text-blue-950">{selectedOpportunity.seoScore}</div></div>
                  <div className="rounded-lg bg-violet-50 p-3"><div className="text-violet-700">PR</div><div className="mt-1 text-lg font-bold text-violet-950">{selectedOpportunity.prScore}</div></div>
                  <div className="rounded-lg bg-slate-100 p-3"><div className="text-slate-600">Total</div><div className="mt-1 text-lg font-bold text-slate-950">{selectedOpportunity.overallScore}</div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateOpportunityStatus(selectedOpportunity.id, 'in-progress')} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Start work</button>
                  <button type="button" onClick={() => updateOpportunityStatus(selectedOpportunity.id, 'completed')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Mark complete</button>
                  <button type="button" onClick={() => updateOpportunityStatus(selectedOpportunity.id, 'dismissed')} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Dismiss</button>
                  <button type="button" onClick={exportOpportunityBrief} className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Export brief</button>
                  <span className="self-center text-xs capitalize text-slate-500">Status: {selectedStatus}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Live Trend Radar</div>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Opportunity watchlist</h3>
            </div>
            <div className="text-sm text-slate-500">{radarList.length} tracked topics</div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {radarList.map((trend) => (
              <div key={trend.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{trend.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{trend.country} • {trend.category}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${stageStyles[trend.trend_stage] || stageStyles.NORMAL}`}>
                    {trend.trend_stage}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>Search momentum</span>
                      <span>{trend.search_momentum}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${trend.search_momentum}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>News momentum</span>
                      <span>{trend.news_momentum}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${trend.news_momentum}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-slate-600">Overall score</div>
                  <div className="font-bold text-slate-950">{trend.overallScore}</div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{trend.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Opportunity map</div>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Prioritized trend opportunities</h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {opportunityTracks.map((trend) => (
              <div key={trend.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-slate-900">{trend.title}</div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${stageStyles[trend.trend_stage] || stageStyles.NORMAL}`}>
                    {trend.trend_stage}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg bg-white p-2 text-center">
                    <div className="text-slate-500">SEO</div>
                    <div className="mt-1 font-bold text-blue-700">{trend.seoScore}</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center">
                    <div className="text-slate-500">PR</div>
                    <div className="mt-1 font-bold text-violet-700">{trend.prScore}</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center">
                    <div className="text-slate-500">Total</div>
                    <div className="mt-1 font-bold text-slate-900">{trend.overallScore}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{trend.action}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">📈 Sites Overview</h1>
              <p className="text-gray-600">Multi-site performance tracking and trend analysis</p>
            </div>
            <button
              onClick={handleRefreshData}
              disabled={overviewLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {overviewLoading ? 'Loading...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Overview Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="time-period" className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select id="time-period" className="w-full" onChange={(e) => setOverviewPeriod(e.target.value)} value={overviewPeriod}>
                {dateRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="device-type" className="block text-sm font-medium text-gray-700 mb-2">Device Type</label>
              <select id="device-type" className="w-full" onChange={(e) => setOverviewDevice(e.target.value)} value={overviewDevice}>
                {deviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="secondary-metric" className="block text-sm font-medium text-gray-700 mb-2">Secondary Metric</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOverviewSecondaryMetric('none')}
                  className={`px-3 py-2 text-sm rounded ${overviewSecondaryMetric === 'none' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  None
                </button>
                <button
                  onClick={() => setOverviewSecondaryMetric('ctr')}
                  className={`px-3 py-2 text-sm rounded ${overviewSecondaryMetric === 'ctr' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  CTR
                </button>
                <button
                  onClick={() => setOverviewSecondaryMetric('position')}
                  className={`px-3 py-2 text-sm rounded ${overviewSecondaryMetric === 'position' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Position
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {overviewLoading && topSites.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-8 text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-blue-800">Loading overview data for top {topSites.length} sites...</p>
          </div>
        )}

        {topSites.length === 0 && !overviewLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center mb-6">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-yellow-900 mb-2">No Sites Selected</h3>
            <p className="text-yellow-800 mb-4">Please select sites in Settings to view their overview data.</p>
            <Link href="/settings" className="inline-flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium">
              <span>Go to Settings</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {topSites.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="text-blue-800 font-medium mb-3">
              📊 Showing Top {topSites.length} Sites
              {overviewData.length > 0 && (
                <span className="ml-2 text-sm font-normal">(Data cached - change settings or click refresh to update)</span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-blue-700">
              {topSites.map((site, index) => (
                <div key={site} className="bg-white rounded p-2 border border-blue-200">
                  <span className="font-medium">{index + 1}.</span> {getSiteName(site)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {overviewData.map((siteData, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3" title={siteData.site}>{getSiteName(siteData.site)}</h3>
                {siteData.data && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-600 font-medium text-sm">Total Clicks</div>
                      <div className="text-lg font-bold text-blue-800">{formatNumber(siteData.data.totalClicks)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-green-600 font-medium text-sm">Total Impressions</div>
                      <div className="text-lg font-bold text-green-800">{formatNumber(siteData.data.totalImpressions)}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-orange-600 font-medium text-sm">Average CTR</div>
                      <div className="text-lg font-bold text-orange-800">{(siteData.data.avgCtr * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-red-600 font-medium text-sm">Average Position</div>
                      <div className="text-lg font-bold text-red-800">{siteData.data.avgPosition.toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-80">
                {siteData.timeSeriesData.length > 0 ? (
                  <canvas
                    ref={(el) => {
                      overviewChartRefs.current[`overview-${index}`] = el;
                    }}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <div>No data available for this time period</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {overviewData.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📖 Chart Legend & Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Chart Elements:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <span><strong>Blue Line:</strong> Clicks (left axis)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-500"></div>
                    <span><strong>Green Line:</strong> Impressions (right axis)</span>
                  </li>
                  {overviewSecondaryMetric === 'ctr' && (
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-orange-500 border-dashed border-t"></div>
                      <span><strong>Orange Dashed:</strong> CTR % (no axis)</span>
                    </li>
                  )}
                  {overviewSecondaryMetric === 'position' && (
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-red-500 border-dashed border-t"></div>
                      <span><strong>Red Dashed:</strong> Average Position (no axis)</span>
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">How to Use:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <strong>Time Period:</strong> Adjust to view different date ranges (up to 16 months)</li>
                  <li>• <strong>Device Filter:</strong> Focus on specific device performance</li>
                  <li>• <strong>Secondary Metrics:</strong> Overlay CTR or Position trends</li>
                  <li>• <strong>Hover:</strong> See exact values at any data point</li>
                  <li>• <strong>Dual Axis:</strong> Compare clicks vs impressions with proper scaling</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

