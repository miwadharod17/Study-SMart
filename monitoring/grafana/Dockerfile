FROM grafana/grafana:latest

USER root

# Install necessary plugins
RUN grafana-cli plugins install grafana-piechart-panel
RUN grafana-cli plugins install grafana-clock-panel
RUN grafana-cli plugins install natel-discrete-panel

# Copy provisioning files
COPY datasources /etc/grafana/provisioning/datasources
COPY dashboards /etc/grafana/provisioning/dashboards

USER grafana
