from youtube_transcript_api import YouTubeTranscriptApi
import sys

print(f"Version testing...")

try:
    # Try the 'new/weird' API
    api = YouTubeTranscriptApi()
    print("Instance created successfully")
    if hasattr(api, 'fetch'):
        print("Has fetch method")
    else:
        print("No fetch method")
        
except Exception as e:
    print(f"Instantiation failed: {e}")

try:
    # Try the 'old/standard' API
    YouTubeTranscriptApi.get_transcript('123')
except Exception as e:
    print(f"Static get_transcript failed: {e}")
