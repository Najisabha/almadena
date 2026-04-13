-- One-time migration: remove deprecated appointments feature from existing databases.
-- Run manually when deploying after code no longer references this table, e.g.:
--   psql "$DATABASE_URL" -f backend/src/scripts/drop-appointments-table.sql

DROP TABLE IF EXISTS appointments;
