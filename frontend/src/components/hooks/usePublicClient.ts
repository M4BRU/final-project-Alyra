"use client";

// hooks/usePublicClient.ts
import { useChainId } from "wagmi";
import { publicClients } from "@/utils/client";

export const usePublicClient = () => {
  const chainId = useChainId();
  return publicClients[chainId];
};
