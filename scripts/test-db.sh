#!/usr/bin/env bash
# Local MariaDB for API tests (CI uses a mariadb service container instead).
# Usage: scripts/test-db.sh start|stop   -> socket-less TCP on 127.0.0.1:${DB_PORT:-3307}, root without password.
set -euo pipefail
DIR="${DB_DIR:-/tmp/elektroplan-mariadb}"
PORT="${DB_PORT:-3307}"
case "${1:-start}" in
  start)
    if mariadb -h127.0.0.1 -P"$PORT" -uroot -e 'select 1' >/dev/null 2>&1; then echo "already running on $PORT"; exit 0; fi
    if [ ! -d "$DIR/mysql" ]; then
      mkdir -p "$DIR"
      mariadb-install-db --no-defaults --datadir="$DIR" --auth-root-authentication-method=normal --user="$(whoami)" >/dev/null
    fi
    (mariadbd --no-defaults --datadir="$DIR" --port="$PORT" --bind-address=127.0.0.1 --socket="$DIR/mysqld.sock" \
      --pid-file="$DIR/mysqld.pid" --user="$(whoami)" --skip-grant-tables=0 >"$DIR/server.log" 2>&1 &)
    for _ in $(seq 1 60); do
      mariadb -h127.0.0.1 -P"$PORT" -uroot -e 'select 1' >/dev/null 2>&1 && { echo "mariadb on $PORT"; exit 0; }
      sleep 0.5
    done
    tail -20 "$DIR/server.log"; exit 1;;
  stop)
    [ -f "$DIR/mysqld.pid" ] && kill "$(cat "$DIR/mysqld.pid")" || true;;
esac
