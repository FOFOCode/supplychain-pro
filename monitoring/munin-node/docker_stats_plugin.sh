#!/bin/sh
set -eu

PROG=$(basename "$0")
if [ "$PROG" = "docker_stats_plugin.sh" ]; then
  echo "Este plugin solo se debe enlazar como docker_stats_<servicio>"
  exit 1
fi

case "$PROG" in
  docker_stats_backend)
    TARGET=supplychain-pro-supplychainpro-backend-1
    ;;
  docker_stats_frontend)
    TARGET=supplychain-pro-supplychainpro-frontend-1
    ;;
  docker_stats_db)
    TARGET=supplychain-pro-supplychainpro-db-1
    ;;
  docker_stats_simulator)
    TARGET=supplychain-pro-supplychainpro-simulator-1
    ;;
  *)
    TARGET=${PROG#docker_stats_}
    ;;
esac

DOCKER_BIN="/usr/bin/docker"

# Detect actual container name in Docker Compose project.
container=$($DOCKER_BIN ps --format '{{.Names}}' | grep "$TARGET" | head -n 1 || true)

if [ -z "$container" ]; then
  container=$TARGET
fi

arg="${1:-}"
if [ "$arg" = "config" ]; then
  echo "graph_title Docker $container usage"
  echo "graph_args --base 1000 -l 0"
  echo "graph_vlabel %"
  echo "graph_category docker"
  echo "cpu.label CPU"
  echo "memory.label Memoria"
  echo "disk.label Disco"
  exit 0
fi

cpu=0
memory=0
disk=0

if [ -S /var/run/docker.sock ]; then
  stats=$($DOCKER_BIN stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemPerc}}' "$container" 2>/dev/null || true)
  if [ -n "$stats" ]; then
    cpu=$(printf '%s' "$stats" | awk -F'|' '{gsub("%", "", $2); print $2}')
    memory=$(printf '%s' "$stats" | awk -F'|' '{gsub("%", "", $3); print $3}')
  fi

  diskline=$($DOCKER_BIN exec "$container" sh -c 'df -P / 2>/dev/null | tail -1' 2>/dev/null || true)
  if [ -n "$diskline" ]; then
    disk=$(printf '%s' "$diskline" | awk '{gsub("%", "", $5); print $5}')
  fi
fi

printf "cpu.value %.2f\n" "${cpu:-0}"
printf "memory.value %.2f\n" "${memory:-0}"
printf "disk.value %.2f\n" "${disk:-0}"
