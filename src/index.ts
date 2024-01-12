import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { env } from "hono/adapter";

const app = new Hono();

app.get("/redirect/:id", async (c) => {
  const { SUPABASE_URL, SUPABASE_KEY } = env<{
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
  }>(c);
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  const id = parseInt(c.req.param('id'));
  const { data, error } = await client.from('urls').select('*').eq('id', id);

  if (error) {
    throw new Error('Internal Server Error');
  }

  if (!data.length) {
    return c.notFound();
  }

  const url = data[0].url;
  return c.redirect(url, 301);
});

export default app;
