import { getArgValue } from "@/utils/index";
import { LogLevel, createLogger } from "@/utils/logger";

const logger = createLogger("FigmaConfig", LogLevel.INFO);

// Priority: get from command line arguments first, then from environment variables
export const DEFAULT_PERSONAL_TOKEN =
  getArgValue("figma-api-key") ||
  process.env.FIGMA_API_KEY ||
  process.env.personalToken ||
  "";

export const serverName = "F2C MCP";
export const serverVersion = process.env.FIGMA_VERSION || "0.0.1";
logger.debug("DEFAULT_PERSONAL_TOKEN", DEFAULT_PERSONAL_TOKEN);
