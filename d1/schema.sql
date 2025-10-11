CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    title TEXT,
    authors TEXT,
    description TEXT,
    cover_url TEXT  -- ✅ thay vì cover_r2_key
);

CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER,
    number INTEGER,
    title TEXT,
    content_url TEXT,  -- ✅ thay vì r2_key
    FOREIGN KEY (story_id) REFERENCES stories(id)
);
