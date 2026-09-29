
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS settings(
 id INTEGER PRIMARY KEY CHECK(id=1),
 site_name TEXT NOT NULL,
 tagline TEXT,
 breaking_text TEXT,
 about_text TEXT,
 primary_color TEXT DEFAULT '#0a4f8a',
 accent_color TEXT DEFAULT '#a61f2b'
);
CREATE TABLE IF NOT EXISTS articles(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 summary TEXT,
 category TEXT,
 author TEXT,
 published_at TEXT,
 status TEXT DEFAULT 'rascunho',
 featured INTEGER DEFAULT 0,
 content_type TEXT DEFAULT 'materia',
 image_url TEXT,
 body_html TEXT,
 youtube_url TEXT,
 extra_label TEXT,
 extra_url TEXT,
 source_name TEXT,
 source_url TEXT
);
CREATE TABLE IF NOT EXISTS links(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 category TEXT,
 description TEXT,
 url TEXT NOT NULL,
 active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS cooperatives(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 type TEXT,
 sort_order INTEGER NOT NULL DEFAULT 100,
 description TEXT,
 website TEXT,
 instagram TEXT,
 image_url TEXT,
 active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS faqs(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 question TEXT NOT NULL,
 answer TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ads(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 title TEXT NOT NULL,
 body TEXT,
 placement TEXT DEFAULT 'middle',
 target_url TEXT,
 image_url TEXT,
 active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS analytics(
 event_type TEXT NOT NULL,
 item_id INTEGER NOT NULL DEFAULT 0,
 count INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(event_type,item_id)
);
CREATE TABLE IF NOT EXISTS admin_sessions(
 token TEXT PRIMARY KEY,
 expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 subject TEXT NOT NULL,
 message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'new',
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
