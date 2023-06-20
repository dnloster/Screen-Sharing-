import express from "express";
import http from "http";
import { Server } from "socket.io";
import username from "username-generator";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

app.use(express.static("./client/build"));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});

const users = {};

io.on("connection", (socket) => {
    const userid = username.generateUsername();
    if (!users[userid]) {
        users[userid] = socket.id;
    }

    // send back username
    socket.emit("yourID", userid);
    io.sockets.emit("allUsers", users);

    socket.on("disconnect", () => {
        delete users[userid];
    });

    socket.on("callUser", (data) => {
        io.to(users[data.userToCall]).emit("calling", {
            signal: data.signalData,
            from: data.from,
        });
    });

    socket.on("acceptCall", (data) => {
        io.to(users[data.to]).emit("callAccepted", data.signal);
    });

    socket.on("close", (data) => {
        io.to(users[data.to]).emit("close");
    });

    socket.on("rejected", (data) => {
        io.to(users[data.to]).emit("rejected");
    });
});

const port = process.env.PORT || 4444;

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
