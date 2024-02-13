# Pterodactyl Exporter

Pterodactyl Exporter is a Prometheus exporter for the Pterodactyl Panel, allowing you to monitor server resources such as CPU, RAM, Disk, and Network usage.

## Measurable Metrics
Fetches server metrics from Pterodactyl Panel.
- Provides Prometheus metrics for CPU, RAM, Disk, and Network usage.

## Configuration

Set up the following environment variables in a `.env` file or directly in your environment:

- `PTERODACTYL_API_KEY`: Your Pterodactyl API key. (Application API Key)
- `PTERODACTYL_API_URL`: The URL to your Pterodactyl panel. (e.g. `https://panel.example.com`)

## Usage with Docker

### Docker Compose

Create a `docker-compose.yml` file with the following content:

```yaml
version: '3'
services:
  pterodactyl-exporter:
    image: ghcr.io/Rene-Roscher/pterodactyl-prometheus-exporter:latest
    ports:
      - "3000:3000"
    environment:
      PTERODACTYL_API_KEY: YourPterodactylApiKey
      PTERODACTYL_API_URL: YourPterodactylApiUrl
```

Then run `docker-compose up -d` to start the exporter.

### Docker CLI

Run the following command to start the exporter:

```bash
docker run -d -p 3000:3000 -e PTERODACTYL_API_KEY=YourPterodactylApiKey -e PTERODACTYL_API_URL=YourPterodactylApiUrl ghcr.io/Rene-Roscher/pterodactyl-prometheus-exporter:latest
```

## Metrics Endpoint

The metrics endpoint is available at `http://localhost:3000/metrics`.

## Grafana Dashboard
WIP
