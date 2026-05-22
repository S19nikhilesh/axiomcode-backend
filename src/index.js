const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');
const cors = require('cors');

const http = require('http');
const { Server } = require('socket.io');
const { matchHandler } = require('./sockets/matchHandler');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['https://axiomcode.vercel.app', 'http://localhost:5173'],
        credentials: true
    }
});

const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");
const cookieParser = require('cookie-parser');
const redisClient = require("./config/redis");
const submitRouter = require('./routes/submit');

app.use(cors({
    origin: ['https://axiomcode.vercel.app', 'http://localhost:5173'],
    credentials: true
}));
app.set('trust proxy', true);

app.use(express.json());
app.use(cookieParser());
app.use("/video", videoRouter);
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);

io.on('connection', (socket) => {
    matchHandler(io, socket);
});

const InitializeConnection = async () => {
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("Connected to both DB");

        server.listen(process.env.PORT, () => {
            console.log("Server Listening at PORT number:" + process.env.PORT);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
    }
}

InitializeConnection();