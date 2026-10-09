import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/utils/starMap.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function fixture({ mobile = false, motion = false, gpu = true, delayed = false } = {}) {
  const events = [];
  const host = { dataset: {}, querySelector: () => canvas };
  const canvas = { getBoundingClientRect: () => ({ width: 240, height: 160 }) };
  const desktop = Object.assign(new EventTarget(), { matches: !mobile });
  const reduced = Object.assign(new EventTarget(), { matches: motion });
  const document = Object.assign(new EventTarget(), { hidden: false, querySelectorAll: () => [host] });
  let observer;
  let notifyReady;
  let notifyUnavailable;
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const render = {
    pause: () => events.push("pause"), resume: () => events.push("resume"),
    destroy: () => events.push("destroy"), resize: () => events.push("resize"),
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, AbortController, document, navigator: gpu ? { gpu: {} } : {},
    matchMedia: (query) => query.includes("min-width") ? desktop : reduced,
    IntersectionObserver: class {
      constructor(callback) { observer = callback; }
      observe() {} disconnect() { events.push("disconnect-intersection"); }
    },
    ResizeObserver: class { observe() {} disconnect() { events.push("disconnect-resize"); } },
    require() {
      events.push("import");
      return { async createStarMapRenderer(_canvas, signal, ready, unavailable) {
        events.push("create");
        notifyReady = ready;
        notifyUnavailable = unavailable;
        signal.addEventListener("abort", () => events.push("abort"), { once: true });
        if (delayed) await pending;
        return render;
      } };
    },
  });
  const cleanup = exports.mountStarMaps();
  return { events, host, desktop, reduced, document, cleanup, finish,
    visible: (value) => observer([{ isIntersecting: value }]),
    ready: () => notifyReady(), unavailable: () => notifyUnavailable(),
  };
}

test("star map never loads the engine for reduced motion or missing WebGPU", async () => {
  for (const options of [{ motion: true }, { gpu: false }]) {
    const f = fixture(options);
    f.visible(true);
    await flush();
    assert.ok(!f.events.includes("import"));
    assert.equal(f.host.dataset.shaderState, options.gpu === false ? "unavailable" : "static");
    f.cleanup();
  }
});

test("star map loads once, pauses offscreen/hidden, and resumes without rebuilding", async () => {
  const f = fixture();
  f.visible(true); f.visible(true);
  await flush(); f.ready();
  assert.equal(f.events.filter((x) => x === "create").length, 1);
  assert.equal(f.host.dataset.shaderState, "ready");
  f.visible(false); await flush();
  assert.equal(f.events.at(-1), "pause");
  f.visible(true); await flush();
  assert.equal(f.events.at(-1), "resume");
  f.document.hidden = true;
  f.document.dispatchEvent(new Event("visibilitychange")); await flush();
  assert.equal(f.events.at(-1), "pause");
  f.cleanup();
});

test("live reduced motion destroys the renderer and rejects stale readiness", async () => {
  const f = fixture(); f.visible(true); await flush(); f.ready();
  f.reduced.matches = true; f.reduced.dispatchEvent(new Event("change"));
  await flush(); f.ready();
  assert.equal(f.host.dataset.shaderState, "static");
  assert.ok(f.events.includes("destroy")); assert.ok(f.events.includes("abort"));
  f.reduced.matches = false; f.reduced.dispatchEvent(new Event("change"));
  await flush();
  assert.equal(f.events.filter((x) => x === "create").length, 2);
  f.cleanup();
});

test("route cleanup cancels an in-flight renderer and disconnects observers", async () => {
  const f = fixture({ delayed: true }); f.visible(true); await flush();
  f.cleanup(); f.finish(); await flush(); f.ready();
  assert.equal(f.host.dataset.shaderState, "static");
  for (const event of ["abort", "destroy", "disconnect-intersection", "disconnect-resize"]) assert.ok(f.events.includes(event));
  f.visible(true); await flush();
  assert.equal(f.events.filter((x) => x === "create").length, 1);
});

test("GPU failure keeps the static art and never spins a retry loop", async () => {
  const f = fixture(); f.visible(true); await flush();
  f.unavailable(); f.visible(false); f.visible(true); await flush();
  assert.equal(f.host.dataset.shaderState, "unavailable");
  assert.equal(f.events.filter((x) => x === "create").length, 1);
  f.cleanup();
});

test("reduced motion cancels pending initialization before it can reveal the canvas", async () => {
  const f = fixture({ delayed: true }); f.visible(true); await flush();
  f.reduced.matches = true; f.reduced.dispatchEvent(new Event("change"));
  f.finish(); await flush(); f.ready();
  assert.equal(f.host.dataset.shaderState, "static"); assert.ok(f.events.includes("destroy"));
  f.cleanup();
});

