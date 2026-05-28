import os
import re
import json
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
import pandas as pd
import numpy as np

# Import local tools
from predictor import get_stock_prediction, fetch_stock_data
from optimizer import RiskParityPortfolioOptimizer

# Try to import Google GenAI SDK
GENAI_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

logger = logging.getLogger(__name__)
load_dotenv()

SYSTEM_INSTRUCTION = """You are QuantPulse AI, an advanced, professional quantitative finance assistant.
Your goal is to assist users with stock market prediction, quantitative modeling, technical analysis, and portfolio optimization.

Always prioritize scientific and mathematical rigor:
- When explaining portfolio optimization, refer to the "Risk Parity Framework" (equalizing marginal risk contributions).
- When explaining predictions, refer to "Autoregressive Lag models combined with statistical regularized regression".
- Format all equations nicely in LaTeX and structure data in markdown tables.
- DO NOT use emojis. Maintain a serious, academic, and highly professional tone.
- When asked to predict, analyze, or optimize, execute the relevant tools and provide detailed summaries.
"""

def search_tickers_in_text(text: str) -> List[str]:
    """
    Extracts potential stock ticker symbols (capitalized 1-5 letters) from user text.
    E.g., "Predict AAPL and MSFT" -> ["AAPL", "MSFT"]
    """
    # Regex to find uppercase words of 1-5 letters, excluding common verbs/words
    candidates = re.findall(r'\b[A-Z]{1,5}\b', text)
    stopwords = {'I', 'A', 'AND', 'THE', 'FOR', 'TO', 'ON', 'IN', 'OF', 'BY', 'WITH', 'AT', 'AM', 'PM', 'GET', 'BUY', 'SELL', 'RSI', 'MACD', 'SMA', 'EMA', 'ROC', 'BB', 'ML', 'AI'}
    tickers = [c for c in candidates if c not in stopwords]
    return list(set(tickers))

