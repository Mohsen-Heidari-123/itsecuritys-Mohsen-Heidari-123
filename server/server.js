const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const https = require('https');
const fs = require('fs');

const app = express();
const HTTP_PORT = 8080;
const HTTPS_PORT = 8443;

// Förbered för HTTPS
const privateKey = fs.readFileSync('certs/selfsigned.key', 'utf8');
const certificate = fs.readFileSync('certs/selfsigned.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };


const JWT_SECRET = "MY_LONG_AND_SECRET_TOKEN_AT_LEAST_192BIT_LONG_TO_BE_SAFE!";

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Tillåt frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- In-memory "databas" ---

let users = [];
let messages = [];
let nextUserId = 1;
let nextMessageId = 1;

// --- Hjälpfunktioner ---

function generateToken(userId, username) {
    return jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ status: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ status: 'UNAUTHORIZED', message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

function sendApiResponse(res, status, message) {
    res.json({ status, message });
}

// --- Endpoints ---

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return sendApiResponse(res, 'ERROR', 'Username and password required');
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return sendApiResponse(res, 'ERROR', 'User already exists');
    }

    const newUser = {
        id: nextUserId++,
        username,
        password 
    };

    users.push(newUser);
    sendApiResponse(res, 'SUCCESS', 'User created');
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = generateToken(user.id, user.username);
        sendApiResponse(res, 'SUCCESS', token);
    } else {
        sendApiResponse(res, 'UNAUTHORIZED', 'Invalid Username or Password');
    }
});

app.get('/api/user', verifyToken, (req, res) => {
    const action = req.query.action;
    const search = req.query.search;

    if (action === 'SEARCH' && search) {
        const foundUsers = users
            .filter(u => u.username.toLowerCase().includes(search.toLowerCase()))
            .map(u => ({ id: u.id, username: u.username })); 
        
        return res.json({ users: foundUsers });
    }

    const currentUser = users.find(u => u.id === req.user.id);
    if (currentUser) {
        return res.json({ users: [{ id: currentUser.id, username: currentUser.username }] });
    }

    return res.status(404).json({ users: [] });
});

app.get('/api/message', verifyToken, (req, res) => {
    const userMessages = messages.filter(m => m.to === req.user.id);
    res.json({ messages: userMessages });
});

app.post('/api/message', verifyToken, (req, res) => {
    const { from, to, message } = req.body;

    if (!to || !message) {
        return sendApiResponse(res, 'ERROR', 'Missing fields');
    }

    const recipient = users.find(u => u.id === to);
    if (!recipient) {
        return sendApiResponse(res, 'ERROR', 'Unknown receiving user');
    }

    const newMessage = {
        id: nextMessageId++,
        from,
        to,
        message,
        fromUsername: users.find(u => u.id === from)?.username || 'Unknown',
        toUsername: recipient.username
    };

    messages.push(newMessage);
    sendApiResponse(res, 'SUCCESS', 'Message created');
});


const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(HTTP_PORT, () => {
    console.log(`🚀 HTTP Server kör på http://localhost:${HTTP_PORT}`);
    console.log(`⚠️  OBS: Denna server är INTE säker för produktion!`);
});

httpsServer.listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS Server kör på https://localhost:${HTTPS_PORT}`);
    console.log(`⚠️  OBS: Denna server är INTE säker för produktion!`);
});
