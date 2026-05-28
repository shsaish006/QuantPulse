import React from 'react';
import { getStockDetails } from '@/lib/backend.actions';
import CandlestickChart from '@/components/CandlestickChart';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { ArrowLeft, TrendingUp, TrendingDown, Sparkles, Cpu, Table, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockDetailsPage({ params }: PageProps) {
  const { ticker } = await params;
  const tickerUpper = ticker.toUpperCase().trim();

  let details: any = null;
  let errorMsg: string | null = null;

  try {
    details = await getStockDetails(tickerUpper, '1y');
  } catch (err) {
    console.error(err);
    errorMsg = `Could not load quantitative terminal details for ticker ${tickerUpper}. Verify that the FastAPI backend server is online at port 8000.`;
  }

  return (
    <main className="main-container max-w-360 mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {/* Back to terminal bar */}
      <div className="flex items-center justify-between border-b border-dark-400 pb-4">
        <Link
          href="/"
          className="text-purple-100/70 hover:text-white flex items-center gap-1.5 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Back to Terminal Dashboard
        </Link>
        <span className="text-xs text-purple-100/40 font-mono">QuantPulse Dynamic Stock Routing</span>
      </div>

      {errorMsg ? (
        <div className="p-12 bg-dark-500 rounded-2xl border border-red-500/10 flex flex-col items-center justify-center text-center gap-4">
          <ShieldAlert className="text-red-500 size-12" />
          <h3 className="text-lg font-bold text-white">Connection / Analytics Error</h3>
          <p className="text-sm text-purple-100/60 max-w-md">{errorMsg}</p>
          <Link
            href="/"
            className="bg-green-500 hover:bg-green-400 text-dark-900 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      ) : details ? (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="p-6 bg-dark-500 rounded-2xl border border-purple-600/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-0.5 rounded">
                  QUANT SECURED
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">{tickerUpper}</h2>
              </div>
              <p className="text-sm text-purple-100/60 font-medium mt-1">{details.name}</p>
            </div>
            <div className="text-left sm:text-right">
              <h1 className="text-4xl font-extrabold text-white">{formatCurrency(details.current_price)}</h1>
              <p
                className={`text-sm font-bold flex items-center gap-1 mt-1 sm:justify-end ${
                  details.change_percent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {details.change_percent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatPercentage(details.change_percent)}
              </p>
            </div>
          </div>

          {/* Grid Layout: Chart & ML Prediction */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Columns: Candlestick & Technical metrics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-dark-500 rounded-2xl border border-purple-600/10 p-6 shadow-xl">
                <CandlestickChart
                  data={details.ohlc_history}
                  coinId={tickerUpper}
                  height={380}
                  initialPeriod="daily"
                >
                  <span className="text-sm font-semibold text-white">Interactive Daily Momentum</span>
                </CandlestickChart>
              </div>

              {/* Technical Indicator Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-dark-500 p-4 rounded-xl border border-purple-600/10">
                  <p className="text-xs text-purple-100/50">RSI (14)</p>
                  <h4 className="text-lg font-bold text-white mt-1">{details.rsi.toFixed(2)}</h4>
                  <span className="text-[10px] text-green-400 font-bold block mt-1">Relative Strength</span>
                </div>

                <div className="bg-dark-500 p-4 rounded-xl border border-purple-600/10">
                  <p className="text-xs text-purple-100/50">MACD Line</p>
                  <h4 className="text-lg font-bold text-white mt-1">{details.macd.toFixed(4)}</h4>
                  <p className="text-[10px] text-purple-100/40 mt-1">Signal: {details.macd_signal.toFixed(4)}</p>
                </div>

                <div className="bg-dark-500 p-4 rounded-xl border border-purple-600/10">
                  <p className="text-xs text-purple-100/50">10D Rate of Change</p>
                  <h4 className="text-lg font-bold text-white mt-1">{details.roc.toFixed(2)}%</h4>
                  <p className="text-[10px] text-purple-100/40 mt-1">Price Velocity</p>
                </div>

                <div className="bg-dark-500 p-4 rounded-xl border border-purple-600/10">
                  <p className="text-xs text-purple-100/50">Bollinger Upper/Lower</p>
                  <h4 className="text-sm font-bold text-white mt-1.5 truncate">
                    ${details.bb_lower.toFixed(1)} - ${details.bb_upper.toFixed(1)}
                  </h4>
                  <p className="text-[10px] text-purple-100/40 mt-1">Volatility Bounds</p>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Statistical Forecaster */}
            <div className="lg:col-span-1 bg-dark-500 rounded-2xl border border-purple-600/10 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-dark-400 pb-3">
                <Sparkles className="text-green-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Iterative Rolling Forecast</h3>
                  <p className="text-[10px] text-purple-100/50">7-Day quantitative machine learning predictions</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {details.forecast.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-dark-900/60 rounded-xl border border-dark-400 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{item.date}</p>
                      <span className="text-[10px] text-purple-100/40">Compounded Horizon</span>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-green-400 text-sm">{formatCurrency(item.price)}</p>
                      <span className="text-[9px] text-purple-100/40 font-mono">
                        ${item.lower.toFixed(1)} - ${item.upper.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
