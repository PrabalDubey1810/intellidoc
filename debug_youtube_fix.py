from youtube_transcript_api import YouTubeTranscriptApi
import youtube_utils

print("Testing direct import:")
try:
    print(f"Attr: {hasattr(YouTubeTranscriptApi, 'get_transcript')}")
except Exception as e:
    print(e)

url = "https://youtu.be/fI_ruddnvmM?si=z-g-vnamaMWC2HYHnscript"
print(f"\nTesting URL: {url}")

vid = youtube_utils.extract_video_id(url)
print(f"Extracted ID: {vid}")

print("\nFetching transcript...")
transcript = youtube_utils.get_transcript_text(vid)
print(f"Result len: {len(transcript)}")
if "Error" in transcript:
    print(transcript)
else:
    print("Success!")
