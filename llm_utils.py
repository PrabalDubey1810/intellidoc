import urllib.request
import json
import os

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "ollama/minimax-m2:cloud")

def generate_response(messages, model_name=None):
    """
    Generates a response from the LLM using the Ollama API.
    
    Args:
        messages (list): A list of message dictionaries (role, content).
        model_name (str, optional): Overrides the default model name.
        
    Returns:
        str: The complete response text from the LLM.
    """
    full_response = ""
    
    # Use provided model or default
    target_model = model_name or MODEL_NAME
    
    # Strip 'ollama/' prefix if present, as Ollama API expects just the model name
    api_model = target_model.replace("ollama/", "")
    
    url = f"{OLLAMA_BASE_URL}/api/chat"
    headers = {"Content-Type": "application/json"}
    data = {
        "model": api_model,
        "messages": messages,
        "stream": True
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
        with urllib.request.urlopen(req) as response:
            for line in response:
                if line:
                    decoded_line = line.decode('utf-8').strip()
                    if not decoded_line:
                        continue
                    try:
                        json_obj = json.loads(decoded_line)
                        if "message" in json_obj:
                            content = json_obj["message"].get("content", "")
                            if content:
                                full_response += content
                        # Ignore 'thinking' field or empty content
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        # In a real app, use logging
        return f"Error communicating with LLM: {str(e)}"

    return full_response
