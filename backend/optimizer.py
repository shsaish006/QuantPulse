import numpy as np
import pandas as pd
from scipy.optimize import minimize
import sys
import logging

logger = logging.getLogger(__name__)

class RiskParityPortfolioOptimizer:
    """
    Provides a pure Python implementation of a risk parity portfolio optimizer.
    It calculates optimal weights with a weight range from 0 to 1, seeking to
    equalize the risk carried by each asset in the portfolio.
    
    Ported from the QUANT algorithm and optimized for standard data science environments.
    """
    
    def __init__(self, minimum_weight: float = 1e-05, maximum_weight: float = 1.0):
        self.minimum_weight = max(minimum_weight, 1e-05)
        self.maximum_weight = max(maximum_weight, minimum_weight)

    def optimize(self, historical_returns: pd.DataFrame, budget: np.ndarray = None, covariance: np.ndarray = None) -> np.ndarray:
        """
        Calculates the optimal asset weights under a Risk Parity framework.
        
        Args:
            historical_returns (pd.DataFrame): DataFrame containing daily/periodic asset returns.
            budget (np.ndarray, optional): Custom risk budget for each asset. Defaults to equal risk budget.
            covariance (np.ndarray, optional): Covariance matrix. Computed from returns if not provided.
            
        Returns:
            np.ndarray: Optimized normalized portfolio weights.
        """
        try:
            if covariance is None:
                # Compute standard covariance matrix, scale to annual if needed, but relative scales are fine
                covariance = np.cov(historical_returns.T)
                
            # If standard cov yields a scalar (1x1 covariance matrix, i.e., 1 asset)
            if np.isscalar(covariance) or len(historical_returns.columns) == 1:
                return np.array([1.0])
                
            size = historical_returns.columns.size
            x0 = np.array(size * [1. / size])
            
            # Risk budget: equal risk contribution if not specified
            budget = budget if budget is not None else x0
            
            # Optimization objective function
            # minimize_{x >= 0} f(x) = 0.5 * x^T.Sigma.x - budget^T.log(x)
            # df(x)/dx = Sigma.x - budget / x
            # Hessian(x) = Sigma + Diag(budget / x^2)
            objective = lambda weights: 0.5 * weights.T @ covariance @ weights - budget.T @ np.log(weights)
            gradient = lambda weights: covariance @ weights - budget / weights
            hessian = lambda weights: covariance + np.diag((budget / weights**2).flatten())
            
            bounds = tuple((self.minimum_weight, self.maximum_weight) for _ in range(size))
            
            # Optimize using trust-region constrained method
            solver = minimize(
                objective, 
                jac=gradient, 
                hess=hessian, 
                x0=x0, 
                bounds=bounds, 
                method="trust-constr",
                options={"maxiter": 1000}
            )
            
            if not solver["success"]:
                logger.warning(f"RiskParityPortfolioOptimizer.optimize: Did not converge. Reason: {solver.get('message')}. Returning equal weighted.")
                return x0
                
            # Normalize weights: w = x / sum(x)
            optimal_x = solver["x"]
            weights = optimal_x / np.sum(optimal_x)
            return weights
            
        except Exception as e:
            logger.error(f"Error during risk parity optimization: {e}. Returning equal weighted.")
            # Fallback to equal weighting
            num_assets = historical_returns.shape[1]
            return np.array([1.0 / num_assets] * num_assets)
