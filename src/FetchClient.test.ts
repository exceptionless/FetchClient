import { assert, assertEquals, assertFalse, assertRejects } from "@std/assert";
import {
  FetchClient,
  type FetchClientContext,
  getJSON,
  ProblemDetails,
  setBaseUrl,
  useFetchClient,
} from "../mod.ts";
import { FetchClientProvider } from "./FetchClientProvider.ts";
import { z, type ZodTypeAny } from "zod";

export const TodoSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
  completedTime: z.coerce.date().optional(),
});

type Todo = z.infer<typeof TodoSchema>;
type Products = {
  products: Array<{ id: number; name: string }>;
};

Deno.test("can getJSON", async () => {
  const api = new FetchClient();
  const res = await api.getJSON<Products>(
    `https://dummyjson.com/products/search?q=iphone&limit=10`,
  );
  assertEquals(res.status, 200);
  assert(res.data?.products);
});

Deno.test("can use function", async () => {
  const res = await getJSON<Products>(
    `https://dummyjson.com/products/search?q=iphone&limit=10`,
  );

  assertEquals(res.status, 200);
  assert(res.data?.products);
});

Deno.test("can getJSON with baseUrl", async () => {
  const api = new FetchClient({
    baseUrl: "https://dummyjson.com",
  });
  const res = await api.getJSON<Products>(
    `/products/search?q=iphone&limit=10`,
  );
  assertEquals(res.status, 200);
  assert(res.data?.products);
});

Deno.test("can getJSON with client middleware", async () => {
  const provider = new FetchClientProvider();

  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
      });
      assert(provider.isLoading);
      resolve(new Response(data));
    });

  provider.fetch = fakeFetch;
  let called = false;

  provider.useMiddleware(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assert(ctx.options.expectedStatusCodes);
    assert(ctx.options.expectedStatusCodes.length > 0);
    assertFalse(ctx.response);
    assert(provider.isLoading);
    called = true;
    await next();
    assert(ctx.response);
  });

  const client = provider.getFetchClient();
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
  assertFalse(provider.isLoading);
});

Deno.test("can getJSON with caching", async () => {
  const provider = new FetchClientProvider();
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
      assert(provider.isLoading);
      resolve(new Response(data));
    });

  provider.fetch = fakeFetch;
  const client = provider.getFetchClient();

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
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(provider.isLoading);
  assertEquals(fetchCount, 1);
  assert(provider.cache.has(["todos", "1"]));

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
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(provider.isLoading);
  assertEquals(fetchCount, 1);
  assert(provider.cache.has(["todos", "1"]));

  provider.cache.delete(["todos", "1"]);

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
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(provider.isLoading);
  assertEquals(fetchCount, 2);
  assert(provider.cache.has(["todos", "1"]));

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
  assertEquals(r.data!.userId, 1);
  assertEquals(r.data!.id, 1);
  assertEquals(r.data!.title, "A random title");
  assertFalse(r.data!.completed);
  assertFalse(provider.isLoading);
  assertEquals(fetchCount, 3);
  assert(provider.cache.has(["todos", "1"]));
});

