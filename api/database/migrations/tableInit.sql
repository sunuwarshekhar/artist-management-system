-- user table
CREATE TABLE IF NOT EXISTS "user" (
  id          SERIAL        PRIMARY KEY,
  first_name  VARCHAR(255)  NOT NULL,
  last_name   VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    VARCHAR(500)  NOT NULL,
  phone       VARCHAR(20),
  dob         DATE,
  gender      VARCHAR(1)    CHECK (gender IN ('m', 'f', 'o')),
  address     VARCHAR(255),
  role        VARCHAR(20)   NOT NULL CHECK (role IN ('super_admin', 'artist_manager', 'artist')),
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- artist table
CREATE TABLE IF NOT EXISTS "artist" (
  id                    SERIAL        PRIMARY KEY,
  user_id               INT           UNIQUE REFERENCES "user"(id) ON DELETE SET NULL,
  name                  VARCHAR(255)  NOT NULL,
  dob                   DATE,
  gender                VARCHAR(1)    CHECK (gender IN ('m', 'f', 'o')),
  address               VARCHAR(255),
  first_release_year    INT           CHECK (first_release_year >= 1900 AND first_release_year <= EXTRACT(YEAR FROM NOW())),
  no_of_albums_released INT           NOT NULL DEFAULT 0 CHECK (no_of_albums_released >= 0),
  created_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- music table
CREATE TABLE IF NOT EXISTS "music" (
  id          SERIAL        PRIMARY KEY,
  artist_id   INT           NOT NULL REFERENCES "artist"(id) ON DELETE CASCADE,
  title       VARCHAR(255)  NOT NULL,
  album_name  VARCHAR(255),
  genre       VARCHAR(20)   CHECK (genre IN ('rnb', 'country', 'classic', 'rock', 'jazz')),
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- trigger for auto updating updated_at column on row change
-- main trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_user ON "user";
CREATE TRIGGER set_updated_at_user
  BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_artist ON "artist";
CREATE TRIGGER set_updated_at_artist
  BEFORE UPDATE ON "artist"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_music ON "music";
CREATE TRIGGER set_updated_at_music
  BEFORE UPDATE ON "music"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
