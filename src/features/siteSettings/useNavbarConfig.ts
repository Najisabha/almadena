import { useCallback, useEffect, useState } from "react";
import { loadNavbarConfig } from "./navbar.service";
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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    config,
    isLoading,
    warning,
    refresh,
  };
}
