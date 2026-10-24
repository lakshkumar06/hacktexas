import { expect, test } from "@playwright/test";

test("create, inspect, rearrange, edit, run, save and reopen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByLabel("What would you like your agent to do?")
    .fill("Find sponsors for my college club");
  await page.screenshot({ path: "test-results/create.png", fullPage: true });
  await page.getByRole("button", { name: "Build my agent" }).click();
  await expect(page.getByText("Understanding your goal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run my agent" })).toBeVisible({
    timeout: 10000,
  });
  await page.screenshot({ path: "test-results/workbench.png", fullPage: true });
  await page.getByLabel("Component name").fill("Thoughtful partner");
  await page.getByLabel("Component name").press("Tab");
  const brain = page.locator('.react-flow__node[data-id="brain"]');
  const before = await brain.boundingBox();
  if (!before) throw new Error("Brain was not rendered");
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    before.x + before.width / 2 + 35,
    before.y + before.height / 2 - 25,
    { steps: 10 },
  );
  await page.mouse.up();
  const after = await brain.boundingBox();
  expect(after!.x).not.toBe(before.x);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "Add Web search" }).click();
  await page.getByLabel("Connect to component").selectOption("output");
  await page.getByRole("button", { name: "Add connection" }).click();
  await expect(page.getByRole("status")).toContainText("Connected");
  await page.getByRole("button", { name: "Run my agent" }).click();
  await expect(page.getByText("SAMPLE RESULTS")).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(/Campus Coffee Co/)).toBeVisible();
  await page.getByRole("button", { name: "Save agent" }).click();
  await page.reload();
  await page.getByRole("button", { name: "My agents 1" }).click();
  await page
    .getByRole("button", { name: /Sponsor research.*Find sponsors/ })
    .click();
  await expect(
    page.locator(".node-label", { hasText: "Thoughtful partner" }),
  ).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  expect(errors).toEqual([]);
});

test("connect sockets, remove a cable, and undo", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("What would you like your agent to do?")
    .fill("help me");
  await page.getByRole("button", { name: "Build my agent" }).click();
  await expect(page.getByRole("button", { name: "Run my agent" })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Add Web search" }).click();
  const search = page
    .locator(".react-flow__node")
    .filter({ has: page.locator(".node-label", { hasText: "Web search" }) });
  const source = await search
    .locator(".react-flow__handle-right")
    .boundingBox();
  const target = await page
    .locator('.react-flow__node[data-id="output"] .react-flow__handle-left')
    .boundingBox();
  if (!source || !target) throw new Error("Sockets were not rendered");
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    target.x + target.width / 2,
    target.y + target.height / 2,
    { steps: 15 },
  );
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText("Connected");
  await page
    .getByRole("button", { name: "Disconnect Web search from Output" })
    .click();
  await expect(page.getByRole("status")).toContainText("Cable disconnected");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Disconnect Web search from Output" }),
  ).toBeVisible();
});

test("Gmail authorization is a local preview", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("What would you like your agent to do?")
    .fill("Read my emails");
  await page.getByRole("button", { name: "Build my agent" }).click();
  await expect(page.getByRole("button", { name: "Run my agent" })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Run my agent" }).click();
  await expect(page.getByRole("status")).toContainText("demo inbox");
  await page.locator('.react-flow__node[data-id="gmail"]').click();
  await expect(page.getByRole("dialog")).toContainText(
    "No sign-in. No credentials. No emails sent.",
  );
  await page.getByRole("button", { name: "Allow demo connection" }).click();
  await page.getByRole("button", { name: "Run my agent" }).click();
  await expect(page.getByText("SAMPLE RESULTS")).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(/Reply today: Maya/)).toBeVisible();
});

test("small screen and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByLabel("What would you like your agent to do?"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-create.png",
    fullPage: true,
  });
  await page
    .getByLabel("What would you like your agent to do?")
    .fill("help me");
  await page.getByRole("button", { name: "Build my agent" }).click();
  await expect(page.getByRole("button", { name: "Run my agent" })).toBeVisible({
    timeout: 10000,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-workbench.png",
    fullPage: true,
  });
});
