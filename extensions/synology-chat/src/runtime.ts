import { createPluginRuntimeStore } from "nanoclawd/plugin-sdk/compat";
import type { PluginRuntime } from "nanoclawd/plugin-sdk/synology-chat";

const { setRuntime: setSynologyRuntime, getRuntime: getSynologyRuntime } =
  createPluginRuntimeStore<PluginRuntime>(
    "Synology Chat runtime not initialized - plugin not registered",
  );
export { getSynologyRuntime, setSynologyRuntime };
