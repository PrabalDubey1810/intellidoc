import asyncio
from telegram import Bot
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

async def test_bot():
    print("Testing python-telegram-bot connection...")
    bot = Bot(token=TELEGRAM_TOKEN)
    try:
        me = await bot.get_me()
        print(f"Success! Bot info: {me.username}")
    except Exception as e:
        print(f"Bot Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_bot())
