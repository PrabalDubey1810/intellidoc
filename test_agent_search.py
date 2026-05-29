import agent_utils
import json

def test_search():
    print("Testing Agent Search...")
    task = "Who is the current CEO of Microsoft and what is their latest public announcement?"
    
    for step in agent_utils.run_agent_task(task):
        type = step.get("type")
        content = step.get("content")
        
        if type == "thought":
            print(f"\n[THOUGHT]: {content}")
        elif type == "action":
            print(f"\n[ACTION]: {content}")
        elif type == "result":
            print(f"\n[RESULT]: {content[:200]}...") # Truncate for brevity
        elif type == "final":
            print(f"\n[FINAL ANSWER]: {content}")
        elif type == "error":
            print(f"\n[ERROR]: {content}")

if __name__ == "__main__":
    test_search()
