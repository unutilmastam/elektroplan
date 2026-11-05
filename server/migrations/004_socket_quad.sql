-- PHASE 20: four-gang socket (src/features/symbols/catalog.ts 'socket-quad')
INSERT INTO symbols (id, owner_id, name, category, placement, default_color, default_mount_height_cm, is_system) VALUES
  ('socket-quad', NULL, 'To‘rt rozetka', 'socket', 'wall', '#3b8bff', 30, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), placement = VALUES(placement),
  default_color = VALUES(default_color), default_mount_height_cm = VALUES(default_mount_height_cm), is_system = 1;

INSERT IGNORE INTO schema_migrations (version) VALUES ('004_socket_quad');
