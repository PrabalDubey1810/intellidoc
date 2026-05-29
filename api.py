from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
import io
import base64

import auth
import gemini_utils
import pptx_utils
import youtube_utils
import podcast_utils
from llm_utils import generate_response, MODEL_NAME
from pypdf import PdfReader

app = Flask(__name__, static_folder="frontend", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "intellidoc-secret-key-2026")
CORS(app, supports_credentials=True)

auth.init_db()

# ── Serve Frontend ──────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory("frontend", "index.html")

# ── Auth ────────────────────────────────────────────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")
    if auth.authenticate_user(username, password):
        session["user"] = username
        history = auth.get_chat_history(username)
        return jsonify({"success": True, "username": username, "history": history, "is_admin": bool(auth.is_admin(username))})
    return jsonify({"success": False, "error": "Invalid username or password"}), 401


@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400
    if auth.register_user(username, password):
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Username already exists"}), 409


@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"success": True})


@app.route("/api/me")
def me():
    user = session.get("user")
    if user:
        history = auth.get_chat_history(user)
        return jsonify({"username": user, "is_admin": bool(auth.is_admin(user)), "history": history})
    return jsonify({"username": None}), 401


@app.route("/api/history")
def history():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"history": auth.get_chat_history(user)})


@app.route("/api/history", methods=["DELETE"])
def clear_history():
    """Clear all chat history for the logged-in user."""
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    import sqlite3
    conn = sqlite3.connect(auth.DB_NAME)
    conn.execute("DELETE FROM chats WHERE username = ?", (user,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ── Chat ────────────────────────────────────────────────────────────────────
MODELS = {
    "offline": "qwen3-vl:4b",           # local Ollama model
    "online":  "minimax-m2:cloud",      # MiniMax cloud via Ollama
}

@app.route("/api/chat", methods=["POST"])
def chat():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data        = request.json
    messages    = data.get("messages", [])
    pdf_context = data.get("pdf_context", "")
    model_key   = data.get("model", "online")          # "offline" | "online"
    model_name  = MODELS.get(model_key, MODELS["online"])

    messages_for_llm = messages.copy()
    if pdf_context:
        messages_for_llm.insert(0, {
            "role": "system",
            "content": "You are an assistant answering questions based on the following PDF content:\n\n" + pdf_context
        })

    response = generate_response(messages_for_llm, model_name=model_name)
    auth.save_message(user, "user", messages[-1]["content"] if messages else "")
    auth.save_message(user, "assistant", response)
    return jsonify({"response": response, "model": model_name})


@app.route("/api/models")
def list_models():
    """Return available model options."""
    return jsonify({"models": [
        {"key": "online",  "label": "MiniMax Cloud",  "description": "Online · Fast · Powerful", "icon": "🌐"},
        {"key": "offline", "label": "Qwen3-VL 4B",    "description": "Offline · Local · Private",  "icon": "🖥️"},
    ]})



# ── PDF Upload ──────────────────────────────────────────────────────────────
@app.route("/api/upload-pdf", methods=["POST"])
def upload_pdf():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    files = request.files.getlist("files")
    saved_pdfs = []
    
    for f in files:
        try:
            reader = PdfReader(f)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            pdf_id = auth.save_user_pdf(user, f.filename, text)
            saved_pdfs.append({
                "id": pdf_id,
                "filename": f.filename,
                "content": text
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"pdfs": saved_pdfs})


# ── Active PDF Session Management ───────────────────────────────────────────
@app.route("/api/active-pdf", methods=["GET"])
def get_active_pdf():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    
    active_ids = session.get("active_pdf_ids", [])
    return jsonify({"active_pdf_ids": active_ids})


@app.route("/api/active-pdf", methods=["POST"])
def set_active_pdf():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.json
    session["active_pdf_ids"] = data.get("active_pdf_ids", [])
    return jsonify({"success": True})


@app.route("/api/active-pdf", methods=["DELETE"])
def clear_active_pdf():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    
    session.pop("active_pdf_ids", None)
    return jsonify({"success": True})


# ── PDF Management ──────────────────────────────────────────────────────────
@app.route("/api/pdfs", methods=["GET"])
def get_pdfs():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    pdfs = auth.get_user_pdfs(user)
    return jsonify({"pdfs": pdfs})


@app.route("/api/pdfs/<int:pdf_id>", methods=["GET"])
def get_pdf(pdf_id):
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    content = auth.get_pdf_content(pdf_id, user)
    if content is None:
        return jsonify({"error": "PDF not found"}), 404
    return jsonify({"content": content})


@app.route("/api/pdfs/<int:pdf_id>", methods=["DELETE"])
def delete_pdf(pdf_id):
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    auth.delete_user_pdf(pdf_id, user)
    return jsonify({"success": True})


# ── Audio Summary ───────────────────────────────────────────────────────────
@app.route("/api/audio-summary", methods=["POST"])
def audio_summary():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    pdf_context = data.get("pdf_context", "")
    if not pdf_context:
        return jsonify({"error": "No PDF context"}), 400

    from gtts import gTTS
    messages = [
        {"role": "system", "content": "Summarize the following text in 3 sentences:"},
        {"role": "user", "content": pdf_context[:5000]}
    ]
    summary = generate_response(messages)

    tts = gTTS(text=summary, lang='en')
    audio_fp = io.BytesIO()
    tts.write_to_fp(audio_fp)
    audio_b64 = base64.b64encode(audio_fp.getvalue()).decode()

    return jsonify({"summary": summary, "audio_b64": audio_b64})


# ── Quiz ────────────────────────────────────────────────────────────────────
@app.route("/api/quiz", methods=["POST"])
def quiz():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    pdf_context = data.get("pdf_context", "")
    if not pdf_context:
        return jsonify({"error": "No PDF context"}), 400

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
IMPORTANT: The 'answer' field MUST be an EXACT string match to one of the items in the 'options' list.
Text: {pdf_context[:3000]}"""

    messages = [{"role": "user", "content": prompt}]
    response = generate_response(messages)
    try:
        cleaned = response.replace("```json", "").replace("```", "").strip()
        quiz_data = json.loads(cleaned)
        return jsonify({"quiz": quiz_data})
    except Exception as e:
        return jsonify({"error": f"Failed to parse quiz: {e}", "raw": response}), 500


# ── Knowledge Graph ─────────────────────────────────────────────────────────
@app.route("/api/knowledge-graph", methods=["POST"])
def knowledge_graph():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    pdf_context = data.get("pdf_context", "")
    if not pdf_context:
        return jsonify({"error": "No PDF context"}), 400

    prompt = f"""Extract top 5 relationships from the text.
Return ONLY raw JSON (no markdown) in this format:
[
    {{"source": "Entity1", "target": "Entity2", "label": "relationship"}},
    ...
]
Text: {pdf_context[:3000]}"""

    messages = [{"role": "user", "content": prompt}]
    response = generate_response(messages)
    try:
        cleaned = response.replace("```json", "").replace("```", "").strip()
        rels = json.loads(cleaned)
        return jsonify({"relationships": rels})
    except Exception as e:
        return jsonify({"error": f"Failed to parse graph: {e}", "raw": response}), 500


# ── Slide Deck ──────────────────────────────────────────────────────────────
@app.route("/api/slides", methods=["POST"])
def slides():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    pdf_context = data.get("pdf_context", "")
    theme = data.get("theme", "midnight")
    api_key = os.getenv("GEMINI_API_KEY")

    if not pdf_context:
        return jsonify({"error": "No PDF context"}), 400

    slides_data = gemini_utils.generate_slide_content(pdf_context, api_key)
    if isinstance(slides_data, dict) and "error" in slides_data:
        return jsonify({"error": slides_data["error"]}), 500

    prs = pptx_utils.create_styled_presentation(slides_data, theme_name=theme)
    binary_output = io.BytesIO()
    prs.save(binary_output)
    pptx_b64 = base64.b64encode(binary_output.getvalue()).decode()
    return jsonify({"pptx_b64": pptx_b64, "slides_data": slides_data})


# ── YouTube ─────────────────────────────────────────────────────────────────
@app.route("/api/youtube", methods=["POST"])
def youtube():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    url = data.get("url", "")
    language = data.get("language", "English")
    video_id = youtube_utils.extract_video_id(url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube URL"}), 400

    transcript = youtube_utils.get_transcript_text(video_id)
    if "Error" in transcript:
        return jsonify({"error": transcript}), 500

    messages = [
        {"role": "system", "content": f"Summarize this video transcript in 5 concise bullet points in {language}."},
        {"role": "user", "content": transcript[:10000]}
    ]
    summary = generate_response(messages)
    return jsonify({"transcript": transcript, "summary": summary})


# ── Podcast ─────────────────────────────────────────────────────────────────
@app.route("/api/podcast", methods=["POST"])
def podcast():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    pdf_context = data.get("pdf_context", "")
    if not pdf_context:
        return jsonify({"error": "No PDF context"}), 400

    script_data = podcast_utils.generate_podcast_script(pdf_context)

    if isinstance(script_data, list) and len(script_data) > 0:
        if script_data[0].get("speaker") == "System":
            return jsonify({"error": script_data[0].get("text")}), 500

        # Fix: audio_file is a BytesIO object, not a filename
        audio_stream = podcast_utils.generate_podcast_audio(script_data)
        audio_b64 = ""
        if audio_stream:
            try:
                audio_stream.seek(0)
                audio_b64 = base64.b64encode(audio_stream.read()).decode()
            except Exception as e:
                print(f"Error encoding audio: {e}")
                pass

        return jsonify({"script": script_data, "audio_b64": audio_b64})

    return jsonify({"error": "Failed to generate script"}), 500


import agent_utils

# ── Agent Mode ─────────────────────────────────────────────────────────────
@app.route("/api/agent/run", methods=["POST"])
def run_agent():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.json
    task = data.get("task", "").strip()
    if not task:
        return jsonify({"error": "No task provided"}), 400

    logs = []
    for step in agent_utils.run_agent_task(task):
        logs.append(step)
    
    return jsonify({"logs": logs})


# ── Admin ────────────────────────────────────────────────────────────────────
@app.route("/api/admin/users")
def admin_users():
    user = session.get("user")
    if not user or not auth.is_admin(user):
        return jsonify({"error": "Forbidden"}), 403
    users = auth.get_all_users()
    return jsonify({"users": [{"username": u[0], "is_admin": bool(u[1])} for u in users]})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
