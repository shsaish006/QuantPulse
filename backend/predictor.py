import numpy as np
import pandas as pd
import yfinance as yfinance_engine
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def calculate_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes professional-grade technical indicators on the given DataFrame.
    Expects Close, High, Low prices.
    """
    df = df.copy()
    
    # 1. Simple Moving Averages
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    
    # 2. Exponential Moving Averages
    df['EMA_12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['EMA_26'] = df['Close'].ewm(span=26, adjust=False).mean()
    
    # 3. MACD
    df['MACD'] = df['EMA_12'] - df['EMA_26']
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
    
    # 4. Relative Strength Index (RSI)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / (loss + 1e-9)
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # 5. Bollinger Bands (20-day SMA +/- 2 StdDev)
    df['BB_Mid'] = df['SMA_20']
    df['BB_Std'] = df['Close'].rolling(window=20).std()
    df['BB_Upper'] = df['BB_Mid'] + (2 * df['BB_Std'])
    df['BB_Lower'] = df['BB_Mid'] - (2 * df['BB_Std'])
    
    # 6. Rate of Change (ROC - 10-day)
    df['ROC'] = df['Close'].pct_change(periods=10) * 100
    
    # Fill NAs
    df.ffill(inplace=True)
    df.bfill(inplace=True)
    
    return df

class QuantitativePredictor:
    """
    Combines rolling autoregressive lag features with a machine learning regressor (Ridge)
    to perform statistical forecasting on stock prices.
    """
    def __init__(self, lag_days: int = 5):
        self.lag_days = lag_days
        self.model = Ridge(alpha=1.0)
        self.is_trained = False
        self.std_error = 0.0

    def prepare_features(self, df: pd.DataFrame):
        """
        Creates lagging price features and technical indicators for autoregressive ML modeling.
        """
        df = df.copy()
        
        # Target: Tomorrow's close price
        df['Target'] = df['Close'].shift(-1)
        
        # Lag features
        feature_cols = []
        for lag in range(1, self.lag_days + 1):
            col_name = f'Lag_Close_{lag}'
            df[col_name] = df['Close'].shift(lag)
            feature_cols.append(col_name)
            
        # Add core technical indicators as features
        technical_cols = ['SMA_20', 'SMA_50', 'EMA_12', 'EMA_26', 'MACD', 'MACD_Signal', 'RSI', 'ROC']
        for col in technical_cols:
            if col in df.columns:
                feature_cols.append(col)
                
        # Drop rows with NaN targets or lag features
        df_clean = df.dropna().copy()
        
        X = df_clean[feature_cols]
        y = df_clean['Target']
        
        return X, y, feature_cols

    def train_and_forecast(self, df: pd.DataFrame, forecast_days: int = 7):
        """
        Trains the autoregressive ridge model and projects future prices with statistical confidence bounds.
        """
        if len(df) < 60:
            raise ValueError(f"Insufficient historical data: {len(df)} days found. Minimum 60 days required.")
            
        # Prepare data
        X, y, feature_cols = self.prepare_features(df)
        
        if len(X) < 10:
            raise ValueError("Insufficient data points after lagging features calculation.")
            
        # Fit model
        self.model.fit(X, y)
        self.is_trained = True
        
        # Calculate standard error of estimate (residual standard deviation)
        predictions = self.model.predict(X)
        residuals = y - predictions
        self.std_error = np.std(residuals)
        
        # Predict iteratively (rolling forecast)
        forecast_dates = []
        forecast_prices = []
        lower_bounds = []
        upper_bounds = []
        
        last_known_data = df.copy()
        current_date = last_known_data.index[-1]
        
        for day in range(1, forecast_days + 1):
            # Advance date
            current_date += timedelta(days=1)
            # Skip weekends for stocks
            while current_date.weekday() >= 5:
                current_date += timedelta(days=1)
                
            forecast_dates.append(current_date)
            
            # Recalculate indicators on the temporary dataset to feed the lags
            temp_df = calculate_technical_indicators(last_known_data)
            
            # Extract features for the latest row (to predict the next day)
            latest_row = temp_df.iloc[-1].copy()
            
            # Construct feature vector
            feature_vector = []
            
            # Lags: Lag 1 is the last close, Lag 2 is the second-to-last, etc.
            for lag in range(1, self.lag_days + 1):
                # Fetch Close price from the index -lag relative to the end
                val = last_known_data.iloc[-lag]['Close']
                feature_vector.append(val)
                
            # Technical indicators
            technical_cols = ['SMA_20', 'SMA_50', 'EMA_12', 'EMA_26', 'MACD', 'MACD_Signal', 'RSI', 'ROC']
            for col in technical_cols:
                feature_vector.append(latest_row[col])
                
            # Predict
            X_pred = np.array(feature_vector).reshape(1, -1)
            pred_price = self.model.predict(X_pred)[0]
            
            # Prevent negative stock prices in high volatility
            pred_price = max(pred_price, 0.01)
            
            forecast_prices.append(pred_price)
            
            # Calculate 95% prediction interval: Price +/- 1.96 * std_error * sqrt(day)
            # Volatility error accumulates over multi-step horizons (scaled by sqrt(day))
            margin = 1.96 * self.std_error * np.sqrt(day)
            lower_bounds.append(max(pred_price - margin, 0.01))
            upper_bounds.append(pred_price + margin)
            
            # Append predicted close to last_known_data to enable continuous rolling autoregressive forecasting
            new_row = pd.DataFrame(
                [[pred_price, pred_price, pred_price, pred_price, 0]], 
                columns=['Open', 'High', 'Low', 'Close', 'Volume'],
                index=[current_date]
            )
            last_known_data = pd.concat([last_known_data, new_row])
            
        # Format results
        forecast_df = pd.DataFrame({
            'Price': forecast_prices,
            'Lower': lower_bounds,
            'Upper': upper_bounds
        }, index=forecast_dates)
        
        return forecast_df


def fetch_stock_data(ticker: str, period: str = '1y') -> pd.DataFrame:
    """
    Downloads historical stock OHLCV data via Yahoo Finance.
    """
    ticker_clean = ticker.upper().strip()
    try:
        stock = yfinance_engine.Ticker(ticker_clean)
        # Handle custom period conversion for compatibility
        period_map = {
            '1d': '5d',
            'daily': '1y',
            'weekly': '2y',
            'monthly': '5y'
        }
        yfinance_period = period_map.get(period, period)
        
        df = stock.history(period=yfinance_period)
        if df.empty:
            raise ValueError(f"No stock data found for ticker '{ticker_clean}' via yfinance.")
        return df
    except Exception as e:
        logger.error(f"Error fetching ticker '{ticker_clean}': {e}")
        # Retry with yfinance direct download in case of issues
        df = yfinance_engine.download(ticker_clean, period='1y', progress=False)
        if df.empty:
            raise ValueError(f"Failed to download stock data for '{ticker_clean}': {e}")
        return df


def get_stock_prediction(ticker: str, period: str = '1y'):
    """
    Core function called by API. Performs yfinance fetching, calculates technicals,
    runs the ML predictor, and formats output for Next.js lightweight-charts frontend.
    """
    ticker_clean = ticker.upper().strip()
    df_raw = fetch_stock_data(ticker_clean, period)
    
    # Generate indicators
    df_indicators = calculate_technical_indicators(df_raw)
    
    # Train predictor and forecast next 7 days
    predictor = QuantitativePredictor()
    forecast_df = predictor.train_and_forecast(df_indicators, forecast_days=7)
    
    # Format historical data for lightweight-charts: [timestamp_ms, open, high, low, close]
    ohlc_history = []
    for idx, row in df_indicators.iterrows():
        # Convert pandas Timestamp to millisecond timestamp
        timestamp_ms = int(idx.timestamp() * 1000)
        ohlc_history.append([
            timestamp_ms,
            float(row['Open']),
            float(row['High']),
            float(row['Low']),
            float(row['Close'])
        ])
        
    # Format forecast data
    forecast_list = []
    for idx, row in forecast_df.iterrows():
        timestamp_ms = int(idx.timestamp() * 1000)
        forecast_list.append({
            'date': idx.strftime('%Y-%m-%d'),
            'timestamp': timestamp_ms,
            'price': float(row['Price']),
            'lower': float(row['Lower']),
            'upper': float(row['Upper'])
        })
        
    # Latest indicators summary
    latest = df_indicators.iloc[-1]
    
    # Info for card display
    try:
        info_raw = yfinance_engine.Ticker(ticker_clean).info
        name = info_raw.get('longName', ticker_clean)
        market_cap = info_raw.get('marketCap', 0)
        volume = info_raw.get('volume', int(latest['Volume']))
    except:
        name = ticker_clean
        market_cap = 0
        volume = int(latest['Volume'])
        
    change_percent = float(df_indicators['Close'].pct_change().iloc[-1] * 100)
    
    return {
        'ticker': ticker_clean,
        'name': name,
        'current_price': float(latest['Close']),
        'change_percent': change_percent,
        'market_cap': market_cap,
        'volume': volume,
        'rsi': float(latest['RSI']),
        'macd': float(latest['MACD']),
        'macd_signal': float(latest['MACD_Signal']),
        'macd_hist': float(latest['MACD_Hist']),
        'bb_upper': float(latest['BB_Upper']),
        'bb_lower': float(latest['BB_Lower']),
        'bb_mid': float(latest['BB_Mid']),
        'roc': float(latest['ROC']),
        'ohlc_history': ohlc_history,
        'forecast': forecast_list
    }
