// src/index.ts

import express, { Express, Request, Response } from 'express';
import cors from "cors";

import { S3Helper } from './utils/s3Helper';
import dotenv from 'dotenv';
import connectDB from "./dbConnection";

import { InsurtechRouter } from './routes/insurtechRoutes';


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;

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


app.use("/InsurTech", InsurtechRouter);


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

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});