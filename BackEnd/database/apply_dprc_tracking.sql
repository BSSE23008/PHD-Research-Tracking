-- Apply DPRC Individual Member Tracking System
-- Run this script to set up the new DPRC tracking functionality

-- First, drop the existing view if it exists
DROP VIEW IF EXISTS dprc_form_approval_summary;

-- Now run the main DPRC tracking script
\i dprc_individual_tracking.sql

-- Verify the view was created successfully
SELECT 'DPRC tracking system applied successfully' as status; 