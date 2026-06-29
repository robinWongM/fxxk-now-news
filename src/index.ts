type Bindings = {
  DB: D1Database;
};

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (request.method === "GET" || request.method === "HEAD") {
      const match = url.pathname.match(/^\/fxxk-now-news\/redirect\/(\d+)$/);
      if (match) {
        return redirect(match[1], env, ctx);
      }
    }

    if (request.method === "POST" && url.pathname === "/fxxk-now-news/add") {
      return add(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function redirect(id: string, env: Bindings, ctx: ExecutionContext) {
  const row = await env.DB.prepare("SELECT url FROM urls WHERE id = ?")
    .bind(id)
    .first<{ url: string }>();

  if (!row) {
    return new Response("Not Found", { status: 404 });
  }

  ctx.waitUntil(
    env.DB.prepare(
      "UPDATE urls SET views = views + 1, modified_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
      .bind(id)
      .run()
  );

  return Response.redirect(row.url, 301);
}

async function add(request: Request) {
  const { url } = await request.json<{
    title: string;
    url: string;
  }>();

  return Response.json({
    code: 0,
    url,
  });
}
