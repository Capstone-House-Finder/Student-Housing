-- Seed existing listings that were created before the approval workflow
-- Mark all existing non-deleted listings as verified so they remain visible
UPDATE listings SET verified = true WHERE deleted_at IS NULL;
