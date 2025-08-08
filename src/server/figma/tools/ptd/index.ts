import { randomUUID } from "node:crypto";
import { createLogger } from "@/utils/logger";
import {
  CommandProgressUpdate,
  type FigmaCommand,
  type ProgressMessage,
} from "../../types/design";
const logger = createLogger("ptdTool");
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const initialReconnectDelay = 1000;
let currentChannel: string | null = null;
const args = process.argv.slice(2);
const serverArg = args.find((arg) => arg.startsWith("--server="));
const serverUrl = serverArg ? serverArg.split("=")[1] : "localhost";
const WS_URL =
  serverUrl === "localhost" ? `ws://${serverUrl}` : `wss://${serverUrl}`;
const pendingRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    timeout: ReturnType<typeof setTimeout>;
    lastActivity: number; // Add timestamp for last activity
  }
>();
function connectToFigma(port = 3055) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    logger.info("Already connected to Figma");
    return;
  }

  const wsUrl = serverUrl === "localhost" ? `${WS_URL}:${port}` : WS_URL;
  logger.info(`Connecting to Figma socket server at ${wsUrl}...`);
  ws = new WebSocket(wsUrl);
  logger.info("Connecting", ws.readyState, WebSocket.OPEN);
  ws.onopen = () => {
    logger.info("Successfully connected to Figma socket server");
    currentChannel = null;
    reconnectAttempts = 0;
  };
  ws.onmessage = (event) => {
    try {
      const json = JSON.parse(event.data) as ProgressMessage;
      logger.log("onmessage" + JSON.stringify(json));
      if (json.type === "ping") {
        ws?.send(JSON.stringify({ type: "pong" }));
        return;
      }
      const myResponse = json.message;
      if (
        myResponse.id &&
        pendingRequests.has(myResponse.id) &&
        myResponse.result
      ) {
        const request = pendingRequests.get(myResponse.id)!;
        clearTimeout(request.timeout);

        if (myResponse.error) {
          logger.error(`Error from Figma: ${myResponse.error}`);
          request.reject(new Error(myResponse.error));
        } else {
          if (myResponse.result) {
            request.resolve(myResponse.result);
          }
        }

        pendingRequests.delete(myResponse.id);
      } else {
        // Handle broadcast messages or events
        logger.info(
          `Received broadcast message: ${JSON.stringify(myResponse)}`
        );
      }
    } catch (error) {
      logger.error(
        `Error parsing message: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };
  ws.onerror = (error) => {
    logger.error(
      `Socket error: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  };

  ws.onclose = (event) => {
    logger.info(
      `Disconnected from Figma socket server, Code: ${event.code}, Reason: ${event.reason}`
    );
    ws = null;

    for (const [id, request] of pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error("Connection closed"));
      pendingRequests.delete(id);
    }

    if (reconnectAttempts < maxReconnectAttempts) {
      const reconnectDelay =
        initialReconnectDelay * 2 ** reconnectAttempts;
      logger.info(
        `Attempting to reconnect in ${
          reconnectDelay / 1000
        } seconds... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`
      );
      setTimeout(() => connectToFigma(port), reconnectDelay);
      reconnectAttempts++;
    } else {
      logger.error("Max reconnection attempts reached. Will not try again.");
    }
  };
}
async function start() {
  try {
    console.log("FigmaMCP server starting...");
    // Try to connect to Figma socket server
    const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3055;
    connectToFigma(port);
  } catch (error) {
    logger.warn(
      `Could not connect to Figma initially: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    logger.warn("Will try to connect when the first command is sent");
  }

  // Start the MCP server with stdio transport
  // const transport = new StdioServerTransport();
  // await server.connect(transport);
  logger.info("FigmaMCP server running on stdio");
}

async function joinChannel(channelName: string): Promise<void> {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error("Not connected to Figma");
  }

  try {
    await sendCommandToFigma("join", { channel: channelName });
    currentChannel = channelName;
    logger.info(`Joined channel: ${channelName}`);
  } catch (error) {
    logger.error(
      `Failed to join channel: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

function sendCommandToFigma(
  command: FigmaCommand,
  params: unknown = {},
  timeoutMs = 30000
): Promise<unknown> {
  logger.info(`sendCommandToFigmaReq`, command, params);
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectToFigma();
      reject(new Error("Not connected to Figma. Attempting to connect..."));
      return;
    }
    const requiresChannel = command !== "join";
    if (requiresChannel && !currentChannel) {
      reject(new Error("Must join a channel before sending commands"));
      return;
    }
    const id = randomUUID();
    const request = {
      id,
      type: command === "join" ? "join" : "message",
      ...(command === "join"
        ? { channel: (params as any).channel }
        : { channel: currentChannel }),
      message: {
        id,
        command,
        params: {
          ...(params as any),
          commandId: id, // Include the command ID in params
        },
      },
    };
    logger.info(`Sending command to Figma: ${JSON.stringify(request)}`);

    // Set timeout for request
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        const { reject: _, ...rest } = pendingRequests.get(id)!;
        logger.error(
          `Request to Figma timed out after ${
            timeoutMs / 1000
          } seconds. Request details: ${JSON.stringify(rest)}`
        );
        pendingRequests.delete(id);
        reject(new Error("Request to Figma timed out"));
      }
    }, timeoutMs);

    // Store the promise callbacks to resolve/reject later
    pendingRequests.set(id, {
      resolve,
      reject,
      timeout,
      lastActivity: Date.now(),
    });

    // Send the request
    logger.info(`Request details: ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));
  });
}

export { start, connectToFigma, sendCommandToFigma, joinChannel };
