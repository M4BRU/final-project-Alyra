"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, zksync, sepolia } from "wagmi/chains";

export default getDefaultConfig({
  appName: "Bout App",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [anvil, zksync, sepolia],
  ssr: false,
});
