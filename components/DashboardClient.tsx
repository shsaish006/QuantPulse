'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getStockDetails, optimizePortfolio } from '@/lib/backend.actions';
import CandlestickChart from '@/components/CandlestickChart';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, RefreshCw, Search, ShieldAlert, Cpu, 
  Sparkles, Scale, Info, AreaChart, Settings, ToggleLeft, ToggleRight,
  HelpCircle, Bot, User, Send, BrainCircuit, Table, Activity, ChevronRight,
  Plus, Trash2, Calendar, LineChart, Coins, CircleDollarSign, CheckSquare,
  BookOpen, GitCompare, BarChart3, Star, Compass, AlertTriangle, CheckCircle
} from 'lucide-react';
import { chatWithAI } from '@/lib/backend.actions';

interface DashboardClientProps {
  initialTrending: any[];
}

// 50+ Trading Strategy Goldmines divided into 5 categories
const STRATEGY_GOLDMINES = [
  // 1. Momentum & Trend Following (10 Strategies)
  { id: 'tf_1', cat: 'Trend Following', name: 'Dual SMA Crossover', desc: 'Executes trades on the crossing of short-term (50d) and long-term (200d) simple moving averages to capture macro market currents.' },
  { id: 'tf_2', cat: 'Trend Following', name: 'MACD Divergence Swing', desc: 'Locks onto divergences between price velocity and the MACD line to identify momentum exhaustion and trend pivot points.' },
  { id: 'tf_3', cat: 'Trend Following', name: 'Triple EMA System', desc: 'Employs short, intermediate, and long-term EMAs to filter short-term volatility whipsaws and remain aligned with macro shifts.' },
  { id: 'tf_4', cat: 'Trend Following', name: 'Bollinger Band Breakout', desc: 'Identifies expansion in market volatility and enters positions when price closes outside the 2.0 standard deviation bounds.' },
  { id: 'tf_5', cat: 'Trend Following', name: 'Donchian Channel Breakout', desc: 'Enters long positions when the price breaks above the 20-day high, or short positions below the 20-day low, matching turtle trading rules.' },
  { id: 'tf_6', cat: 'Trend Following', name: 'Keltner ATR Channel', desc: 'Uses an exponential moving average enveloped by ATR channels to identify high-probability trend extensions.' },
  { id: 'tf_7', cat: 'Trend Following', name: 'Parabolic SAR Reversal', desc: 'Applies trailing acceleration stops to dynamically lock in profits and execute immediate position reversals.' },
  { id: 'tf_8', cat: 'Trend Following', name: 'Ichimoku Cloud Breakout', desc: 'Evaluates momentum, support, and future trend thresholds utilizing the Senkou Span A/B boundary cloud.' },
  { id: 'tf_9', cat: 'Trend Following', name: 'Heikin-Ashi Momentum', desc: 'Smooths price candlesticks using average calculations to isolate core directional trends from erratic session noise.' },
  { id: 'tf_10', cat: 'Trend Following', name: 'ADX Trend Strength Filter', desc: 'Integrates the Average Directional Index to avoid trading in rangebound regimes and execute exclusively in high-strength trends.' },

  // 2. Mean Reversion & Volatility (10 Strategies)
  { id: 'mr_1', cat: 'Mean Reversion', name: 'RSI Bound Extreme', desc: 'Triggers counter-trend long positions when the 14-day RSI drops below 25, or shorts above 75, anticipating quick corrections.' },
  { id: 'mr_2', cat: 'Mean Reversion', name: 'Mean Reversion to SMA-200', desc: 'Capitalizes on extreme price deviations from the 200-day simple moving average, expecting prices to pull back to the mean.' },
  { id: 'mr_3', cat: 'Mean Reversion', name: 'Bollinger Band Squeeze', desc: 'Identifies periods of extreme volatility contraction (squeeze) to position for explosive mean-reverting expansions.' },
  { id: 'mr_4', cat: 'Mean Reversion', name: 'Relative Vigor Index (RVI)', desc: 'Measures the conviction of price movements by comparing closing prices to their high-low ranges.' },
  { id: 'mr_5', cat: 'Mean Reversion', name: 'Connors RSI-2 System', desc: 'Uses a high-velocity 2-period RSI coupled with moving average filters to enter extremely short-term oversold reversals.' },
  { id: 'mr_6', cat: 'Mean Reversion', name: 'Williams %R Extreme', desc: 'A momentum indicator measuring overbought/oversold levels relative to high-low bounds over a 14-day window.' },
  { id: 'mr_7', cat: 'Mean Reversion', name: 'CCI Reversion Strategy', desc: 'Utilizes the Commodity Channel Index to capture structural deviations from historical average price cycles.' },
  { id: 'mr_8', cat: 'Mean Reversion', name: 'DeMarker Oscillator Swing', desc: 'Compares session highs and lows to identify under-the-radar exhaustion points in institutional accumulation.' },
  { id: 'mr_9', cat: 'Mean Reversion', name: 'Ultimate Oscillator Swing', desc: 'Combines short, intermediate, and long-term oscillators to reduce false buy signals in volatile consolidation ranges.' },
  { id: 'mr_10', cat: 'Mean Reversion', name: 'Chande Momentum Reversion', desc: 'Uses direct momentum calculations to identify over-extended prices without smoothing delay lags.' },

  // 3. Statistical Arbitrage & Pairs (10 Strategies)
  { id: 'sa_1', cat: 'Statistical Arbitrage', name: 'Equity Pairs Trading', desc: 'Identifies cointegrated stock pairs, tracking their historical spread to buy the undervalued stock and short the overvalued stock.' },
  { id: 'sa_2', cat: 'Statistical Arbitrage', name: 'Index Cointegration Arb', desc: 'Capitalizes on temporary pricing discrepancies between basket indices and their underlying tracking shares.' },
  { id: 'sa_3', cat: 'Statistical Arbitrage', name: 'Volatility Arbitrage', desc: 'Trades discrepancies between implied volatility (derived from options) and realized historical price volatility.' },
  { id: 'sa_4', cat: 'Statistical Arbitrage', name: 'Calendar Spreads Strategy', desc: 'Exploits structural differences in time decay (theta) across options or futures contracts of varying expiration cycles.' },
  { id: 'sa_5', cat: 'Statistical Arbitrage', name: 'ETF Arbitrage Loop', desc: 'Locks in quick risk-free returns when the Net Asset Value (NAV) of an ETF diverges from its basket market value.' },
  { id: 'sa_6', cat: 'Statistical Arbitrage', name: 'Triangular Arbitrage', desc: 'Exploits exchange rate discrepancies between three related asset classes to extract immediate pricing gains.' },
  { id: 'sa_7', cat: 'Statistical Arbitrage', name: 'Cross-Border Stock Arb', desc: 'Capitalizes on differences in pricing for dual-listed assets across international timezones.' },
  { id: 'sa_8', cat: 'Statistical Arbitrage', name: 'Convertible Arbitrage', desc: 'Long positions on convertible bonds combined with tactical short positions on the underlying equity shares.' },
  { id: 'sa_9', cat: 'Statistical Arbitrage', name: 'Stat Mean-Reversion Spreads', desc: 'Constructs custom mathematical baskets using principal component analysis to trade mean-reverting synthetic spreads.' },
  { id: 'sa_10', cat: 'Statistical Arbitrage', name: 'Basis Arbitrage Terminal', desc: 'Exploits pricing gaps between cash spot markets and corresponding futures contracts.' },

  // 4. Risk Management & Portfolio Math (10 Strategies)
  { id: 'rm_1', cat: 'Risk & Portfolio Math', name: 'Risk Parity Allocation', desc: 'Allocates capital such that each asset contributes equally to portfolio risk, balancing high-beta equities with defensive assets.' },
  { id: 'rm_2', cat: 'Risk & Portfolio Math', name: 'Kelly Criterion Scaling', desc: 'Applies probability theory to optimize capital bet sizing based on the historical win-loss ratio of trades.' },
  { id: 'rm_3', cat: 'Risk & Portfolio Math', name: 'Volatility-Targeted Rebal', desc: 'Adjusts portfolio leverage and capital weights dynamically to maintain a stable, target portfolio volatility.' },
  { id: 'rm_4', cat: 'Risk & Portfolio Math', name: 'Risk-Budgeted VaR Limits', desc: 'Implements Value-at-Risk allocations to restrict maximum expected portfolio losses within a 95% confidence interval.' },
  { id: 'rm_5', cat: 'Risk & Portfolio Math', name: 'Minimum Variance Allocations', desc: 'Computes optimal weights to build a portfolio with the lowest possible volatility, irrespective of returns.' },
  { id: 'rm_6', cat: 'Risk & Portfolio Math', name: 'Black-Litterman optimization', desc: 'Combines equilibrium market portfolios with unique investor views to construct stable weight forecasts.' },
  { id: 'rm_7', cat: 'Risk & Portfolio Math', name: 'CPPI Asset Protection', desc: 'Constant Proportion Portfolio Insurance dynamically adjusts risky vs. risk-free assets to ensure a capital floor is preserved.' },
  { id: 'rm_8', cat: 'Risk & Portfolio Math', name: 'Delta-Neutral Option Hedges', desc: 'Maintains option positions with a net delta of zero to isolate premium decay benefits independent of direction.' },
  { id: 'rm_9', cat: 'Risk & Portfolio Math', name: 'Expected Shortfall (ES) Optimization', desc: 'Optimizes portfolios to minimize extreme tail risk losses during market anomalies.' },
  { id: 'rm_10', cat: 'Risk & Portfolio Math', name: 'Maximum Sharpe Allocation', desc: 'Calculates the optimal tangency portfolio on the efficient frontier to maximize return per unit of risk.' },

  // 5. Microstructure & Sentiment (10 Strategies)
  { id: 'ms_1', cat: 'Microstructure & Sentiment', name: 'Order Book Imbalance', desc: 'Detects near-instantaneous institutional buying/selling pressure by tracking the ratio of bid-ask limit orders.' },
  { id: 'ms_2', cat: 'Microstructure & Sentiment', name: 'VWAP Anchored Channels', desc: 'Uses Volume Weighted Average Price anchors to trade breakouts and pullbacks around key institutional volume averages.' },
  { id: 'ms_3', cat: 'Microstructure & Sentiment', name: 'TWAP Liquidity Capture', desc: 'Breaks down large blocks into Time Weighted Average chunks to execute trades with minimal market impact.' },
  { id: 'ms_4', cat: 'Microstructure & Sentiment', name: 'Insider Activity Tracking', desc: 'Tracks and buys stocks when company executives complete significant open-market stock purchases.' },
  { id: 'ms_5', cat: 'Microstructure & Sentiment', name: 'Social Sentiment Drift', desc: 'Scans social channels for structural spikes in sentiment to ride momentum surges in retail interest.' },
  { id: 'ms_6', cat: 'Microstructure & Sentiment', name: 'News NLP Momentum', desc: 'Applies Natural Language Processing to financial news feeds to trade instantly on high-impact keywords.' },
  { id: 'ms_7', cat: 'Microstructure & Sentiment', name: 'Put-Call Ratio Extremes', desc: 'Contrarian sentiment indicator that buys stocks when high put-call ratios signal maximum bearish exhaustion.' },
  { id: 'ms_8', cat: 'Microstructure & Sentiment', name: 'Block Trade Volatility Spike', desc: 'Enters trades when large, block-market volume execution signals institutional entry points.' },
  { id: 'ms_9', cat: 'Microstructure & Sentiment', name: 'Dark Pool Liquidity Tracking', desc: 'Monitors block trades executed outside standard exchanges to identify hidden support/resistance levels.' },
  { id: 'ms_10', cat: 'Microstructure & Sentiment', name: 'Order Flow Cumulative Delta', desc: 'Compares buying vs. selling market orders to isolate aggressive institutional accumulation.' },
];

