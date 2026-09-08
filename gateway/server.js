const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 5000;

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'gateway' });
});

// Route to Job Listing Service
app.use('/api/jobs', createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
    pathRewrite: (path, req) => '/jobs' + path
}));

// Route to Matching Service
app.use('/api/matches', createProxyMiddleware({
    target: 'http://localhost:5002',
    changeOrigin: true,
    pathRewrite: (path, req) => '/matches' + path
}));

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'MALFORMED_BODY', message: 'Could not parse request body' });
    }
    next(err);
});

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));