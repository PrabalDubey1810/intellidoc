import google.generativeai as genai
import os
import json

def generate_slide_content(text_context, api_key, num_slides=5):
    """
    Generates structured JSON content for slides using Google Gemini.
    """
    try:
        genai.configure(api_key=api_key)
        
        # Use a model that supports JSON mode or is good at following instructions
        # "gemini-2.5-flash" is fast and cost-effective, good for this.
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are an expert presentation designer. 
        Create a {num_slides}-slide presentation based on the following text.
        
        Return the output as a JSON array of objects. 
        Each object must have:
        - "title": string (Slide title)
        - "bullets": array of strings (3-5 bullet points per slide)
        - "speaker_notes": string (Brief speaker notes)
        
        Do not include markdown formatting like ```json ... ```. Just return the raw JSON array.
        
        Text to process:
        {text_context[:10000]}
        """
        
        response = model.generate_content(prompt)
        
        # simple cleanup in case it returns markdown
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(clean_text)
        
    except Exception as e:
        return {"error": str(e)}
