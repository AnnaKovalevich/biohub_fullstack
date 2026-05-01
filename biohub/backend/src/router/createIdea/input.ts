import { z } from "zod";

export const zCreateIdeaTrpcInput = z.object({
  name: z.string().min(1),
  nick: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      "Nick may contain only lowercase letters, numbers and dashes",
    ),
  description: z.string().min(1),
  text: z.string().min(100, "Text should be at least 100 characters long"),
});
