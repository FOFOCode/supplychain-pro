#!/bin/sh
set -eu

PROG=$(basename "$0")
if [ "$PROG" = "docker_stats_plugin.sh" ]; then
  echo "Este plugin solo se debe enlazar como docker_stats_<servicio>"
  exit 1
fi

case "$PROG" in
  docker_stats_backend)
    SEARCH="supplychainpro-backend"
    ;;
  docker_stats_frontend)
    SEARCH="supplychainpro-frontend"
    ;;
  docker_stats_db)
    SEARCH="supplychainpro-db"
    ;;
  docker_stats_simulator)
    SEARCH="supplychainpro-simulator"
    ;;
  *)
    # Para plugins nombrados genéricamente, busca por el sufijo del nombre
    SEARCH=${PROG#docker_stats_}
    ;;
esac

DOCKER_BIN="/usr/bin/docker"

# Busca el contenedor que contenga el nombre del servicio en cualquier proyecto de Docker Compose
container=$($DOCKER_BIN ps --format '{{.Names}}' | grep "$SEARCH" | head -n 1 || true)

if [ -z "$container" ]; then
  container=$SEARCH
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
