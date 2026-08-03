-- Down migration for 043 removes the student identity fields
ALTER TABLE users DROP COLUMN IF EXISTS gender;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS major;