Deno.test("can postJSON with client middleware", async () => {
  const provider = new FetchClientProvider();
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

  provider.fetch = fakeFetch;
  const client = provider.getFetchClient();
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

Deno.test("can putJSON with client middleware", async () => {
  const provider = new FetchClientProvider();
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

  provider.fetch = fakeFetch;
  const client = provider.getFetchClient();
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

Deno.test("can deleteJSON with client middleware", async () => {
  const provider = new FetchClientProvider();
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

  provider.fetch = fakeFetch;
  const client = provider.getFetchClient();
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

  const r = await client.deleteJSON<Todo>(
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

Deno.test("can abort getJSON", async () => {
  const provider = new FetchClientProvider();
  const client = provider.getFetchClient();
  let gotError = false;

  try {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort("Signal was aborted");
    }, 100);

    await client.getJSON("https://dummyjson.com/products/1?delay=2000", {
      timeout: 500,
      signal: controller.signal,
    });
  } catch (error) {
    assertEquals(error, "Signal was aborted");
    gotError = true;
  }

  assert(gotError);

  // can use expectedStatusCodes to not throw an error
  const response = await client.getJSON(
    "https://dummyjson.com/products/1?delay=2000",
    {
      timeout: 500,
      signal: AbortSignal.timeout(100),
      expectedStatusCodes: [408],
    },
  );

  assertEquals(response.status, 408);
  assertEquals(response.statusText, "Request Timeout");
  assertEquals(response.problem?.status, 408);
});

Deno.test("can getJSON with timeout", async () => {
  const provider = new FetchClientProvider();

  const client = provider.getFetchClient();
  let gotError = false;

  try {
    // timeout is set to 100ms, but the request takes 2000ms
    // so it should throw a timeout error
    await client.getJSON("https://dummyjson.com/products/1?delay=2000", {
      timeout: 100,
    });
  } catch (error) {
    assertEquals((error as Response).status, 408);
    gotError = true;
  }

  assert(gotError);
  gotError = false;

  // can use expectedStatusCodes to not throw an error
  const response = await client.getJSON(
    "https://dummyjson.com/products/1?delay=2000",
    {
      timeout: 100,
      expectedStatusCodes: [408],
    },
  );
  assertFalse(gotError);
  assertEquals(response.status, 408);
  assertEquals(response.statusText, "Request Timeout");

  try {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort("Signal was aborted");
    }, 100);

    // both timeout and signal are set
    await client.getJSON("https://dummyjson.com/products/1?delay=2000", {
      timeout: 500,
      signal: controller.signal,
    });
  } catch (error) {
    assertEquals(error, "Signal was aborted");
    gotError = true;
  }

  assert(gotError);
});

Deno.test("can get loading status", async () => {
  const api = new FetchClient();
  const response = api.getJSON("https://jsonplaceholder.typicode.com/todos/1");
  assert(api.isLoading);

  await response;
  assertFalse(api.isLoading);
});

Deno.test("can use loading event", async () => {
  const api = new FetchClient();
  let called = false;
  api.loading.on((isLoading) => {
    called = true;
    console.log(`Loading: ${isLoading}`);
  });
  const response = api.getJSON("https://jsonplaceholder.typicode.com/todos/1");
  assert(api.isLoading);

  await response;
  assert(called);
  assertFalse(api.isLoading);
});

Deno.test("can handle error", async () => {
  const provider = new FetchClientProvider();
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      resolve(new Response(null, { status: 404 }));
    });

  provider.fetch = fakeFetch;
  const client = provider.getFetchClient();

  // can use expectedStatusCodes to not throw an error
  let res = await client.getJSON(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      expectedStatusCodes: [404],
    },
  );
  assertFalse(res.ok);
  assertEquals(res.status, 404);

  assertRejects(async () => {
    await client.getJSON("https://jsonplaceholder.typicode.com/todos/1");
  });

  // can use shouldThrowOnUnexpectedStatusCodes to not throw an error
  res = await client.getJSON(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      shouldThrowOnUnexpectedStatusCodes: false,
    },
  );
  assertFalse(res.ok);
  assertEquals(res.status, 404);

  // can use errorCallback to not throw an error
  res = await client.getJSON(
    "https://jsonplaceholder.typicode.com/todos/1",
    {
      errorCallback: () => true,
    },
  );
  assertFalse(res.ok);
  assertEquals(res.status, 404);

  // can use errorCallback to throw custom error
  const error = await assertRejects(async () => {
    await client.getJSON("https://jsonplaceholder.typicode.com/todos/1", {
      errorCallback: (res) => {
        throw res.problem ?? res;
      },
    });
  });
  assert(error instanceof ProblemDetails);

  assertRejects(async () => {
    await client.getJSON("https://jsonplaceholder.typicode.com/todos/1", {
      errorCallback: () => false,
    });
  });

  assertRejects(async () => {
    await client.getJSON("https://jsonplaceholder.typicode.com/todos/1", {
      errorCallback: () => {},
    });
  });
});

