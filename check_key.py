import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [{"parts": [{"text": "Hi"}]}]
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    if response.status_code == 200:
        print("SUCCESS: The API key is working.")
        print("Response:", response.json())
    else:
        print(f"FAILED: Status Code {response.status_code}")
        print("Error Details:", response.text)
except Exception as e:
    print(f"ERROR: {str(e)}")
