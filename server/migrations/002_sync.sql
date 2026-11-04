-- ELEKTROPLAN — PHASE 12: sync storage details, openings, login rate limit, system symbols.
-- Keeps the client order of every list (`seq`) so a project read back from the server is identical
-- to the one the device sent (the merge compares versions entity by entity).

SET NAMES utf8mb4;

-- Entity ids are unique inside a project (client-made), not across the whole database:
-- child tables are keyed by (project_id, id); references between children are checked by the API.
ALTER TABLE wall_rooms DROP FOREIGN KEY fk_wr_wall, DROP FOREIGN KEY fk_wr_room;
ALTER TABLE electrical_points DROP FOREIGN KEY fk_points_room, DROP FOREIGN KEY fk_points_wall;
ALTER TABLE installation_tasks DROP FOREIGN KEY fk_tasks_point;
ALTER TABLE rooms DROP PRIMARY KEY, ADD PRIMARY KEY (project_id, id);
ALTER TABLE walls DROP PRIMARY KEY, ADD PRIMARY KEY (project_id, id);
ALTER TABLE electrical_points DROP PRIMARY KEY, ADD PRIMARY KEY (project_id, id);
ALTER TABLE wall_rooms ADD COLUMN project_id CHAR(36) NOT NULL FIRST,
  DROP PRIMARY KEY, ADD PRIMARY KEY (project_id, wall_id, room_id),
  ADD CONSTRAINT fk_wr_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE rooms
  MODIFY name VARCHAR(200) NOT NULL,
  ADD COLUMN seq INT NOT NULL DEFAULT 0 AFTER sort_order;

ALTER TABLE walls
  MODIFY name VARCHAR(200) NULL,
  ADD COLUMN seq INT NOT NULL DEFAULT 0 AFTER thickness;

ALTER TABLE wall_rooms
  ADD COLUMN seq TINYINT NOT NULL DEFAULT 0;

-- heights / distances are centimetres but may carry decimals from dragging in the wall view
ALTER TABLE electrical_points
  MODIFY mount_height_cm DOUBLE NULL,
  MODIFY distance_from_corner_cm DOUBLE NULL,
  MODIFY description TEXT NOT NULL,
  MODIFY label VARCHAR(120) NULL,
  ADD COLUMN seq INT NOT NULL DEFAULT 0 AFTER side;

ALTER TABLE installation_tasks
  ADD COLUMN project_id CHAR(36) NOT NULL AFTER id,
  ADD COLUMN seq INT NOT NULL DEFAULT 0,
  DROP PRIMARY KEY, ADD PRIMARY KEY (project_id, id),
  ADD CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_settings
  MODIFY grid_size DOUBLE NOT NULL DEFAULT 20,
  MODIFY default_socket_height_cm DOUBLE NOT NULL DEFAULT 30,
  MODIFY default_switch_height_cm DOUBLE NOT NULL DEFAULT 90,
  MODIFY wall_display_height_cm DOUBLE NOT NULL DEFAULT 270;

-- Door / window gaps (visual only; Phase 4)
CREATE TABLE IF NOT EXISTS openings (
  id         CHAR(36)     NOT NULL,
  project_id CHAR(36)     NOT NULL,
  wall_id    CHAR(36)     NOT NULL,
  kind       ENUM('door','window') NOT NULL,
  t          DOUBLE       NOT NULL,
  width      DOUBLE       NOT NULL,
  swing      TINYINT      NOT NULL DEFAULT 1,
  seq        INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, id),
  CONSTRAINT fk_openings_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login / register throttling (per IP + login and per IP)
CREATE TABLE IF NOT EXISTS rate_limits (
  k            VARCHAR(190) NOT NULL PRIMARY KEY,
  hits         INT          NOT NULL DEFAULT 0,
  window_start DATETIME(3)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE sessions ADD COLUMN last_seen_at DATETIME(3) NULL;

-- System symbols (src/features/symbols/catalog.ts)
INSERT INTO symbols (id, owner_id, name, category, placement, default_color, default_mount_height_cm, is_system) VALUES
  ('socket-single', NULL, 'Rozetka',                     'socket',   'wall',    '#3b8bff', 30,   1),
  ('socket-double', NULL, 'Ikki rozetka',                'socket',   'wall',    '#3b8bff', 30,   1),
  ('socket-triple', NULL, 'Uch rozetka',                 'socket',   'wall',    '#3b8bff', 30,   1),
  ('switch-single', NULL, 'Viklyuchatel',                'switch',   'wall',    '#ef4444', 90,   1),
  ('switch-double', NULL, 'Ikki klavishli viklyuchatel', 'switch',   'wall',    '#ef4444', 90,   1),
  ('internet',      NULL, 'Internet',                    'data',     'wall',    '#3b8bff', 30,   1),
  ('tv',            NULL, 'TV',                          'data',     'wall',    '#8b5cf6', 110,  1),
  ('ceiling-light', NULL, 'Lyustra',                     'lighting', 'ceiling', '#facc15', NULL, 1),
  ('led',           NULL, 'LED',                         'lighting', 'any',     '#facc15', NULL, 1),
  ('ac',            NULL, 'Konditsioner',                'climate',  'wall',    '#14b8a6', 220,  1),
  ('custom',        NULL, 'Boshqa',                      'custom',   'any',     '#64748b', NULL, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), placement = VALUES(placement),
  default_color = VALUES(default_color), default_mount_height_cm = VALUES(default_mount_height_cm), is_system = 1;

INSERT IGNORE INTO schema_migrations (version) VALUES ('002_sync');
