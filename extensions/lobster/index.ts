import type {
  AnyAgentTool,
  NanoClawdPluginApi,
  NanoClawdPluginToolFactory,
} from "nanoclawd/plugin-sdk/lobster";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: NanoClawdPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as NanoClawdPluginToolFactory,
    { optional: true },
  );
}
