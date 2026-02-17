import requests
import json
import time

# Based on search results
API_BASE_URL = "https://api.slidesgpt.com/v1"

def generate_slides(prompt, api_key):
    """
    Generates slides using SlidesGPT API.
    """
    if not api_key:
        return {"error": "API Key is required"}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {"prompt": prompt}
    
    try:
        # POST /presentations/generate
        # It seems the endpoint is /presentations/generate or similar
        # Let's try the one found in search results: https://api.slidesgpt.com/v1/presentations/generate
        url = f"{API_BASE_URL}/presentations/generate"
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            return response.json() # Should contain 'download' URL directly or task ID
        else:
             return {"error": f"API Error ({response.status_code}): {response.text}"}
            
    except Exception as e:
        return {"error": str(e)}
