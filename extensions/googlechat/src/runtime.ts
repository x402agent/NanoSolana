import { createPluginRuntimeStore } from "nanoclawd/plugin-sdk/compat";
import type { PluginRuntime } from "nanoclawd/plugin-sdk/googlechat";

const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Google Chat runtime not initialized");
export { getGoogleChatRuntime, setGoogleChatRuntime };