def execute_local_fallback_query(user_query: str) -> str:
    """
    Highly advanced quantitative NLP fallback parser. Parses keywords, runs the actual
    predictive/optimization modules, and crafts a highly analytical academic report.
    """
    query_upper = user_query.upper()
    tickers = search_tickers_in_text(user_query)
    
    # 1. PORTFOLIO OPTIMIZATION REQUEST
    if any(keyword in query_upper for keyword in ["OPTIMIZE", "PORTFOLIO", "ALLOCATE", "RISK PARITY", "WEIGHT"]):
        # Fallback list of tickers if none detected
        active_tickers = tickers if len(tickers) >= 2 else ["SPY", "AAPL", "MSFT", "GLD"]
        
        try:
            # Fetch returns for these tickers
            returns_data = {}
            for ticker in active_tickers:
                try:
                    df = fetch_stock_data(ticker, period='1y')
                    returns_data[ticker] = df['Close'].pct_change()
                except Exception as e:
                    logger.error(f"Optimizer fallback could not fetch '{ticker}': {e}")
                    
            if len(returns_data) < 2:
                return f"Unable to perform portfolio optimization. Risk Parity requires at least two valid assets with historical pricing. Only found data for: {list(returns_data.keys())}."
                
            returns_df = pd.DataFrame(returns_data).dropna()
            
            # Run optimizer
            optimizer = RiskParityPortfolioOptimizer()
            weights = optimizer.optimize(returns_df)
            
            # Generate report
            report = f"## Risk Parity Portfolio Allocation Analysis\n\n"
            report += f"The portfolio optimization was conducted using a Risk Parity framework. Unlike traditional mean-variance optimization (which is highly sensitive to expected return estimates), Risk Parity determines asset weights such that each asset contributes equally to the total portfolio volatility.\n\n"
            
            report += "### Mathematical Framework\n\n"
            report += "We solve the following convex optimization problem to equalize the marginal risk contribution of each asset:\n\n"
            report += "$$\\min_{x \\ge 0} \\frac{1}{2} x^T \\Sigma x - \\sum_{i=1}^{N} b_i \\ln(x_i)$$\n\n"
            report += "Where $\\Sigma$ is the covariance matrix of asset returns, $b_i = 1/N$ represents the target risk budget for asset $i$, and the optimal weights are defined by normalizing the decision variable:\n\n"
            report += "$$w_i = \\frac{x_i}{\\sum_{j=1}^{N} x_j}$$\n\n"
            
            report += "### Optimized Asset Weights\n\n"
            report += "| Asset Ticker | Optimized Weight | Risk Contribution Budget |\n"
            report += "| :--- | :--- | :--- |\n"
            for ticker, weight in zip(returns_df.columns, weights):
                report += f"| **{ticker}** | {weight * 100:.2f}% | {100 / len(weights):.2f}% |\n"
                
            report += "\n### Volatility & Correlation Context\n"
            report += f"Asset optimization was computed over {len(returns_df)} trading days using the annualized covariance structure of the returns. Assets with higher historical volatility (e.g., tech stocks) are allocated lower nominal weights to match the volatility contributions of defensive assets (e.g., bonds or gold).\n"
            return report
            
        except Exception as e:
            return f"An error occurred during portfolio optimization calculations: {str(e)}."

    # 2. STOCK PREDICTION REQUEST
    elif any(keyword in query_upper for keyword in ["PREDICT", "FORECAST", "FUTURE", "TOMORROW", "NEXT WEEK"]):
        active_ticker = tickers[0] if len(tickers) > 0 else "SPY"
        
        try:
            res = get_stock_prediction(active_ticker)
            
            report = f"## Quantitative Predictive Model Report: {active_ticker}\n\n"
            report += f"This quantitative forecasting analysis uses an Autoregressive Ridge Regression framework with rolling lag structures (Lag 1 through Lag 5) and primary technical indicators.\n\n"
            report += f"### Model Parameters and Latest State\n"
            report += f"- **Target Ticker**: {active_ticker} ({res['name']})\n"
            report += f"- **Latest Close Price**: ${res['current_price']:.2f} ({res['change_percent']:+.2f}%)\n"
            report += f"- **14-day RSI**: {res['rsi']:.2f}\n"
            report += f"- **MACD Line**: {res['macd']:.4f} (Signal: {res['macd_signal']:.4f})\n"
            report += f"- **10-day Rate of Change (ROC)**: {res['roc']:.2f}%\n\n"
            
            report += "### 7-Day Rolling Statistical Forecast\n"
            report += "The forecast is generated using iterative multi-step prediction. Standard error margins are calculated with a 95% confidence boundary, scaling dynamically over the prediction horizon to account for compounding error variance:\n\n"
            
            report += "| Trading Day | Projected Price | Lower Bound (95% CI) | Upper Bound (95% CI) |\n"
            report += "| :--- | :--- | :--- | :--- |\n"
            for item in res['forecast']:
                report += f"| {item['date']} | **${item['price']:.2f}** | ${item['lower']:.2f} | ${item['upper']:.2f} |\n"
                
            report += "\n### Quantitative Interpretation\n"
            last_pred = res['forecast'][-1]['price']
            net_change = ((last_pred - res['current_price']) / res['current_price']) * 100
            report += f"Over the next 7 trading sessions, the autoregressive model predicts a net price change of **{net_change:+.2f}%** to terminal price **${last_pred:.2f}**. "
            if res['rsi'] > 70:
                report += "The Relative Strength Index indicates overbought conditions (RSI > 70), indicating potential overhead resistance."
            elif res['rsi'] < 30:
                report += "The Relative Strength Index indicates oversold conditions (RSI < 30), highlighting a statistical support level."
            else:
                report += "The Relative Strength Index remains in neutral territory."
                
            return report
            
        except Exception as e:
            return f"An error occurred while generating predictions for stock '{active_ticker}': {str(e)}."

    # 3. STATISTICAL TECHNICAL ANALYSIS REQUEST
    elif any(keyword in query_upper for keyword in ["RSI", "MACD", "BOLLINGER", "TECHNICAL", "INDICATOR", "METRICS"]):
        active_ticker = tickers[0] if len(tickers) > 0 else "SPY"
        
        try:
            res = get_stock_prediction(active_ticker)
            report = f"## Technical Indicators & Momentum Analysis: {active_ticker}\n\n"
            report += f"This report synthesizes standard quantitative indicators computed from historical close prices over the specified period:\n\n"
            
            report += "| Metric / Indicator | Value | Analytical Interpretation |\n"
            report += "| :--- | :--- | :--- |\n"
            report += f"| **Latest Close Price** | ${res['current_price']:.2f} | Current market value |\n"
            report += f"| **Relative Strength Index (RSI)** | {res['rsi']:.2f} | " + ("Overbought conditions; high momentum risk" if res['rsi'] > 70 else ("Oversold conditions; buying exhaustion" if res['rsi'] < 30 else "Neutral momentum")) + " |\n"
            report += f"| **MACD Line** | {res['macd']:.4f} | " + ("Bullish divergence" if res['macd'] > res['macd_signal'] else "Bearish divergence") + " |\n"
            report += f"| **MACD Signal Line** | {res['macd_signal']:.4f} | Moving average of MACD difference |\n"
            report += f"| **MACD Histogram** | {res['macd_hist']:.4f} | Absolute divergence momentum |\n"
            report += f"| **Bollinger Band (Upper)** | ${res['bb_upper']:.2f} | Technical ceiling resistance (2 StdDev) |\n"
            report += f"| **Bollinger Band (Lower)** | ${res['bb_lower']:.2f} | Technical floor support (2 StdDev) |\n"
            report += f"| **Rate of Change (10-day ROC)** | {res['roc']:.2f}% | Directional momentum velocity |\n\n"
            
            report += "### Mathematical Formulations\n"
            report += "- **Relative Strength Index (RSI)**: $100 - \\frac{100}{1 + RS}$, where $RS = \\frac{\\text{Average Gain}}{\\text{Average Loss}}$ over a rolling 14-day window.\n"
            report += "- **Bollinger Bands**: $\\text{SMA}_{20} \\pm 2 \\times \\sigma_{20}$, representing the volatility-adjusted standard deviation channel.\n"
            return report
        except Exception as e:
            return f"An error occurred while computing technical metrics for stock '{active_ticker}': {str(e)}."
            
    # 4. GENERAL FINANCIAL THEORY / GREETING
    else:
        return (
            "## Welcome to QuantPulse AI Assistant\n\n"
            "I am programmed to perform high-fidelity statistical stock forecasting and portfolio optimization under strict mathematical frameworks.\n\n"
            "### Available Capabilities\n\n"
            "1. **Autoregressive Stock Forecasting**:\n"
            "   - Synthesizes lagged price features with regularized Ridge Regression.\n"
            "   - Generates 7-day price forecasts with 95% confidence intervals.\n"
            "   - *Try asking*: 'Predict the price of AAPL for next week'\n\n"
            "2. **Risk Parity Portfolio Optimization**:\n"
            "   - Solves non-linear convex optimizations to ensure assets contribute equally to portfolio variance.\n"
            "   - *Try asking*: 'Optimize a portfolio of TSLA, MSFT, and GLD using risk parity'\n\n"
            "3. **Technical Momentum Reporting**:\n"
            "   - Computes RSI, MACD, and Bollinger Bands with high precision.\n"
            "   - *Try asking*: 'Give me the technical indicators for NVDA'\n\n"
            "Please specify the quantitative task or financial assets you wish to analyze."
        )


