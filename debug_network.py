
import urllib.request
import socket

def test_connection(host="api.telegram.org", port=443):
    try:
        print(f"Testing DNS resolution for {host}...")
        ip = socket.gethostbyname(host)
        print(f"Resolved {host} to {ip}")
        
        print(f"Testing TCP connection to {ip}:{port}...")
        sock = socket.create_connection((host, port), timeout=5)
        print("TCP connection successful!")
        sock.close()
        return True
    except socket.gaierror as e:
        print(f"DNS Resolution Failed: {e}")
    except socket.error as e:
        print(f"Connection Failed: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    return False

if __name__ == "__main__":
    test_connection()
