import os
import json
import requests
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
api_key = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-2.5-flash"
# Configure genai for the main agent
genai.configure(api_key=api_key)

def get_stock_price(symbol: str) -> str:
    """Gets the current stock price for a given symbol."""
    prices = {"AAPL": "190.25", "MSFT": "415.50", "GOOGL": "145.30", "AMZN": "175.10", "NVDA": "825.40"}
    price = prices.get(symbol.upper(), "150.00")
    return f"The current price of {symbol.upper()} is ${price}."

def search_product_price(product_name: str) -> str:
    """Searches for the price of a product online (Mock)."""
    if "iphone" in product_name.lower(): return "Found iPhone 15 Pro for $999 at Apple Store."
    return f"Average price for {product_name} is around $50.00."

def google_search(query: str) -> str:
    """
    Performs a real Google search using Gemini's built-in grounding in a separate call.
    This provides exact and up-to-date results.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{"parts": [{"text": f"Search and summarize: {query}"}]}],
        "tools": [{"google_search": {}}], # Only google_search tool here
        "generationConfig": {"temperature": 0.0}
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            return f"Error performing search: {response.status_code}"
            
        res_data = response.json()
        candidate = res_data["candidates"][0]
        text = "".join([p.get("text", "") for p in candidate["content"]["parts"]])
        
        # Optionally add source info if available
        if "groundingMetadata" in candidate:
            meta = candidate["groundingMetadata"]
            if "searchEntryPoint" in meta:
                text += f"\n\nSources: {meta['searchEntryPoint'].get('renderedContent', '')}"
                
        return text if text else "No search results found."
    except Exception as e:
        return f"Search exception: {str(e)}"

# Define tools for the main agent
tools = [
    {
        "function_declarations": [
            {
                "name": "get_stock_price",
                "description": "Get the current stock price for a company",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {"symbol": {"type": "STRING", "description": "The stock symbol, e.g. AAPL"}},
                    "required": ["symbol"]
                }
            },
            {
                "name": "search_product_price",
                "description": "Search for the price of a product",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {"product_name": {"type": "STRING", "description": "The name of the product"}},
                    "required": ["product_name"]
                }
            },
            {
                "name": "google_search",
                "description": "Perform a real Google search to find exact, real-time results for any query",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {"query": {"type": "STRING", "description": "The search query"}},
                    "required": ["query"]
                }
            }
        ]
    }
]

def run_agent_task(task_description: str):
    """
    Runs an autonomous agent loop using Gemini SDK for tool calling.
    """
    try:
        model = genai.GenerativeModel(MODEL_NAME, tools=tools)
        chat = model.start_chat()
        
        system_instruction = "You are an autonomous AI agent. Use your tools sequentially to solve tasks. Use google_search for any real-time or factual research."
        yield {"type": "thought", "content": f"Starting task: {task_description}"}
        
        response = chat.send_message(f"{system_instruction}\nTask: {task_description}")
        
        for _ in range(5):
            if response.parts:
                for part in response.parts:
                    if part.text:
                        yield {"type": "thought", "content": part.text}
            
            function_calls = [part.function_call for part in response.parts if part.function_call]
            if not function_calls:
                break
                
            tool_responses = []
            for func_call in function_calls:
                name = func_call.name
                args = {k: v for k, v in func_call.args.items()}
                
                yield {"type": "action", "content": f"Calling tool {name} with args {args}..."}
                
                if name == "get_stock_price": result = get_stock_price(**args)
                elif name == "search_product_price": result = search_product_price(**args)
                elif name == "google_search": result = google_search(**args)
                else: result = f"Error: Tool {name} not found."
                
                yield {"type": "result", "content": result}
                
                tool_responses.append({
                    "function_response": {
                        "name": name,
                        "response": {"result": result}
                    }
                })
            
            response = chat.send_message(tool_responses)
            
        yield {"type": "final", "content": response.text if response.text else "Task complete."}
        
    except Exception as e:
        yield {"type": "error", "content": f"Agent error: {str(e)}"}