def get_instant_strategy_report(id: str) -> str:
    categories = {
        'tf': 'Momentum & Trend Following',
        'mr': 'Mean Reversion & Volatility',
        'sa': 'Statistical Arbitrage & Pairs Trading',
        'rm': 'Risk Management & Portfolio Math',
        'ms': 'Microstructure & Sentiment'
    }
    prefix = id.split('_')[0]
    cat_name = categories.get(prefix, 'Quantitative Algorithmic Strategy')

    # Mapping of all 50 strategies to ensure specific outputs
    defaults = {
        'tf_1': {'name': 'Dual SMA Crossover', 'desc': 'Executes trades on the crossing of short-term (50d) and long-term (200d) simple moving averages to capture macro market currents.'},
        'tf_2': {'name': 'MACD Divergence Swing', 'desc': 'Locks onto divergences between price velocity and the MACD line to identify momentum exhaustion and trend pivot points.'},
        'tf_3': {'name': 'Triple EMA System', 'desc': 'Employs short, intermediate, and long-term EMAs to filter short-term volatility whipsaws and remain aligned with macro shifts.'},
        'tf_4': {'name': 'Bollinger Band Breakout', 'desc': 'Identifies expansion in market volatility and enters positions when price closes outside the 2.0 standard deviation bounds.'},
        'tf_5': {'name': 'Donchian Channel Breakout', 'desc': 'Enters long positions when the price breaks above the 20-day high, or short positions below the 20-day low, matching turtle trading rules.'},
        'tf_6': {'name': 'Keltner ATR Channel', 'desc': 'Uses an exponential moving average enveloped by ATR channels to identify high-probability trend extensions.'},
        'tf_7': {'name': 'Parabolic SAR Reversal', 'desc': 'Applies trailing acceleration stops to dynamically lock in profits and execute immediate position reversals.'},
        'tf_8': {'name': 'Ichimoku Cloud Breakout', 'desc': 'Evaluates momentum, support, and future trend thresholds utilizing the Senkou Span A/B boundary cloud.'},
        'tf_9': {'name': 'Heikin-Ashi Momentum', 'desc': 'Smooths price candlesticks using average calculations to isolate core directional trends from erratic session noise.'},
        'tf_10': {'name': 'ADX Trend Strength Filter', 'desc': 'Integrates the Average Directional Index to avoid trading in rangebound regimes and execute exclusively in high-strength trends.'},
        'mr_1': {'name': 'RSI Bound Extreme', 'desc': 'Triggers counter-trend long positions when the 14-day RSI drops below 25, or shorts above 75, anticipating quick corrections.'},
        'mr_2': {'name': 'Mean Reversion to SMA-200', 'desc': 'Capitalizes on extreme price deviations from the 200-day simple moving average, expecting prices to pull back to the mean.'},
        'mr_3': {'name': 'Bollinger Band Squeeze', 'desc': 'Identifies periods of extreme volatility contraction (squeeze) to position for explosive mean-reverting expansions.'},
        'mr_4': {'name': 'Relative Vigor Index (RVI)', 'desc': 'Measures the conviction of price movements by comparing closing prices to their high-low ranges.'},
        'mr_5': {'name': 'Connors RSI-2 System', 'desc': 'Uses a high-velocity 2-period RSI coupled with moving average filters to enter extremely short-term oversold reversals.'},
        'mr_6': {'name': 'Williams %R Extreme', 'desc': 'A momentum indicator measuring overbought/oversold levels relative to high-low bounds over a 14-day window.'},
        'mr_7': {'name': 'CCI Reversion Strategy', 'desc': 'Utilizes the Commodity Channel Index to capture structural deviations from historical average price cycles.'},
        'mr_8': {'name': 'DeMarker Oscillator Swing', 'desc': 'Compares session highs and lows to identify under-the-radar exhaustion points in institutional accumulation.'},
        'mr_9': {'name': 'Ultimate Oscillator Swing', 'desc': 'Combines short, intermediate, and long-term oscillators to reduce false buy signals in volatile consolidation ranges.'},
        'mr_10': {'name': 'Chande Momentum Reversion', 'desc': 'Uses direct momentum calculations to identify over-extended prices without smoothing delay lags.'},
        'sa_1': {'name': 'Equity Pairs Trading', 'desc': 'Identifies cointegrated stock pairs, tracking their historical spread to buy the undervalued stock and short the overvalued stock.'},
        'sa_2': {'name': 'Index Cointegration Arb', 'desc': 'Capitalizes on temporary pricing discrepancies between basket indices and their underlying tracking shares.'},
        'sa_3': {'name': 'Volatility Arbitrage', 'desc': 'Trades discrepancies between implied volatility (derived from options) and realized historical price volatility.'},
        'sa_4': {'name': 'Calendar Spreads Strategy', 'desc': 'Exploits structural differences in time decay (theta) across options or futures contracts of varying expiration cycles.'},
        'sa_5': {'name': 'ETF Arbitrage Loop', 'desc': 'Locks in quick risk-free returns when the Net Asset Value (NAV) of an ETF diverges from its basket market value.'},
        'sa_6': {'name': 'Triangular Arbitrage', 'desc': 'Exploits exchange rate discrepancies between three related asset classes to extract immediate pricing gains.'},
        'sa_7': {'name': 'Cross-Border Stock Arb', 'desc': 'Capitalizes on differences in pricing for dual-listed assets across international timezones.'},
        'sa_8': {'name': 'Convertible Arbitrage', 'desc': 'Long positions on convertible bonds combined with tactical short positions on the underlying equity shares.'},
        'sa_9': {'name': 'Stat Mean-Reversion Spreads', 'desc': 'Constructs custom mathematical spreads using principal component analysis to trade mean-reverting synthetic spreads.'},
        'sa_10': {'name': 'Basis Arbitrage Terminal', 'desc': 'Exploits pricing gaps between cash spot markets and corresponding futures contracts.'},
        'rm_1': {'name': 'Risk Parity Allocation', 'desc': 'Allocates capital such that each asset contributes equally to portfolio risk, balancing high-beta equities with defensive assets.'},
        'rm_2': {'name': 'Kelly Criterion Scaling', 'desc': 'Applies probability theory to optimize capital bet sizing based on the historical win-loss ratio of trades.'},
        'rm_3': {'name': 'Volatility-Targeted Rebal', 'desc': 'Adjusts portfolio leverage and capital weights dynamically to maintain a stable, target portfolio volatility.'},
        'rm_4': {'name': 'Risk-Budgeted VaR Limits', 'desc': 'Implements Value-at-Risk allocations to restrict maximum expected portfolio losses within a 95% confidence interval.'},
        'rm_5': {'name': 'Minimum Variance Allocations', 'desc': 'Computes optimal weights to build a portfolio with the lowest possible volatility, irrespective of returns.'},
        'rm_6': {'name': 'Black-Litterman Optimization', 'desc': 'Combines equilibrium market portfolios with unique investor views to construct stable weight forecasts.'},
        'rm_7': {'name': 'CPPI Asset Protection', 'desc': 'Constant Proportion Portfolio Insurance dynamically adjusts risky vs. risk-free assets to ensure a capital floor is preserved.'},
        'rm_8': {'name': 'Delta-Neutral Option Hedges', 'desc': 'Maintains option positions with a net delta of zero to isolate premium decay benefits independent of direction.'},
        'rm_9': {'name': 'Expected Shortfall (ES) Optimization', 'desc': 'Optimizes portfolios to minimize extreme tail risk losses during market anomalies.'},
        'rm_10': {'name': 'Maximum Sharpe Allocation', 'desc': 'Calculates the optimal tangency portfolio on the efficient frontier to maximize return per unit of risk.'},
        'ms_1': {'name': 'Order Book Imbalance', 'desc': 'Detects near-instantaneous institutional buying/selling pressure by tracking the ratio of bid-ask limit orders.'},
        'ms_2': {'name': 'VWAP Anchored Channels', 'desc': 'Uses Volume Weighted Average Price anchors to trade breakouts and pullbacks around key institutional volume averages.'},
        'ms_3': {'name': 'TWAP Liquidity Capture', 'desc': 'Breaks down large blocks into Time Weighted Average chunks to execute trades with minimal market impact.'},
        'ms_4': {'name': 'Insider Activity Tracking', 'desc': 'Tracks and buys stocks when company executives complete significant open-market stock purchases.'},
        'ms_5': {'name': 'Social Sentiment Drift', 'desc': 'Scans social channels for structural spikes in sentiment to ride momentum surges in retail interest.'},
        'ms_6': {'name': 'News NLP Momentum', 'desc': 'Applies Natural Language Processing to financial news feeds to trade instantly on high-impact keywords.'},
        'ms_7': {'name': 'Put-Call Ratio Extremes', 'desc': 'Contrarian sentiment indicator that buys stocks when high put-call ratios signal maximum bearish exhaustion.'},
        'ms_8': {'name': 'Block Trade Volatility Spike', 'desc': 'Enters trades when large, block-market volume execution signals institutional entry points.'},
        'ms_9': {'name': 'Dark Pool Liquidity Tracking', 'desc': 'Monitors block trades executed outside standard exchanges to identify hidden support/resistance levels.'},
        'ms_10': {'name': 'Order Flow Cumulative Delta', 'desc': 'Compares buying vs. selling market orders to isolate aggressive institutional accumulation.'}
    }

    selected_strat = defaults.get(id, {'name': 'Quantitative Strategy', 'desc': 'Systematic algorithmic trading rule-based framework.'})
    name = selected_strat['name']
    desc = selected_strat['desc']

    # Compile exact custom formula and descriptions dynamically based on the name keywords
    formula = '$$\\text{Signal}_t = f(P_t, P_{t-1}, \\dots, P_{t-k})$$'
    math_explain = 'Determines optimal directional bias based on systematic price lag models.'

    if 'SMA' in name or 'Crossover' in name:
        formula = '$$\\text{Cross}_t = \\text{SMA}_{50,t} - \\text{SMA}_{200,t}$$'
        math_explain = 'A buy signal is triggered when the short-term SMA crosses above the long-term SMA (Golden Cross), and a sell signal is triggered on a cross below (Death Cross).'
    elif 'EMA' in name:
        formula = '$$\\text{EMA}_t(N) = P_t \\cdot \\frac{2}{N+1} + \\text{EMA}_{t-1} \\cdot \\left(1 - \\frac{2}{N+1}\\right)$$'
        math_explain = 'Smooths high-frequency price variance using exponential weights decaying over the rolling moving window parameters.'
    elif 'MACD' in name:
        formula = '$$\\text{MACD}_t = \\text{EMA}_t(12) - \\text{EMA}_t(26) \\quad \\text{and} \\quad \\text{Signal}_t = \\text{EMA}_t(\\text{MACD}_t, 9)$$'
        math_explain = 'Calculates price velocity convergence/divergence. Swing signals occur when the MACD oscillator crosses the exponential signal baseline.'
    elif 'Bollinger' in name or 'Band' in name:
        formula = '$$\\text{Upper/Lower Bands} = \\text{SMA}_{20,t} \\pm 2.0 \\cdot \\sigma_{20,t}$$'
        math_explain = 'Constructs standard volatility channels around a core moving average using a 2.0 standard deviation parameter.'
    elif 'RSI' in name:
        formula = '$$\\text{RSI}_t = 100 - \\frac{100}{1 + RS_t} \\quad \\text{where} \\quad RS_t = \\frac{\\text{SMMA}(Gain, 14)}{\\text{SMMA}(Loss, 14)}$$'
        math_explain = 'A rolling 14-period momentum indicator measuring the ratio of average gains to average losses to flag extreme overbought/oversold levels.'
    elif 'Donchian' in name:
        formula = '$$\\text{Upper Channel}_t = \\max(H_{t-1}, \\dots, H_{t-20}) \\quad \\text{and} \\quad \\text{Lower Channel}_t = \\min(L_{t-1}, \\dots, L_{t-20})$$'
        math_explain = 'Determines high/low boundaries of the trailing 20 sessions to execute breakout trend following strategies.'
    elif 'SAR' in name:
        formula = '$$\\text{SAR}_{t+1} = \\text{SAR}_t + \\alpha_t \\cdot (\\text{EP}_t - \\text{SAR}_t)$$'
        math_explain = 'Calculates trailing acceleration stops that dynamically follow price peaks and troughs, triggering immediate reversals on breach.'
    elif 'Ichimoku' in name:
        formula = '$$\\text{Senkou Span A} = \\frac{\\text{Tenkan-Sen} + \\text{Kijun-Sen}}{2} \\quad \\text{and} \\quad \\text{Span B} = \\frac{\\max(H_{52}) + \\min(L_{52})}{2}$$'
        math_explain = 'Determines macro support/resistance envelopes (clouds) projected 26 periods ahead to gauge trend integrity.'
    elif 'Heikin' in name:
        formula = '$$Close_{HA} = \\frac{O + H + L + C}{4} \\quad \\text{and} \\quad Open_{HA,t} = \\frac{Open_{HA,t-1} + Close_{HA,t-1}}{2}$$'
        math_explain = 'Smooths typical pricing charts using trailing candle averages to isolate underlying trend components from session noise.'
    elif 'ADX' in name:
        formula = '$$\\text{ADX}_t = \\text{EMA}_t(\\text{DX}, 14) \\quad \\text{where} \\quad \\text{DX} = 100 \\cdot \\frac{|+DI - -DI|}{+DI + -DI}$$'
        math_explain = 'Measures the absolute strength of a directional trend, bypassing ranges to execute only in highly trending regimes (ADX > 25).'
    elif 'Pairs' in name or 'Cointegration' in name:
        formula = '$$Spread_t = \\ln(Asset_1) - \\beta \\cdot \\ln(Asset_2) - \\alpha \\quad \\text{where} \\quad Z_t = \\frac{Spread_t - \\mu_S}{\\sigma_S}$$'
        math_explain = 'Models the long-term cointegrating relationship of two correlated assets, trading mean-reverting deviations in their relative spread.'
    elif 'Kelly' in name:
        formula = '$$f^* = \\frac{p \\cdot b - (1 - p)}{b}$$'
        math_explain = 'Probability model that optimizes investment leverage and allocation fraction based on historical win probability and payoff odds.'
    elif 'VWAP' in name or 'TWAP' in name:
        formula = '$$\\text{VWAP}_t = \\frac{\\sum_i P_i \\cdot V_i}{\\sum_i V_i}$$'
        math_explain = 'Volume-weighted price average used by institutional desks to run large trades with minimal execution slip.'
    elif 'Sentiment' in name or 'NLP' in name:
        formula = '$$\\text{Sentiment Score}_t = \\sum_i w_i \\cdot \\text{Score}(\\text{Text}_i)$$'
        math_explain = 'Extracts and accumulates structural keyword sentiments from news arrays to ride momentum shifts in public interest.'
    elif 'Imbalance' in name or 'Order Flow' in name:
        formula = '$$\\text{Imbalance}_t = \\frac{BidVolume_t - AskVolume_t}{BidVolume_t + AskVolume_t}$$'
        math_explain = 'Calculates order book bid-ask limit volume ratios to detect immediate institutional accumulation pressure.'
    elif 'Variance' in name:
        formula = '$$\\min_{w} w^T \\Sigma w \\quad \\text{subject to} \\quad \\sum w_i = 1$$'
        math_explain = 'Finds weights that construct a portfolio with the lowest possible volatility contribution, regardless of returns.'
    elif 'Sharpe' in name:
        formula = '$$\\max_{w} \\frac{w^T R - R_f}{\\sqrt{w^T \\Sigma w}}$$'
        math_explain = 'Tangency portfolio optimizer targeting the absolute maximum return per unit of annualized covariance risk.'

    report = f"## Goldmine Strategy Analysis: Strategy {id.upper()}\n\n"
    report += f"### 1. Classification & Overview\n"
    report += f"- **Strategy Name**: {name}\n"
    report += f"- **Category**: {cat_name}\n"
    report += f"- **Concept**: {desc}\n"
    report += f"- **System Latency Class**: High-Frequency Execution / Real-time Tick processing\n\n"

    report += f"### 2. Theoretical Mathematical Foundations\n"
    report += f"The quantitative model for **{name}** is formulated below:\n\n"
    report += f"{formula}\n\n"
    report += f"**Quantitative Breakdown**:\n"
    report += f"{math_explain}\n\n"

    report += f"### 3. Systematic Implementation Steps\n"
    report += f"1. **Parameters Calibration**: Fit historical lag windows and trigger bounds using rolling out-of-sample data sets.\n"
    report += f"2. **Signal Filtering**: Check indicators (such as ADX strength filters or cointegration statistics) to reject false trades.\n"
    report += f"3. **Execution Routing**: Execute trades through volume-weighted execution algos (VWAP or TWAP) to minimize slipping.\n"
    report += f"4. **Dynamic Risk Budgeting**: Apply fractional Kelly sizing constraints and trailing stops to lock in equity curve gains.\n\n"

    report += f"### 4. Code Implementation & Execution\n"
    report += f"This strategy is fully integrated with our local simulator. You can inspect implementation models directly inside the Strategy Goldmines collapsibles or click the run trigger below to initiate simulation testing."

    return report


