from llm_utils import generate_response
import json
from gtts import gTTS
import io

def generate_podcast_script(text_context):
    """
    Generates a podcast script between two hosts using MiniMax (via llm_utils).
    Returns a list of dicts: {"speaker": "Host 1", "text": "..."}
    """
    try:
        prompt = f"""
        You are a podcast producer. Create a lively, engaging conversation script between two hosts (Host 1 and Host 2) 
        discussing the key points of the following text.
        
        - Host 1: Enthusiastic, introduces topics.
        - Host 2: Analytical, asks questions or adds depth.
        - Keep it to about 10-15 total exchanges.
        - Make it sound natural, not robotic.
        
        Return ONLY a raw JSON array of objects (no markdown, no ```json wrapper).
        Format:
        [
            {{"speaker": "Host 1", "text": "Welcome back..."}},
            {{"speaker": "Host 2", "text": "Thanks..."}}
        ]
        
        Text to discuss:
        {text_context[:10000]}
        """
        
        messages = [{"role": "user", "content": prompt}]
        
        # Use existing llm_utils which is configured for MiniMax by default
        response_text = generate_response(messages)
        
        # Cleanup response just in case
        clean_text = response_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
        
    except Exception as e:
        return [{"speaker": "System", "text": f"Error generating script: {str(e)}"}]

def generate_podcast_audio(script):
    """
    Generates a combined audio file from the script using gTTS.
    """
    combined_audio = io.BytesIO()
    
    for line in script:
        text = line.get("text", "")
        speaker = line.get("speaker", "Host 1")
        
        try:
            if "Host 1" in speaker:
                tts = gTTS(text=text, lang='en', tld='us')
            else:
                tts = gTTS(text=text, lang='en', tld='co.uk')
                
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            combined_audio.write(fp.read())
            
        except Exception as e:
            print(f"Error generating audio for line: {e}")
            continue
            
    combined_audio.seek(0)
    return combined_audio
