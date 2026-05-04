FROM grafana/grafana:latest

USER root

# ✅ Install plugins the correct way
ENV GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-clock-panel,natel-discrete-panel

# Copy provisioning files
COPY datasources /etc/grafana/provisioning/datasources
COPY provisioning/dashboards /etc/grafana/provisioning/dashboards

USER grafana