const rendererSource = fs.readFileSync(new URL("../src/utils/starMapRenderer.ts", import.meta.url), "utf8");
const rendererCode = ts.transpileModule(rendererSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function gpuFixture({ adapterMissing = false, validationError = false, delayedDevice = false } = {}) {
  const events = [];
  const scheduled = new Map();
  let id = 0;
  let finishDevice;
  const pending = new Promise((resolve) => { finishDevice = resolve; });
  const device = {
    lost: new Promise(() => {}), addEventListener() {},
    destroy: () => events.push("device-destroy"),
    pushErrorScope() {}, popErrorScope: async () => validationError ? new Error("invalid shader") : null,
    createShaderModule: () => ({}),
    createRenderPipelineAsync: async () => ({ getBindGroupLayout: () => ({}) }),
    createBuffer: () => ({ destroy: () => events.push("buffer-destroy") }),
    createBindGroup: () => ({}),
    queue: { writeBuffer(_buffer, _offset, values) { events.push(["uniform", [...values]]); }, submit: () => events.push("submit") },
    createCommandEncoder: () => ({ finish: () => ({}), beginRenderPass: () => ({ setPipeline() {}, setBindGroup() {}, draw() {}, end() {} }) }),
  };
  const context = {
    configure() {}, unconfigure: () => events.push("unconfigure"),
    getCurrentTexture: () => ({ createView: () => ({}) }),
  };
  const canvas = { width: 300, height: 150, getContext: () => context, getBoundingClientRect: () => ({ width: 280, height: 200 }) };
  const exports = {};
  vm.runInNewContext(rendererCode, {
    exports, require: () => ({ default: "fixture shader" }), devicePixelRatio: 3,
    GPUBufferUsage: { UNIFORM: 64, COPY_DST: 8 },
    navigator: { gpu: {
      getPreferredCanvasFormat: () => "bgra8unorm",
      requestAdapter: async () => adapterMissing ? null : { async requestDevice() {
        if (delayedDevice) await pending;
        return device;
      } },
    } },
    requestAnimationFrame(callback) { scheduled.set(++id, callback); return id; },
    cancelAnimationFrame: (key) => scheduled.delete(key),
  });
  const abort = new AbortController();
  return { abort, canvas, events, scheduled, finishDevice,
    create: () => exports.createStarMapRenderer(canvas, abort.signal, () => events.push("ready"), () => events.push("unavailable")),
    tick(now) { const [key, callback] = scheduled.entries().next().value; scheduled.delete(key); callback(now); },
  };
}

test("native renderer bounds pixel size, submits at 30fps, and releases its GPU resources", async () => {
  const f = gpuFixture(); const renderer = await f.create();
  assert.equal(f.canvas.width, 420); assert.equal(f.canvas.height, 300);
  renderer.resume(); renderer.resume(); assert.equal(f.scheduled.size, 1);
  f.tick(100); f.tick(110); f.tick(120); f.tick(140);
  const uniforms = f.events.filter((x) => Array.isArray(x) && x[0] === "uniform");
  assert.equal(uniforms[0][1].length, 16);
  assert.equal(uniforms[0][1][4], 420); assert.equal(uniforms[0][1][5], 300);
  assert.ok(uniforms[1][1][0] > uniforms[0][1][0]);
  renderer.resize(2000, 1200); assert.equal(f.canvas.width, 960); assert.equal(f.canvas.height, 576);
  assert.equal(f.events.filter((x) => x === "submit").length, 2);
  assert.equal(f.events.filter((x) => x === "ready").length, 1);
  renderer.pause(); assert.equal(f.scheduled.size, 0);
  renderer.resume(); f.abort.abort(); renderer.destroy();
  assert.equal(f.scheduled.size, 0);
  for (const event of ["device-destroy", "buffer-destroy", "unconfigure"]) assert.equal(f.events.filter((x) => x === event).length, 1);
});

test("native renderer returns static art after an unavailable adapter or validation error", async () => {
  for (const options of [{ adapterMissing: true }, { validationError: true }]) {
    const f = gpuFixture(options);
    assert.equal(await f.create(), null);
    assert.equal(f.events.filter((x) => x === "unavailable").length, 1);
    assert.ok(!f.events.includes("submit")); assert.equal(f.scheduled.size, 0);
  }
});

test("a device granted after cancellation is destroyed rather than leaked", async () => {
  const f = gpuFixture({ delayedDevice: true }); const promise = f.create();
  await flush(); f.abort.abort(); f.finishDevice();
  assert.equal(await promise, null);
  assert.equal(f.events.filter((x) => x === "device-destroy").length, 1);
  assert.ok(!f.events.includes("ready")); assert.ok(!f.events.includes("unavailable"));
});

// Unlike the old sidebar, the hero is present and enhanced on narrow screens.
test("mobile hero loads the same four-layer effect", async () => {
  const f = fixture({ mobile: true }); f.visible(true); await flush(); f.ready();
  assert.equal(f.host.dataset.shaderState, "ready");
  assert.equal(f.events.filter((x) => x === "create").length, 1);
  f.cleanup();
});
