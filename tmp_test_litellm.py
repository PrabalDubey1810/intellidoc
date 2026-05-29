import litellm
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    print("Testing completion...")
    response = litellm.completion(
        model="gemini/gemini-2.5-flash",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("Success:", response.choices[0].message.content)
except Exception as e:
    print("Error:", e)
