import { assert, assertEquals, assertFalse } from "@std/assert";
import {
  defaultProvider,
  FetchClient,
  ProblemDetails,
  setDefaultBaseUrl,
} from "../mod.ts";

Deno.test("can getJSON", async () => {
  defaultProvider.fetch = undefined;
  const api = new FetchClient();
  const res = await api.getJSON<{
    products: Array<{ id: number; name: string }>;
  }>(
    `https://dummyjson.com/products/search?q=iphone&limit=10`,
  );
  assertEquals(res.status, 200);
  assert(res.data?.products);
});

Deno.test("can getJSON with baseUrl", async () => {
  defaultProvider.fetch = undefined;
  const api = new FetchClient({
    baseUrl: "https://dummyjson.com",
  });
  const res = await api.getJSON<{
    products: Array<{ id: number; name: string }>;
  }>(
    `/products/search?q=iphone&limit=10`,
  );
  assertEquals(res.status, 200);
  assert(res.data?.products);
});

Deno.test("can getJSON with middleware", async () => {
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
      });
      assert(defaultProvider.isLoading);
      resolve(new Response(data));
    });

  defaultProvider.fetch = fakeFetch;
  const client = defaultProvider.getFetchClient();
  const res = await client.getJSON(
    "https://dummyjson.com/products/search?q=iphone&limit=10",
  );
  console.log("hi", res.data);
  let called = false;
  client.use(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assert(ctx.options.expectedStatusCodes);
    assert(ctx.options.expectedStatusCodes.length > 0);
    assertFalse(ctx.response);
    assert(defaultProvider.isLoading);
    called = true;
    await next();
    assert(ctx.response);
  });
  assert(client);

  type Todo = { userId: number; id: number; title: string; completed: boolean };
  const r = await client.getJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      expectedStatusCodes: [404],
    },
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(defaultProvider.isLoading);
});

Deno.test("can getJSON with caching", async () => {
  let fetchCount = 0;
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
      });
      fetchCount++;
      assert(defaultProvider.isLoading);
      resolve(new Response(data));
    });

  defaultProvider.fetch = fakeFetch;
  const client = defaultProvider.getFetchClient();
  let called = false;
  client.use(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assert(ctx.options.expectedStatusCodes);
    assert(ctx.options.expectedStatusCodes.length > 0);
    assertFalse(ctx.response);
    assert(defaultProvider.isLoading);
    called = true;
    await next();
    assert(ctx.response);
  });
  assert(client);

  type Todo = { userId: number; id: number; title: string; completed: boolean };
  let r = await client.getJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      expectedStatusCodes: [404],
      cacheKey: ["todos", "1"],
    },
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(defaultProvider.isLoading);
  assertEquals(fetchCount, 1);
  assert(defaultProvider.cache.has(["todos", "1"]));

  r = await client.getJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      expectedStatusCodes: [404],
      cacheKey: ["todos", "1"],
    },
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(defaultProvider.isLoading);
  assertEquals(fetchCount, 1);
  assert(defaultProvider.cache.has(["todos", "1"]));

  defaultProvider.cache.delete(["todos", "1"]);

  r = await client.getJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      expectedStatusCodes: [404],
      cacheKey: ["todos", "1"],
      cacheDuration: 10,
    },
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(defaultProvider.isLoading);
  assertEquals(fetchCount, 2);
  assert(defaultProvider.cache.has(["todos", "1"]));

  await delay(100);

  r = await client.getJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      expectedStatusCodes: [404],
      cacheKey: ["todos", "1"],
    },
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(defaultProvider.isLoading);
  assertEquals(fetchCount, 3);
  assert(defaultProvider.cache.has(["todos", "1"]));
});

Deno.test("can postJSON with middleware", async () => {
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
      });
      resolve(new Response(data));
    });

  defaultProvider.fetch = fakeFetch;
  const client = defaultProvider.getFetchClient();
  let called = false;
  client.use(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assert(ctx.options);
    assertFalse(ctx.response);
    called = true;
    await next();
    assert(ctx.response);
  });
  assert(client);

  type Todo = { userId: number; id: number; title: string; completed: boolean };
  const r = await client.postJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertEquals(r.data!.completed, false);
});

