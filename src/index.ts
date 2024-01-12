import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { env } from "hono/adapter";

const app = new Hono().basePath("/fxxk-now-news");

app.get("/redirect/:id", async (c) => {
  const { SUPABASE_URL, SUPABASE_KEY } = env<{
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
  }>(c);
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  const id = parseInt(c.req.param("id"));
  const { data, error } = await client
    .from("urls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Internal Server Error");
  }

  if (!data) {
    return c.notFound();
  }

  const url = data.url;
  c.executionCtx.waitUntil(
    Promise.all([client.rpc("increment_views", { row_id: id })])
  );

  return c.redirect(url, 301);
});

export default app;
