import streamlit as st
import litellm
import urllib.request

from pypdf import PdfReader
import auth
from gtts import gTTS
import io
import graphviz
import json
import extra_streamlit_components as stx
import youtube_utils
import slidesgpt_utils
import gemini_utils
import pptx_utils
import podcast_utils
import io

st.set_page_config(page_title="Chatbot - Powered by Open Source LLM")

# Cookie Manager
def get_manager():
    return stx.CookieManager()

cookie_manager = get_manager()

# Application Logic
from llm_utils import generate_response, MODEL_NAME

# -------- PDF TEXT EXTRACTION --------.v
def extract_pdf_text(uploaded_files):
    text = ""
    for uploaded_file in uploaded_files:
        try:
            reader = PdfReader(uploaded_file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            st.error(f"Error reading {uploaded_file.name}: {e}")
    return text


# -------- LLM RESPONSE --------
# Moved to llm_utils.py


# -------- AUTH & SESSION --------
auth.init_db()

if "user" not in st.session_state:
    st.session_state.user = None

if "messages" not in st.session_state:
    st.session_state.messages = []

if "pdf_context" not in st.session_state:
    st.session_state.pdf_context = ""

if "youtube_context" not in st.session_state:
    st.session_state.youtube_context = ""

if "youtube_messages" not in st.session_state:
    st.session_state.youtube_messages = []


def main_app():
    st.sidebar.title(f"Welcome, {st.session_state.user}")
    if st.sidebar.button("Logout"):
        st.session_state.user = None
        st.session_state.logout_clicked = True
        cookie_manager.delete("user_token")
        st.rerun()

    # Telegram Bot Link
    st.sidebar.markdown(
        """
        <a href="https://t.me/ComedyhackersBOT" target="_blank" style="text-decoration: none;">
            <div style="background-color: #0088cc; color: white; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
                <span style="font-size: 1.2rem;">🤖</span> Chat with Telegram Bot
            </div>
        </a>
        """,
        unsafe_allow_html=True
    )

    # Admin Panel
    if auth.is_admin(st.session_state.user):
        with st.sidebar.expander("Admin Panel"):
            st.write("### User Management")
            users = auth.get_all_users()
            for u in users:
                is_admin_text = " (Admin)" if u[1] else ""
                st.write(f"- {u[0]}{is_admin_text}")

    st.title("💬 Chatbot")
    st.caption("🚀 Streamlit chatbot powered by Ollama (Qwen3-VL 4B)")

    uploaded_pdfs = st.sidebar.file_uploader("Upload PDFs", type=["pdf"], accept_multiple_files=True)
    if uploaded_pdfs:
        pdf_text = extract_pdf_text(uploaded_pdfs)
        st.session_state.pdf_context = pdf_text
        st.sidebar.success(f"{len(uploaded_pdfs)} PDF(s) processed!")

    # Export Chat
    chat_str = "\n".join([f"{m['role']}: {m['content']}" for m in st.session_state.messages])
    st.sidebar.download_button("Download Chat", chat_str, file_name="chat_history.txt")

    # Interactive Features
    with st.sidebar.expander("Interactive Features"):
        feature_mode = st.radio("Select Mode", ["Chat", "Audio Summary", "Podcast", "Quiz", "Knowledge Graph", "Slide Deck", "YouTube Assistant"])

    if feature_mode == "Chat":
        for msg in st.session_state.messages:
            st.chat_message(msg["role"]).write(msg["content"])

        if prompt := st.chat_input("Ask something..."):
            st.session_state.messages.append({"role": "user", "content": prompt})
            st.chat_message("user").write(prompt)

            auth.save_message(st.session_state.user, "user", prompt)

            messages_for_llm = st.session_state.messages.copy()
            if st.session_state.pdf_context:
                messages_for_llm.insert(0, {"role": "system", "content": "You are an assistant answering questions based on the following PDF content:\n\n" + st.session_state.pdf_context})

            response = generate_response(messages_for_llm)
            st.session_state.messages.append({"role": "assistant", "content": response})
            st.chat_message("assistant").write(response)
            auth.save_message(st.session_state.user, "assistant", response)

    elif feature_mode == "Audio Summary":
        st.subheader("🔊 Audio Summary")
        if st.button("Generate Audio Summary"):
            if st.session_state.pdf_context:
                with st.spinner("Generating summary and audio..."):
                     # 1. Get Summary
                    messages = [{"role": "system", "content": "Summarize the following text in 3 sentences:"},
                                {"role": "user", "content": st.session_state.pdf_context[:5000]}] # Limit context for speed
                    summary = generate_response(messages)
                    st.write(summary)
                    
                    # 2. Convert to Audio
                    tts = gTTS(text=summary, lang='en')
                    audio_fp = io.BytesIO()
                    tts.write_to_fp(audio_fp)
                    st.audio(audio_fp, format='audio/mp3')
            else:
                st.warning("Please upload a PDF first.")

    elif feature_mode == "Podcast":
        st.subheader("🎙️ AI Podcast Studio")
        
        # Two-person animation CSS
        st.markdown("""
        <style>
        @keyframes talk-animation {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7); }
            50% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
        }
        .host-container {
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 20px;
            background-color: #f0f2f6;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        .host {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-size: cover;
            position: relative;
            border: 3px solid #4CAF50;
        }
        .host-1 {
            background-image: url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'); 
            animation: talk-animation 2s infinite ease-in-out;
        }
        .host-2 {
            background-image: url('https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka');
            animation: talk-animation 2s infinite ease-in-out 1s; /* Offset animation */
        }
        .host-label {
            text-align: center;
            margin-top: 10px;
            font-weight: bold;
            font-size: 0.9rem;
        }
        </style>
        
        <div class="host-container">
            <div>
                <div class="host host-1"></div>
                <div class="host-label">Host 1 (US)</div>
            </div>
            <div style="font-size: 2rem;">🎙️</div>
            <div>
                <div class="host host-2"></div>
                <div class="host-label">Host 2 (UK)</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if st.button("Generate Podcast"):
            if st.session_state.pdf_context:
                with st.spinner("Writing script & Recording audio (this may take a minute)..."):
                    
                    # 1. Generate Script (Using MiniMax via llm_utils)
                    script_data = podcast_utils.generate_podcast_script(st.session_state.pdf_context)
                    
                    if isinstance(script_data, list) and len(script_data) > 0:
                        if script_data[0].get("speaker") == "System":
                            st.error(script_data[0].get("text"))
                        else:
                            st.session_state.podcast_script = script_data
                            
                            # 2. Generate Audio
                            audio_file = podcast_utils.generate_podcast_audio(script_data)
                            st.session_state.podcast_audio = audio_file
                            
                            st.success("Podcast generated successfully!")
                    else:
                        st.error("Failed to generate valid script.")
                        st.write(script_data)
            else:
                st.warning("Please upload a PDF first.")

        # Display Results
        if "podcast_audio" in st.session_state:
            st.audio(st.session_state.podcast_audio, format='audio/mp3')
            
        if "podcast_script" in st.session_state:
            with st.expander("View Script"):
                for line in st.session_state.podcast_script:
                    speaker = line.get('speaker', 'Unknown')
                    text = line.get('text', '')
                    st.markdown(f"**{speaker}**: {text}")

    elif feature_mode == "Quiz":
        st.subheader("📝 PDF Quiz")
        if st.button("Generate Quiz"):
             if st.session_state.pdf_context:
                with st.spinner("Generating quiz..."):
                    prompt = f"""Generate 3 multiple-choice questions based on the text. 
                    Return ONLY raw JSON (no markdown formatting) in this format:
                    [
                        {{
                            "question": "Question text?", 
                            "options": ["Option 1", "Option 2", "Option 3", "Option 4"], 
                            "answer": "Option 2"
                        }},
                        ...
                    ]
                    IMPORTANT: The 'answer' field MUST be an EXACT string match to one of the items in the 'options' list. Do not use letters like A, B, C, D unless they are part of the option text.
                    Text: {st.session_state.pdf_context[:3000]}"""
                    
                    messages = [{"role": "user", "content": prompt}]
                    response = generate_response(messages)
                    try:
                        # Clean up potentially markdown-wrapped json
                        cleaned_response = response.replace("```json", "").replace("```", "").strip()
                        st.session_state.quiz_data = json.loads(cleaned_response)
                        st.session_state.quiz_score = 0
                    except Exception as e:
                        st.error(f"Failed to parse quiz JSON: {e}")
                        st.write("Raw response:", response)

        if "quiz_data" in st.session_state:
             with st.form("quiz_form"):
                score = 0
                for i, q in enumerate(st.session_state.quiz_data):
                    st.write(f"**Q{i+1}: {q['question']}**")
                    user_answer = st.radio(f"Select answer for Q{i+1}", q['options'], key=f"q_{i}")
                    if user_answer == q['answer']:
                        score += 1
                
                if st.form_submit_button("Submit"):
                    st.success(f"You scored {score}/{len(st.session_state.quiz_data)}")

    elif feature_mode == "Knowledge Graph":
        st.subheader("🕸️ Knowledge Graph")
        if st.button("Generate Graph"):
             if st.session_state.pdf_context:
                with st.spinner("Analyzing text..."):
                    prompt = f"""Extract top 5 relationships from the text.
                    Return ONLY raw JSON (no markdown) in this format:
                    [
                        {{"source": "Entity1", "target": "Entity2", "label": "relationship"}},
                        ...
                    ]
                    Text: {st.session_state.pdf_context[:3000]}"""
                    
                    messages = [{"role": "user", "content": prompt}]
                    response = generate_response(messages)
                    
                    try:
                        cleaned_response = response.replace("```json", "").replace("```", "").strip()
                        rels = json.loads(cleaned_response)
                        
                        graph = graphviz.Digraph()
                        for r in rels:
                            graph.edge(r['source'], r['target'], label=r['label'])
                        
                        st.graphviz_chart(graph)
                    except Exception as e:
                         st.error(f"Failed to generate graph: {e}")
                         st.write("Raw response:", response)

    elif feature_mode == "Slide Deck":
        st.subheader("📽️ Smart Slide Deck (via Google Gemini)")
        
        # API Key (Hardcoded as requested)
        api_key = ""
        
        if st.button("Generate Slides"):
             if st.session_state.pdf_context:
                with st.spinner("Analyzing text & Designing slides..."):
                    
                    # 1. Get structured content from Gemini
                    slides_data = gemini_utils.generate_slide_content(st.session_state.pdf_context, api_key)
                    
                    if isinstance(slides_data, dict) and "error" in slides_data:
                        st.error(f"Gemini API Error: {slides_data['error']}")
                    else:
                        try:
                            # 2. Build PPTX locally with Styling
                            prs = pptx_utils.create_styled_presentation(slides_data)
                            
                            binary_output = io.BytesIO()
                            prs.save(binary_output)
                            
                            st.success("✅ Designer Slides generated successfully!")
                            st.download_button(
                                label="Download Designer PowerPoint (.pptx)",
                                data=binary_output.getvalue(),
                                file_name="gemini_designer_presentation.pptx",
                                mime="application/vnd.openxmlformats-officedocument.presentationml.presentation"
                            )
                            
                            # Preview Content
                            with st.expander("Preview Slide Content"):
                                st.json(slides_data)
                                
                        except Exception as e:
                             st.error(f"Failed to build PPTX file: {e}")

             else:
                 st.warning("Please upload a PDF first to generate content.")






    elif feature_mode == "YouTube Assistant":
        st.subheader("📺 YouTube Assistant")
        
        youtube_url = st.text_input("Enter YouTube URL")
        
        if st.button("Process Video"):
            if youtube_url:
                video_id = youtube_utils.extract_video_id(youtube_url)
                if video_id:
                    with st.spinner("Fetching transcript..."):
                        transcript = youtube_utils.get_transcript_text(video_id)
                        if "Error" not in transcript:
                            st.session_state.youtube_context = transcript
                            st.session_state.youtube_messages = [] # Reset chat on new video
                            st.success("Transcript fetched successfully!")
                            
                            # Generate Summary
                            with st.spinner("Generating summary..."):
                                messages = [
                                    {"role": "system", "content": "Summarize this video transcript in 5 concise bullet points."},
                                    {"role": "user", "content": transcript[:10000]} # Limit context
                                ]
                                st.session_state.youtube_summary = generate_response(messages)
                        else:
                            st.error(f"Could not retrieve transcript. The video might not have captions enabled. ({transcript})")
                else:
                    st.error("Invalid YouTube URL")
        
        # Display Summary
        if st.session_state.get("youtube_summary"):
            st.write("### Video Summary")
            st.write(st.session_state.youtube_summary)

        # Chat Interface for YouTube
        if st.session_state.get("youtube_context"):
            st.divider()
            st.subheader("💬 Chat with Video")
            
            for msg in st.session_state.youtube_messages:
                st.chat_message(msg["role"]).write(msg["content"])

            if prompt := st.chat_input("Ask about the video..."):
                st.session_state.youtube_messages.append({"role": "user", "content": prompt})
                st.chat_message("user").write(prompt)
                
                # Generate Answer
                messages = [
                    {"role": "system", "content": f"You are a helpful assistant answering questions based on the following video transcript:\n\n{st.session_state.youtube_context[:15000]}"}
                ]
                # Filter out messages that might have "system" role if any (though we only append user/assistant)
                chat_history = [{"role": m["role"], "content": m["content"]} for m in st.session_state.youtube_messages]
                messages.extend(chat_history)
                
                response = generate_response(messages)
                st.session_state.youtube_messages.append({"role": "assistant", "content": response})
                st.chat_message("assistant").write(response)


def login_page():
    st.markdown("<h1 style='text-align: center; margin-bottom: 2rem;'>👋 Welcome Back</h1>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.subheader("Login to your account")
        username = st.text_input("Username", key="login_user")
        password = st.text_input("Password", type="password", key="login_pass")
        
        if st.button("Login", use_container_width=True):
            if auth.authenticate_user(username, password):
                st.session_state.user = username
                st.session_state.logout_clicked = False
                cookie_manager.set("user_token", username)
                history = auth.get_chat_history(username)
                if history:
                    st.session_state.messages = history
                else:
                     st.session_state.messages = [{"role": "assistant", "content": "Hi! You can chat with me or upload a PDF 📄"}]
                st.rerun()
            else:
                st.error("Invalid username or password")


def register_page():
    st.markdown("<h1 style='text-align: center; margin-bottom: 2rem;'>🚀 Create Account</h1>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.subheader("Join IntelliDoc AI")
        username = st.text_input("New Username", key="reg_user")
        password = st.text_input("New Password", type="password", key="reg_pass")
        
        if st.button("Register", use_container_width=True):
            if auth.register_user(username, password):
                st.success("Registration successful! Please login.")
            else:
                st.error("Username already exists")


# Check for existing session
cookies = cookie_manager.get_all()
token = cookies.get("user_token")

if not st.session_state.user and token:
    if st.session_state.get("logout_clicked"):
        # User just logged out, ignoring the lingering cookie
        # Try deleting it again to be sure
        cookie_manager.delete("user_token")
    else:
        # Valid auto-login
        username = token
        st.session_state.user = username
        history = auth.get_chat_history(username)
        if history:
            st.session_state.messages = history
        else:
            st.session_state.messages = [{"role": "assistant", "content": "Hi! You can chat with me or upload a PDF 📄"}]


if st.session_state.user:
    main_app()
else:
    # Hero Section
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0;">
        <h1 style="font-size: 3rem;">
            IntelliDoc AI
        </h1>
        <p style="font-size: 1.2rem; opacity: 0.8;">
            Your Advanced Document Assistant. Chat, Analyze, Visualize.
        </p>
    </div>
    """, unsafe_allow_html=True)

    tab1, tab2 = st.tabs(["Login", "Register"])
    with tab1:
        login_page()
    with tab2:
        register_page()
