from youtube_transcript_api import YouTubeTranscriptApi
import sys

vid = "fI_ruddnvmM" # Sample ID
log = open("debug_yt_log.txt", "w", encoding="utf-8")

try:
    log.write(f"Fetching for {vid}...\n")
    api = YouTubeTranscriptApi()
    transcript_obj = api.fetch(vid)
    log.write(f"Type: {type(transcript_obj)}\n")
    log.write(f"Content: {str(transcript_obj)[:500]}\n") # Truncate for safety
except Exception as e:
    log.write(f"Error: {e}\n")

log.close()
