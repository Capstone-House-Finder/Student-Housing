-- Add status column to reviews table for admin moderation
ALTER TABLE reviews ADD COLUMN status ENUM('approved','flagged','deleted') NOT NULL DEFAULT 'approved' AFTER comment;
ALTER TABLE reviews ADD INDEX idx_status (status);