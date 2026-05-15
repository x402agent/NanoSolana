import type { NanoClawdPluginApi } from "nanoclawd/plugin-sdk/googlechat";
import { emptyPluginConfigSchema } from "nanoclawd/plugin-sdk/googlechat";
import { googlechatDock, googlechatPlugin } from "./src/channel.js";
import { setGoogleChatRuntime } from "./src/runtime.js";

const plugin = {
  id: "googlechat",
  name: "Google Chat",
  description: "NanoClawd Google Chat channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: NanoClawdPluginApi) {
    setGoogleChatRuntime(api.runtime);
    api.registerChannel({ plugin: googlechatPlugin, dock: googlechatDock });
  },
};

export default plugin;
