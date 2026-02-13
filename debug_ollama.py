import litellm
import sys

model = sys.argv[1]
print(f"Testing {model}...")
try:
    response = litellm.completion(
        model=model,
        messages=[{"role": "user", "content": "hi"}],
        api_base="http://localhost:11434",
        stream=False
    )
    print("Success!")
    print(response)
except Exception as e:
    print(f"Failure: {e}")
