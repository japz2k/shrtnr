import aiosqlite
import os
from utils import generate_shortcode

DB_PATH = 'urls.db'

CREATE_USERS_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL
);
'''

CREATE_URLS_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
'''

CREATE_CLICK_EVENTS_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS click_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    device_type TEXT,
    FOREIGN KEY(url_id) REFERENCES urls(id)
);
'''

EXAMPLE_URLS = [
    ("abc123", "https://www.example.com", 0),
    ("xyz789", "https://www.fastapi.tiangolo.com", 0),
]

import sqlite3

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_USERS_TABLE_SQL)
        await db.execute(CREATE_URLS_TABLE_SQL)
        await db.execute(CREATE_CLICK_EVENTS_TABLE_SQL)
        # Add 'clicks' column if missing (for migrations)
        try:
            await db.execute("ALTER TABLE urls ADD COLUMN clicks INTEGER NOT NULL DEFAULT 0")
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e):
                raise
        # Add 'user_id' column if missing (for migrations)
        try:
            await db.execute("ALTER TABLE urls ADD COLUMN user_id INTEGER")
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e):
                raise
        # Add click_events table if missing (for migrations)
        try:
            await db.execute(CREATE_CLICK_EVENTS_TABLE_SQL)
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e):
                raise
        await db.commit()
        # Insert example data if not present
        for code, url, clicks in EXAMPLE_URLS:
            await db.execute("INSERT OR IGNORE INTO urls (code, url, clicks) VALUES (?, ?, ?)", (code, url, clicks))
        await db.commit()

# --- Analytics ---
async def insert_click_event(url_id: int, referrer: str, user_agent: str, ip_address: str, device_type: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO click_events (url_id, referrer, user_agent, ip_address, device_type) VALUES (?, ?, ?, ?, ?)",
            (url_id, referrer, user_agent, ip_address, device_type)
        )
        await db.commit()

async def get_click_events(code: str, limit: int = 100, offset: int = 0):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT ce.id, ce.timestamp, ce.referrer, ce.user_agent, ce.ip_address, ce.device_type "
            "FROM click_events ce JOIN urls u ON ce.url_id = u.id WHERE u.code = ? ORDER BY ce.timestamp DESC LIMIT ? OFFSET ?",
            (code, limit, offset)
        ) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": r[0],
                    "timestamp": r[1],
                    "referrer": r[2],
                    "user_agent": r[3],
                    "ip_address": r[4],
                    "device_type": r[5]
                } for r in rows
            ]


async def insert_url(url: str, user_id: int = None) -> str:
    async with aiosqlite.connect(DB_PATH) as db:
        # Ensure unique code
        code = None
        while True:
            code = generate_shortcode()
            async with db.execute("SELECT 1 FROM urls WHERE code = ?", (code,)) as cursor:
                exists = await cursor.fetchone()
                if not exists:
                    break
        await db.execute("INSERT INTO urls (code, url, clicks, user_id) VALUES (?, ?, 0, ?)", (code, url, user_id))
        await db.commit()
        return code

async def insert_url_with_code(url: str, code: str, user_id: int = None) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT 1 FROM urls WHERE code = ?", (code,)) as cursor:
            exists = await cursor.fetchone()
            if exists:
                return False
        await db.execute(
            "INSERT INTO urls (code, url, clicks, user_id) VALUES (?, ?, 0, ?)",
            (code, url, user_id)
        )
        await db.commit()
        return True

async def code_exists(code: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT 1 FROM urls WHERE code = ?", (code,)) as cursor:
            return (await cursor.fetchone()) is not None

# User management
async def create_user(email: str, hashed_password: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute("INSERT INTO users (email, hashed_password) VALUES (?, ?)", (email, hashed_password))
            await db.commit()
            return True
        except Exception:
            return False

async def get_user_by_email(email: str):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id, email, hashed_password FROM users WHERE email = ?", (email,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return {"id": row[0], "email": row[1], "hashed_password": row[2]}
            return None 

async def get_user_by_id(user_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id, email, hashed_password FROM users WHERE id = ?", (user_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return {"id": row[0], "email": row[1], "hashed_password": row[2]}
            return None

async def get_user_links(user_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT code, url, clicks FROM urls WHERE user_id = ?", (user_id,)) as cursor:
            rows = await cursor.fetchall()
            return [
                {"short_code": r[0], "original_url": r[1], "total_clicks": r[2]}
                for r in rows
            ]

async def get_url(code: str) -> tuple[str, int] | None:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT url, id FROM urls WHERE code = ?", (code,)) as cursor:
            row = await cursor.fetchone()
            return (row[0], row[1]) if row else None

async def increment_clicks(code: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE urls SET clicks = clicks + 1 WHERE code = ?", (code,))
        await db.commit()

async def get_stats(code: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT code, url, clicks FROM urls WHERE code = ?", (code,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return {
                    "short_code": row[0],
                    "original_url": row[1],
                    "total_clicks": row[2]
                }
            return None
