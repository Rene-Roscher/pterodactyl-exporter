require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Gauge, register } = require('prom-client');

const app = express();
const port = 3000;

const apiClient = axios.create({
    baseURL: process.env.PTERODACTYL_API_URL,
    headers: { 'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}` },
});

const cpuUsageGauge = new Gauge({
    name: 'server_cpu_usage',
    help: 'CPU usage of the server in percent',
    labelNames: ['server_id', 'server_name', 'node'],
});
const ramUsageGauge = new Gauge({
    name: 'server_ram_usage',
    help: 'RAM usage of the server in bytes',
    labelNames: ['server_id', 'server_name', 'node'],
});
const diskUsageGauge = new Gauge({
    name: 'server_disk_usage',
    help: 'Disk usage of the server in bytes',
    labelNames: ['server_id', 'server_name', 'node'],
});
const networkRxGauge = new Gauge({
    name: 'server_network_rx',
    help: 'Network received by the server in bytes',
    labelNames: ['server_id', 'server_name', 'node'],
});
const networkTxGauge = new Gauge({
    name: 'server_network_tx',
    help: 'Network transmitted by the server in bytes',
    labelNames: ['server_id', 'server_name', 'node'],
});

async function fetchServersWithPagination() {
    let allServers = [];
    let currentPage = 1;
    let totalPages = 0;

    do {
        const response = await apiClient.get('/api/application/servers', {
            params: {
                'page': currentPage,
                'per_page': 150,
            },
        });
        const servers = response.data.data;
        allServers = allServers.concat(servers);

        totalPages = response.data.meta.pagination.total_pages;
        currentPage += 1;

        await processServersInBatches(servers, 50);
    } while (currentPage <= totalPages);

    return allServers;
}

function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

async function processServersInBatches(servers, batchSize) {
    const serverBatches = chunkArray(servers, batchSize);
    for (const batch of serverBatches) {
        const promises = batch.map(server => fetchServerResources(server).catch(() => console.error('Error: ', server.attributes.identifier)));
        await Promise.all(promises);
    }
}

async function fetchServerResources(server) {
    console.log(`Fetching resources for server ${server.attributes.identifier}`);
    const response = await apiClient.get(`/api/client/servers/${server.attributes.identifier}/resources`);
    const { attributes } = response.data;
    const serverId = server.attributes.identifier;
    const serverName = server.attributes.name;
    const node = server.attributes.node;

    const limits = server.attributes.limits;
    const cpuLimit = limits.cpu;
    const ramLimit = limits.memory;

    cpuUsageGauge.labels(serverId, serverName, node).set(attributes.resources.cpu_absolute / cpuLimit * 100);
    ramUsageGauge.labels(serverId, serverName, node).set(attributes.resources.memory_bytes / ramLimit * 1024 * 1024 * 1024);
    diskUsageGauge.labels(serverId, serverName, node).set(attributes.resources.disk_bytes / limits.disk * 1024 * 1024 * 1024);
    networkRxGauge.labels(serverId, serverName, node).set(attributes.resources.network_rx_bytes);
    networkTxGauge.labels(serverId, serverName, node).set(attributes.resources.network_tx_bytes);
}

app.get('/metrics', async (req, res) => {
    await fetchServersWithPagination();
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(port, () => console.log(`Metric exporter running on http://localhost:${port}`));
