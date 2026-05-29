import sqlite3
import hashlib
import os

DB_NAME = "users.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash BLOB NOT NULL,
            salt BLOB NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT 0
        );
        """
    )
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(username) REFERENCES users(username)
        );
        """
    )
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS pdfs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            filename TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(username) REFERENCES users(username)
        );
        """
    )
    conn.commit()
    conn.close()


def hash_password(password, salt=None):
    if salt is None:
        salt = os.urandom(32)
    # Use PBKDF2 HMAC SHA256
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return pwd_hash, salt


def register_user(username, password):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    password_hash, salt = hash_password(password)
    
    try:
        c.execute(
            "INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
            (username, password_hash, salt),
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def authenticate_user(username, password):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT password_hash, salt FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user:
        stored_hash = user[0]
        stored_salt = user[1]
        
        # Hash the provided password with the stored salt
        check_hash, _ = hash_password(password, stored_salt)
        
        if check_hash == stored_hash:
            return True
    return False


def is_admin(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT is_admin FROM users WHERE username = ?", (username,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else False


def make_admin(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("UPDATE users SET is_admin = 1 WHERE username = ?", (username,))
    conn.commit()
    conn.close()


def get_all_users():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT username, is_admin FROM users")
    users = c.fetchall()
    conn.close()
    return users


def save_message(username, role, content):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "INSERT INTO chats (username, role, content) VALUES (?, ?, ?)",
        (username, role, content),
    )
    conn.commit()
    conn.close()


def get_chat_history(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "SELECT role, content FROM chats WHERE username = ? ORDER BY timestamp ASC",
        (username,),
    )
    chats = c.fetchall()
    conn.close()
    return [{"role": row[0], "content": row[1]} for row in chats]


def save_user_pdf(username, filename, content):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "INSERT INTO pdfs (username, filename, content) VALUES (?, ?, ?)",
        (username, filename, content),
    )
    pdf_id = c.lastrowid
    conn.commit()
    conn.close()
    return pdf_id


def get_user_pdfs(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "SELECT id, filename, timestamp FROM pdfs WHERE username = ? ORDER BY timestamp DESC",
        (username,),
    )
    pdfs = c.fetchall()
    conn.close()
    return [{"id": row[0], "filename": row[1], "timestamp": row[2]} for row in pdfs]


def get_pdf_content(pdf_id, username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "SELECT content FROM pdfs WHERE id = ? AND username = ?",
        (pdf_id, username),
    )
    result = c.fetchone()
    conn.close()
    return result[0] if result else None


def delete_user_pdf(pdf_id, username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "DELETE FROM pdfs WHERE id = ? AND username = ?",
        (pdf_id, username),
    )
    conn.commit()
    conn.close()


def get_last_active_pdfs(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT last_active_pdfs FROM users WHERE username = ?", (username,))
    result = c.fetchone()
    conn.close()
    if result and result[0]:
        try:
            import json
            return json.loads(result[0])
        except:
            return []
    return []


def save_last_active_pdfs(username, pdf_ids):
    import json
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "UPDATE users SET last_active_pdfs = ? WHERE username = ?",
        (json.dumps(pdf_ids), username),
    )
    conn.commit()
    conn.close()
