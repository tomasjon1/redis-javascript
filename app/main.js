const net = require("net");

const server = net.createServer((socket) => {
});

server.listen(6379, "127.0.0.1");