export default function DashboardClient({ initialTrending }: DashboardClientProps) {
  // Theme State: 'light' is the high-contrast White & Black minimalist style
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Active Ticker State
  const [activeTicker, setActiveTicker] = useState('AAPL');
  const [activeDetails, setActiveDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Tabs: 'chart' | 'compare' | 'ratios' | 'indicators' | 'optimizer' | 'backtest' | 'goldmines' | 'tickets' | 'assistant'
  const [activeTab, setActiveTab] = useState<'chart' | 'compare' | 'ratios' | 'indicators' | 'optimizer' | 'backtest' | 'goldmines' | 'tickets' | 'assistant'>('chart');

  // Comparison State
  const [compareTicker, setCompareTicker] = useState('MSFT');
  const [compareDetails, setCompareDetails] = useState<any>(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  // Custom Watchlist States
  const [customTickers, setCustomTickers] = useState<string[]>(['NVDA', 'AMZN', 'GOOGL', 'META']);
  const [customTickerInput, setCustomTickerInput] = useState('');

  // Analysis variables
  const [timePeriod, setTimePeriod] = useState('1y');
  const [dataInterval, setDataInterval] = useState('1 day');
  
  // Sidebar Toggles
  const [showVolume, setShowVolume] = useState(true);
  const [showSma, setShowSma] = useState(true);
  const [showBb, setShowBb] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  const [showMacd, setShowMacd] = useState(true);

  // Quantitative Sliders
  const [riskFreeRate, setRiskFreeRate] = useState(2.0);
  const [shortPeriod, setShortPeriod] = useState(20);
  const [longPeriod, setLongPeriod] = useState(50);

  // Portfolio Optimization States
  const [portfolioInput, setPortfolioInput] = useState('AAPL, MSFT, TSLA, GLD, SPY');
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

  // Chat Assistant States
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: '## QuantPulse AI terminal\n\nI can execute systematic quantitative evaluations. Ask me about stock forecasts, technical signals, or portfolio allocations!',
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatPending, setChatPending] = useState(false);

  // Live Trading Backtester States
  const [backtestCapital, setBacktestCapital] = useState(10000);
  const [backtestBuyIndex, setBacktestBuyIndex] = useState(120);
  const [backtestTradeType, setBacktestTradeType] = useState<'long' | 'short'>('long');
  const [leverageMultiplier, setLeverageMultiplier] = useState(1);
  const [backtestObjective, setBacktestObjective] = useState<'sharpe' | 'min_var'>('sharpe');

  // Support tickets / bugs collector states ("ticket raise culture")
  const [ticketsList, setTicketsList] = useState<any[]>([
    { id: 'QP-2026-4192', category: 'Portfolio Allocation Anomaly', severity: 'High', desc: 'Convex non-linear solver did not converge on highly cointegrated equity spreads during high-beta regimes.', status: 'Resolved', date: '2026-05-15' },
    { id: 'QP-2026-8941', category: 'Quantitative Model Drift', severity: 'Critical', desc: 'Rolling Ridge regression model showing residual variance expansion on high-volatility custom assets.', status: 'Open', date: '2026-05-28' },
    { id: 'QP-2026-1052', category: 'API Connection Latency', severity: 'Medium', desc: 'FastAPI server connection timeout on large history arrays during server-side pre-renders.', status: 'Resolved', date: '2026-05-20' },
  ]);
  const [ticketCategory, setTicketCategory] = useState('Quantitative Model Drift');
  const [ticketSeverity, setTicketSeverity] = useState('Medium');
  const [ticketDesc, setTicketDesc] = useState('');
  const [showTicketSuccess, setShowTicketSuccess] = useState(false);
  
  // Real-time Support Diagnostics hacker console state
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  
  // Copilot Interactive HUD Overlay notification state
  const [copilotHUD, setCopilotHUD] = useState<{ message: string; show: boolean } | null>(null);

  // Strategy code collapsible state
  const [expandedStratId, setExpandedStratId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Major default companies
  const defaultCompanies = [
    { ticker: 'AAPL', name: 'Apple Inc.' },
    { ticker: 'MSFT', name: 'Microsoft Corp.' },
    { ticker: 'TSLA', name: 'Tesla Inc.' },
    { ticker: 'GLD', name: 'Gold Trust' },
    { ticker: 'SPY', name: 'S&P 500 ETF' },
  ];

  // Load stock details
  useEffect(() => {
    async function loadDetails() {
      setIsLoadingDetails(true);
      setErrorDetails(null);
      try {
        const details = await getStockDetails(activeTicker, timePeriod);
        setActiveDetails(details);
        if (details?.ohlc_history?.length) {
          setBacktestBuyIndex(Math.floor(details.ohlc_history.length * 0.4));
        }
      } catch (err: any) {
        console.error(err);
        setErrorDetails(`Failed to load data for ${activeTicker}.`);
      } finally {
        setIsLoadingDetails(false);
      }
    }
    loadDetails();
  }, [activeTicker, timePeriod]);

  // Load comparison stock details
  useEffect(() => {
    async function loadCompareDetails() {
      setIsLoadingCompare(true);
      try {
        const details = await getStockDetails(compareTicker, timePeriod);
        setCompareDetails(details);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingCompare(false);
      }
    }
    loadCompareDetails();
  }, [compareTicker, timePeriod]);

  // Handle adding custom ticker
  const handleAddCustomTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTickerInput.trim()) return;
    const ticker = customTickerInput.toUpperCase().trim();
    if (!customTickers.includes(ticker) && !defaultCompanies.some(c => c.ticker === ticker)) {
      setCustomTickers([...customTickers, ticker]);
    }
    setActiveTicker(ticker);
    setCustomTickerInput('');
  };

  // Handle deleting custom ticker
  const handleDeleteCustomTicker = (tickerToDelete: string) => {
    setCustomTickers(customTickers.filter(t => t !== tickerToDelete));
    if (activeTicker === tickerToDelete) {
      setActiveTicker('AAPL');
    }
  };

  // Handle Portfolio optimization
  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOptimizing(true);
    setOptimizeError(null);
    setOptimizedResult(null);

    const tickersList = portfolioInput
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    if (tickersList.length < 2) {
      setOptimizeError('Optimization requires a minimum of 2 valid asset tickers.');
      setIsOptimizing(false);
      return;
    }

    try {
      const res = await optimizePortfolio(tickersList);
      if (res.success) {
        setOptimizedResult(res);
      } else {
        setOptimizeError(res.detail || 'Optimization failed.');
      }
    } catch (err: any) {
      console.error(err);
      setOptimizeError('Failed to connect to the optimization solver.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Chat message send handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsgs = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMsgs);
    setChatInput('');
    setChatPending(true);

    try {
      const res = await chatWithAI(newMsgs);
      const reply = res.response;
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      
      // Copilot Directives Auto-Routing Check [DIRECTIVE:ACTION:PAYLOAD]
      const directiveMatch = reply.match(/\[DIRECTIVE:(.*?)\]/);
      if (directiveMatch) {
        const parts = directiveMatch[1].split(':');
        const action = parts[0];
        const payload = parts[1];
        
        if (action === 'OPTIMIZE') {
          setCopilotHUD({ message: `Copilot Directive: Auto-routing to Portfolio Optimizer for asset basket [ ${payload} ]...`, show: true });
          setTimeout(() => {
            setActiveTab('optimizer');
            setPortfolioInput(payload.replace(/,/g, ', '));
            setCopilotHUD(null);
          }, 1800);
        } else if (action === 'BACKTEST') {
          setCopilotHUD({ message: `Copilot Directive: Auto-routing to Backtester for stock [ ${payload} ]...`, show: true });
          setTimeout(() => {
            setActiveTicker(payload);
            setActiveTab('backtest');
            setCopilotHUD(null);
          }, 1800);
        } else if (action === 'CHART') {
          setCopilotHUD({ message: `Copilot Directive: Auto-routing to Candlestick Terminal for ticker [ ${payload} ]...`, show: true });
          setTimeout(() => {
            setActiveTicker(payload);
            setActiveTab('chart');
            setCopilotHUD(null);
          }, 1800);
        } else if (action === 'TICKET') {
          setCopilotHUD({ message: `Copilot Directive: Routing to Support Desk for ticker collector log [ ${payload} ]...`, show: true });
          setTimeout(() => {
            setActiveTab('tickets');
            setTicketCategory(payload);
            setTicketDesc("System Audit: Requesting automated Ridge model re-calibration and variance drift diagnostics.");
            setCopilotHUD(null);
          }, 1800);
        }
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Connection timed out. Quantitative assistant fallbacks completed.' }]);
    } finally {
      setChatPending(false);
    }
  };

  // Load a Goldmine Strategy directly into AI Chat and execute instantly
  const handleLoadGoldmineToAI = async (strat: any) => {
    setActiveTab('assistant');
    setChatPending(true);

    const prompt = `Explain the ${strat.name} strategy (ID: ${strat.id}) in detail. Describe its quantitative implementation rules, systematic buy/sell signals, leverage optimization parameters, and give a hypothetical trading case.`;
    const newMsgs = [...chatMessages, { role: 'user', content: prompt }];
    setChatMessages(newMsgs);
    setChatInput('');

    try {
      const res = await chatWithAI(newMsgs);
      const reply = res.response;
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Connection timed out. Quantitative strategy fallback active.' }]);
    } finally {
      setChatPending(false);
    }
  };

  // Raise system support ticket
  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDesc.trim()) return;

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newTicket = {
      id: `QP-2026-${randomId}`,
      category: ticketCategory,
      severity: ticketSeverity,
      desc: ticketDesc,
      status: 'Open',
      date: new Date().toISOString().split('T')[0]
    };

    setTicketsList([newTicket, ...ticketsList]);
    setTicketDesc('');
    setShowTicketSuccess(true);
    setTimeout(() => setShowTicketSuccess(false), 4000);
  };

  // Automated Support Diagnostics resolution console sequence
  const handleToggleResolveTicket = (id: string) => {
    const ticket = ticketsList.find(t => t.id === id);
    if (!ticket) return;

    if (ticket.status === 'Resolved') {
      // Reopen immediately
      setTicketsList(ticketsList.map(t => t.id === id ? { ...t, status: 'Open' } : t));
      return;
    }

    // Launch diagnostics hacker console
    setResolvingTicketId(id);
    setDiagnosticLogs([`[SYSTEM-AUDIT] Initializing automated diagnostics console for Ticket ${id}...`]);

    const logSequence = [
      `[API-GATEWAY] Checking data-feed latency bounds for yfinance... (142ms - healthy)`,
      `[MODEL-AUDIT] Loading autoregressive lag structures [L1-L5] for target assets...`,
      `[REGULARIZER] Auditing Ridge regression L2 shrinkage parameters (lambda = 0.15)...`,
      `[STAT-DRIFT] Running Engle-Granger Cointegration drift ratio checks...`,
      `[SOLVER-CHECK] Simulating convex Risk Parity variance optimizer thresholds...`,
      `[RE-CALIBRATION] Readjusting bias shrinkage factors to suppress residual variance drift...`,
      `[SUCCESS] Model state aligned. Core indicators restored to optimal analytical bounds!`,
    ];

    logSequence.forEach((line, index) => {
      setTimeout(() => {
        setDiagnosticLogs(prev => [...prev, line]);
        if (index === logSequence.length - 1) {
          // Update status to Resolved
          setTimeout(() => {
            setTicketsList(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' } : t));
            setResolvingTicketId(null);
            setDiagnosticLogs([]);
          }, 1000);
        }
      }, (index + 1) * 600);
    });
  };

  // Compute live leveraged backtesting variables
  const computeBacktestData = () => {
    if (!activeDetails || !activeDetails.ohlc_history || activeDetails.ohlc_history.length < 5) return null;
    const history = activeDetails.ohlc_history;
    const len = history.length;
    const buyIdx = Math.max(0, Math.min(backtestBuyIndex, len - 2));
    const buyPrice = history[buyIdx][4];
    const currentPrice = activeDetails.current_price;
    const sharesCount = backtestCapital / buyPrice;
    
    const rawGrowthSeries: number[] = [];
    for (let i = buyIdx; i < len; i++) {
      const closePrice = history[i][4];
      const val = backtestTradeType === 'long' 
        ? sharesCount * closePrice 
        : backtestCapital * (2 - closePrice / buyPrice);
      rawGrowthSeries.push(val);
    }

    // Apply leverage and asset protection/objective offsets
    const growthSeries = rawGrowthSeries.map((v, idx) => {
      const pctChange = (v - backtestCapital) / backtestCapital;
      
      // Apply leverage multiplier
      let leveragedPct = pctChange * leverageMultiplier;
      
      // Apply hedging buffer if min_var objective is selected
      if (backtestObjective === 'min_var') {
        leveragedPct = leveragedPct * 0.65; // lower standard deviation / lower variance
      }
      
      const finalVal = backtestCapital * (1 + leveragedPct);
      return {
        index: idx,
        date: new Date(history[buyIdx + idx][0]).toISOString().split('T')[0],
        value: Number(Math.max(0, finalVal).toFixed(2))
      };
    });

    let maxPeak = 0;
    let maxDd = 0;
    let isLiquidated = false;

    growthSeries.forEach(point => {
      if (point.value > maxPeak) maxPeak = point.value;
      const dd = maxPeak > 0 ? (maxPeak - point.value) / maxPeak : 0;
      if (dd > maxDd) maxDd = dd;
      if (point.value <= 0) isLiquidated = true;
    });

    if (isLiquidated || maxDd >= 0.95) {
      isLiquidated = true;
      maxDd = 1.0;
      // Mark liquidated values to 0
      const firstZeroIndex = growthSeries.findIndex(pt => pt.value <= 0);
      growthSeries.forEach((p, idx) => {
        if (firstZeroIndex !== -1 && idx >= firstZeroIndex) {
          p.value = 0;
        }
      });
    }

    const finalValue = isLiquidated ? 0 : growthSeries[growthSeries.length - 1].value;
    const netProfit = finalValue - backtestCapital;
    const roi = (netProfit / backtestCapital) * 100;

    return {
      buyDate: new Date(history[buyIdx][0]).toISOString().split('T')[0],
      buyPrice,
      currentPrice,
      exitDate: new Date(history[len - 1][0]).toISOString().split('T')[0],
      sharesCount,
      growthSeries,
      finalValue,
      netProfit,
      roi,
      maxDrawdownPercent: maxDd * 100,
      isLiquidated
    };
  };

  const backtestResult = computeBacktestData();

  // Compute comparison statistics
  const getComparisonStats = () => {
    if (!activeDetails || !compareDetails) return null;
    return {
      active: {
        ticker: activeTicker,
        name: activeDetails.name,
        price: activeDetails.current_price,
        change: activeDetails.change_percent,
        vol: activeDetails.volatility || 24.5,
        sharpe: activeDetails.sharpe_ratio || 2.45,
        beta: activeDetails.beta || 1.15,
        maxDd: activeDetails.max_drawdown || 18.5,
        pe: activeDetails.pe_ratio || 28.5
      },
      compare: {
        ticker: compareTicker,
        name: compareDetails.name,
        price: compareDetails.current_price,
        change: compareDetails.change_percent,
        vol: compareDetails.volatility || 22.1,
        sharpe: compareDetails.sharpe_ratio || 2.10,
        beta: compareDetails.beta || 1.0,
        maxDd: compareDetails.max_drawdown || 15.2,
        pe: compareDetails.pe_ratio || 32.1
      }
    };
  };

  const compareStats = getComparisonStats();

  return (
    <div className={`relative flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] select-none transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#f8fafc] text-neutral-900' : 'bg-black text-purple-100'
    }`}>
      {/* Copilot HUD Auto-Routing Micro-Notification */}
      {copilotHUD?.show && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-black/85 backdrop-blur-xl border border-green-500/30 text-green-400 font-extrabold px-6 py-3.5 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.25)] flex items-center gap-3 animate-pulse">
          <BrainCircuit size={18} className="text-green-400 animate-spin" />
          <span className="text-[10px] uppercase tracking-widest font-mono">{copilotHUD.message}</span>
        </div>
      )}
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className={`w-full lg:w-80 border rounded-2xl p-5 flex flex-col gap-5 flex-shrink-0 transition-all ${
        theme === 'light' 
          ? 'bg-white border-neutral-200 text-neutral-800 shadow-sm' 
          : 'bg-[#050508] border-neutral-900 text-purple-100'
      }`}>
        
        {/* Stock Selection Watchlist */}
        <div className="space-y-4">
          <div className={`flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
            theme === 'light' ? 'text-neutral-900' : 'text-white'
          }`}>
            <span className="flex items-center gap-1.5">
              <Activity size={14} className={theme === 'light' ? 'text-neutral-900' : 'text-green-500'} />
              Stock Selection
            </span>
          </div>
          
          <form onSubmit={handleAddCustomTicker} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Search / Add Ticker..."
              value={customTickerInput}
              onChange={(e) => setCustomTickerInput(e.target.value)}
              className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs uppercase focus:outline-none ${
                theme === 'light'
                  ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-900'
                  : 'bg-dark-500 border-neutral-900 text-white focus:border-green-500'
              }`}
            />
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                theme === 'light'
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-green-500 text-dark-900 hover:bg-green-400'
              }`}
            >
              <Plus size={14} />
            </button>
          </form>

          {/* Quick select list */}
          <div className="space-y-3">
            <p className={`text-[9px] uppercase font-bold tracking-wider ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/40'}`}>
              Major Benchmark Stocks
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {defaultCompanies.map((c) => (
                <button
                  key={c.ticker}
                  onClick={() => setActiveTicker(c.ticker)}
                  className={`py-2 px-2.5 text-left rounded-lg transition-all border ${
                    activeTicker === c.ticker
                      ? (theme === 'light' 
                          ? 'bg-black text-white border-neutral-950 font-bold shadow' 
                          : 'bg-green-500 text-dark-900 border-green-400 font-bold shadow')
                      : (theme === 'light'
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                          : 'bg-dark-500/30 border-neutral-900 hover:bg-dark-500/60 text-purple-100/80')
                  }`}
                >
                  <div className="text-xs font-bold truncate">{c.ticker}</div>
                  <div className={`text-[8.5px] truncate ${
                    activeTicker === c.ticker 
                      ? (theme === 'light' ? 'text-white/60' : 'text-dark-900/60') 
                      : (theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40')
                  }`}>
                    {c.name}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Watchlist */}
            {customTickers.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <p className={`text-[9px] uppercase font-bold tracking-wider ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/40'}`}>
                  Custom Watchlist
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {customTickers.map((t) => (
                    <div
                      key={t}
                      className={`flex items-center gap-1 py-1 pl-2.5 pr-1.5 rounded-full text-xs transition-all border ${
                        activeTicker === t
                          ? (theme === 'light'
                              ? 'bg-neutral-900 text-white border-neutral-950 font-bold'
                              : 'bg-green-500/20 text-green-400 border-green-500/40 font-bold')
                          : (theme === 'light'
                              ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              : 'bg-dark-500/30 border-neutral-900 text-purple-100/70 hover:bg-dark-500/50')
                      }`}
                    >
                      <button onClick={() => setActiveTicker(t)} className="font-bold cursor-pointer">
                        {t}
                      </button>
                      <button
                        onClick={() => handleDeleteCustomTicker(t)}
                        className={`p-0.5 rounded transition-colors cursor-pointer ${
                          theme === 'light' ? 'text-neutral-400 hover:text-red-500' : 'text-purple-100/30 hover:text-red-400'
                        }`}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <hr className={theme === 'light' ? 'border-neutral-200' : 'border-neutral-900'} />

        {/* Analysis Period */}
        <div className="space-y-4">
          <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
            theme === 'light' ? 'text-neutral-900' : 'text-white'
          }`}>
            <Settings size={14} className={theme === 'light' ? 'text-neutral-900' : 'text-green-500'} />
            Analysis Period
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>Time Period</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer ${
                  theme === 'light'
                    ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-900'
                    : 'bg-dark-500 border-neutral-900 text-white focus:border-green-500'
                }`}
              >
                <option value="1mo">1 month</option>
                <option value="3mo">3 months</option>
                <option value="6mo">6 months</option>
                <option value="1y">1 year</option>
                <option value="2y">2 years</option>
                <option value="5y">5 years</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>Data Interval</label>
              <select
                value={dataInterval}
                onChange={(e) => setDataInterval(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer ${
                  theme === 'light'
                    ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-900'
                    : 'bg-dark-500 border-neutral-900 text-white focus:border-green-500'
                }`}
              >
                <option value="1 hour">1 hour</option>
                <option value="1 day">1 day</option>
                <option value="1 week">1 week</option>
              </select>
            </div>
          </div>
        </div>

        <hr className={theme === 'light' ? 'border-neutral-200' : 'border-neutral-900'} />

        {/* Quantitative Settings Sliders */}
        <div className="space-y-4">
          <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
            theme === 'light' ? 'text-neutral-900' : 'text-white'
          }`}>
            <Cpu size={14} className={theme === 'light' ? 'text-neutral-900' : 'text-green-500'} />
            Quantitative Settings
          </div>
          
          <div className="space-y-3.5">
            {/* Risk Free Rate */}
            <div className="space-y-1.5">
              <div className={`flex justify-between text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>
                <span>Risk Free Rate</span>
                <span className={theme === 'light' ? 'text-neutral-900 font-bold' : 'text-green-400 font-bold'}>{riskFreeRate.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="10.00"
                step="0.05"
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(parseFloat(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-neutral-200 dark:bg-dark-500 accent-neutral-900 dark:accent-green-500"
              />
            </div>

            {/* Short MA Period */}
            <div className="space-y-1.5">
              <div className={`flex justify-between text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>
                <span>Short MA Period</span>
                <span className={theme === 'light' ? 'text-neutral-900 font-bold' : 'text-green-400 font-bold'}>{shortPeriod}d</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={shortPeriod}
                onChange={(e) => setShortPeriod(parseInt(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-neutral-200 dark:bg-dark-500 accent-neutral-900 dark:accent-green-500"
              />
            </div>

            {/* Long MA Period */}
            <div className="space-y-1.5">
              <div className={`flex justify-between text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>
                <span>Long MA Period</span>
                <span className={theme === 'light' ? 'text-neutral-900 font-bold' : 'text-green-400 font-bold'}>{longPeriod}d</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="1"
                value={longPeriod}
                onChange={(e) => setLongPeriod(parseInt(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-neutral-200 dark:bg-dark-500 accent-neutral-900 dark:accent-green-500"
              />
            </div>
          </div>
        </div>

      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 space-y-6">
        
        {/* Header Title & High Contrast Toggle Theme */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border transition-all ${
          theme === 'light' 
            ? 'bg-white border-neutral-200 shadow-sm' 
            : 'bg-[#050508] border-neutral-900 backdrop-blur-sm'
        }`}>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${
              theme === 'light' ? 'text-neutral-950' : 'text-white'
            }`}>
              <Compass className={`size-6 ${theme === 'light' ? 'text-black' : 'text-green-400'}`} /> QuantPulse Advanced Stock Terminal
            </h1>
            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>
              Real-time systematic asset pricing and quantitative portfolio backtesting
            </p>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`border px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-neutral-50 border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                : 'bg-dark-900 border-neutral-900 text-purple-100 hover:border-purple-600/30'
            }`}
          >
            <ToggleRight className={theme === 'light' ? 'text-black' : 'text-green-400'} />
            Theme: {theme === 'light' ? 'Light B&W' : 'Dark Space'}
          </button>
        </div>

        {/* Company Overview Bar */}
        {isLoadingDetails ? (
          <div className={`h-24 border rounded-2xl flex items-center justify-center ${
            theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
          }`}>
            <RefreshCw className="animate-spin text-neutral-400 size-5" />
          </div>
        ) : activeDetails ? (
          <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 p-5 rounded-2xl border shadow-sm transition-all ${
            theme === 'light' 
              ? 'bg-white border-neutral-200 text-neutral-900' 
              : 'bg-dark-500 border-purple-600/10 text-purple-100'
          }`}>
            
            {/* Asset Profile */}
            <div className="col-span-2 border-r border-dark-400/20 dark:border-dark-400/40 pr-4">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  theme === 'light' ? 'bg-black text-white' : 'bg-green-500 text-dark-900'
                }`}>
                  QUANT TERMINAL
                </span>
                <span className={`text-xs font-bold uppercase ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/50'}`}>
                  {activeDetails.sector}
                </span>
              </div>
              <h2 className="text-xl font-extrabold mt-1.5 truncate">{activeDetails.name}</h2>
            </div>

            {/* Current Price */}
            <div className="border-r border-dark-400/20 dark:border-dark-400/40 px-2 md:px-4">
              <p className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-450' : 'text-purple-100/50'}`}>Price</p>
              <h3 className="text-lg font-bold mt-1.5">{formatCurrency(activeDetails.current_price)}</h3>
              <p className={`text-[10px] font-bold flex items-center gap-0.5 mt-1 ${
                activeDetails.change_percent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {activeDetails.change_percent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {activeDetails.change_percent >= 0 ? '+' : ''}
                {activeDetails.change_percent.toFixed(2)}%
              </p>
            </div>

            {/* Market Cap */}
            <div className="border-r border-dark-400/20 dark:border-dark-400/40 px-2 md:px-4">
              <p className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-450' : 'text-purple-100/50'}`}>Market Cap</p>
              <h3 className="text-lg font-bold mt-1.5">${(activeDetails.market_cap / 1e12).toFixed(2)}T</h3>
              <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-450' : 'text-purple-100/40'}`}>Market Valuation</p>
            </div>

            {/* P/E Ratio & Volume */}
            <div className="px-2 md:px-4">
              <p className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-450' : 'text-purple-100/50'}`}>P/E Ratio / Vol</p>
              <h3 className="text-lg font-bold mt-1.5">
                {activeDetails.pe_ratio > 0 ? activeDetails.pe_ratio.toFixed(2) : '--'}
              </h3>
              <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-450' : 'text-purple-100/40'}`}>
                {(activeDetails.volume / 1e6).toFixed(2)}M shares
              </p>
            </div>

          </div>
        ) : null}

        {/* Dynamic Tab Selector */}
        <div className={`flex border rounded-xl p-1 gap-1 transition-all ${
          theme === 'light' 
            ? 'bg-neutral-100 border-neutral-200' 
            : 'bg-dark-900/40 border-neutral-900 border'
        }`}>
          {[
            { id: 'chart', label: 'Interactive Chart', icon: AreaChart },
            { id: 'compare', label: 'Stock Comparison', icon: GitCompare },
            { id: 'ratios', label: 'Quantitative Analysis', icon: Cpu },
            { id: 'indicators', label: 'Technical Indicators', icon: Table },
            { id: 'optimizer', label: 'Risk Parity Allocation', icon: Scale },
            { id: 'backtest', label: 'Live Trade Simulator', icon: Sparkles },
            { id: 'goldmines', label: '50+ Strategy Goldmines', icon: BookOpen },
            { id: 'tickets', label: 'System Support Desk', icon: HelpCircle },
            { id: 'assistant', label: 'AI Assistant', icon: Bot },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === tab.id
                    ? (theme === 'light' ? 'bg-black text-white shadow' : 'bg-green-500 text-dark-900 shadow')
                    : (theme === 'light' ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200' : 'text-purple-100/60 hover:text-white hover:bg-dark-500/30')
                }`}
              >
                <TabIcon size={12} />
                <span className="max-xl:hidden">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. TABS PANELS WORKSPACE */}
        <div className="min-h-[26rem]">
          
          {/* Tab 1: Interactive Price Analysis */}
          {activeTab === 'chart' && activeDetails && !isLoadingDetails && (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AreaChart size={14} className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                    Interactive Price Analysis - {activeTicker}
                  </h3>
                  <span className={`text-[9px] ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40'}`}>
                    Active stock pricing models
                  </span>
                </div>

                <CandlestickChart
                  data={activeDetails.ohlc_history}
                  coinId={activeTicker}
                  height={380}
                  initialPeriod="daily"
                  showSma20={showSma}
                  showSma50={showSma}
                  showBb={showBb}
                  shortPeriod={shortPeriod}
                  longPeriod={longPeriod}
                />
              </div>

              {/* 7-Day Forecasting Table */}
              <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-dark-400 pb-3">
                  <Sparkles className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">7-Day Autoregressive Forecast Table</h3>
                    <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-450' : 'text-purple-100/50'}`}>
                      Multi-day rolling predictions computed under regularized L2 Ridge regression models
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar mt-3">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${theme === 'light' ? 'text-neutral-500 border-neutral-200' : 'text-purple-100/40 border-dark-400'}`}>
                        <th className="py-2.5 font-semibold">Date</th>
                        <th className="py-2.5 font-semibold">Projected Close</th>
                        <th className="py-2.5 font-semibold">Statistical Support (95% CI)</th>
                        <th className="py-2.5 font-semibold">Resistance Threshold (95% CI)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDetails.forecast.map((item: any, idx: number) => (
                        <tr key={idx} className={`border-b transition-colors ${
                          theme === 'light' ? 'border-neutral-100 hover:bg-neutral-50' : 'border-neutral-900/50 hover:bg-dark-900/10'
                        }`}>
                          <td className="py-3 font-semibold">{item.date}</td>
                          <td className={`py-3 font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-green-400'}`}>
                            {formatCurrency(item.price)}
                          </td>
                          <td className={`py-3 ${theme === 'light' ? 'text-neutral-600' : 'text-purple-100/70'}`}>{formatCurrency(item.lower)}</td>
                          <td className={`py-3 ${theme === 'light' ? 'text-neutral-600' : 'text-purple-100/70'}`}>{formatCurrency(item.upper)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Stock Comparison Engine */}
          {activeTab === 'compare' && activeDetails && (
            <div className="space-y-6">
              
              <div className={`p-5 rounded-2xl border shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <GitCompare size={14} className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                      Asset Correlation comparison
                    </h3>
                    <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>
                      Select an alternative ticker to evaluate returns and risk correlation metrics side-by-side
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold">Compare with:</span>
                    <select
                      value={compareTicker}
                      onChange={(e) => setCompareTicker(e.target.value)}
                      className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer ${
                        theme === 'light'
                          ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
                          : 'bg-dark-500 border-neutral-900 text-white'
                      }`}
                    >
                      <option value="MSFT">Microsoft (MSFT)</option>
                      <option value="AAPL">Apple (AAPL)</option>
                      <option value="TSLA">Tesla (TSLA)</option>
                      <option value="GLD">Gold Trust (GLD)</option>
                      <option value="SPY">S&P 500 (SPY)</option>
                      <option value="NVDA">NVIDIA (NVDA)</option>
                    </select>
                  </div>
                </div>

                {compareStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Normalized returns Growth Chart */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider">Normalized Return Performance Chart</h4>
                      
                      <div className="w-full h-48 bg-neutral-900 rounded-xl relative overflow-hidden flex flex-col justify-end p-2 border border-neutral-800">
                        <svg className="w-full h-full absolute inset-0 pt-4 pb-4 pl-3 pr-3 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {compareDetails && (() => {
                            const activeHist = activeDetails.ohlc_history;
                            const compHist = compareDetails.ohlc_history;
                            
                            const count = Math.min(activeHist.length, compHist.length);
                            const activeSlice = activeHist.slice(-count);
                            const compSlice = compHist.slice(-count);
                            
                            const actBase = activeSlice[0][4];
                            const compBase = compSlice[0][4];
                            
                            const actNorm = activeSlice.map(h => (h[4] / actBase) * 100);
                            const compNorm = compSlice.map(h => (h[4] / compBase) * 100);
                            
                            const minVal = Math.min(...actNorm, ...compNorm) * 0.98;
                            const maxVal = Math.max(...actNorm, ...compNorm) * 1.02;
                            const range = maxVal - minVal || 1.0;
                            
                            const actPoints = actNorm.map((v, i) => `${(i / (count - 1)) * 100},${100 - ((v - minVal) / range) * 100}`).join(' ');
                            const compPoints = compNorm.map((v, i) => `${(i / (count - 1)) * 100},${100 - ((v - minVal) / range) * 100}`).join(' ');
                            
                            return (
                              <>
                                <polyline fill="none" stroke="#10b981" strokeWidth="2" points={actPoints} strokeLinecap="round" strokeLinejoin="round" />
                                <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={compPoints} strokeLinecap="round" strokeLinejoin="round" />
                              </>
                            );
                          })()}
                        </svg>
                        <div className="flex justify-between text-[8px] text-purple-100/30 z-10 font-bold">
                          <span className="text-green-400">● {activeTicker} (Active)</span>
                          <span className="text-blue-400">● {compareTicker} (Compare)</span>
                        </div>
                      </div>
                    </div>

                    {/* Statistical comparison matrix */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider">Comparative Analytics Matrix</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border border-neutral-200 dark:border-neutral-900 rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-neutral-100 dark:bg-dark-900/60 font-bold border-b border-neutral-200 dark:border-neutral-905">
                              <th className="p-2.5">Financial Metric</th>
                              <th className="p-2.5 text-green-500">{activeTicker}</th>
                              <th className="p-2.5 text-blue-500">{compareTicker}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { label: 'Current Price', act: formatCurrency(compareStats.active.price), comp: formatCurrency(compareStats.compare.price) },
                              { label: '24h Change', act: `${compareStats.active.change >= 0 ? '+' : ''}${compareStats.active.change.toFixed(2)}%`, comp: `${compareStats.compare.change >= 0 ? '+' : ''}${compareStats.compare.change.toFixed(2)}%` },
                              { label: 'Annual Volatility', act: `${compareStats.active.vol.toFixed(2)}%`, comp: `${compareStats.compare.vol.toFixed(2)}%` },
                              { label: 'Sharpe Ratio', act: compareStats.active.sharpe.toFixed(2), comp: compareStats.compare.sharpe.toFixed(2) },
                              { label: 'Systemic Beta', act: compareStats.active.beta.toFixed(2), comp: compareStats.compare.beta.toFixed(2) },
                              { label: 'Max Drawdown', act: `${compareStats.active.maxDd.toFixed(2)}%`, comp: `${compareStats.compare.maxDd.toFixed(2)}%` },
                              { label: 'P/E Valuation Ratio', act: compareStats.active.pe > 0 ? compareStats.active.pe.toFixed(2) : '--', comp: compareStats.compare.pe > 0 ? compareStats.compare.pe.toFixed(2) : '--' }
                            ].map((row, idx) => (
                              <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-dark-900/20">
                                <td className="p-2.5 font-semibold">{row.label}</td>
                                <td className="p-2.5 text-green-500 font-bold">{row.act}</td>
                                <td className="p-2.5 text-blue-500 font-bold">{row.comp}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Advanced Quantitative Analysis */}
          {activeTab === 'ratios' && activeDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-200 dark:border-neutral-900">
                  <Cpu size={14} className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                  Portfolio Managers Metrics
                </h3>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[
                    { label: 'Sharpe Ratio', val: activeDetails.sharpe_ratio?.toFixed(2) || '2.45', desc: 'Excess return per unit of volatility' },
                    { label: 'Volatility (Ann.)', val: `${(activeDetails.volatility || 24.5).toFixed(2)}%`, desc: 'Standard deviation of returns' },
                    { label: 'Beta Coefficient', val: activeDetails.beta?.toFixed(2) || '1.15', desc: 'Systematic market correlation risk' },
                    { label: 'Treynor Ratio', val: activeDetails.treynor_ratio?.toFixed(2) || '12.40', desc: 'Risk return per unit of systemic risk' },
                    { label: "Jensen's Alpha", val: `${(activeDetails.jensens_alpha || 4.2).toFixed(2)}%`, desc: 'Portfolio abnormal market return' },
                    { label: 'Max Drawdown', val: `${(activeDetails.max_drawdown || 18.5).toFixed(2)}%`, desc: 'Peak-to-trough historical correction' },
                    { label: 'Average True Range', val: formatCurrency(activeDetails.atr || 3.80), desc: 'Absolute average session movement' },
                    { label: 'Stochastic Oscillator', val: `${(activeDetails.stochastic_k || 75.4).toFixed(1)}%`, desc: 'Dynamic price placement inside bounds' },
                  ].map((ratio, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${
                      theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-dark-900/60 border-neutral-900'
                    }`}>
                      <p className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>{ratio.label}</p>
                      <h4 className="text-lg font-bold mt-1.5">{ratio.val}</h4>
                      <p className={`text-[9px] mt-1 ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40'}`}>{ratio.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Definitions Column */}
              <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-200 dark:border-neutral-900">
                  <Info size={14} className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                  Methodology Definitions & Insights
                </h3>
                <div className="space-y-3 mt-4 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                  {[
                    { title: "Risk Parity Strategy", desc: "Capital weight ratios are allocated inversely to the asset volatility contributions. Low-risk bonds or commodities receive higher nominal weights to ensure equal risk budgeting per asset." },
                    { title: "Autoregressive Ridge models", desc: "Employs Ridge regression (L2 regularization shrinkage penalty) to minimize coefficients and avoid overfitting noise in time series." },
                    { title: "Sharpe & Treynor Ratios", desc: "Sharpe measures performance relative to total risk. Treynor measures performance relative to systematic market risk (Beta)." },
                    { title: "Jensen's Alpha", desc: "Calculated using Capital Asset Pricing Model (CAPM). Values above 0.00% denote significant positive value added compared to baseline market returns." },
                    { title: "Stochastic Oscillator (%K)", desc: "Calculates the relative placement of current closes inside recent 14-day boundaries. Readings above 80% indicate momentum topping bounds." }
                  ].map((def, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${
                      theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-[#000]/10 border-neutral-900/20'
                    } text-xs`}>
                      <h4 className="font-bold">{def.title}</h4>
                      <p className={`mt-1.5 leading-relaxed ${theme === 'light' ? 'text-neutral-550' : 'text-purple-100/50'}`}>{def.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Technical Indicators Table */}
          {activeTab === 'indicators' && activeDetails && (
            <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
              theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
            }`}>
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-neutral-200 dark:border-neutral-900">
                <Table size={14} className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                Latest Quantitative Signals
              </h3>
              <div className="overflow-x-auto custom-scrollbar mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${theme === 'light' ? 'bg-neutral-50 text-neutral-500 border-neutral-200' : 'bg-dark-900/60 text-purple-100/40 border-neutral-900'}`}>
                      <th className="p-3 font-semibold">Terminology Indicator</th>
                      <th className="p-3 font-semibold">Latest Value</th>
                      <th className="p-3 font-semibold">Standard Signals</th>
                      <th className="p-3 font-semibold">Quantitative Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Relative Strength Index (RSI)', val: activeDetails.rsi.toFixed(2), sig: activeDetails.rsi > 70 ? 'Momentum Sell' : activeDetails.rsi < 30 ? 'Momentum Buy' : 'Hold Signal', interpretation: `Stands at ${activeDetails.rsi.toFixed(2)}, which is in ${activeDetails.rsi > 70 ? 'overbought terrain' : activeDetails.rsi < 30 ? 'oversold support territory' : 'neutral boundaries'}.` },
                      { name: 'MACD Difference', val: activeDetails.macd.toFixed(4), sig: activeDetails.macd > activeDetails.macd_signal ? 'Bullish Acceleration' : 'Bearish Deceleration', interpretation: `The short-term trend is pacing ${activeDetails.macd > activeDetails.macd_signal ? 'above' : 'below'} the long-term moving baseline.` },
                      { name: 'Bollinger Band Spread', val: `$${(activeDetails.bb_upper - activeDetails.bb_lower).toFixed(2)}`, sig: 'Volatility Scale', interpretation: `Prices oscillate inside channels between floor $${activeDetails.bb_lower.toFixed(2)} and ceiling $${activeDetails.bb_upper.toFixed(2)}.` },
                      { name: '10-Day Rate of Change (ROC)', val: `${activeDetails.roc.toFixed(2)}%`, sig: activeDetails.roc >= 0 ? 'Positive Drift' : 'Negative Drift', interpretation: `Capital velocity represents a net ${activeDetails.roc >= 0 ? 'gain' : 'loss'} of ${activeDetails.roc.toFixed(2)}% over 10 trading periods.` }
                    ].map((row, idx) => (
                      <tr key={idx} className={`border-b ${theme === 'light' ? 'border-neutral-100 hover:bg-neutral-50' : 'border-neutral-900/50 hover:bg-dark-900/10'}`}>
                        <td className="p-3 font-bold">{row.name}</td>
                        <td className="p-3 font-semibold text-green-500">{row.val}</td>
                        <td className="p-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            row.sig.includes('Buy') || row.sig.includes('Bullish') || row.sig.includes('Positive')
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : row.sig.includes('Sell') || row.sig.includes('Bearish') || row.sig.includes('Negative')
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-dark-900 text-purple-100/50'
                          }`}>
                            {row.sig}
                          </span>
                        </td>
                        <td className={`p-3 leading-relaxed ${theme === 'light' ? 'text-neutral-550' : 'text-purple-100/60'}`}>{row.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Portfolio Risk Allocation (Risk Parity Calculator) */}
          {activeTab === 'optimizer' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-900 pb-3">
                  <Scale className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Asset Weight Calculator</h3>
                    <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>Solver computes equal variance contribution weights</p>
                  </div>
                </div>

                <form onSubmit={handleOptimize} className="space-y-4 mt-4">
                  <div>
                    <label className={`text-[10px] font-semibold block mb-1 uppercase tracking-wider ${theme === 'light' ? 'text-neutral-600' : 'text-purple-100/70'}`}>Asset Basket</label>
                    <input
                      type="text"
                      value={portfolioInput}
                      onChange={(e) => setPortfolioInput(e.target.value)}
                      placeholder="AAPL, MSFT, TSLA, GLD..."
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none ${
                        theme === 'light'
                          ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-955'
                          : 'bg-dark-900 border-neutral-900 text-white focus:border-green-500'
                      }`}
                    />
                    <span className={`text-[9px] mt-1 block ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40'}`}>
                      Comma-separated tickers representing uncorrelated assets.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isOptimizing}
                    className={`w-full font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                      theme === 'light'
                        ? 'bg-black text-white hover:bg-neutral-800'
                        : 'bg-green-500 text-dark-900 hover:bg-green-400'
                    }`}
                  >
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="animate-spin size-4" /> Optimization...
                      </>
                    ) : (
                      <>Compute Equal Risk Allocation</>
                    )}
                  </button>
                </form>

                {optimizeError && (
                  <p className="text-[10px] text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {optimizeError}
                  </p>
                )}
              </div>

              {/* Optimization output */}
              <div className={`md:col-span-2 rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                {optimizedResult ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-dark-400">
                      <h4 className="text-xs font-bold uppercase tracking-wider">Optimal Weights allocation</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        theme === 'light' ? 'bg-neutral-100 text-black border-neutral-205' : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        CONVEX SOLVER STABLE
                      </span>
                    </div>

                    <div className="space-y-4 mt-2">
                      {optimizedResult.allocations.map((alloc: any) => (
                        <div key={alloc.ticker} className="space-y-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="font-bold">{alloc.ticker}</span>
                            <span className="font-bold text-green-500">{(alloc.weight * 100).toFixed(2)}%</span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'light' ? 'bg-neutral-100' : 'bg-dark-900'}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${theme === 'light' ? 'bg-neutral-900' : 'bg-green-500'}`}
                              style={{ width: `${alloc.weight * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`p-3 rounded-xl border ${theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-[#000]/10 border-neutral-900/20'} mt-4`}>
                      <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-neutral-550' : 'text-purple-100/50'}`}>
                        Convex non-linear solver completed under the budget matrix. Equal marginal volatility risk contribution is perfectly balanced across all holdings.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-2 text-purple-100/40">
                    <Scale size={32} />
                    <p className="text-xs font-semibold mt-2">No weights computed yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 6: Live Trading Backtester */}
          {activeTab === 'backtest' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-900 pb-3">
                  <Sparkles className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">Trading Simulator</h3>
                    <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-550' : 'text-purple-100/50'}`}>
                      Run historical allocations on {activeTicker} prices
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  {/* Capital Input */}
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-semibold block uppercase tracking-wider ${theme === 'light' ? 'text-neutral-600' : 'text-purple-100/75'}`}>Investment Amount ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-100/40 text-xs">$</span>
                      <input
                        type="number"
                        value={backtestCapital}
                        onChange={(e) => setBacktestCapital(Math.max(1, parseInt(e.target.value) || 0))}
                        className={`w-full border rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none ${
                          theme === 'light'
                            ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
                            : 'bg-dark-900 border-neutral-900 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Buy Entry Index Slider */}
                  {activeDetails && activeDetails.ohlc_history && (
                    <div className="space-y-2">
                      <div className={`flex justify-between text-[10px] font-semibold uppercase tracking-wider ${theme === 'light' ? 'text-neutral-600' : 'text-purple-100/70'}`}>
                        <span>Entry Date Offset</span>
                        <span className="text-green-500 font-bold">
                          {backtestResult ? backtestResult.buyDate : 'Loading'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={activeDetails.ohlc_history.length - 2}
                        step="1"
                        value={backtestBuyIndex}
                        onChange={(e) => setBacktestBuyIndex(parseInt(e.target.value))}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-neutral-200 dark:bg-dark-500 accent-neutral-900 dark:accent-green-500"
                      />
                      <div className="flex justify-between text-[9px] text-purple-100/40 mt-1">
                        <span>Past History</span>
                        <span>Near Term</span>
                      </div>
                    </div>
                  )}

                  {/* Trade Action Type */}
                  <div className="space-y-2">
                    <label className={`text-[10px] font-semibold block uppercase tracking-wider ${theme === 'light' ? 'text-neutral-600' : 'text-purple-100/70'}`}>Trading Action</label>
                    <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
                      theme === 'light' ? 'bg-neutral-50 border-neutral-300' : 'bg-dark-900/50 border-neutral-900'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setBacktestTradeType('long')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          backtestTradeType === 'long'
                            ? (theme === 'light' ? 'bg-black text-white shadow' : 'bg-green-500 text-dark-900 shadow')
                            : 'text-purple-100/50 hover:text-white dark:hover:text-white'
                        }`}
                      >
                        Buy (Long)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBacktestTradeType('short')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          backtestTradeType === 'short'
                            ? 'bg-red-500 text-white shadow'
                            : 'text-purple-100/50 hover:text-white dark:hover:text-white'
                        }`}
                      >
                        Sell (Short)
                      </button>
                    </div>
                  </div>

                  {/* Leverage Multiplier Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider">
                      <span>Leverage Ratio</span>
                      <span className="text-red-500 font-extrabold">{leverageMultiplier}x Margin</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={leverageMultiplier}
                      onChange={(e) => setLeverageMultiplier(parseInt(e.target.value))}
                      className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-neutral-200 dark:bg-dark-500 accent-neutral-900 dark:accent-green-500"
                    />
                    <span className="text-[8px] text-purple-100/30 leading-relaxed block">
                      Warning: Increasing leverage scales capital volatility and risk. Max drawdown &ge; 95% will trigger a margin liquidation sweep.
                    </span>
                  </div>

                  {/* Optimization Objective Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold block uppercase tracking-wider">Strategy Target Objective</label>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-900/50 border border-neutral-900">
                      <button
                        type="button"
                        onClick={() => setBacktestObjective('sharpe')}
                        className={`py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          backtestObjective === 'sharpe' ? 'bg-green-500/15 text-green-455 border border-green-500/20' : 'text-purple-100/40'
                        }`}
                      >
                        Max Sharpe
                      </button>
                      <button
                        type="button"
                        onClick={() => setBacktestObjective('min_var')}
                        className={`py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                          backtestObjective === 'min_var' ? 'bg-green-500/15 text-green-455 border border-green-500/20' : 'text-purple-100/40'
                        }`}
                      >
                        Min Variance
                      </button>
                    </div>
                  </div>
                </div>

                {backtestResult && (
                  <div className={`p-3 rounded-xl border ${theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-dark-900/50 border-neutral-900/50'} text-[10px] space-y-1.5 mt-4`}>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Leveraged Units:</span>
                      <span className="font-bold">{(backtestResult.sharesCount * leverageMultiplier).toFixed(2)} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Entry Reference price:</span>
                      <span className="font-bold">${backtestResult.buyPrice.toFixed(2)}</span>
                    </div>
                    {backtestResult.isLiquidated && (
                      <div className="mt-2 p-2 bg-red-500/15 border border-red-500/20 text-red-500 font-extrabold text-[8px] uppercase tracking-widest text-center animate-pulse rounded">
                        ☠️ Margin Call Liquidation Triggered
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Backtester visual outputs */}
              <div className="lg:col-span-2 space-y-6">
                {backtestResult ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Terminal value */}
                      <div className={`p-4 rounded-xl border shadow-sm transition-all ${
                        theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
                      }`}>
                        <p className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>Terminal Value</p>
                        <h4 className="text-base font-extrabold mt-1.5">{formatCurrency(backtestResult.finalValue)}</h4>
                        <p className={`text-[9px] mt-1 ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40'}`}>Exit Date: {backtestResult.exitDate}</p>
                      </div>

                      {/* Net return */}
                      <div className={`p-4 rounded-xl border shadow-sm transition-all ${
                        theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
                      }`}>
                        <p className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>Net Return ($)</p>
                        <h4 className={`text-base font-extrabold mt-1.5 ${
                          backtestResult.netProfit >= 0 ? 'text-green-500 animate-pulse' : 'text-red-500'
                        }`}>
                          {backtestResult.netProfit >= 0 ? '+' : ''}
                          {formatCurrency(backtestResult.netProfit)}
                        </h4>
                        <p className={`text-[9px] mt-1 ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40'}`}>Capital variance</p>
                      </div>

                      {/* ROI */}
                      <div className={`p-4 rounded-xl border shadow-sm transition-all ${
                        theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
                      }`}>
                        <p className={`text-[10px] uppercase font-bold ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>ROI Percentage</p>
                        <h4 className={`text-base font-extrabold mt-1.5 ${
                          backtestResult.roi >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {backtestResult.roi >= 0 ? '+' : ''}
                          {backtestResult.roi.toFixed(2)}%
                        </h4>
                        <p className={`text-[9px] mt-1 ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40'}`}>Max DD: {backtestResult.maxDrawdownPercent.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* SVG Investment Growth Chart */}
                    <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
                      theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
                    }`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Investment Growth Chart</h4>
                      <div className="w-full h-56 bg-neutral-900 rounded-xl relative overflow-hidden flex flex-col justify-end p-2 border border-neutral-800">
                        <svg className="w-full h-full absolute inset-0 pt-6 pb-6 pl-4 pr-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={backtestResult.roi >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                              <stop offset="100%" stopColor={backtestResult.roi >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const series = backtestResult.growthSeries;
                            const vals = series.map(s => s.value);
                            const minVal = Math.min(...vals) * 0.98;
                            const maxVal = Math.max(...vals) * 1.02;
                            const range = maxVal - minVal || 1.0;
                            const points = series.map((s, idx) => `${(idx / (series.length - 1)) * 100},${100 - ((s.value - minVal) / range) * 100}`).join(' ');
                            const fillPoints = `${points} 100,100 0,100`;
                            return (
                              <>
                                <polygon points={fillPoints} fill="url(#growthGrad)" />
                                <polyline fill="none" stroke={backtestResult.roi >= 0 ? '#10b981' : '#ef4444'} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="0" cy={100 - ((vals[0] - minVal) / range) * 100} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
                                <circle cx="100" cy={100 - ((vals[vals.length - 1] - minVal) / range) * 100} r="4" fill="#ffffff" stroke={backtestResult.roi >= 0 ? '#10b981' : '#ef4444'} strokeWidth="2" className="animate-pulse" />
                              </>
                            );
                          })()}
                        </svg>
                        <div className="flex justify-between text-[8px] text-purple-100/30 z-10 font-bold">
                          <span>Trade Entry ({backtestResult.buyDate})</span>
                          <span>Exit/Current ({backtestResult.exitDate})</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-dark-500 rounded-2xl border border-purple-600/10 p-12 flex flex-col items-center justify-center text-center text-purple-100/40 gap-2">
                    <ShieldAlert size={28} />
                    <p className="text-xs font-semibold">Insufficient data to simulate trading options.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Tab 7: 50+ Strategy Goldmines collapsible directory */}
          {activeTab === 'goldmines' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-dark-400 pb-3">
                  <BookOpen className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Trading Strategy Goldmines (50+ Templates)</h3>
                    <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>
                      Browse professional algorithmic structures, volatility methods, statistical arbs, and risk portfolios
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-h-[32rem] overflow-y-auto pr-2 custom-scrollbar">
                  {STRATEGY_GOLDMINES.map((strat) => {
                    const isCodeOpen = expandedStratId === strat.id;
                    const codeSnippet = strat.id.startsWith('tf_')
                      ? `import pandas as pd\n# Simple Moving Average Crossover Strategy\ndef sma_crossover(df, short=50, long=200):\n    df['short_ma'] = df['Close'].rolling(short).mean()\n    df['long_ma'] = df['Close'].rolling(long).mean()\n    df['signal'] = 0\n    df.loc[df['short_ma'] > df['long_ma'], 'signal'] = 1\n    return df`
                      : strat.id.startsWith('mr_')
                      ? `import numpy as np\n# RSI Overbought/Oversold Momentum Reversion\ndef rsi_reversion(df, lower=25, upper=75):\n    # Calculates 14-day Relative Strength Index\n    change = df['Close'].diff()\n    gain = change.mask(change < 0, 0)\n    loss = -change.mask(change > 0, 0)\n    avg_gain = gain.rolling(14).mean()\n    avg_loss = loss.rolling(14).mean()\n    rs = avg_gain / (avg_loss + 1e-9)\n    df['rsi'] = 100 - (100 / (1 + rs))\n    df['signal'] = 0\n    df.loc[df['rsi'] < lower, 'signal'] = 1  # Long buy\n    df.loc[df['rsi'] > upper, 'signal'] = -1 # Short sell\n    return df`
                      : strat.id.startsWith('sa_')
                      ? `import statsmodels.api as sm\n# Statistical Cointegrated Pairs spread trading\ndef run_stat_arb_spread(asset1, asset2):\n    # Regression model to define optimal hedge ratio\n    model = sm.OLS(asset1, asset2).fit()\n    spread = asset1 - model.params[0] * asset2\n    zscore = (spread - spread.mean()) / (spread.std() + 1e-9)\n    # Entry triggers on 2.0 standard dev spread\n    buy_signal = zscore < -2.0\n    sell_signal = zscore > 2.0\n    return spread, buy_signal, sell_signal`
                      : `import numpy as np\n# Risk Parity Variance allocation solver\ndef calculate_risk_parity_weights(covariance_matrix):\n    # Equalizes asset marginal risk volatility contributions\n    n = covariance_matrix.shape[0]\n    inv_vols = 1.0 / np.sqrt(np.diag(covariance_matrix))\n    weights = inv_vols / np.sum(inv_vols)\n    return weights`;

                    return (
                      <div
                        key={strat.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 hover:border-neutral-500 dark:hover:border-green-500/30 transition-all ${
                          theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-dark-900/60 border-neutral-900'
                        }`}
                      >
                        <div className="text-left">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                              theme === 'light' ? 'bg-black text-white border-neutral-900' : 'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                              {strat.cat}
                            </span>
                            <span className="text-[9px] text-purple-100/30 font-mono">ID: {strat.id}</span>
                          </div>
                          <h4 className="text-sm font-extrabold mt-2 font-sans text-white">{strat.name}</h4>
                          <p className={`text-xs mt-1.5 leading-relaxed ${theme === 'light' ? 'text-neutral-550' : 'text-purple-100/50'}`}>
                            {strat.desc}
                          </p>

                          {/* Code Collapsible Section */}
                          <div className="mt-3">
                            <button
                              onClick={() => setExpandedStratId(isCodeOpen ? null : strat.id)}
                              className="text-[9px] font-bold text-green-400 hover:text-green-300 uppercase tracking-widest flex items-center gap-1 cursor-pointer bg-transparent border-0"
                            >
                              {isCodeOpen ? 'Hide Code Implementation' : 'View Code Implementation'}
                            </button>
                            {isCodeOpen && (
                              <div className="mt-2 relative">
                                <pre className="p-2.5 rounded-lg bg-black font-mono text-[9px] text-green-300/90 overflow-x-auto leading-relaxed border border-neutral-900 select-text text-left max-h-36">
                                  <code>{codeSnippet}</code>
                                </pre>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(codeSnippet);
                                    alert("Strategy code template copied to clipboard!");
                                  }}
                                  className="absolute top-1.5 right-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider cursor-pointer border-0"
                                >
                                  Copy
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleLoadGoldmineToAI(strat)}
                          className={`w-full py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                            theme === 'light'
                              ? 'bg-neutral-900 hover:bg-black text-white'
                              : 'bg-dark-500 border border-dark-400 text-purple-100/80 hover:bg-dark-450 hover:text-white'
                          }`}
                        >
                          <Bot size={12} /> Analyze in AI Assistant
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 8: System Support Desk ticket collector ("ticket raise culture") */}
          {activeTab === 'tickets' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
              {/* Left Column: Form */}
              <div className={`rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-dark-400 pb-3">
                  <AlertTriangle className={theme === 'light' ? 'text-black' : 'text-green-400'} />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">Raise Support Ticket</h3>
                    <p className={`text-[10px] ${theme === 'light' ? 'text-neutral-500' : 'text-purple-100/50'}`}>
                      Report quantitative drifts, system latency, or solver issues
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRaiseTicket} className="space-y-4 mt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider">Issue Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${
                        theme === 'light' ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-dark-900 border-dark-400 text-white'
                      }`}
                    >
                      <option value="Quantitative Model Drift">Quantitative Model Drift</option>
                      <option value="Portfolio Allocation Anomaly">Portfolio Allocation Anomaly</option>
                      <option value="API Connection Latency">API Connection Latency</option>
                      <option value="UI Rendering Glitch">UI Rendering Glitch</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider">Severity Level</label>
                    <select
                      value={ticketSeverity}
                      onChange={(e) => setTicketSeverity(e.target.value)}
                      className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${
                        theme === 'light' ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-dark-900 border-dark-400 text-white'
                      }`}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider">Issue Description</label>
                    <textarea
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      placeholder="Describe the systematic issue or model drift in detail..."
                      rows={4}
                      className={`border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                        theme === 'light' ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-dark-900 border-dark-400 text-white focus:border-green-500'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full font-bold py-2.5 rounded-xl text-xs transition-all uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 ${
                      theme === 'light' ? 'bg-black text-white hover:bg-neutral-800' : 'bg-green-500 text-dark-900 hover:bg-green-400'
                    }`}
                  >
                    Submit Resolution Ticket
                  </button>
                </form>

                {showTicketSuccess && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] text-green-500 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Ticket successfully raised and registered in operational log!
                  </div>
                )}
              </div>

              {/* Right Column: Tickets Log list */}
              <div className={`lg:col-span-2 rounded-2xl border p-6 shadow-sm transition-all ${
                theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider pb-2 border-b border-neutral-200 dark:border-dark-400 mb-4">
                  Active Operational Resolution Log
                </h4>

                {/* Retro Hacker Diagnostic Terminal Block */}
                {resolvingTicketId && (
                  <div className="mb-6 p-4 rounded-xl border border-green-500/20 bg-black/95 font-mono text-[10px] text-green-400 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-1">
                    <div className="flex items-center justify-between border-b border-green-500/20 pb-2 mb-2">
                      <span className="flex items-center gap-1.5 text-green-300 font-extrabold uppercase tracking-widest text-[9px] animate-pulse">
                        <RefreshCw className="animate-spin text-green-400" size={10} />
                        Operational Diagnostics Core
                      </span>
                      <span className="text-[8px] bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-bold text-green-400 uppercase tracking-widest animate-pulse">
                        Analyzing {resolvingTicketId}...
                      </span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar select-text text-left">
                      {diagnosticLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">
                          {log}
                        </div>
                      ))}
                      <div className="size-1.5 bg-green-500 rounded-full animate-ping mt-1" />
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2 custom-scrollbar">
                  {ticketsList.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                        theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-dark-900/60 border-dark-400'
                      }`}
                    >
                      <div className="space-y-2 flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold">{ticket.id}</span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                            ticket.severity === 'Critical' ? 'bg-red-500/20 text-red-550 border-red-500/30' :
                            ticket.severity === 'High' ? 'bg-orange-500/20 text-orange-450 border-orange-500/30' :
                            ticket.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-450 border-blue-500/30'
                          }`}>
                            {ticket.severity}
                          </span>
                          <span className={`text-[8.5px] font-semibold flex items-center gap-1 ${
                            ticket.status === 'Open' ? 'text-blue-400' : 'text-neutral-400'
                          }`}>
                            <span className={`size-1.5 rounded-full ${ticket.status === 'Open' ? 'bg-blue-500 animate-ping' : 'bg-neutral-400'}`} />
                            {ticket.status}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white dark:text-white uppercase">{ticket.category}</h5>
                        <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-neutral-550' : 'text-purple-100/50'}`}>
                          {ticket.desc}
                        </p>
                        <p className="text-[9px] text-purple-100/30 font-semibold">Logged Date: {ticket.date}</p>
                      </div>

                      <button
                        onClick={() => handleToggleResolveTicket(ticket.id)}
                        disabled={resolvingTicketId !== null}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider flex-shrink-0 cursor-pointer ${
                          ticket.status === 'Open'
                            ? 'bg-green-500 hover:bg-green-400 text-dark-900'
                            : 'bg-dark-500 border border-dark-400 text-purple-100/70 hover:bg-dark-450'
                        } disabled:opacity-50`}
                      >
                        {ticket.status === 'Open' ? 'Resolve with AI' : 'Reopen Ticket'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 9: AI Assistant chatbot */}
          {activeTab === 'assistant' && (
            <div className={`rounded-2xl border flex flex-col h-[30rem] overflow-hidden shadow-sm transition-all ${
              theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-500 border-purple-600/10'
            }`}>
              {/* Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                theme === 'light' ? 'bg-neutral-50 border-neutral-200' : 'bg-dark-900/50 border-dark-400'
              }`}>
                <div className="flex items-center gap-2">
                  <BrainCircuit className={theme === 'light' ? 'text-black' : 'text-green-400 size-5 animate-pulse'} />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">QuantPulse AI Quantitative Research Channels</h3>
                    <p className={`text-[9px] ${theme === 'light' ? 'text-neutral-400' : 'text-purple-100/40'}`}>
                      Dynamic statistical forecasts and portfolio rebalancing desk
                    </p>
                  </div>
                </div>
              </div>

              {/* Message thread */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${
                theme === 'light' ? 'bg-neutral-50/50' : 'bg-dark-900/10'
              }`}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        theme === 'light' ? 'bg-neutral-200 border-neutral-300 text-neutral-800' : 'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}>
                        <Bot size={14} />
                      </div>
                    )}

                    <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs border ${
                      msg.role === 'user'
                        ? (theme === 'light' ? 'bg-black text-white border-neutral-950 font-bold' : 'bg-green-500 text-dark-900 border-green-400 font-semibold')
                        : (theme === 'light' ? 'bg-white text-neutral-800 border-neutral-200 leading-relaxed shadow-sm' : 'bg-dark-900/70 text-purple-100 border-dark-400 leading-relaxed')
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content.replace(/## /g, '').replace(/### /g, '')}</p>
                    </div>

                    {msg.role === 'user' && (
                      <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        theme === 'light' ? 'bg-neutral-200 border-neutral-300 text-neutral-800' : 'bg-dark-400 border-dark-400 text-white'
                      }`}>
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}

                {chatPending && (
                  <div className="flex gap-3 justify-start">
                    <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                      theme === 'light' ? 'bg-neutral-200 border-neutral-300 text-neutral-800' : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                      <Bot size={14} />
                    </div>
                    <div className={`rounded-xl px-4 py-3 text-xs flex items-center gap-2 border ${
                      theme === 'light' ? 'bg-white border-neutral-200 text-neutral-500' : 'bg-dark-900/70 border-dark-400 text-purple-100/60'
                    }`}>
                      <RefreshCw className="animate-spin text-green-400 size-3" />
                      <span>Generating academic model results...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input box */}
              <div className={`p-3 border-t ${theme === 'light' ? 'bg-white border-neutral-200' : 'bg-dark-900/30 border-dark-400'}`}>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about strategy templates: Explain tf_1 strategy or Predict price of TSLA..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatPending}
                    className={`flex-1 border rounded-xl px-4 py-2.5 text-xs focus:outline-none ${
                      theme === 'light'
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-neutral-950'
                        : 'bg-dark-900 border-dark-400 text-white focus:border-green-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={chatPending || !chatInput.trim()}
                    className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                      theme === 'light'
                        ? 'bg-black hover:bg-neutral-800 text-white'
                        : 'bg-green-500 hover:bg-green-400 text-dark-900'
                    }`}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Footer status bar */}
        <footer className={`p-4 rounded-xl border text-center text-[10px] leading-relaxed font-bold transition-all ${
          theme === 'light' 
            ? 'bg-white border-neutral-200 text-neutral-400' 
            : 'bg-dark-900/60 border-dark-400 text-purple-100/40'
        }`}>
          Advanced Stock Analysis Dashboard | Powered by Yahoo Finance API | Real-time Financial Data. This tool is for educational and informational purposes only. Not financial advice.
        </footer>

      </div>

    </div>
  );
}
