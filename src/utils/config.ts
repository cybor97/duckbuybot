let dexConfig: Map<string, string> | null = null;
/**
 * @returns {Map<string, string>} interface_name => display_name
 */
export function getDexConfig(): Map<string, string> {
  if (dexConfig === null) {
    const rawData =
      process.env.DEX_CONFIG ?? "stonfi_router:STON.fi,dedust_vault:DeDust";
    dexConfig = new Map<string, string>();

    for (const line of rawData.split(",")) {
      const [interfaceName, displayName] = line.split(":");
      dexConfig.set(interfaceName.trim(), displayName.trim());
    }
  }
  return dexConfig;
}
