const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 5002;
const JOB_LISTING_URL = 'http://localhost:5001';

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'matching' });
});

// CREATE a match — calls Job Listing Service (Service A -> Service B)
app.post('/matches', async (req, res) => {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            field: !candidateId ? 'candidateId' : 'jobId',
            message: 'Required field missing'
        });
    }

    let job;
    try {
        const response = await axios.get(`${JOB_LISTING_URL}/jobs/${jobId}`, {
            headers: { Accept: 'application/json' },
            timeout: 3000
        });
        job = response.data;
    } catch (err) {
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ error: 'NOT_FOUND', message: `Job ${jobId} does not exist` });
        }
        return res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: 'Job Listing Service is unreachable' });
    }

    if (!job.active) {
        return res.status(409).json({ error: 'CONFLICT', message: 'This job is no longer active' });
    }

    const match = {
        matchId: Date.now(),
        candidateId: parseInt(candidateId),
        jobId: job.jobId,
        jobTitle: job.title,
        accommodationType: job.accommodationType,
        matchedAt: new Date().toISOString()
    };

    res.status(201).json(match);
});

app.listen(PORT, () => console.log(`Matching Service running on port ${PORT}`));