CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    title TEXT,
    authors TEXT,
    description TEXT,
    cover_r2_key TEXT
);

CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER,
    number INTEGER,
    title TEXT,
    r2_key TEXT,
    FOREIGN KEY (story_id) REFERENCES stories(id)
);
