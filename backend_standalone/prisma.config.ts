import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: "postgresql://biohub:biohub@localhost:5432/biohub?schema=public",
  },
});

// import { defineConfig } from "prisma/config";

// export default defineConfig({
//   datasource: {
//     url: process.env.DATABASE_URL!, // URL будет подхвачен из .env
//   },
// });
