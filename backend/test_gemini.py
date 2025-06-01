#!/usr/bin/env python3
"""
Test script for Gemini AI integration
"""

import sys
import os
from pathlib import Path

# Add the src directory to the Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

def test_gemini_import():
    """Test if we can import the Google GenAI library"""
    try:
        from google import genai
        from google.genai import types
        print("✅ Successfully imported google.genai")
        return True
    except ImportError as e:
        print(f"❌ Failed to import google.genai: {e}")
        return False

def test_gemini_client_creation():
    """Test creating a Gemini client with a dummy API key"""
    try:
        from google import genai
        client = genai.Client(api_key="dummy_key_for_testing")
        print("✅ Successfully created Gemini client")
        return client
    except Exception as e:
        print(f"❌ Failed to create Gemini client: {e}")
        return None

def test_ai_service_import():
    """Test importing the AI service"""
    try:
        from ai_service import AIContentAnalyzer, create_ai_analyzer
        print("✅ Successfully imported AI service")
        return True
    except ImportError as e:
        print(f"❌ Failed to import AI service: {e}")
        return False

def test_with_real_api_key():
    """Test with a real API key if provided via environment variable"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ℹ️  No GEMINI_API_KEY environment variable found, skipping real API test")
        print("   To test with a real API key, set: export GEMINI_API_KEY=your_key_here")
        return
    
    try:
        from ai_service import create_ai_analyzer
        analyzer = create_ai_analyzer(api_key)
        if analyzer:
            result = analyzer.validate_api_key()
            print(f"✅ API key validation result: {result}")
        else:
            print("❌ Failed to create AI analyzer")
    except Exception as e:
        print(f"❌ Error testing real API key: {e}")

def main():
    print("🔍 Testing Gemini AI Integration")
    print("=" * 40)
    
    # Test imports
    if not test_gemini_import():
        return
    
    if not test_ai_service_import():
        return
    
    # Test client creation
    client = test_gemini_client_creation()
    if not client:
        return
    
    # Test with real API key
    test_with_real_api_key()
    
    print("\n🎉 Basic tests completed!")
    print("If you're still having issues, try setting a real API key:")
    print("export GEMINI_API_KEY=your_key_here")
    print("docker-compose exec backend poetry run python test_gemini.py")

if __name__ == "__main__":
    main() 