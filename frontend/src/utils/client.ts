"use client";

import { createPublicClient, http } from "viem";
import { sepolia, hardhat } from "viem/chains";

// Tu déclares le type avec index signature explicite
export const publicClients: Record<
  number,
  ReturnType<typeof createPublicClient>
> = {
  11155111: createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  }),
  31337: createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  }),
};
