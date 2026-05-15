import { createPluginRuntimeStore } from "nanoclawd/plugin-sdk/compat";
import type { PluginRuntime } from "nanoclawd/plugin-sdk/twitch";

const { setRuntime: setTwitchRuntime, getRuntime: getTwitchRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Twitch runtime not initialized");
export { getTwitchRuntime, setTwitchRuntime };
