from flask import Flask, request, send_file, jsonify
import gemini_utils
import pptx_utils
import io
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Load Gemini API Key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@app.route('/generate-ppt', methods=['POST'])
def generate_ppt():
    try:
        data = request.json
        text_context = data.get('text', '')
        
        if not text_context:
            return jsonify({"error": "No text provided"}), 400

        # 1. Generate Structured Content
        try:
            slides_data = gemini_utils.generate_slide_content(text_context, GEMINI_API_KEY)
        except Exception as e:
            return jsonify({"error": f"Content generation failed: {str(e)}"}), 500

        if isinstance(slides_data, dict) and "error" in slides_data:
            return jsonify({"error": slides_data['error']}), 500

        # 2. Create Presentation
        try:
            prs = pptx_utils.create_styled_presentation(slides_data)
            
            binary_output = io.BytesIO()
            prs.save(binary_output)
            binary_output.seek(0)
            
            return send_file(
                binary_output,
                mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation',
                as_attachment=True,
                download_name='presentation.pptx'
            )
            
        except Exception as e:
            return jsonify({"error": f"PPT creation failed: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Running on port 5001 to avoid conflict with streamlit (8501) or other services
    app.run(debug=True, port=5001)
