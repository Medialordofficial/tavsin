import { clusterApiUrl } from "@solana/web3.js";

export type TavsinCluster = "localnet" | "devnet" | "mainnet-beta";

function normalizeCluster(value?: string | null): TavsinCluster {
  if (value === "mainnet" || value === "mainnet-beta") {
    return "mainnet-beta";
  }

  if (value === "localnet" || value === "localhost") {
    return "localnet";
  }

  return "devnet";
}

export function getDefaultRpcEndpoint(cluster: TavsinCluster) {
  if (cluster === "localnet") {
    return "http://127.0.0.1:8899";
  }

  return clusterApiUrl(cluster === "mainnet-beta" ? "mainnet-beta" : "devnet");
}

export function getPublicCluster() {
  return normalizeCluster(process.env.NEXT_PUBLIC_SOLANA_CLUSTER);
}

export function getPublicRpcEndpoint() {
  return (
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    getDefaultRpcEndpoint(getPublicCluster())
  );
}

export function getServerCluster() {
  return normalizeCluster(
    process.env.TAVSIN_SOLANA_CLUSTER || process.env.NEXT_PUBLIC_SOLANA_CLUSTER
  );
}

export function getServerRpcEndpoint() {
  return (
    process.env.TAVSIN_SOLANA_RPC_URL ||
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    getDefaultRpcEndpoint(getServerCluster())
  );
}

export function getClusterLabel(cluster: TavsinCluster) {
  if (cluster === "mainnet-beta") {
    return "Mainnet";
  }

  if (cluster === "localnet") {
    return "Localnet";
  }

  return "Devnet";
}

export function getClusterTone(cluster: TavsinCluster) {
  if (cluster === "mainnet-beta") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (cluster === "localnet") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-200";
  }

  return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
}
