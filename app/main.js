const net = require("net");

const TERMINATOR = "\r\n";

const simpleString = s => `+${s}`;

const handlePing = () => {
    return [simpleString("PONG")];
};

function handleData(data)
{
    const resp = handlePing();
    resp.push("");
    return resp.join(TERMINATOR);
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    socket.write(handleData(data));
  });
});

server.listen(6379, "127.0.0.1");