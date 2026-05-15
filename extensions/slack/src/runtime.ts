import { createPluginRuntimeStore } from "nanoclawd/plugin-sdk/compat";
import type { PluginRuntime } from "nanoclawd/plugin-sdk/slack";

const { setRuntime: setSlackRuntime, getRuntime: getSlackRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Slack runtime not initialized");
export { getSlackRuntime, setSlackRuntime };
