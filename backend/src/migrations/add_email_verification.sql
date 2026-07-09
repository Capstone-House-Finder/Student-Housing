-- Migration: Add Email Verification support
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_verifications (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  token_hash  VARCHAR(255)  NOT NULL UNIQUE,
  expires_at  TIMESTAMP     NOT NULL,
  used        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
