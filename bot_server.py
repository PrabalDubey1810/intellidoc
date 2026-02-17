import os
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters
import llm_utils

# Setup Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# --- CONFIGURATION ---
# --- CONFIGURATION ---
# TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
TELEGRAM_TOKEN = "8571782168:AAG84QZgIq5k9f8aB7vslfzOXRbiKTB6z0Q"

import io
from pypdf import PdfReader

# --- GLOBAL STATE (In-memory for demo purposes) ---
user_contexts = {}

# --- TELEGRAM BOT HANDLERS ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send a welcome message when the command /start is issued."""
    await context.bot.send_message(
        chat_id=update.effective_chat.id, 
        text="Hello! I am your IntelliDoc AI assistant.\n\nSend me a **PDF file** to analyze it, or just chat with me!"
    )

async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming PDF files."""
    chat_id = update.effective_chat.id
    document = update.message.document
    
    # Check if it's a PDF
    if document.mime_type != 'application/pdf':
        await context.bot.send_message(chat_id=chat_id, text="Please send a PDF file.")
        return

    file = await context.bot.get_file(document.file_id)
    
    # Download to memory
    f = io.BytesIO()
    await file.download_to_memory(f)
    f.seek(0)
    
    # Extract Text
    try:
        reader = PdfReader(f)
        text = ""
        for page in reader.pages:
            result = page.extract_text()
            if result:
                text += result + "\n"
        
        if text:
            user_contexts[chat_id] = text
            await context.bot.send_message(
                chat_id=chat_id, 
                text=f"✅ Received **{document.file_name}**! I've read `{len(text)}` characters.\n\nNow ask me anything about this document."
            )
        else:
             await context.bot.send_message(chat_id=chat_id, text="⚠️ I couldn't extract any text from this PDF. It might be scanned images.")
             
    except Exception as e:
        logging.error(f"Error processing PDF: {e}")
        await context.bot.send_message(chat_id=chat_id, text="❌ Error processing the PDF file.")


async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming text messages."""
    user_text = update.message.text
    chat_id = update.effective_chat.id
    
    logging.info(f"Received message from {chat_id}: {user_text}")
    
    # Notify user that we are processing
    await context.bot.send_chat_action(chat_id=chat_id, action="typing")

    # Build Messages
    messages = []
    
    # Add Context if available
    pdf_context = user_contexts.get(chat_id)
    if pdf_context:
        messages.append({
            "role": "system", 
            "content": f"You are a helpful assistant. Answer questions based on the following document content:\n\n{pdf_context[:10000]}" # Limit context
        })
    else:
         messages.append({"role": "system", "content": "You are a helpful assistant."})

    messages.append({"role": "user", "content": user_text})

    # Get response from LLM
    response_text = llm_utils.generate_response(messages)
    
    await context.bot.send_message(chat_id=chat_id, text=response_text)

def main():
    """Start the bot."""
    if TELEGRAM_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN":
        print("Error: TELEGRAM_TOKEN is not set.")
        print("Please set the TELEGRAM_TOKEN environment variable or edit the script.")
        return

    print("Starting Telegram Bot...")
    application = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    
    start_handler = CommandHandler('start', start)
    doc_handler = MessageHandler(filters.Document.PDF, handle_document)
    echo_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), echo)
    
    application.add_handler(start_handler)
    application.add_handler(doc_handler)
    application.add_handler(echo_handler)
    
    print("Bot is polling...")
    application.run_polling()

if __name__ == "__main__":
    main()
