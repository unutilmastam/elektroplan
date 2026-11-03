-- ELEKTROPLAN — MySQL / MariaDB schema (cPanel, activated in PHASE 12)
-- Requires MySQL 5.7+ or MariaDB 10.2+. Charset utf8mb4 for Uzbek letters (o‘, g‘).
-- IDs are UUID strings generated on the client (uuid v7), so records can be created offline.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  phone         VARCHAR(20)  NULL,
  email         VARCHAR(190) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'electrician',
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id          CHAR(64)    NOT NULL PRIMARY KEY,   -- sha256 of the random token stored in the cookie
  user_id     CHAR(36)    NOT NULL,
  user_agent  VARCHAR(255) NULL,
  expires_at  DATETIME(3) NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  owner_id      CHAR(36)     NOT NULL,
  name          VARCHAR(200) NOT NULL,
  customer_name VARCHAR(200) NOT NULL DEFAULT '',
  address       VARCHAR(300) NOT NULL DEFAULT '',
  revision      INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)  NULL,
  KEY ix_projects_owner_updated (owner_id, updated_at),
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_settings (
  project_id               CHAR(36)    NOT NULL PRIMARY KEY,
  grid_size                INT         NOT NULL DEFAULT 20,
  snap_to_grid             TINYINT(1)  NOT NULL DEFAULT 1,
  default_socket_height_cm INT         NOT NULL DEFAULT 30,
  default_switch_height_cm INT         NOT NULL DEFAULT 90,
  wall_display_height_cm   INT         NOT NULL DEFAULT 270,
  updated_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_settings_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rooms (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  project_id   CHAR(36)     NOT NULL,
  name         VARCHAR(120) NOT NULL,
  color        VARCHAR(9)   NOT NULL,
  shape        ENUM('rect','square','polygon') NOT NULL,
  vertices     JSON         NOT NULL,  -- Vec2[]
  label_offset JSON         NOT NULL,  -- Vec2
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at   DATETIME(3)  NULL,
  KEY ix_rooms_project (project_id),
  CONSTRAINT fk_rooms_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS walls (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  project_id CHAR(36)     NOT NULL,
  a_x DOUBLE NOT NULL, a_y DOUBLE NOT NULL,
  b_x DOUBLE NOT NULL, b_y DOUBLE NOT NULL,
  thickness  DOUBLE       NOT NULL DEFAULT 12,
  name       VARCHAR(120) NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3)  NULL,
  KEY ix_walls_project (project_id),
  CONSTRAINT fk_walls_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wall_rooms (
  wall_id CHAR(36) NOT NULL,
  room_id CHAR(36) NOT NULL,
  PRIMARY KEY (wall_id, room_id),
  KEY ix_wall_rooms_room (room_id),
  CONSTRAINT fk_wr_wall FOREIGN KEY (wall_id) REFERENCES walls(id) ON DELETE CASCADE,
  CONSTRAINT fk_wr_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS symbols (
  id                      VARCHAR(64)  NOT NULL PRIMARY KEY,  -- 'socket-single' or uuid for custom
  owner_id                CHAR(36)     NULL,                  -- NULL = system symbol
  name                    VARCHAR(120) NOT NULL,
  category                ENUM('socket','switch','data','lighting','climate','custom') NOT NULL,
  placement               ENUM('wall','ceiling','any') NOT NULL DEFAULT 'wall',
  default_color           VARCHAR(9)   NOT NULL,
  default_mount_height_cm INT          NULL,
  svg                     TEXT         NULL,                  -- custom symbols only
  is_system               TINYINT(1)   NOT NULL DEFAULT 0,
  created_at              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_symbols_owner (owner_id),
  CONSTRAINT fk_symbols_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS electrical_points (
  id                      CHAR(36)    NOT NULL PRIMARY KEY,
  project_id              CHAR(36)    NOT NULL,
  room_id                 CHAR(36)    NOT NULL,
  wall_id                 CHAR(36)    NULL,
  symbol_id               VARCHAR(64) NOT NULL,
  t                       DOUBLE      NULL,
  side                    TINYINT     NOT NULL DEFAULT 1,
  x                       DOUBLE      NOT NULL,
  y                       DOUBLE      NOT NULL,
  mount_height_cm         INT         NULL,
  distance_from_corner_cm INT         NULL,
  description             VARCHAR(500) NOT NULL DEFAULT '',
  color                   VARCHAR(9)  NOT NULL,
  label                   VARCHAR(60) NULL,
  status                  ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  status_changed_at       DATETIME(3) NULL,
  created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at              DATETIME(3) NULL,
  KEY ix_points_project (project_id),
  KEY ix_points_wall (wall_id),
  KEY ix_points_project_status (project_id, status),
  CONSTRAINT fk_points_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_points_room    FOREIGN KEY (room_id)    REFERENCES rooms(id)    ON DELETE CASCADE,
  CONSTRAINT fk_points_wall    FOREIGN KEY (wall_id)    REFERENCES walls(id)    ON DELETE SET NULL,
  CONSTRAINT fk_points_symbol  FOREIGN KEY (symbol_id)  REFERENCES symbols(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS installation_tasks (
  id          CHAR(36)    NOT NULL PRIMARY KEY,
  point_id    CHAR(36)    NOT NULL,
  user_id     CHAR(36)    NULL,
  from_status ENUM('pending','in_progress','completed') NOT NULL,
  to_status   ENUM('pending','in_progress','completed') NOT NULL,
  note        VARCHAR(500) NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_tasks_point_created (point_id, created_at),
  CONSTRAINT fk_tasks_point FOREIGN KEY (point_id) REFERENCES electrical_points(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_history (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  project_id CHAR(36)     NOT NULL,
  user_id    CHAR(36)     NULL,
  revision   INT UNSIGNED NOT NULL,
  ops        JSON         NOT NULL,   -- immer patches
  kind       ENUM('change','conflict','restore') NOT NULL DEFAULT 'change',
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_history_project_revision (project_id, revision),
  CONSTRAINT fk_history_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    VARCHAR(50) NOT NULL PRIMARY KEY,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_init');
