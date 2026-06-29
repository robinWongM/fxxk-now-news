import { Hono } from "hono";
import { env } from "hono/adapter";

type Bindings = {
  DB: D1Database;
};

const app = new Hono().basePath("/fxxk-now-news");

app.get("/redirect/:id", async (c) => {
  const { DB } = env<Bindings>(c);
  const id = c.req.param("id");

  if (!/^\d+$/.test(id)) {
    return c.notFound();
  }

  const row = await DB.prepare("SELECT url FROM urls WHERE id = ?")
    .bind(id)
    .first<{ url: string }>();

  if (!row) {
    return c.notFound();
  }

  c.executionCtx.waitUntil(
    DB.prepare(
      "UPDATE urls SET views = views + 1, modified_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
      .bind(id)
      .run()
  );

  return c.redirect(row.url, 301);
});

app.post("/add", async (c) => {
  const { url } = await c.req.json<{
    title: string;
    url: string;
  }>();

  return c.json({
    code: 0,
    url,
  });
});

export default app;