Deno.test("will validate postJSON model with provider model validator", async () => {
  const provider = new FetchClientProvider();
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
  provider.setModelValidator(async (data: object | null) => {
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
  provider.fetch = fakeFetch;
  const client = provider.getFetchClient();
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

Deno.test("can use middleware", async () => {
  const provider = new FetchClientProvider();
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

  provider.fetch = fakeFetch;
  let called = false;
  provider.useMiddleware(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assertFalse(ctx.response);
    called = true;
    await next();
    assert(ctx.response);
  });
  const client = provider.getFetchClient();
  assert(client);

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

Deno.test("can use current provider", async () => {
  const api = new FetchClient();
  setBaseUrl("https://dummyjson.com");

  assertEquals(api.options.baseUrl, "https://dummyjson.com");
  const res = await api.getJSON<Products>(
    `products/search?q=iphone&limit=10`,
  );
  assertEquals(res.status, 200);
  assert(res.data?.products);
});

Deno.test("can getJSON with zod schema", async () => {
  const provider = new FetchClientProvider();
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
        completedTime: "2021-01-01T00:00:00.000Z",
      });
      resolve(new Response(data));
    });

  provider.fetch = fakeFetch;

  const api = provider.getFetchClient();

  api.use(async (ctx, next) => {
    await next();

    if (ctx.options.schema) {
      const schema = ctx.options.schema as ZodTypeAny;
      const parsed = schema.safeParse(ctx.response!.data);

      if (parsed.success) {
        ctx.response!.data = parsed.data;
      }
    }
  });

  const res = await api.getJSON<Todo>(
    `https://jsonplaceholder.typicode.com/todos/1`,
    {
      meta: { schema: TodoSchema },
    },
  );

  assertEquals(res.status, 200);
  assert(res.data);
  assert(TodoSchema.parse(res.data));
});

Deno.test("can parse dates", async () => {
  const provider = new FetchClientProvider();
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
        completedTime: "2021-01-01T00:00:00.000Z",
      });
      resolve(new Response(data));
    });

  provider.fetch = fakeFetch;

  const api = provider.getFetchClient();

  let res = await api.getJSON<Todo>(
    `https://jsonplaceholder.typicode.com/todos/1`,
  );

  assertEquals(res.status, 200);
  assert(res.data);
  assertFalse(res.data.completedTime instanceof Date);

  res = await api.getJSON<Todo>(
    `https://jsonplaceholder.typicode.com/todos/1`,
    {
      shouldParseDates: true,
    },
  );

  assertEquals(res.status, 200);
  assert(res.data);
  assert(res.data.completedTime instanceof Date);
});

Deno.test("can use reviver", async () => {
  const provider = new FetchClientProvider();
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
        completedTime: "2021-01-01T00:00:00.000Z",
      });
      resolve(new Response(data));
    });

  provider.fetch = fakeFetch;

  const api = provider.getFetchClient();

  let res = await api.getJSON<Todo>(
    `https://jsonplaceholder.typicode.com/todos/1`,
  );

  assertEquals(res.status, 200);
  assert(res.data);
  assertFalse(res.data.completedTime instanceof Date);

  res = await api.getJSON<Todo>(
    `https://jsonplaceholder.typicode.com/todos/1`,
    {
      reviver: (key: string, value: unknown) => {
        if (key === "completedTime") {
          return new Date(<string> value);
        }
        return value;
      },
    },
  );

  assertEquals(res.status, 200);
  assert(res.data);
  assert(res.data.completedTime instanceof Date);
});

