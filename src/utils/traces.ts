import { Trace } from "tonapi-sdk-js";

export function findInterface(trace: Trace, iName: string): string | null {
  if (!trace.interfaces) {
    return null;
  }

  if (trace.interfaces.includes(iName)) {
    return trace.transaction.hash;
  }

  if (!trace.children) {
    return null;
  }

  for (const childTrace of trace.children) {
    const interfaceHash = findInterface(childTrace, iName);
    if (interfaceHash !== null) {
      return interfaceHash;
    }
  }

  return null;
}
