-- ELEKTROPLAN — PHASE 14: admin, Pro subscription (activated by the admin), password reset.

SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN pro_until DATETIME(3) NULL AFTER role,
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER pro_until,
  ADD COLUMN last_login_at DATETIME(3) NULL AFTER must_change_password;

-- Who did what to whom (password reset, Pro on / off). Never deleted with the user.
CREATE TABLE IF NOT EXISTS admin_actions (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  admin_id   CHAR(36)     NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  action     VARCHAR(40)  NOT NULL,
  detail     JSON         NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_admin_actions_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('003_admin_pro');
