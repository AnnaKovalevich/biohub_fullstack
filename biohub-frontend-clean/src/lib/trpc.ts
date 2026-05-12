import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { TrpcRouter } from "./types";

export const trpc = createTRPCReact<TrpcRouter>();

const getBaseUrl = () => {
  // В браузере используем localhost:3000
  if (typeof window !== "undefined") {
    return "http://localhost:3000";
  }
  // На сервере тоже
  return "http://localhost:3000";
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers() {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
