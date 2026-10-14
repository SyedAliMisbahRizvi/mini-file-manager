//Load Node's HTTP module so we can create a server without express.
const http = require('http');
//Load the file system module for file operations.
const fs = require('fs');
//Load the path module for safe file and folder paths.
const path = require('path');
//Load the operating system module for basic system information.
const os = require('os');

//Keep frontend files inside the public folder.
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

//Create the data folder when the server starts.
ensureDataDir();

//Create the HTTP server.
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost:3000');
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/') return serveFile(res, 'index.html', 'text/html');
    if (req.method === 'GET' && pathname === '/style.css') return serveFile(res, 'style.css', 'text/css');
    if (req.method === 'GET' && pathname === '/app.js') return serveFile(res, 'app.js', 'application/javascript');
    if (req.method === 'GET' && pathname === '/api/files') return listFiles(res);
    if (req.method === 'GET' && pathname.startsWith('/api/files/')) return readFile(res, pathname.replace('/api/files/', ''));
    if (req.method === 'POST' && pathname === '/api/files') return saveFile(req, res);
    if (req.method === 'DELETE' && pathname.startsWith('/api/files/')) return deleteFile(res, pathname.replace('/api/files/', ''));
    if (req.method === 'GET' && pathname === '/api/system') return sendSystemInfo(res);

    sendJSON(res, 404, { error: 'Not found.' });
});

server.listen(3000, () => console.log('Mini File Manager: http://localhost:3000'));

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function serveFile(res, fileName, contentType) {
    const filePath = path.join(PUBLIC_DIR, fileName);

    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(500);
            res.end('Could not load file.');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

function readBody(req, callback) {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1000000) {
            req.destroy();
            callback(new Error('Request too large.'));
        }
    });

    req.on('end', () => {
        if (!body) {
            callback(null, {});
            return;
        }

        try {
            callback(null, JSON.parse(body));
        } catch (error) {
            callback(new Error('Invalid JSON.'));
        }
    });
}

function saveFile(req, res) {
    readBody(req, (error, body) => {
        if (error) {
            sendJSON(res, 400, { error: error.message });
            return;
        }

        const fileName = normalizeFileName(body.filename);
        const content = String(body.content || '');

        if (!fileName) {
            sendJSON(res, 400, { error: 'Please enter a valid file name.' });
            return;
        }

        const filePath = path.join(DATA_DIR, fileName);
        const exists = fs.existsSync(filePath);

        fs.writeFile(filePath, content, 'utf8', (writeError) => {
            if (writeError) {
                sendJSON(res, 500, { error: 'Could not save file.' });
                return;
            }

            sendJSON(res, 200, {
                message: exists ? 'File updated successfully.' : 'File created successfully.'
            });
        });
    });
}

function listFiles(res) {
    fs.readdir(DATA_DIR, { withFileTypes: true }, (error, entries) => {
        if (error) {
            sendJSON(res, 500, { error: 'Could not read files.' });
            return;
        }

        const files = entries
            .filter((entry) => entry.isFile())
            .map((entry) => {
                const filePath = path.join(DATA_DIR, entry.name);
                const stats = fs.statSync(filePath);
                return {
                    name: entry.name,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        sendJSON(res, 200, files);
    });
}

function readFile(res, fileName) {
    const filePath = resolveFilePath(fileName);

    if (!filePath) {
        sendJSON(res, 400, { error: 'Invalid file name.' });
        return;
    }

    fs.readFile(filePath, 'utf8', (error, content) => {
        if (error) {
            sendJSON(res, 404, { error: 'File not found.' });
            return;
        }

        sendJSON(res, 200, {
            name: path.basename(filePath),
            content: content
        });
    });
}

function deleteFile(res, fileName) {
    const filePath = resolveFilePath(fileName);

    if (!filePath) {
        sendJSON(res, 400, { error: 'Invalid file name.' });
        return;
    }

    fs.unlink(filePath, (error) => {
        if (error) {
            sendJSON(res, 404, { error: 'File not found.' });
            return;
        }

        sendJSON(res, 200, { message: 'File deleted successfully.' });
    });
}

function sendSystemInfo(res) {
    const info = {
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        uptime: os.uptime()
    };

    sendJSON(res, 200, info);
}

function sendJSON(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

function normalizeFileName(fileName) {
    if (typeof fileName !== 'string') return '';

    const cleaned = fileName.trim();
    if (!cleaned) return '';

    const safeName = path.basename(cleaned);
    if (!safeName || safeName === '.' || safeName === '..') return '';

    return safeName;
}

function resolveFilePath(fileName) {
    const safeName = normalizeFileName(fileName);
    if (!safeName) return null;

    const filePath = path.join(DATA_DIR, safeName);
    const relative = path.relative(DATA_DIR, filePath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }

    return filePath;
}
 