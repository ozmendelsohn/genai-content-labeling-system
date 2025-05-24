"""
Configuration utilities for the GenAI Content Detection Assistant backend.

This module provides functions to load and access the global configuration.
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional

# Default configuration file path (relative to project root)
DEFAULT_CONFIG_PATH = "config.yaml"

# Cache for the loaded configuration
_config_cache: Optional[Dict[str, Any]] = None

def get_config(reload: bool = False) -> Dict[str, Any]:
    """
    Load and return the global configuration.
    
    Parameters
    ----------
    reload : bool, optional
        If True, reload the configuration from disk even if cached, by default False
    
    Returns
    -------
    Dict[str, Any]
        The configuration dictionary
    
    Notes
    -----
    The function first looks for the config file at the path specified by the
    GENAI_CONFIG_PATH environment variable. If not found, it falls back to
    the default path (config.yaml in the project root).
    
    The configuration is cached after the first load for better performance.
    """
    global _config_cache
    
    if _config_cache is not None and not reload:
        return _config_cache
    
    # Check for config path in environment variable
    config_path = os.environ.get("GENAI_CONFIG_PATH", DEFAULT_CONFIG_PATH)
    
    # For Docker environment, use absolute path if relative path doesn't exist
    if not os.path.exists(config_path) and config_path == DEFAULT_CONFIG_PATH:
        # Try to find it at the project root (assuming we're in /app/src in Docker)
        docker_path = "/app/config.yaml"
        if os.path.exists(docker_path):
            config_path = docker_path
    
    try:
        with open(config_path, 'r') as f:
            _config_cache = yaml.safe_load(f)
        return _config_cache
    except FileNotFoundError:
        raise FileNotFoundError(f"Configuration file not found at {config_path}")
    except yaml.YAMLError as e:
        raise ValueError(f"Error parsing YAML configuration: {e}")

def get_config_value(key_path: str, default: Any = None) -> Any:
    """
    Get a specific configuration value using a dot-notation key path.
    
    Parameters
    ----------
    key_path : str
        Dot-notation path to the configuration value (e.g., "api.base_url")
    default : Any, optional
        Default value to return if the key is not found, by default None
    
    Returns
    -------
    Any
        The configuration value at the specified path, or the default value if not found
    
    Examples
    --------
    >>> get_config_value("api.base_url")
    'http://localhost:8000'
    >>> get_config_value("labeling.max_labelers_per_website")
    3
    """
    config = get_config()
    keys = key_path.split('.')
    
    # Navigate through the nested dictionary
    current = config
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    
    return current 