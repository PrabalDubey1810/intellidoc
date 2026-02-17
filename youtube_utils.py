import re
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url):
    """
    Extracts the video ID from a YouTube URL.
    Supports various formats:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    """
    # Regex for extracting the video ID
    # Matches 11 character ID after v= or /
    regex = r"(?:v=|\/)([0-9A-Za-z_-]{11})"
    match = re.search(regex, url)
    if match:
        return match.group(1)
    return None

def get_transcript_text(video_id):
    """
    Fetches the transcript for a given video ID and returns it as a single string.
    Handles both standard static API and instance-based API variants.
    """
    try:
        # Check if using standard API (static method)
        if hasattr(YouTubeTranscriptApi, 'get_transcript'):
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            # Standard API returns a list of dictionaries
            # Each item has 'text', 'start', 'duration'
            return " ".join([item['text'] for item in transcript_list])
            
        else:
            # Fallback to instance-based API (found in current environment v1.2.4?)
            api = YouTubeTranscriptApi()
            # The fetch method returns a FetchedTranscript object
            fetched_transcript = api.fetch(video_id)
            
            if hasattr(fetched_transcript, 'snippets'):
                return " ".join([snippet.text for snippet in fetched_transcript.snippets])
            
            # Additional fallback if structure is different
            return f"Error: Unexpected transcript format: {type(fetched_transcript)}"

    except Exception as e:
        return f"Error retrieving transcript: {str(e)}"
