"""Test GROQ API connection"""
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key loaded: {api_key[:20]}..." if api_key else "API Key not found!")

try:
    client = Groq(api_key=api_key)
    print("Client initialized successfully")
    
    # Try different models - llama-3.1-70b-versatile is decommissioned
    models_to_try = [
        "llama-3.3-70b-versatile",  # Latest Llama 3.3
        "llama-3.1-8b-instant",      # Fallback to 8b
        "mixtral-8x7b-32768"         # Alternative
    ]
    
    for model in models_to_try:
        try:
            print(f"Trying model: {model}")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say hello"}
                ],
                temperature=0.3,
                max_tokens=50
            )
            print(f"✓ Model {model} works!")
            print(f"Response: {response.choices[0].message.content}")
            break
        except Exception as e:
            print(f"✗ Model {model} failed: {str(e)[:100]}")
            continue
    
    print("✓ GROQ API is working!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
