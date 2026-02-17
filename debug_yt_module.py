import sys
print(f"Python: {sys.executable}")
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    print(f"Module file: {YouTubeTranscriptApi.__file__}")
    print("Attributes:")
    print(dir(YouTubeTranscriptApi))
except Exception as e:
    print(e)
