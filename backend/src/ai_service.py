"""
AI Content Analysis Service

This module provides AI-powered content analysis using Google's Gemini AI
to automatically suggest whether content is AI-generated or human-created,
along with relevant indicators and confidence scores.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from google import genai
import json
import re

# Set up logging
logger = logging.getLogger(__name__)

class AIContentAnalyzer:
    """
    AI Content Analyzer using Google's Gemini AI
    
    This class handles content extraction from URLs and uses Gemini AI
    to analyze whether content is AI-generated or human-created.
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the AI Content Analyzer
        
        Parameters
        ----------
        api_key : str
            Google AI Studio API key for Gemini access
        """
        self.api_key = api_key
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Gemini AI client"""
        try:
            self.client = genai.Client(api_key=self.api_key)
            logger.info("Gemini AI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI client: {e}")
            raise
    
    def extract_content_from_url(self, url: str, timeout: int = 10) -> Dict[str, Any]:
        """
        Extract text content from a given URL
        
        Parameters
        ----------
        url : str
            The URL to extract content from
        timeout : int, optional
            Request timeout in seconds (default: 10)
            
        Returns
        -------
        Dict[str, Any]
            Dictionary containing extracted content with keys:
            - title: Page title
            - description: Meta description
            - content_text: Main text content
            - word_count: Number of words
            - error: Error message if extraction failed
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_tag = soup.find('title')
            title = title_tag.get_text().strip() if title_tag else "No title found"
            
            # Extract meta description
            description_tag = soup.find('meta', attrs={'name': 'description'})
            description = description_tag.get('content', '').strip() if description_tag else ""
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Extract main content text
            content_text = soup.get_text()
            
            # Clean up text
            lines = (line.strip() for line in content_text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            content_text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Limit content length for analysis (Gemini has token limits)
            if len(content_text) > 8000:
                content_text = content_text[:8000] + "..."
            
            word_count = len(content_text.split())
            
            return {
                'title': title,
                'description': description,
                'content_text': content_text,
                'word_count': word_count,
                'error': None
            }
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch content from {url}: {e}")
            return {
                'title': "",
                'description': "",
                'content_text': "",
                'word_count': 0,
                'error': f"Failed to fetch content: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error extracting content from {url}: {e}")
            return {
                'title': "",
                'description': "",
                'content_text': "",
                'word_count': 0,
                'error': f"Unexpected error: {str(e)}"
            }
    
    def analyze_content_with_ai(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze content using Gemini AI to determine if it's AI-generated or human-created
        
        Parameters
        ----------
        content_data : Dict[str, Any]
            Dictionary containing content data from extract_content_from_url
            
        Returns
        -------
        Dict[str, Any]
            Analysis results containing:
            - classification: 'ai_generated', 'human_created', or 'uncertain'
            - confidence_score: Integer 0-100
            - ai_indicators: List of detected AI indicators
            - human_indicators: List of detected human indicators
            - reasoning: AI's reasoning for the classification
            - analysis_timestamp: When analysis was performed
        """
        if not self.client:
            return self._create_error_response("AI client not initialized")
        
        if content_data.get('error'):
            return self._create_error_response(f"Cannot analyze due to content extraction error: {content_data['error']}")
        
        if not content_data.get('content_text') or content_data.get('word_count', 0) < 50:
            return self._create_error_response("Insufficient content for analysis (minimum 50 words required)")
        
        try:
            # Create a comprehensive prompt for content analysis
            analysis_prompt = self._create_analysis_prompt(content_data)
            
            # Generate content analysis using Gemini with new API
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-001",
                contents=analysis_prompt,
                config={
                    "temperature": 0.1,  # Low temperature for consistent analysis
                    "max_output_tokens": 1500,
                    "response_mime_type": "application/json",
                    "response_schema": {
                        "type": "object",
                        "properties": {
                            "classification": {
                                "type": "string",
                                "enum": ["ai_generated", "human_created", "uncertain"]
                            },
                            "confidence_score": {
                                "type": "integer",
                                "minimum": 0,
                                "maximum": 100
                            },
                            "ai_indicators": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "human_indicators": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "reasoning": {"type": "string"}
                        },
                        "required": ["classification", "confidence_score", "ai_indicators", "human_indicators", "reasoning"]
                    }
                }
            )
            
            # Parse the response
            try:
                analysis_result = json.loads(response.text)
            except json.JSONDecodeError:
                # Fallback parsing if JSON schema doesn't work
                analysis_result = self._parse_fallback_response(response.text)
            
            # Add metadata
            analysis_result['analysis_timestamp'] = datetime.utcnow().isoformat()
            analysis_result['model_used'] = "gemini-2.0-flash-001"
            analysis_result['word_count_analyzed'] = content_data.get('word_count', 0)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Failed to analyze content with AI: {e}")
            return self._create_error_response(f"AI analysis failed: {str(e)}")
    
    def _create_analysis_prompt(self, content_data: Dict[str, Any]) -> str:
        """
        Create a comprehensive prompt for AI content analysis
        
        Parameters
        ----------
        content_data : Dict[str, Any]
            Content data to analyze
            
        Returns
        -------
        str
            Formatted prompt for Gemini AI
        """
        title = content_data.get('title', 'No title')
        description = content_data.get('description', 'No description')
        content = content_data.get('content_text', '')
        
        prompt = f"""
Analyze the following web content to determine if it was likely generated by AI or created by humans. 
Provide a detailed analysis with specific indicators and confidence score.

CONTENT TO ANALYZE:
Title: {title}
Description: {description}
Content: {content[:4000]}{"..." if len(content) > 4000 else ""}

ANALYSIS REQUIREMENTS:
1. Classify as "ai_generated", "human_created", or "uncertain"
2. Provide confidence score (0-100)
3. List specific AI indicators if detected
4. List specific human indicators if detected
5. Provide reasoning for your classification

AI INDICATORS TO LOOK FOR:
- Repetitive or formulaic language patterns
- Overly perfect grammar with no colloquialisms
- Generic or template-like phrasing
- Lack of personal anecdotes or specific details
- Unnatural transitions between topics
- Overly balanced or comprehensive coverage
- Formal tone throughout without variation
- Lists or structured formats without personal touches
- Generic examples or hypothetical scenarios

HUMAN INDICATORS TO LOOK FOR:
- Personal experiences or anecdotes
- Colloquial language or slang
- Minor grammatical errors or typos
- Emotional language or subjective opinions
- Specific details or unique perspectives
- Conversational tone variations
- Cultural references or inside jokes
- Inconsistent writing style or voice changes
- Spontaneous tangents or personal asides

Return your analysis in valid JSON format with the following structure:
{{
  "classification": "ai_generated|human_created|uncertain",
  "confidence_score": 0-100,
  "ai_indicators": ["list", "of", "detected", "ai", "indicators"],
  "human_indicators": ["list", "of", "detected", "human", "indicators"],
  "reasoning": "Detailed explanation of your analysis and decision"
}}
"""
        return prompt
    
    def _parse_fallback_response(self, response_text: str) -> Dict[str, Any]:
        """
        Fallback parser for AI response if JSON schema fails
        
        Parameters
        ----------
        response_text : str
            Raw response text from AI
            
        Returns
        -------
        Dict[str, Any]
            Parsed analysis result
        """
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass
        
        # Manual parsing as fallback
        classification = "uncertain"
        confidence_score = 50
        
        # Simple keyword-based classification
        text_lower = response_text.lower()
        if "ai_generated" in text_lower or "ai-generated" in text_lower:
            classification = "ai_generated"
            confidence_score = 70
        elif "human_created" in text_lower or "human-created" in text_lower:
            classification = "human_created"
            confidence_score = 70
        
        return {
            "classification": classification,
            "confidence_score": confidence_score,
            "ai_indicators": ["Fallback analysis - detailed parsing failed"],
            "human_indicators": [],
            "reasoning": f"Fallback analysis due to parsing error. Raw response: {response_text[:500]}..."
        }
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """
        Create a standardized error response
        
        Parameters
        ----------
        error_message : str
            Error message to include
            
        Returns
        -------
        Dict[str, Any]
            Error response dictionary
        """
        return {
            "classification": "uncertain",
            "confidence_score": 0,
            "ai_indicators": [],
            "human_indicators": [],
            "reasoning": f"Analysis failed: {error_message}",
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "error": error_message
        }
    
    async def analyze_url_async(self, url: str) -> Dict[str, Any]:
        """
        Asynchronously analyze a URL's content
        
        Parameters
        ----------
        url : str
            URL to analyze
            
        Returns
        -------
        Dict[str, Any]
            Complete analysis result including content extraction and AI analysis
        """
        # Extract content
        content_data = self.extract_content_from_url(url)
        
        # Analyze with AI
        ai_analysis = self.analyze_content_with_ai(content_data)
        
        # Combine results
        return {
            "url": url,
            "content_extraction": content_data,
            "ai_analysis": ai_analysis,
            "analysis_complete": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def validate_api_key(self) -> Dict[str, Any]:
        """
        Validate the API key by making a simple test request
        
        Returns
        -------
        Dict[str, Any]
            Validation result with success status and message
        """
        try:
            if not self.client:
                return {"valid": False, "message": "Client not initialized"}
            
            # Make a simple test request with new API
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-001",
                contents="Hello, this is a test message. Please respond with 'API key is valid.'",
                config={
                    "max_output_tokens": 20,
                    "temperature": 0.1
                }
            )
            
            if response and response.text:
                return {
                    "valid": True,
                    "message": "API key is valid and Gemini AI is accessible",
                    "test_response": response.text
                }
            else:
                return {"valid": False, "message": "No response from Gemini AI"}
                
        except Exception as e:
            return {
                "valid": False,
                "message": f"API key validation failed: {str(e)}"
            }

def create_ai_analyzer(api_key: str) -> Optional[AIContentAnalyzer]:
    """
    Factory function to create an AI Content Analyzer
    
    Parameters
    ----------
    api_key : str
        Google AI Studio API key
        
    Returns
    -------
    Optional[AIContentAnalyzer]
        Initialized analyzer or None if creation failed
    """
    try:
        return AIContentAnalyzer(api_key)
    except Exception as e:
        logger.error(f"Failed to create AI analyzer: {e}")
        return None 