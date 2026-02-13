import requests
import json
import sys

# Default to the model causing issues
model = "ollama/minimax-m2:cloud"
if len(sys.argv) > 1:
    model = sys.argv[1]

# Strip 'ollama/' prefix if present for the actual API call
api_model = model.replace("ollama/", "")

print(f"Testing {api_model} with requests...")

url = "http://localhost:11434/api/chat"
payload = {
    "model": api_model,
    "messages": [{"role": "user", "content": "hi"}],
    "stream": True
}

try:
    with requests.post(url, json=payload, stream=True) as r:
        r.raise_for_status()
        print("Connection successful. Reading stream...")
        for line in r.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                try:
                    json_obj = json.loads(decoded_line)
                    # print(f"Chunk: {json_obj}")
                    if "message" in json_obj:
                        content = json_obj["message"].get("content", "")
                        print(f"Content: {content}", end="", flush=True)
                    if "error" in json_obj:
                         print(f"\nError in chunk: {json_obj['error']}")
                except json.JSONDecodeError:
                    print(f"\nFailed to decode: {decoded_line}")
    print("\nStream finished.")

except Exception as e:
    print(f"\nRequest failed: {e}")
