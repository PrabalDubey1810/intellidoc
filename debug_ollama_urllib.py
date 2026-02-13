import urllib.request
import json
import sys

# Default to the model causing issues
model_name = "qwen3-vl:4b"  # Default
if len(sys.argv) > 1:
    model_name = sys.argv[1]

# Strip 'ollama/' prefix
api_model = model_name.replace("ollama/", "")

print(f"Testing {api_model} with urllib...")

url = "http://localhost:11434/api/chat"
headers = {"Content-Type": "application/json"}
data = {
    "model": api_model,
    "messages": [{"role": "user", "content": "hi"}],
    "stream": True
}

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
    with urllib.request.urlopen(req) as response:
        print("Connection successful. Reading stream...")
        count = 0
        for line in response:
            if line:
                decoded_line = line.decode('utf-8').strip()
                if not decoded_line:
                    continue
                try:
                    json_obj = json.loads(decoded_line)
                    count += 1
                    if count <= 3:
                        print(f"DEBUG Chunk {count}: {json_obj}")
                    
                    if "message" in json_obj:
                         content = json_obj["message"].get("content", "")
                         if content:
                             print(content, end="", flush=True)
                    elif "response" in json_obj:
                         content = json_obj.get("response", "")
                         if content:
                             print(content, end="", flush=True)

                    if "error" in json_obj:
                         print(f"\nError in chunk: {json_obj['error']}")
                         
                except json.JSONDecodeError as e:
                    print(f"\nFailed to decode: {decoded_line} - {e}")
                
                if count > 20: # Limit output for debug
                    break

    print("\nStream finished.")

except Exception as e:
    print(f"\nRequest failed: {e}")
