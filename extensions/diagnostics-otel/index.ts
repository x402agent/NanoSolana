import type { NanoClawdPluginApi } from "nanoclawd/plugin-sdk/diagnostics-otel";
import { emptyPluginConfigSchema } from "nanoclawd/plugin-sdk/diagnostics-otel";
import { createDiagnosticsOtelService } from "./src/service.js";

const plugin = {
  id: "diagnostics-otel",
  name: "Diagnostics OpenTelemetry",
  description: "Export diagnostics events to OpenTelemetry",
  configSchema: emptyPluginConfigSchema(),
  register(api: NanoClawdPluginApi) {
    api.registerService(createDiagnosticsOtelService());
  },
};

export default plugin;