Deno.test("can putJSON with middleware", async () => {
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
      });
      resolve(new Response(data));
    });

  defaultProvider.fetch = fakeFetch;
  const client = defaultProvider.getFetchClient();
  let called = false;
  client.use(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assertFalse(ctx.response);
    called = true;
    await next();
    assert(ctx.response);
  });
  assert(client);

  type Todo = { userId: number; id: number; title: string; completed: boolean };
  const r = await client.putJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertEquals(r.data!.completed, false);
});

Deno.test("can delete with middleware", async () => {
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      resolve(new Response());
    });

  defaultProvider.fetch = fakeFetch;
  const client = defaultProvider.getFetchClient();
  let called = false;
  client.use(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assertFalse(ctx.response);
    called = true;
    await next();
    assert(ctx.response);
  });
  assert(client);

  const r = await client.delete("https://jsonplaceholder.typicode.com/todos/1");
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(called);
});

Deno.test("can abort getJSON", () => {
  const controller = new AbortController();
  let responseTimeout: ReturnType<typeof setTimeout>;
  const fakeFetch = (r: unknown): Promise<Response> =>
    new Promise((resolve) => {
      const request = r as Request;
      request.signal.addEventListener("abort", () => {
        clearTimeout(responseTimeout);
        resolve(
          new Response(null, {
            status: 299,
            statusText: "The user aborted a request.",
          }),
        );
      });
      responseTimeout = setTimeout(function () {
        resolve(new Response());
      }, 1000);
    });

  defaultProvider.fetch = fakeFetch;
  const client = defaultProvider.getFetchClient();
  client
    .getJSON("https://jsonplaceholder.typicode.com/todos/1", {
      signal: controller.signal,
    })
    .then((r) => {
      assert(r.ok);
      assertEquals(r.status, 299);
      assertEquals(r.statusText, "The user aborted a request.");
    });
  controller.abort();
});

Deno.test("will validate postJSON model with default model validator", async () => {
  let called = false;
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      called = true;
      resolve(new Response());
    });

  const data = {
    email: "test@test",
    password: "test",
  };
  // deno-lint-ignore require-await
  defaultProvider.setModelValidator(async (data: object | null) => {
    // use zod or class validator
    const problem = new ProblemDetails();
    const d = data as { password: string };
    if (d?.password?.length < 6) {
      problem.errors.password = [
        "Password must be longer than or equal to 6 characters.",
      ];
    }
    return problem;
  });
  defaultProvider.fetch = fakeFetch;
  const client = defaultProvider.getFetchClient();
  const response = await client.postJSON(
    "https://jsonplaceholder.typicode.com/todos/1",
    data,
  );
  assertEquals(response.ok, false);
  assertEquals(called, false);
  assertEquals(response.status, 422);
  assertFalse(response.data);
  assert(response.problem);
  assert(response.problem!.errors);
  assert(response.problem!.errors.password);
  assertEquals(response.problem!.errors.password!.length, 1);
  assertEquals(
    response.problem!.errors.password![0],
    "Password must be longer than or equal to 6 characters.",
  );
});

Deno.test("can use global middleware", async () => {
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
      });
      resolve(new Response(data));
    });

  defaultProvider.fetch = fakeFetch;
  let called = false;
  defaultProvider.useMiddleware(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assertFalse(ctx.response);
    called = true;
    await next();
    assert(ctx.response);
  });
  const client = defaultProvider.getFetchClient();
  assert(client);

  type Todo = { userId: number; id: number; title: string; completed: boolean };
  const r = await client.getJSON<Todo>(
    "https://jsonplaceholder.typicode.com/todos/1",
  );
  assert(r.ok);
  assertEquals(r.status, 200);
  assert(r.data);
  assert(called);
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertEquals(r.data!.completed, false);
});

Deno.test("can use defaultProvider", async () => {
  const api = new FetchClient();
  defaultProvider.fetch = undefined;
  setDefaultBaseUrl("https://dummyjson.com");

  assertEquals(api.options.baseUrl, "https://dummyjson.com");
  const res = await api.getJSON<{
    products: Array<{ id: number; name: string }>;
  }>(
    `products/search?q=iphone&limit=10`,
  );
  assertEquals(res.status, 200);
  assert(res.data?.products);
});

function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
