import os from "node:os";
import path from "node:path";
import type { PluginRuntime } from "nanoclawd/plugin-sdk/msteams";

export const msteamsRuntimeStub = {
  state: {
    resolveStateDir: (env: NodeJS.ProcessEnv = process.env, homedir?: () => string) => {
      const override = env.NANOCLAWD_STATE_DIR?.trim() || env.NANOCLAWD_STATE_DIR?.trim();
      if (override) {
        return override;
      }
      const resolvedHome = homedir ? homedir() : os.homedir();
      return path.join(resolvedHome, ".nanoclawd");
    },
  },
} as unknown as PluginRuntime;
