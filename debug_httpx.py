
import httpx
import asyncio

async def test_httpx():
    url = "https://api.telegram.org"
    print(f"Testing httpx connection to {url}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10)
            print(f"Status Code: {response.status_code}")
            print("HTTPX Connection Successful!")
    except Exception as e:
        print(f"HTTPX Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_httpx())
