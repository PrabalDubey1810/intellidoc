import os
import agent_utils

print("Starting agent test...")
try:
    for step in agent_utils.run_agent_task("Check NVDA stock price"):
        print(step)
    print("Finished.")
except Exception as e:
    print("Error:", e)