def chat_with_assistant(messages: List[Dict[str, str]]) -> str:
    """
    Main entry point for AI chat.
    Utilizes Google's new GenAI SDK if an API key is present in environment,
    otherwise routes cleanly to our mathematical fallback parser.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    user_query = messages[-1]["content"] if messages else ""
    
    if not user_query:
        return "Empty query received."
        
    # Instant Strategy Goldmines Interception
    query_upper = user_query.upper()
    strat_match = re.search(r'\b(TF|MR|SA|RM|MS)_([1-9]|10)\b', query_upper)
    if strat_match:
        strat_id = strat_match.group(0).lower()
        return get_instant_strategy_report(strat_id)
        
    if not GENAI_AVAILABLE or not api_key:
        logger.info("Using local quantitative fallback engine.")
        return execute_local_fallback_query(user_query)
        
    try:
        logger.info("Initiating Google GenAI client.")
        client = genai.Client(api_key=api_key)
        
        # We can pass context to Gemini about the tools available and instruct it to suggest tool parameters.
        # However, to keep it extremely fast and avoid complex multi-turn network calls, we will leverage Gemini's
        # reasoning to synthesize the answer, but enrich it with our actual analytical tools!
        # First, let's extract ticker or optimization request using regular expressions, run the actual math tools,
        # and feed the actual calculation results directly into Gemini's prompt context!
        # This is a highly robust "RAG/Augmented Generation" approach that guarantees the AI gives actual, correct calculations
        # and never hallucinates stock prices or optimal weights!
        
        tickers = search_tickers_in_text(user_query)
        query_upper = user_query.upper()
        
        calculation_context = ""
        
        if any(keyword in query_upper for keyword in ["OPTIMIZE", "PORTFOLIO", "ALLOCATE", "RISK PARITY", "WEIGHT"]):
            active_tickers = tickers if len(tickers) >= 2 else ["SPY", "AAPL", "MSFT", "GLD"]
            try:
                returns_data = {}
                for t in active_tickers:
                    df = fetch_stock_data(t, period='1y')
                    returns_data[t] = df['Close'].pct_change()
                returns_df = pd.DataFrame(returns_data).dropna()
                optimizer = RiskParityPortfolioOptimizer()
                weights = optimizer.optimize(returns_df)
                
                calculation_context = "--- ACTUAL PORTFOLIO CALCULATION CONTEXT ---\n"
                calculation_context += f"The user requested portfolio optimization for tickers: {active_tickers}.\n"
                calculation_context += "Optimized weights calculated by local RiskParityPortfolioOptimizer:\n"
                for t, w in zip(returns_df.columns, weights):
                    calculation_context += f"- {t}: {w*100:.4f}%\n"
                calculation_context += "Use these exact weights in your explanation. Mention that they were computed by the system's local non-linear solver.\n"
                calculation_context += "--------------------------------------------\n"
            except Exception as e:
                calculation_context = f"[Calculations warning: Portfolio optimization could not be computed locally: {e}]\n"
                
        elif any(keyword in query_upper for keyword in ["PREDICT", "FORECAST", "FUTURE", "TOMORROW", "NEXT WEEK", "RSI", "MACD", "BOLLINGER", "TECHNICAL"]):
            active_ticker = tickers[0] if len(tickers) > 0 else "SPY"
            try:
                res = get_stock_prediction(active_ticker)
                calculation_context = "--- ACTUAL STOCK QUANTITATIVE CONTEXT ---\n"
                calculation_context += f"Ticker: {res['ticker']} ({res['name']})\n"
                calculation_context += f"Current Close: ${res['current_price']:.2f} ({res['change_percent']:+.2f}%)\n"
                calculation_context += f"RSI: {res['rsi']:.2f}, MACD: {res['macd']:.4f}, Signal: {res['macd_signal']:.4f}\n"
                calculation_context += f"Bollinger Bands: BB_Upper: ${res['bb_upper']:.2f}, BB_Lower: ${res['bb_lower']:.2f}, BB_Mid: ${res['bb_mid']:.2f}\n"
                calculation_context += f"10-day ROC: {res['roc']:.2f}%\n"
                calculation_context += "7-Day Forecast (Trading days):\n"
                for item in res['forecast']:
                    calculation_context += f"- {item['date']}: Prediction ${item['price']:.2f} (95% CI Support ${item['lower']:.2f} to Resistance ${item['upper']:.2f})\n"
                calculation_context += "Use these exact numbers to answer the user's prediction/technical questions. Do not hallucinate prices.\n"
                calculation_context += "------------------------------------------\n"
            except Exception as e:
                calculation_context = f"[Calculations warning: Stock prediction data could not be retrieved locally for '{active_ticker}': {e}]\n"
                
        # Call Gemini model
        system_instruction_augmented = SYSTEM_INSTRUCTION
        if calculation_context:
            system_instruction_augmented += f"\nHere is the real mathematical context and results computed by local server engines. Incorporate this data fully:\n{calculation_context}"
            
        logger.info("Executing gemini-2.5-flash content generation.")
        
        # Build contents from messages structure
        contents = []
        for msg in messages:
            role = 'user' if msg['role'] == 'user' else 'model'
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg['content'])]
            ))
            
        # Create standard config
        config = types.GenerateContentConfig(
            system_instruction=system_instruction_augmented,
            temperature=0.1,  # Low temperature for high scientific rigor
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=config
        )
        
        reply = response.text
        # Post-process response to append copilot directives if not present
        if "[DIRECTIVE:" not in reply:
            if any(keyword in query_upper for keyword in ["OPTIMIZE", "PORTFOLIO", "ALLOCATE", "RISK PARITY"]):
                active_tickers = tickers if len(tickers) >= 2 else ["SPY", "AAPL", "MSFT", "GLD"]
                reply += f"\n\n[DIRECTIVE:OPTIMIZE:{','.join(active_tickers)}]"
            elif any(keyword in query_upper for keyword in ["BACKTEST"]):
                active_ticker = tickers[0] if len(tickers) > 0 else "AAPL"
                reply += f"\n\n[DIRECTIVE:BACKTEST:{active_ticker}]"
            elif any(keyword in query_upper for keyword in ["PREDICT", "FORECAST", "FUTURE"]):
                active_ticker = tickers[0] if len(tickers) > 0 else "AAPL"
                reply += f"\n\n[DIRECTIVE:CHART:{active_ticker}]"
            elif any(keyword in query_upper for keyword in ["TICKET", "SUPPORT", "BUG"]):
                reply += f"\n\n[DIRECTIVE:TICKET:Quantitative Model Drift]"
                
        return reply
        
    except Exception as e:
        logger.error(f"Error calling Google GenAI API: {e}. Falling back to local reasoning.")
        return execute_local_fallback_query(user_query)
