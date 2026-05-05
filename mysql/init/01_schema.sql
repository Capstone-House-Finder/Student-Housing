-- ============================================================
-- Student Housing Platform — Database Schema
-- ============================================================
CREATE DATABASE IF NOT EXISTS student_housing_test;
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppassword';
GRANT ALL PRIVILEGES ON student_housing_test.* TO 'appuser'@'%';

USE student_housing_test;

-- ── ENUMS (simulated via column constraints in MySQL) ────────

-- ── AUTH GROUP ───────────────────────────────────────────────

CREATE TABLE users (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM('student','landlord','admin') NOT NULL,
  status          ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL UNIQUE,
  full_name   VARCHAR(255),
  phone       VARCHAR(30),
  avatar_url  VARCHAR(500),
  bio         TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_resets (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  token_hash  VARCHAR(255)  NOT NULL UNIQUE,
  expires_at  TIMESTAMP     NOT NULL,
  used        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE token_blocklist (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  jti         VARCHAR(255)  NOT NULL UNIQUE,
  expires_at  TIMESTAMP     NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── LISTINGS GROUP ───────────────────────────────────────────

CREATE TABLE listings (
  id            INT             AUTO_INCREMENT PRIMARY KEY,
  landlord_id   INT             NOT NULL,
  title         VARCHAR(255)    NOT NULL,
  description   TEXT            NOT NULL,
  location      VARCHAR(255)    NOT NULL,
  price         DECIMAL(10, 2)  NOT NULL,
  property_type ENUM('apartment','studio','room','house') NOT NULL,
  status        ENUM('available','rented','under_negotiation') NOT NULL DEFAULT 'available',
  verified      BOOLEAN         NOT NULL DEFAULT FALSE,
  flagged       BOOLEAN         NOT NULL DEFAULT FALSE,
  deleted_at    TIMESTAMP       NULL DEFAULT NULL,
  created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_location     (location),
  INDEX idx_price        (price),
  INDEX idx_type         (property_type),
  INDEX idx_status       (status),
  INDEX idx_deleted      (deleted_at)
);

CREATE TABLE amenities (
  id    INT           AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100)  NOT NULL UNIQUE
);

CREATE TABLE listing_amenities (
  listing_id  INT NOT NULL,
  amenity_id  INT NOT NULL,
  PRIMARY KEY (listing_id, amenity_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);

CREATE TABLE listing_photos (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT           NOT NULL,
  url         VARCHAR(500)  NOT NULL,
  public_id   VARCHAR(255),
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE listing_status_log (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT       NOT NULL,
  changed_by  INT       NOT NULL,
  old_status  ENUM('available','rented','under_negotiation'),
  new_status  ENUM('available','rented','under_negotiation') NOT NULL,
  changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ── TRANSACTIONS GROUP ───────────────────────────────────────

CREATE TABLE conversations (
  id            INT       AUTO_INCREMENT PRIMARY KEY,
  student_id    INT       NOT NULL,
  landlord_id   INT       NOT NULL,
  listing_id    INT       NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (landlord_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (listing_id)  REFERENCES listings(id) ON DELETE CASCADE,
  UNIQUE KEY uq_conversation (student_id, listing_id)
);

CREATE TABLE rentals (
  id            INT       AUTO_INCREMENT PRIMARY KEY,
  student_id    INT       NOT NULL,
  landlord_id   INT       NOT NULL,
  listing_id    INT       NOT NULL,
  start_date    DATE      NOT NULL,
  end_date      DATE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (landlord_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (listing_id)  REFERENCES listings(id) ON DELETE CASCADE
);

-- ── SOCIAL GROUP ─────────────────────────────────────────────

CREATE TABLE reviews (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT       NOT NULL,
  student_id  INT       NOT NULL,
  rental_id   INT       NOT NULL,
  rating      TINYINT   NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (rental_id)  REFERENCES rentals(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_one_review_per_rental (rental_id)
);

CREATE TABLE review_replies (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  review_id   INT       NOT NULL UNIQUE,
  landlord_id INT       NOT NULL,
  reply       TEXT      NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id)   REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (landlord_id) REFERENCES users(id)   ON DELETE CASCADE
);

-- ── MODERATION GROUP ─────────────────────────────────────────

CREATE TABLE reports (
  id          INT         AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT         NOT NULL,
  target_type ENUM('listing','user') NOT NULL,
  target_id   INT         NOT NULL,
  reason      TEXT        NOT NULL,
  status      ENUM('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_target (target_type, target_id),
  INDEX idx_status (status)
);

CREATE TABLE platform_metrics_cache (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  metrics     JSON      NOT NULL,
  cached_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── SEED DATA ─────────────────────────────────────────────────

INSERT INTO amenities (name) VALUES
  ('WiFi'),
  ('Parking'),
  ('Water'),
  ('Electricity'),
  ('Furnished'),
  ('Air Conditioning'),
  ('Security'),
  ('Laundry');