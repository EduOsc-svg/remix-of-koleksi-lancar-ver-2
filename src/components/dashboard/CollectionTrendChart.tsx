import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Area,
  ComposedChart
} from "recharts";
import { useDailyCollectionTrend, useMonthlyCollectionTrend, useYearlyCollectionTrend, TrendPeriod } from "@/hooks/useCollectionTrendPeriods";

// Preset options for each period type
const dailyPresets = [
  { value: 7, label: "7H" },
  { value: 14, label: "14H" },
  { value: 30, label: "30H" },
];

const monthlyPresets = [
  { value: 3, label: "3B" },
  { value: 6, label: "6B" },
  { value: 12, label: "12B" },
];

const yearlyPresets = [
  { value: 2, label: "2T" },
  { value: 3, label: "3T" },
  { value: 5, label: "5T" },
];

export function CollectionTrendChart() {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Trend period and range state
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('daily');
  const [trendDays, setTrendDays] = useState(30);
  const [trendMonths, setTrendMonths] = useState(12);
  const [trendYears, setTrendYears] = useState(5);
  
  // Data hooks - all trend hooks called unconditionally
  const { data: dailyTrendData, isLoading: isLoadingDailyTrend } = useDailyCollectionTrend(trendDays);
  const { data: monthlyTrendData, isLoading: isLoadingMonthlyTrend } = useMonthlyCollectionTrend(trendMonths);
  const { data: yearlyTrendData, isLoading: isLoadingYearlyTrend } = useYearlyCollectionTrend(trendYears);

  // Active trend data based on period
  const activeTrendData = useMemo(() => {
    switch (trendPeriod) {
      case 'monthly': return monthlyTrendData || [];
      case 'yearly': return yearlyTrendData || [];
      default: return dailyTrendData || [];
    }
  }, [trendPeriod, dailyTrendData, monthlyTrendData, yearlyTrendData]);

  const isLoadingTrend = trendPeriod === 'daily' ? isLoadingDailyTrend 
    : trendPeriod === 'monthly' ? isLoadingMonthlyTrend 
    : isLoadingYearlyTrend;

  // Check if chart needs scrolling
  const needsScrolling = useMemo(() => {
    if (trendPeriod === 'yearly') return false;
    return activeTrendData.length > (trendPeriod === 'daily' ? 15 : 8);
  }, [trendPeriod, activeTrendData.length]);

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const canLeft = container.scrollLeft > 10;
    const canRight = container.scrollLeft + container.clientWidth < container.scrollWidth - 10;
    
    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  }, []);

  // Initialize scroll buttons on mount and when data changes
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTrendData, trendPeriod, updateScrollButtons]);

  // Scroll handlers
  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -200, behavior: 'smooth' });
    // Update button states after scroll
    setTimeout(updateScrollButtons, 300);
  }, [updateScrollButtons]);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 200, behavior: 'smooth' });
    // Update button states after scroll
    setTimeout(updateScrollButtons, 300);
  }, [updateScrollButtons]);

  // Collection + contract trend totals
  const totalCollection = activeTrendData.reduce((sum, d) => sum + d.amount, 0);
  const totalContract = activeTrendData.reduce((sum, d) => sum + (d.contractAmount || 0), 0);
  const avgPerPeriod = activeTrendData.length > 0 ? totalCollection / activeTrendData.length : 0;

  // Get current presets and value based on period
  const getCurrentPresets = () => {
    switch (trendPeriod) {
      case 'monthly': return monthlyPresets;
      case 'yearly': return yearlyPresets;
      default: return dailyPresets;
    }
  };

  const getCurrentValue = () => {
    switch (trendPeriod) {
      case 'monthly': return trendMonths;
      case 'yearly': return trendYears;
      default: return trendDays;
    }
  };

  const handlePresetChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    switch (trendPeriod) {
      case 'monthly':
        setTrendMonths(numValue);
        break;
      case 'yearly':
        setTrendYears(numValue);
        break;
      default:
        setTrendDays(numValue);
    }
  };

  // Custom Active Dot Component - FusionCharts style
  const CustomActiveDot = (props: any) => {
    const { cx, cy } = props;
    return (
      <g>
        {/* Outer glow ring */}
        <circle
          cx={cx}
          cy={cy}
          r={12}
          fill="none"
          stroke="#2563eb"
          strokeWidth={1}
          strokeOpacity={0.3}
          className="animate-pulse"
        />
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#2563eb"
          stroke="#ffffff"
          strokeWidth={3}
          filter="drop-shadow(0 2px 8px rgba(37, 99, 235, 0.3))"
        />
        {/* Inner highlight */}
        <circle
          cx={cx}
          cy={cy}
          r={2}
          fill="#60a5fa"
        />
      </g>
    );
  };

  // Enhanced Custom Tooltip Component (multi-series)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateStr = payload[0]?.payload?.date || label;
      const date = new Date(dateStr);
      const formattedDate = trendPeriod === 'daily' && !isNaN(date.getTime())
        ? date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
        : label;

      const seriesMeta: Record<string, { label: string; color: string }> = {
        contractAmount: { label: 'Omset Kontrak Baru', color: '#6366f1' },
        amount: { label: 'Penagihan Aktual', color: '#10b981' },
      };

      return (
        <div className="bg-slate-800/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-slate-600/50 min-w-[220px]">
          <p className="text-slate-300 text-xs mb-3 font-medium">{formattedDate}</p>
          <div className="space-y-2">
            {payload.map((entry: any) => {
              const meta = seriesMeta[entry.dataKey] || { label: entry.dataKey, color: entry.color };
              return (
                <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="text-slate-300 text-xs">{meta.label}</span>
                  </div>
                  <span className="text-white font-semibold text-sm">{formatRupiah(entry.value || 0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Y-Axis tick formatter
  const formatYAxisTick = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}Jt`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
    return value === 0 ? '0' : value.toString();
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/30">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          {/* Period Toggle - Enhanced styling */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent font-bold">
                  {t("dashboard.collectionTrend")}
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2 font-medium flex flex-wrap gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Omset Kontrak: <span className="text-indigo-600 font-semibold">{formatRupiah(totalContract)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Penagihan: <span className="text-emerald-600 font-semibold">{formatRupiah(totalCollection)}</span>
                </span>
              </p>
            </div>
            <ToggleGroup 
              type="single" 
              value={trendPeriod} 
              onValueChange={(value) => value && setTrendPeriod(value as TrendPeriod)}
              className="bg-slate-100 p-1 rounded-xl shadow-inner"
            >
              <ToggleGroupItem value="daily" className="text-xs px-4 py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-blue-600 font-medium rounded-lg transition-all">
                📊 Harian
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" className="text-xs px-4 py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-blue-600 font-medium rounded-lg transition-all">
                📈 Bulanan
              </ToggleGroupItem>
              <ToggleGroupItem value="yearly" className="text-xs px-4 py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-blue-600 font-medium rounded-lg transition-all">
                📉 Tahunan
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Period-specific preset buttons - Enhanced styling */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">📅 Rentang Waktu:</span>
            <ToggleGroup 
              type="single" 
              value={getCurrentValue().toString()} 
              onValueChange={handlePresetChange}
              className="flex flex-wrap gap-1"
            >
              {getCurrentPresets().map((preset) => (
                <ToggleGroupItem 
                  key={preset.value} 
                  value={preset.value.toString()}
                  className="text-xs px-4 py-2 h-8 data-[state=on]:bg-blue-600 data-[state=on]:text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md border border-slate-200 data-[state=on]:border-blue-600"
                >
                  {preset.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative bg-gradient-to-b from-slate-50/50 to-white">
        
        {/* Scrollable Chart Container */}
        <div 
          ref={scrollContainerRef}
          className="w-full overflow-x-auto scroll-smooth scrollbar-none"
          style={{ 
            WebkitOverflowScrolling: 'touch',
          }}
          onScroll={updateScrollButtons}
        >
          <div 
            className="h-[300px] p-6" 
            style={{ 
              minWidth: trendPeriod === 'daily' 
                ? `${Math.max(800, activeTrendData.length * 28)}px` 
                : trendPeriod === 'monthly' 
                  ? `${Math.max(600, activeTrendData.length * 65)}px`
                  : '100%'
            }}
          >
            {isLoadingTrend ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={activeTrendData} 
                  margin={{ top: 20, right: 60, left: 10, bottom: 20 }}
                  style={{
                    background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)"
                  }}
                >
                  {/* Gradient Definitions */}
                  <defs>
                    <linearGradient id="contractGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                    </linearGradient>
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
                    </filter>
                  </defs>
                  
                  {/* Professional Grid - TradingView style */}
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    vertical={false} 
                    stroke="#e2e8f0" 
                    strokeOpacity={0.6}
                  />
                  
                  {/* X-Axis - Clean styling */}
                  <XAxis 
                    dataKey="label" 
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={trendPeriod === 'monthly' ? -45 : 0}
                    textAnchor={trendPeriod === 'monthly' ? 'end' : 'middle'}
                    height={trendPeriod === 'monthly' ? 60 : 30}
                    tick={{ 
                      fill: '#64748b', 
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    className="select-none"
                  />
                  
                  {/* Y-Axis - Right side like TradingView */}
                  <YAxis 
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatYAxisTick}
                    tick={{ 
                      fill: '#64748b', 
                      fontSize: 10,
                      fontWeight: 500
                    }}
                    width={50}
                    className="select-none"
                    domain={[0, 'dataMax + dataMax * 0.1']}
                  />
                  
                  {/* Custom Tooltip */}
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: '#64748b',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                      strokeOpacity: 0.8
                    }}
                    animationDuration={200}
                  />
                  
                  {/* Line 1: Omset Kontrak Baru (accrual) */}
                  <Line 
                    type="monotone" 
                    dataKey="contractAmount" 
                    stroke="url(#contractGradient)"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                    animationDuration={1200}
                    animationBegin={0}
                  />

                  {/* Line 2: Penagihan Aktual (cash) */}
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="url(#collectionGradient)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={<CustomActiveDot />}
                    connectNulls={false}
                    animationDuration={1200}
                    animationBegin={200}
                    filter="url(#dropShadow)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
