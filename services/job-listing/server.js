const express = require('express');
const { Builder, parseStringPromise } = require('xml2js');

const app = express();
const PORT = 5001;

// In-memory store (temporary — real DB comes later)
let jobs = [
    { jobId: 1001, title: "Data Entry Clerk", employerId: 501, accommodationType: "Flexible schedule", location: "Manila", active: true }
];

app.use(express.json());
app.use(express.text({ type: 'application/xml' }));

const xmlBuilder = new Builder({ rootName: 'job', headless: false });

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'job-listing' });
});

// GET a job — supports content negotiation (JSON or XML)
app.get('/jobs/:id', async (req, res) => {
    const job = jobs.find(j => j.jobId === parseInt(req.params.id));

    if (!job) {
        return res.status(404).json({ error: 'NOT_FOUND', message: `Job ${req.params.id} does not exist` });
    }

    const acceptsXml = req.headers.accept && req.headers.accept.includes('application/xml');
    if (acceptsXml) {
        res.set('Content-Type', 'application/xml');
        return res.send(xmlBuilder.buildObject(job));
    }
    res.json(job);
});

// CREATE a job — accepts JSON or XML body
app.post('/jobs', async (req, res) => {
    const contentType = req.headers['content-type'] || '';
    let data;

    try {
        if (contentType.includes('application/xml')) {
            const parsed = await parseStringPromise(req.body, { explicitArray: false });
            data = parsed.job;
        } else if (contentType.includes('application/json')) {
            data = req.body;
        } else {
            return res.status(415).json({ error: 'UNSUPPORTED_MEDIA_TYPE', message: 'Use application/json or application/xml' });
        }
    } catch (e) {
        return res.status(400).json({ error: 'MALFORMED_BODY', message: 'Could not parse request body' });
    }

    if (!data || !data.title || !data.employerId) {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            field: !data || !data.title ? 'title' : 'employerId',
            message: 'Required field missing'
        });
    }

    const newJob = {
        jobId: Date.now(),
        title: data.title,
        employerId: parseInt(data.employerId),
        accommodationType: data.accommodationType || 'Not specified',
        location: data.location || 'Not specified',
        active: true
    };
    jobs.push(newJob);

    const acceptsXml = req.headers.accept && req.headers.accept.includes('application/xml');
    res.status(201);
    if (acceptsXml) {
        res.set('Content-Type', 'application/xml');
        return res.send(xmlBuilder.buildObject(newJob));
    }
    res.json(newJob);
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'MALFORMED_BODY', message: 'Could not parse request body' });
    }
    next(err);
});

app.listen(PORT, () => console.log(`Job Listing Service running on port ${PORT}`));