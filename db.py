import sqlite3

def view_users():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    print("--- Users Table ---")
    cursor.execute("SELECT username, is_admin FROM users")
    for row in cursor.fetchall():
        print(f"User: {row[0]} | Admin: {'Yes' if row[1] else 'No'}")
        
    conn.close()

if __name__ == "__main__":
    view_users()