-- Migration: Add sharing_visibility column to bot table
-- Date: 2026-01-18
-- Description: Adds the sharing.visibility field for the new permission/sharing system

-- Add the sharing_visibility column with default value 'private'
ALTER TABLE bot ADD COLUMN sharing_visibility TEXT DEFAULT 'private';

-- Update existing public bots to have 'public' visibility
UPDATE bot SET sharing_visibility = 'public' WHERE is_public = 1;

-- Update existing private bots to have 'private' visibility (already default, but explicit)
UPDATE bot SET sharing_visibility = 'private' WHERE is_public = 0 OR is_public IS NULL;
