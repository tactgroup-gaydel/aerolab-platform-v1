import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createActRequest, getActRequestCount, getAirports, getAirportsCount, getAirportsStats, getCountryIndicators } from "./db";
import { analyses, articles, countries, indicators, infrastructures, markets, projects, searchContent, sectors } from "@shared/content";
import { connectorCatalog, preparedConnectors } from "./connectors";
import { getMobilitySnapshot } from "./dataEngine";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  content: router({
    summary: publicProcedure.query(() => ({
      articles: articles.length,
      countries: countries.length,
      sectors: sectors.length,
      markets: markets.length,
      infrastructures: infrastructures.length,
      indicators: indicators.length,
      analyses: analyses.length,
      projects: projects.length,
    })),
    directory: publicProcedure.query(() => ({ articles, countries, sectors, markets, infrastructures, indicators, analyses, projects })),
    search: publicProcedure
      .input(z.object({ q: z.string().trim().min(1), locale: z.enum(["fr", "en"]) }))
      .query(({ input }) => searchContent(input.q, input.locale)),
  }),
  dataEngine: router({
    sources: publicProcedure.query(() => ({
      active: connectorCatalog.filter((source) => source.status === "active"),
      prepared: preparedConnectors,
      catalog: connectorCatalog,
    })),
    snapshot: publicProcedure.query(() => getMobilitySnapshot()),
    mapEntities: publicProcedure.query(async () => ({
      countries: countries.map((country) => ({ ...country, source: "aerolab-api" as const })),
      infrastructures: infrastructures.map((infrastructure) => ({ ...infrastructure, source: "aerolab-api" as const })),
      mobility: (await getMobilitySnapshot()).observations,
    })),
    airports: publicProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).optional(),
          offset: z.number().int().min(0).optional(),
          search: z.string().trim().optional(),
          countryCode: z.string().trim().length(2).optional(),
        }).optional(),
      )
      .query(async ({ input }) => {
        const params = input ?? {};
        const [rows, total] = await Promise.all([
          getAirports(params),
          getAirportsCount(params),
        ]);
        return {
          rows: rows.map((row) => ({ ...row, source: "ourairports" as const })),
          total,
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
        };
      }),
    airportsStats: publicProcedure.query(async () => ({
      ...(await getAirportsStats()),
      source: "ourairports" as const,
    })),
    countryIndicators: publicProcedure
      .input(
        z.object({
          indicatorCode: z.string().trim().optional(),
          countryCodes: z.array(z.string().trim()).max(300).optional(),
        }).optional(),
      )
      .query(async ({ input }) => {
        const rows = await getCountryIndicators(input ?? {});
        return {
          rows: rows.map((row) => ({ ...row, source: "worldbank" as const })),
          total: rows.length,
        };
      }),
  }),
  act: router({
    create: publicProcedure
      .input(z.object({
        name: z.string().trim().min(2),
        organization: z.string().trim().min(2),
        email: z.string().email(),
        country: z.string().trim().min(2),
        sector: z.string().trim().min(2),
        description: z.string().trim().min(10),
      }))
      .mutation(({ input }) => createActRequest(input)),
    count: publicProcedure.query(() => getActRequestCount()),
  }),
});

export type AppRouter = typeof appRouter;
