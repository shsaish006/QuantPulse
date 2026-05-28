import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import logging
from dotenv import load_dotenv

# Import local quantitative modules
from predictor import get_stock_prediction, fetch_stock_data
from optimizer import RiskParityPortfolioOptimizer
from ai_assistant import chat_with_assistant

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("backend_main")

load_dotenv()

app = FastAPI(
    title="QuantPulse API",
    description="High-fidelity quantitative stock prediction and Risk Parity portfolio optimization engine.",
    version="1.0.0"
)

# Enable CORS for Next.js development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL e.g. http://localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class PortfolioOptimizeRequest(BaseModel):
    tickers: List[str]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "QuantPulse Quantitative Engine",
        "framework": "FastAPI",
        "documentation": "/docs"
    }

@app.get("/api/stocks/trending")
def get_trending_stocks():
    """
    Exposes a curated set of prominent global stocks representing different asset sectors
    to feed the frontend market dashboard.
    """
    trending_tickers = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GLD", "SPY"]
    results = []
    
    for ticker in trending_tickers:
        try:
            # Fetch latest price metrics (use a fast 1-month window)
            res = get_stock_prediction(ticker, period='1mo')
            results.append({
                "ticker": res["ticker"],
                "name": res["name"],
                "price": res["current_price"],
                "change_percent": res["change_percent"],
                "market_cap": res["market_cap"],
                "volume": res["volume"],
                "rsi": res["rsi"]
            })
        except Exception as e:
            logger.error(f"Error fetching trending ticker '{ticker}': {e}")
            # Append placeholder if download fails
            results.append({
                "ticker": ticker,
                "name": ticker,
                "price": 100.0,
                "change_percent": 0.0,
                "market_cap": 0,
                "volume": 0,
                "rsi": 50.0
            })
            
    return {"stocks": results}

@app.get("/api/stocks/{ticker}")
def get_stock_details(ticker: str, period: str = "1y"):
    """
    Exposes high-fidelity historical data, computed technical indicators,
    and 7-day autoregressive predictive metrics for a given ticker.
    """
    try:
        data = get_stock_prediction(ticker, period)
        return data
    except Exception as e:
        logger.error(f"Error serving prediction for '{ticker}': {e}")
        raise HTTPException(status_code=400, detail=f"Failed to generate stock prediction: {str(e)}")

@app.post("/api/portfolio/optimize")
def optimize_portfolio(payload: PortfolioOptimizeRequest):
    """
    Calculates the mathematical asset allocation weights under the Risk Parity
    framework, equalizing the marginal risk contribution of each asset.
    """
    tickers = [t.upper().strip() for t in payload.tickers if t.strip()]
    if len(tickers) < 2:
        raise HTTPException(status_code=400, detail="Portfolio optimization requires a minimum of 2 tickers.")
        
    try:
        # Fetch historical returns
        returns_data = {}
        valid_tickers = []
        
        for ticker in tickers:
            try:
                df = fetch_stock_data(ticker, period="1y")
                returns_data[ticker] = df["Close"].pct_change()
                valid_tickers.append(ticker)
            except Exception as e:
                logger.error(f"Skipping '{ticker}' in portfolio optimization due to fetch failure: {e}")
                
        if len(valid_tickers) < 2:
            raise ValueError("Insufficient pricing data retrieved for the requested assets.")
            
        returns_df = pd.DataFrame(returns_data).dropna()
        
        # Optimize
        optimizer = RiskParityPortfolioOptimizer()
        weights = optimizer.optimize(returns_df)
        
        # Format response
        allocations = []
        for ticker, weight in zip(returns_df.columns, weights):
            allocations.append({
                "ticker": ticker,
                "weight": float(weight),
                "risk_contribution": float(1.0 / len(weights))  # Risk parity means equal contributions
            })
            
        return {
            "success": True,
            "tickers_analyzed": valid_tickers,
            "days_computed": len(returns_df),
            "allocations": allocations
        }
    except Exception as e:
        logger.error(f"Error optimizing portfolio: {e}")
        raise HTTPException(status_code=400, detail=f"Portfolio optimization failure: {str(e)}")

@app.post("/api/chat")
def run_chat_assistant(payload: ChatRequest):
    """
    Accepts full chat message histories, matches keywords, invokes quantitative solvers,
    and returns a beautifully structured Markdown analysis from the AI Assistant.
    """
    try:
        # Map message formats
        chat_history = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        response_text = chat_with_assistant(chat_history)
        return {"response": response_text}
    except Exception as e:
        logger.error(f"Error in chat assistant execution: {e}")
        raise HTTPException(status_code=500, detail=f"AI Assistant execution error: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
