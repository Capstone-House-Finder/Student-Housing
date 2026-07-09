-- Migration to rename square_feet column to square_meters in listings table
ALTER TABLE listings CHANGE COLUMN square_feet square_meters INT DEFAULT NULL;
