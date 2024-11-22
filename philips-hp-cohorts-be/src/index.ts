// src/index.ts

import express, { Express, Request, Response } from 'express';
import cors from "cors";
import https from 'https';
import http from 'http';
import fs from 'fs';

import { S3Helper } from './utils/s3Helper';
import dotenv from 'dotenv';
import connectDB from "./dbConnection";

import { InsurtechRouter } from './routes/insurtechRoutes';


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8001;

const isEC2 = fs.existsSync('/etc/letsencrypt/live/events.heartcheck.app/privkey.pem') && 
              fs.existsSync('/etc/letsencrypt/live/events.heartcheck.app/fullchain.pem');

const corsOptions = {
  origin: "*",

  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Access-Control-Allow-Credentials",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Pre-flight requests
app.options("*", cors(corsOptions));


app.use(express.json());

// Connect to MongoDB
connectDB();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});


app.use("/insurtech", InsurtechRouter);


// Test S3 connection
app.get('/test-s3', async (req: Request, res: Response) => {
  try {
    const files = await S3Helper.listFiles();
    res.json({ 
      message: 'Successfully connected to S3',
      fileCount: files.length,
      sampleFiles: files.slice(0, 5)
    });
  } catch (error: any) {
    console.error('S3 connection error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to S3',
      details: error.message
    });
  }
});

// List files with optional prefix
app.get('/files/:prefix?', async (req: Request, res: Response) => {
  try {
    const files = await S3Helper.listFiles(req.params.prefix);
    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get file content
app.get('/file/:key(*)', async (req: Request, res: Response) => {
  try {
    const data = await S3Helper.getFile(req.params.key);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
app.post('/upload/:key(*)', async (req: Request, res: Response) => {
  try {
    const result = await S3Helper.uploadFile(req.params.key, req.body);
    res.json({ 
      message: 'File uploaded successfully',
      key: result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/file/:key(*)', async (req: Request, res: Response) => {
  try {
    await S3Helper.deleteFile(req.params.key);
    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});




const startServer = async () => {
  if (isEC2) {
    try {
      const httpsOptions = {
        key: fs.readFileSync('/etc/letsencrypt/live/events.heartcheck.app/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/events.heartcheck.app/fullchain.pem')
      };

      // Create HTTPS server on port 443
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(443, () => {
        console.log('🔐 HTTPS Server running on https://events.heartcheck.app');
      });

      // HTTP redirect server on port 80
      const httpServer = http.createServer((req, res) => {
        const host = req.headers.host || 'events.heartcheck.app';
        res.writeHead(301, { Location: `https://${host}${req.url}` });
        res.end();
      });
      httpServer.listen(80, () => {
        console.log('🔄 HTTP redirect server running on port 80');
      });
    } catch (error) {
      console.error('Failed to start HTTPS server:', error);
      startHttpServer();
    }
  } else {
    startHttpServer();
  }
};

const startHttpServer = () => {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
};

startServer();

export default app;