"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, zksync, sepolia, polygonAmoy } from "wagmi/chains";

export default getDefaultConfig({
  appName: "Bout App",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [sepolia, polygonAmoy, anvil, zksync],
  ssr: false,
});
