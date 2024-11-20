"use strict";
// src/index.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const s3Helper_1 = require("./utils/s3Helper");
const dotenv_1 = __importDefault(require("dotenv"));
const dbConnection_1 = __importDefault(require("./dbConnection"));
const insurtechRoutes_1 = require("./routes/insurtechRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)(corsOptions));
// Pre-flight requests
app.options("*", (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Connect to MongoDB
(0, dbConnection_1.default)();
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use("/InsurTech", insurtechRoutes_1.InsurtechRouter);
// Test S3 connection
app.get('/test-s3', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = yield s3Helper_1.S3Helper.listFiles();
        res.json({
            message: 'Successfully connected to S3',
            fileCount: files.length,
            sampleFiles: files.slice(0, 5)
        });
    }
    catch (error) {
        console.error('S3 connection error:', error);
        res.status(500).json({
            error: 'Failed to connect to S3',
            details: error.message
        });
    }
}));
// List files with optional prefix
app.get('/files/:prefix?', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = yield s3Helper_1.S3Helper.listFiles(req.params.prefix);
        res.json({ files });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Get file content
app.get('/file/:key(*)', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield s3Helper_1.S3Helper.getFile(req.params.key);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Upload file
app.post('/upload/:key(*)', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield s3Helper_1.S3Helper.uploadFile(req.params.key, req.body);
        res.json({
            message: 'File uploaded successfully',
            key: result
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Delete file
app.delete('/file/:key(*)', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield s3Helper_1.S3Helper.deleteFile(req.params.key);
        res.json({ message: 'File deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
