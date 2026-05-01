import { z } from "zod";
import { ideas } from "../../lib/ideas";
import { trpc } from "../../lib/trpc";
import { zCreateIdeaTrpcInput } from "./input";

export const createIdeaTrpcRoute = trpc.procedure
  .input(zCreateIdeaTrpcInput)
  .mutation(({ input }) => {
    if (ideas.find((idea) => idea.nick === input.nick)) {
      throw Error("Idea with this nick already exists");
    }
    ideas.unshift(input);
    return true;
  });
