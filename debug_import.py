import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"System Path: {sys.path}")

try:
    import flask
    print(f"Flask File: {flask.__file__}")
    print("Flask imported successfully")
except ImportError as e:
    print(f"Failed to import flask: {e}")

try:
    import twilio
    print("Twilio imported successfully")
except ImportError as e:
    print(f"Failed to import twilio: {e}")
