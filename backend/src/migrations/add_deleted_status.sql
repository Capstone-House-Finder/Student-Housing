-- Add 'deleted' status to users table status enum
ALTER TABLE users MODIFY COLUMN status ENUM('active', 'suspended', 'pending_verification', 'deleted') NOT NULL DEFAULT 'pending_verification';
