import sys
from youtube_transcript_api import YouTubeTranscriptApi
print(f"Type: {type(YouTubeTranscriptApi)}")
print(f"Dir: {dir(YouTubeTranscriptApi)}")
try:
    print(f"get_transcript: {YouTubeTranscriptApi.get_transcript}")
except AttributeError:
    print("get_transcript not found")
