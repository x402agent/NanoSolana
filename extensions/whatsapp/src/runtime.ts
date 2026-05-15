import { createPluginRuntimeStore } from "nanoclawd/plugin-sdk/compat";
import type { PluginRuntime } from "nanoclawd/plugin-sdk/whatsapp";

const { setRuntime: setWhatsAppRuntime, getRuntime: getWhatsAppRuntime } =
  createPluginRuntimeStore<PluginRuntime>("WhatsApp runtime not initialized");
export { getWhatsAppRuntime, setWhatsAppRuntime };
