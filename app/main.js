const net = require("net");

const database = new Map();
const TERMINATOR = "\r\n";
const NULL = "$-1";

const commandEnum = Object.freeze({
    PING: "ping",
    ECHO: "echo",
    SET: "set",
    GET: "get"
})

function parseRequest(requestBuffer) {
  const arrayHeaderEnd = requestBuffer.indexOf(TERMINATOR);
  const itemCount = Number(
    requestBuffer.subarray(1, arrayHeaderEnd).toString()
  );

  let cursor = arrayHeaderEnd + TERMINATOR.length;
  const items = [];

  for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
    const lengthHeaderEnd = requestBuffer.indexOf(TERMINATOR, cursor);
    const itemByteLength = Number(
      requestBuffer.subarray(cursor + 1, lengthHeaderEnd).toString()
    );

    const itemStart = lengthHeaderEnd + TERMINATOR.length;
    const itemEnd = itemStart + itemByteLength;
    const item = requestBuffer.subarray(itemStart, itemEnd).toString();

    items.push(item);
    cursor = itemEnd + TERMINATOR.length;
  }

  return items;
}

const simpleString = s => `+${s}`;

const handlePing = () => {
    return [simpleString("PONG")];
};

const handleEcho = (args) => {
    const [message] = args;
    return [`$${Buffer.byteLength(message)}`, message]
}

const handleSet = (args) => {
    const [key, value] = args;
    const entry = { value };

    database.set(key, entry);
    return [simpleString("OK")];
};

const handleGet = (args) =>{
    const [key] =  args;
    const item = database.get(key);
    if (item === undefined) 
    {
        return [NULL];
    }
    return [`$${Buffer.byteLength(item.value)}`, item.value];
}

function handleCommand(rawCommand, args)
{
    const command = rawCommand.toLowerCase();
    switch(command){
        case commandEnum.PING:
           return handlePing();
        case commandEnum.ECHO:
            return handleEcho(args)
        case commandEnum.SET:
            return handleSet(args)
        case commandEnum.GET:
            return handleGet(args)
    }
}

function handleData(data)
{
    const [rawCommand, ...args] = parseRequest(data);
    const resp = handleCommand(rawCommand, args);
    resp.push("");
    return resp.join(TERMINATOR);
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    socket.write(handleData(data));
  });
});

server.listen(6379, "127.0.0.1");