Deno.test("can parse dates and use reviver", async () => {
  const provider = new FetchClientProvider();
  const fakeFetch = (): Promise<Response> =>
    new Promise((resolve) => {
      const data = JSON.stringify({
        userId: 1,
        id: 1,
        title: "A random title",
        completed: false,
        completedTime: "2021-01-01T00:00:00.000Z",
      });
      resolve(new Response(data));
    });

  provider.fetch = fakeFetch;

  const api = provider.getFetchClient();

  let res = await api.getJSON<Todo>(
    `https://jsonplaceholder.typicode.com/todos/1`,
  );

  assertEquals(res.status, 200);
  assert(res.data);
  assertEquals(res.data.title, "A random title");
  assertFalse(res.data.completedTime instanceof Date);

  res = await api.getJSON<Todo>(
    `https://jsonplaceholder.typicode.com/todos/1`,
    {
      shouldParseDates: true,
      reviver: (key: string, value: unknown) => {
        if (key === "title") {
          return "revived";
        }
        return value;
      },
    },
  );

  assertEquals(res.status, 200);
  assert(res.data);
  assertEquals(res.data.title, "revived");
  assert(res.data.completedTime instanceof Date);
});

Deno.test("can use kitchen sink", async () => {
  let called = false;
  let optionsCalled = false;

  const api = new FetchClient({
    baseUrl: "https://dummyjson.com",
    defaultRequestOptions: {
      headers: {
        "X-Test": "test",
      },
      expectedStatusCodes: [200],
      params: {
        limit: 3,
      },
      errorCallback: (response) => {
        if (response.status === 404) {
          console.log("Not found");
        }
      },
    },
    middleware: [
      async (ctx, next) => {
        assert(ctx);
        assert(ctx.request);
        assertFalse(ctx.response);
        optionsCalled = true;
        await next();
        assert(ctx.response);
      },
    ],
  }).use(async (ctx, next) => {
    assert(ctx);
    assert(ctx.request);
    assertFalse(ctx.response);
    assertFalse(ctx.someMiddleware);
    called = true;
    await next();
    assert(ctx.someMiddleware);
    assert(ctx.response);
  })
    .use(someMiddleware);

  const res = await api.getJSON<Products>(
    `products/search?q=x`,
  );

  assertEquals(res.status, 200);
  assert(res.data?.products);
  assertEquals(res.data.products.length, 3);
  assert(called);
  assert(optionsCalled);
});

Deno.test("can getJSON relative URL", async () => {
  const provider = new FetchClientProvider();
  let requestedUrl = "";
  const fakeFetch = (req: URL | Request | string): Promise<Response> =>
    new Promise((resolve) => {
      if (req instanceof Request) {
        requestedUrl = req.url;
      } else {
        requestedUrl = req.toString();
      }
      resolve(new Response());
    });

  provider.fetch = fakeFetch;
  const client = provider.getFetchClient();

  await client.getJSON(`/todos/1`);
  assertEquals(requestedUrl, "http://localhost/todos/1");

  await client.getJSON(
    `todos/1`,
    {
      params: {
        limit: 3,
      },
    },
  );
  assertEquals(requestedUrl, "http://localhost/todos/1?limit=3");
});

function someMiddleware(ctx: FetchClientContext, next: () => Promise<void>) {
  ctx.someMiddleware = true;
  return next();
}

Deno.test("can use kitchen sink function", async () => {
  let called = false;
  let optionsCalled = false;

  const res = await useFetchClient({
    baseUrl: "https://dummyjson.com",
    defaultRequestOptions: {
      headers: {
        "X-Test": "test",
      },
      expectedStatusCodes: [200],
      params: {
        limit: 4, // this will be overridden in the getJSON call
      },
      errorCallback: (response) => {
        if (response.status === 404) {
          console.log("Not found");
        }
      },
    },
    middleware: [
      async (ctx, next) => {
        assert(ctx);
        assert(ctx.request);
        assertFalse(ctx.response);
        optionsCalled = true;
        await next();
        assert(ctx.response);
      },
    ],
  })
    .use(async (ctx, next) => {
      assert(ctx);
      assert(ctx.request);
      assertFalse(ctx.response);
      called = true;
      await next();
      assert(ctx.response);
    })
    .getJSON<Products>(
      `products/search?q=x&limit=10`, // this will override the default params
    );

  assertEquals(res.status, 200);
  assert(res.data?.products);
  assertEquals(res.data.products.length, 10);
  assert(called);
  assert(optionsCalled);
});

function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
