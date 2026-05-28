'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  getCandlestickConfig,
  getChartConfig,
  PERIOD_BUTTONS,
} from '@/constants';
import { CandlestickSeries, LineSeries, createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { fetcher } from '@/lib/backend.actions';
import { convertOHLCData } from '@/lib/utils';

interface CandlestickChartProps {
  children?: React.ReactNode;
  data: any[];
  coinId: string;
  height?: number;
  initialPeriod?: string;
  showSma20?: boolean;
  showSma50?: boolean;
  showBb?: boolean;
  shortPeriod?: number;
  longPeriod?: number;
}

const CandlestickChart = ({
  children,
  data,
  coinId,
  height = 360,
  initialPeriod = 'daily',
  showSma20 = true,
  showSma50 = true,
  showBb = true,
  shortPeriod = 20,
  longPeriod = 50,
}: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [period, setPeriod] = useState(initialPeriod);
  const [ohlcData, setOhlcData] = useState<any[]>(data ?? []);
  const [isPending, startTransition] = useTransition();

  const fetchOHLCData = async (selectedPeriod: any) => {
    try {
      const periodMap: Record<string, string> = {
        'daily': '1y',
        'weekly': '2y',
        'monthly': '5y'
      };
      const backendPeriod = periodMap[selectedPeriod] || '1y';

      const res = await fetcher<any>(`api/stocks/${coinId}`, {
        period: backendPeriod
      });

      startTransition(() => {
        setOhlcData(res?.ohlc_history ?? []);
      });
    } catch (e) {
      console.error('Failed to fetch OHLCData', e);
    }
  };

  const handlePeriodChange = (newPeriod: any) => {
    if (newPeriod === period) return;

    setPeriod(newPeriod);
    fetchOHLCData(newPeriod);
  };

  // Keep internal data in sync with prop updates
  useEffect(() => {
    if (data) {
      setOhlcData(data);
    }
  }, [data]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const showTime = ['daily', 'weekly', 'monthly'].includes(period);

    const chart = createChart(container, {
      ...getChartConfig(height, showTime),
      width: container.clientWidth,
    });
    
    // Add primary candlestick series
    const series = chart.addSeries(CandlestickSeries, getCandlestickConfig());
    candleSeriesRef.current = series;

    // Add moving averages and Bollinger overlay series
    const sma20Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1.5,
      title: `SMA (${shortPeriod})`,
    });
    sma20SeriesRef.current = sma20Series;

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 1.5,
      title: `SMA (${longPeriod})`,
    });
    sma50SeriesRef.current = sma50Series;

    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: 'rgba(245, 158, 11, 0.75)',
      lineWidth: 1.0,
      lineStyle: 2, // dashed
      title: 'BB Upper',
    });
    bbUpperSeriesRef.current = bbUpperSeries;

    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: 'rgba(245, 158, 11, 0.75)',
      lineWidth: 1.0,
      lineStyle: 2, // dashed
      title: 'BB Lower',
    });
    bbLowerSeriesRef.current = bbLowerSeries;

    chartRef.current = chart;

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      chart.applyOptions({ width: entries[0].contentRect.width });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
    };
  }, [height, period, shortPeriod, longPeriod]);

  // Compute and set data overlays
  useEffect(() => {
    if (!candleSeriesRef.current || !ohlcData.length) return;

    // Format primary data
    const convertedToSeconds = ohlcData.map(
      (item) => [Math.floor(item[0] / 1000), item[1], item[2], item[3], item[4]] as [number, number, number, number, number],
    );
    convertedToSeconds.sort((a, b) => a[0] - b[0]);
    const converted = convertOHLCData(convertedToSeconds);
    
    // Bind Candlesticks
    candleSeriesRef.current.setData(converted);

    // 1. Plot SMA-20 (Short Period)
    if (showSma20 && sma20SeriesRef.current) {
      const smaData = [];
      for (let i = 0; i < converted.length; i++) {
        if (i >= shortPeriod - 1) {
          const slice = converted.slice(i - (shortPeriod - 1), i + 1);
          const avg = slice.reduce((sum, item) => sum + item.close, 0) / shortPeriod;
          smaData.push({ time: converted[i].time, value: avg });
        }
      }
      sma20SeriesRef.current.setData(smaData);
    } else if (sma20SeriesRef.current) {
      sma20SeriesRef.current.setData([]);
    }

    // 2. Plot SMA-50 (Long Period)
    if (showSma50 && sma50SeriesRef.current) {
      const smaData = [];
      for (let i = 0; i < converted.length; i++) {
        if (i >= longPeriod - 1) {
          const slice = converted.slice(i - (longPeriod - 1), i + 1);
          const avg = slice.reduce((sum, item) => sum + item.close, 0) / longPeriod;
          smaData.push({ time: converted[i].time, value: avg });
        }
      }
      sma50SeriesRef.current.setData(smaData);
    } else if (sma50SeriesRef.current) {
      sma50SeriesRef.current.setData([]);
    }

    // 3. Plot Bollinger Bands
    if (showBb && bbUpperSeriesRef.current && bbLowerSeriesRef.current) {
      const upperData = [];
      const lowerData = [];
      const bbPeriod = 20; // Standard 20 period
      
      for (let i = 0; i < converted.length; i++) {
        if (i >= bbPeriod - 1) {
          const slice = converted.slice(i - (bbPeriod - 1), i + 1);
          const mean = slice.reduce((sum, item) => sum + item.close, 0) / bbPeriod;
          const variance = slice.reduce((sum, item) => sum + Math.pow(item.close - mean, 2), 0) / bbPeriod;
          const stdDev = Math.sqrt(variance);
          
          upperData.push({ time: converted[i].time, value: mean + 2 * stdDev });
          lowerData.push({ time: converted[i].time, value: mean - 2 * stdDev });
        }
      }
      bbUpperSeriesRef.current.setData(upperData);
      bbLowerSeriesRef.current.setData(lowerData);
    } else {
      if (bbUpperSeriesRef.current) bbUpperSeriesRef.current.setData([]);
      if (bbLowerSeriesRef.current) bbLowerSeriesRef.current.setData([]);
    }

    chartRef.current?.timeScale().fitContent();
  }, [ohlcData, showSma20, showSma50, showBb, shortPeriod, longPeriod]);

  return (
    <div id="candlestick-chart">
      <div className="chart-header">
        <div className="flex-1">{children}</div>

        <div className="button-group">
          <span className="text-sm mx-2 font-medium text-purple-100/50">Period:</span>
          {PERIOD_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              className={period === value ? 'config-button-active' : 'config-button'}
              onClick={() => handlePeriodChange(value)}
              disabled={isPending}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={chartContainerRef} className="chart" style={{ height }} />
    </div>
  );
};

export default CandlestickChart;
