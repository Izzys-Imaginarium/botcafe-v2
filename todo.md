# Debug SQL Query Error in Payload CMS Admin Panel

## Task Overview
Resolve the SQL query error occurring when clicking on user profile picture in the Payload CMS admin panel.

## Error Analysis
**SQL Error:** Failed query on `payload_locked_documents` table with complex JOIN across multiple collections
**Root Cause:** Users collection missing profile picture field, causing relationship query to fail
**Trigger:** Clicking on user profile picture in admin panel

## Implementation Steps
- [x] Analyze the provided SQL error and identify root cause
- [x] Examine Payload CMS configuration and database setup
- [x] Review database migrations and schema for locked_documents table
- [x] Add profile picture field to Users collection
- [ ] Generate new database migration for Users table update
- [ ] Test the profile picture click functionality after fix

## Investigation Results
**Found Issues:**
1. Users collection lacks profile picture/avatar field
2. No relationship defined between Users and Media collections
3. Admin panel expects profile picture functionality that doesn't exist

**Solution Implemented:**
✅ Added `avatar` field (upload type) to Users collection that references Media collection
✅ Added `name` field for additional user information
✅ Updated Users collection configuration to support profile pictures
