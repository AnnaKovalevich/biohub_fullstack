import { initTRPC } from "@trpc/server";
import _ from "lodash";
import { z } from "zod";

const ideas = _.times(100, (i) => ({
  nick: `cool-idea-nick-${i}`,
  name: `Idea ${i}`,
  description: `Description of idea ${i}...`,
  text: _.times(100, (j) => `<p>Text paragrph ${j} of idea ${i}...</p>`).join(
    "",
  ),
}));

const trpc = initTRPC.create();

export const trpcRouter = trpc.router({
  // Процедура для получения списка идей
  getIdeas: trpc.procedure.query(() => {
    return { ideas }; //  просто возвращаем весь массив
  }),

  // Процедура для получения одной идеи по nick
  getIdea: trpc.procedure
    .input(z.object({ biohub: z.string() }))
    .query(({ input }) => {
      const idea = ideas.find((idea) => idea.nick === input.biohub);
      if (!idea) {
        throw new Error("Idea not found");
      }
      return { idea };
    }),
});

export type TrpcRouter = typeof trpcRouter;
