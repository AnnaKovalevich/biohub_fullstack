import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { type Express } from "express";
import { type TrpcRouter } from "../router";
import { type TrpcContext } from "./trpcContext";

export const trpc = initTRPC.context<TrpcContext>().create();

export const applyTrpcToExpressApp = (
  expressApp: Express,
  createContext: (opts: trpcExpress.CreateExpressContextOptions) => TrpcContext,
  router: TrpcRouter,
) => {
  expressApp.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router,
      createContext,
    }),
  );
};
