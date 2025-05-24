"""
AI Content Analysis Service

This module provides AI-powered content analysis using Google's Gemini AI
to automatically suggest whether content is AI-generated or human-created,
along with relevant indicators and confidence scores. It pre-selects
appropriate indicators based on comprehensive analysis criteria.
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
from config import get_config

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
    
    def analyze_content_with_ai(self, content_data: Dict[str, Any], url: str = None) -> Dict[str, Any]:
        """
        Analyze content using Gemini AI to determine if it's AI-generated or human-created
        
        Parameters
        ----------
        content_data : Dict[str, Any]
            Dictionary containing content data from extract_content_from_url
        url : str, optional
            Original URL for fallback analysis when content extraction fails
            
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
        
        # If content extraction failed, try URL-based analysis
        if content_data.get('error') or not content_data.get('content_text') or content_data.get('word_count', 0) < 50:
            if url:
                return self._analyze_url_based_fallback(url, content_data.get('error', 'Insufficient content'))
            else:
                return self._create_error_response(f"Cannot analyze due to content extraction error: {content_data.get('error', 'Insufficient content')}")
        
        
        try:
            # Create a comprehensive prompt for content analysis
            analysis_prompt = self._create_analysis_prompt(content_data)
            
            # Generate content analysis using Gemini with new API
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-001",
                contents=analysis_prompt,
                config={
                    "temperature": 0.1,  # Low temperature for consistent analysis
                     "max_output_tokens": 2000,
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
                                "items": {"type": "string"},
                                "description": "Array of AI indicator IDs (e.g., ai-1, ai-5, ai-12)"
                            },
                            "human_indicators": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Array of human indicator IDs (e.g., h-1, h-7, h-15)"
                            },
                            "reasoning": {"type": "string"},
                            "detected_patterns": {"type": "string"}
                        },
                        "required": ["classification", "confidence_score", "ai_indicators", "human_indicators", "reasoning", "detected_patterns"]
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
        Create a comprehensive prompt for AI content analysis using indicators from config
        
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
        
        # Load indicators from configuration
        config = get_config()
        ai_indicators = config.get('labeling', {}).get('ai_indicators', [])
        human_indicators = config.get('labeling', {}).get('human_indicators', [])
        
        # Format AI indicators for the prompt
        ai_indicators_text = "\n".join([
            f"- {indicator['id']}: {indicator['label']} (Category: {indicator.get('category', 'general')})"
            for indicator in ai_indicators
        ])
        
        # Format Human indicators for the prompt
        human_indicators_text = "\n".join([
            f"- {indicator['id']}: {indicator['label']} (Category: {indicator.get('category', 'general')})"
            for indicator in human_indicators
        ])
        
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
3. Select specific AI indicator IDs that apply (return exact IDs from the list below)
4. Select specific human indicator IDs that apply (return exact IDs from the list below)
5. Provide reasoning for your classification

AI INDICATORS TO EVALUATE (return matching IDs):
{ai_indicators_text}

HUMAN INDICATORS TO EVALUATE (return matching IDs):
{human_indicators_text}

INSTRUCTIONS:
- Carefully analyze the content against each indicator
- Return ONLY the IDs (e.g., "ai-1", "h-5") of indicators that are clearly present
- Be selective - only include indicators with strong evidence
- For categories like "visual_media", note that you cannot analyze images, so skip those unless mentioned in text
- Focus on textual content, structure, and metadata analysis

Return your analysis in valid JSON format with the following structure:
{{
  "classification": "ai_generated|human_created|uncertain",
  "confidence_score": 0-100,
  "ai_indicators": ["ai-1", "ai-3", "ai-7"],
  "human_indicators": ["h-2", "h-5"],
  "reasoning": "Detailed explanation of your analysis and decision",
  "detected_patterns": "Summary of key patterns that influenced the classification"
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
    
    def _analyze_url_based_fallback(self, url: str, error_reason: str) -> Dict[str, Any]:
        """
        Perform URL-based analysis when content extraction fails
        
        Parameters
        ----------
        url : str
            The URL to analyze
        error_reason : str
            The reason why content extraction failed
            
        Returns
        -------
        Dict[str, Any]
            Analysis results based on URL patterns
        """
        try:
            # Load indicators from configuration
            config = get_config()
            ai_indicators = config.get('labeling', {}).get('ai_indicators', [])
            
            # Analyze URL patterns for common AI content indicators
            detected_ai_indicators = []
            detected_human_indicators = []
            classification = "uncertain"
            confidence_score = 30
            reasoning = f"Content extraction failed ({error_reason}). Analysis based on URL structure and domain patterns."
            
            # Check for suspicious URL patterns that might indicate AI content
            url_lower = url.lower()
            
            # Check for generic/formulaic URL structures
            if any(pattern in url_lower for pattern in ['coupon-code', 'welcome-home', 'best-', 'top-', 'how-to-']):
                detected_ai_indicators.extend(['ai-4', 'ai-5'])  # Structured & formulaic content
                confidence_score = 45
                reasoning += " URL contains formulaic patterns common in AI-generated content sites."
            
            # Check for suspicious domains
            if any(pattern in url_lower for pattern in ['.co.id', 'inews', 'suara']):
                # Could be subdomain mimicking or inconsistent branding
                detected_ai_indicators.append('ai-17')  # Subdomain mimicking
                confidence_score = 40
                reasoning += " Domain structure suggests potential content farm or AI-generated site."
            
            # Check for 404 errors specifically
            if '404' in error_reason or 'not found' in error_reason.lower():
                detected_ai_indicators.extend(['ai-8', 'ai-9'])  # Broken/misleading links
                classification = "ai_generated"
                confidence_score = 60
                reasoning += " 404 errors and broken links are common indicators of AI-generated content sites with poor maintenance."
            
            # If we detected multiple AI indicators, lean towards AI classification
            if len(detected_ai_indicators) >= 2:
                classification = "ai_generated"
                confidence_score = max(confidence_score, 55)
            
            return {
                "classification": classification,
                "confidence_score": confidence_score,
                "ai_indicators": detected_ai_indicators,
                "human_indicators": detected_human_indicators,
                "reasoning": reasoning,
                "detected_patterns": f"URL-based analysis due to content extraction failure. Detected {len(detected_ai_indicators)} AI indicators.",
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "model_used": "gemini-2.0-flash-001-fallback",
                "fallback_analysis": True
            }
            
        except Exception as e:
            logger.error(f"Fallback URL analysis failed: {e}")
            return self._create_error_response(f"Both content extraction and URL analysis failed: {error_reason}")

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
        
        # Analyze with AI, passing the URL for fallback analysis
        ai_analysis = self.analyze_content_with_ai(content_data, url)
        
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