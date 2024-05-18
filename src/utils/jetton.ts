import { Transaction } from "tonapi-sdk-js";

// in_msg.jetton_internal_transfer -- incoming transfer

// in_msg.jetton_transfer -- outgoing transfer
// out_msg.jetton_internal_transfer -- outgoing (incoming for someone else) transfer

export interface JettonTransfer {
  id: string;
  amount: string;
  // timetamp in seconds
  timestamp: number;
  lt: number;
}

export function getNonBouncedJettonTransfer(
  tx: Transaction,
): JettonTransfer | null {
  const amount = extractJettonAmount(tx);
  if (amount === null) {
    return null;
  }

  return { id: tx.hash, timestamp: tx.utime, amount, lt: tx.lt };
}

function extractJettonAmount(tx: Transaction): string | null {
  const inMsg = tx.in_msg ?? null;
  if (inMsg === null) {
    return null;
  }
  if (inMsg.bounced) {
    return null;
  }

  const decodedOpName = inMsg.decoded_op_name ?? null;
  if (decodedOpName !== "jetton_internal_transfer") {
    return null;
  }

  const decodedBody = inMsg.decoded_body ?? null;
  if (decodedBody === null) {
    return null;
  }

  return decodedBody.amount ?? null;
}
