import { trpc } from "../lib/trpc";
import { authRouter } from "./auth";
import { projectRouter } from "./project";
import { userRouter } from "./user";
import { shareRouter } from "./share";
import { fileRouter } from "./file";

export const trpcRouter = trpc.router({
  auth: authRouter,
  project: projectRouter,
  user: userRouter,
  share: shareRouter,
  file: fileRouter,
});

export type TrpcRouter = typeof trpcRouter;
