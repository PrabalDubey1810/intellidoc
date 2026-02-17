from youtube_transcript_api import YouTubeTranscriptApi
import sys
# Try instance API
try:
    print("Testing instance API...")
    api = YouTubeTranscriptApi()
    res = api.fetch("fI_ruddnvmM")
    print(f"Fetched type: {type(res)}")
    print(f"Has snippets: {hasattr(res, 'snippets')}")
    if hasattr(res, 'snippets'):
        print(f"Snippet text: {res.snippets[0].text}")
    print("Instance API works.")
except Exception as e:
    print(f"Instance API failed: {e}")
