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
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const s3Helper_1 = require("./utils/s3Helper");
const dotenv_1 = __importDefault(require("dotenv"));
const dbConnection_1 = __importDefault(require("./dbConnection"));
const insurtechRoutes_1 = require("./routes/insurtechRoutes");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8001;
const isEC2 = fs_1.default.existsSync('/etc/letsencrypt/live/events.heartcheck.app/privkey.pem') &&
    fs_1.default.existsSync('/etc/letsencrypt/live/events.heartcheck.app/fullchain.pem');
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
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isEC2) {
        try {
            const httpsOptions = {
                key: fs_1.default.readFileSync('/etc/letsencrypt/live/events.heartcheck.app/privkey.pem'),
                cert: fs_1.default.readFileSync('/etc/letsencrypt/live/events.heartcheck.app/fullchain.pem')
            };
            // Create HTTPS server on port 443
            const httpsServer = https_1.default.createServer(httpsOptions, app);
            httpsServer.listen(443, () => {
                console.log('🔐 HTTPS Server running on https://events.heartcheck.app');
            });
            // HTTP redirect server on port 80
            const httpServer = http_1.default.createServer((req, res) => {
                const host = req.headers.host || 'events.heartcheck.app';
                res.writeHead(301, { Location: `https://${host}${req.url}` });
                res.end();
            });
            httpServer.listen(80, () => {
                console.log('🔄 HTTP redirect server running on port 80');
            });
        }
        catch (error) {
            console.error('Failed to start HTTPS server:', error);
            startHttpServer();
        }
    }
    else {
        startHttpServer();
    }
});
const startHttpServer = () => {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
};
startServer();
exports.default = app;
