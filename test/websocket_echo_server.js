// Standalone WebSocket echo server for the libcurl WebSocket tests.
//
// The libcurl WebSocket client performs the HTTP upgrade synchronously on the
// JS thread (curl_easy_perform in the constructor), so an in-process server
// deadlocks: the server can never process the connection while the client's
// event loop is blocked. Running the echo server in its own process avoids
// that, and matches the suite's existing pattern of isolating native code in
// child processes (see the HTTP/3 crash scenarios).
//
// Usage: node test/websocket_echo_server.js
// Prints `WS_ECHO_PORT=<port>` on stdout once listening, then echoes every
// complete text/binary message back to its sender.
const http = require("http");
const crypto = require("crypto");

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function sendWsFrame(socket, opcode, payload) {
    const len = payload.length;
    let header;
    if (len < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x80 | opcode;
        header[1] = len;
    } else if (len <= 0xffff) {
        header = Buffer.alloc(4);
        header[0] = 0x80 | opcode;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x80 | opcode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }
    socket.write(Buffer.concat([header, payload]));
}

// Parses one WebSocket frame (client frames are masked per RFC 6455).
// Returns { fin, opcode, payload, consumed } or null when incomplete.
function parseWsFrame(buffer) {
    if (buffer.length < 2) return null;
    const b0 = buffer[0];
    const b1 = buffer[1];
    const fin = (b0 & 0x80) !== 0;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let offset = 2;
    if (len === 126) {
        if (buffer.length < 4) return null;
        len = buffer.readUInt16BE(2);
        offset = 4;
    } else if (len === 127) {
        if (buffer.length < 10) return null;
        len = Number(buffer.readBigUInt64BE(2));
        offset = 10;
    }
    let maskKey = null;
    if (masked) {
        if (buffer.length < offset + 4) return null;
        maskKey = buffer.subarray(offset, offset + 4);
        offset += 4;
    }
    if (buffer.length < offset + len) return null;
    let payload = buffer.subarray(offset, offset + len);
    if (maskKey) {
        payload = Buffer.from(payload);
        for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskKey[i & 3];
        }
    }
    return { fin, opcode, payload, consumed: offset + len };
}

function createWebSocketEchoServer() {
    const server = http.createServer((_req, res) => {
        res.statusCode = 400;
        res.end("websocket upgrade required");
    });

    const sockets = new Set();
    const stats = { connections: 0, messages: 0, bytes: 0, closes: 0 };

    server.on("upgrade", (req, socket, head) => {
        const key = req.headers["sec-websocket-key"];
        if (!key) {
            socket.destroy();
            return;
        }
        const accept = crypto
            .createHash("sha1")
            .update(key + WS_GUID)
            .digest("base64");
        socket.write(
            "HTTP/1.1 101 Switching Protocols\r\n" +
                "Upgrade: websocket\r\n" +
                "Connection: Upgrade\r\n" +
                `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
        );
        sockets.add(socket);
        stats.connections += 1;
        socket.on("error", () => {});
        socket.on("close", () => {
            sockets.delete(socket);
            stats.closes += 1;
        });

        let buffer = Buffer.from(head);
        let current = null; // fragmented message being assembled
        socket.on("data", (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
            for (;;) {
                let frame;
                try {
                    frame = parseWsFrame(buffer);
                } catch {
                    socket.destroy();
                    return;
                }
                if (!frame) break;
                buffer = buffer.subarray(frame.consumed);

                if (frame.opcode === 0x8) {
                    // close: reply and end the TCP connection
                    sendWsFrame(socket, 0x8, frame.payload);
                    socket.end();
                    return;
                }
                if (frame.opcode === 0x9) {
                    sendWsFrame(socket, 0xa, frame.payload); // ping -> pong
                    continue;
                }
                if (frame.opcode === 0xa) continue; // pong, ignore
                if (frame.opcode === 0x1 || frame.opcode === 0x2) {
                    current = { opcode: frame.opcode, chunks: [frame.payload] };
                    if (frame.fin) {
                        sendWsFrame(socket, frame.opcode, Buffer.concat(current.chunks));
                        stats.messages += 1;
                        stats.bytes += current.chunks[0].length;
                        current = null;
                    }
                } else if (frame.opcode === 0x0 && current) {
                    current.chunks.push(frame.payload);
                    if (frame.fin) {
                        const payload = Buffer.concat(current.chunks);
                        sendWsFrame(socket, current.opcode, payload);
                        stats.messages += 1;
                        stats.bytes += payload.length;
                        current = null;
                    }
                }
            }
        });
    });

    return { server, stats };
}

async function main() {
    const { server } = createWebSocketEchoServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("failed to start websocket echo server");
    }
    console.log(`WS_ECHO_PORT=${address.port}`);
    process.stdout.on("error", () => {}); // ignore EPIPE when the parent dies
}

if (require.main === module) {
    process.on("uncaughtException", (error) => {
        console.error("WS_ECHO_SERVER uncaughtException:", error);
        process.exit(2);
    });
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { createWebSocketEchoServer };
