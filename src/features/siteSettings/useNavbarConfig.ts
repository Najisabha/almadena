import { useCallback, useEffect, useState } from "react";
import { loadNavbarConfig, saveNavbarConfig } from "./navbar.service";
import { NavbarConfig } from "./navbar.types";
import { defaultNavbarConfig } from "./navbar.defaults";

export function useNavbarConfig() {
  const [config, setConfig] = useState<NavbarConfig>(defaultNavbarConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const result = await loadNavbarConfig();
    setConfig(result.config);
    setWarning(result.warning ?? null);
    setIsLoading(false);
  }, []);

  const persist = useCallback(async (nextConfig: NavbarConfig) => {
    setConfig(nextConfig);
    const { error } = await saveNavbarConfig(nextConfig);
    return { error };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    config,
    setConfig,
    isLoading,
    warning,
    refresh,
    persist,
  };
}
