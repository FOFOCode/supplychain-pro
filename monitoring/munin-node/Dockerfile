FROM alpine:3.18

# Instalar munin-node y dependencias básicas
RUN apk add --no-cache \
    munin-node \
    bash \
    coreutils \
    procps \
    perl-net-dns \
    docker-cli

# Configuración básica:
# 1. Configurar host_name
# 2. Permitir conexiones de la red interna de Docker (172.x.x.x)
# 3. Forzar ejecución en primer plano (foreground) para Docker
RUN sed -i 's/^host_name.*/host_name monitoring-munin-node/' /etc/munin/munin-node.conf && \
    echo "allow ^172\..*$" >> /etc/munin/munin-node.conf && \
    echo "background 0" >> /etc/munin/munin-node.conf && \
    echo "setsid 0" >> /etc/munin/munin-node.conf

COPY docker_stats_plugin.sh /usr/local/bin/docker_stats_plugin.sh
RUN chmod +x /usr/local/bin/docker_stats_plugin.sh

# Autodetectar y activar los plugins del sistema disponibles (cpu, memory, load, uptime, etc.)
# Habilitar df explícitamente para exponer uso de disco en el panel.
RUN munin-node-configure --shell | sh && \
    ln -sf /usr/lib/munin/plugins/df /etc/munin/plugins/df && \
    ln -sf /usr/local/bin/docker_stats_plugin.sh /etc/munin/plugins/docker_stats_backend && \
    ln -sf /usr/local/bin/docker_stats_plugin.sh /etc/munin/plugins/docker_stats_frontend && \
    ln -sf /usr/local/bin/docker_stats_plugin.sh /etc/munin/plugins/docker_stats_db && \
    ln -sf /usr/local/bin/docker_stats_plugin.sh /etc/munin/plugins/docker_stats_simulator

# Munin node corre por defecto en el puerto 4949
EXPOSE 4949

# Aseguramos acceso al socket Docker si los permisos del bind mount lo permiten,
# luego arrancamos munin-node en primer plano.
CMD ["sh", "-c", "chmod 666 /var/run/docker.sock 2>/dev/null || true && exec munin-node"]
