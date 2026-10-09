import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { rootPassthrough } from "shaders/core";
import FlowingGradient from "shaders/core/FlowingGradient";
import Aurora from "shaders/core/Aurora";
import FilmGrain from "shaders/core/FilmGrain";
import DotGrid from "shaders/core/DotGrid";

// Compile the upstream components at build time, not in the reader's browser.
// 4.0.4 exposes its composer in the shared core bundle rather than a public
// subpath. Pin that adapter; an upstream change must fail, not silently drift.
const packageRoot = path.dirname(fileURLToPath(import.meta.resolve("shaders/core")));
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, "../../package.json"), "utf8"));
assert.equal(packageJson.version, "4.0.4", "Review the composer adapter before upgrading shaders");
const sharedFile = fs.readdirSync(packageRoot).find((file) => /^std-.*\.js$/.test(file));
assert.ok(sharedFile, "Missing upstream core bundle");
const sharedPath = path.join(packageRoot, sharedFile);
const sharedText = fs.readFileSync(sharedPath, "utf8");
const shared = await import(pathToFileURL(sharedPath));
const upstream = (name) => {
  const alias = sharedText.match(new RegExp(`\\b${name} as (\\w+)`))?.[1];
  assert.ok(alias && shared[alias], `Missing upstream export: ${name}`);
  return shared[alias];
};
const tgpu = upstream("typegpu_default");
const d = upstream("data_exports");
const compose = upstream("composeNodeTree");
const system = d.struct({ time: d.f32, deltaTime: d.f32, frame: d.f32,
  viewportSize: d.vec2f, logicalViewportSize: d.vec2f, aspect: d.f32,
  pointer: d.vec2f, pointerActive: d.f32 });
assert.equal(d.sizeOf(system), 56, "Renderer uniform layout changed");
const layout = tgpu.bindGroupLayout({ uniforms: { uniform: d.struct({ _sys: system }) } });
const number = (value) => {
  assert.ok(Number.isFinite(value), "Non-finite GPU constant");
  return Number.isInteger(value) ? `${value}.0` : String(value);
};
const literal = (value) => {
  if (typeof value === "number") return number(value);
  if (typeof value === "boolean") return value ? "1.0" : "0.0";
  if (Array.isArray(value)) return `vec${value.length}f(${value.map(number).join(", ")})`;
  if (value && typeof value === "object") {
    const keys = "r" in value ? ["r", "g", "b", "a"] : ["x", "y", "z", "w"].filter((key) => key in value);
    assert.ok(keys.length >= 2, "Unsupported GPU value");
    return `vec${keys.length}f(${keys.map((key) => number(value[key])).join(", ")})`;
  }
  throw new Error(`Unsupported GPU constant: ${JSON.stringify(value)}`);
};

// FilmGrain wraps the whole stack, just as <FilmGrain> does in the library.
const layers = [
  { definition: rootPassthrough, parent: null },
  { definition: FilmGrain, parent: "layer0", props: { strength: .045, bias: 2, animated: false } },
  { definition: FlowingGradient, parent: "layer1", props: { colorA: "#0a1630", colorB: "#276d9f", colorC: "#7462b1", colorD: "#96c8d5", colorSpace: "linear", speed: 2.4, distortion: .7, seed: 4 } },
  { definition: Aurora, parent: "layer1", blend: "screen", opacity: .65, props: { colorA: "#627ccc", colorB: "#a2dfeb", colorC: "#b49ddd", intensity: 55, speed: .8, curtainCount: 2, height: 140 } },
  { definition: DotGrid, parent: "layer1", opacity: .13, props: { color: "#cfe3f5", density: 27, dotSize: .10, speed: .03, twinkle: .2 } },
];
const nodes = layers.map((layer, index) => {
  const handles = {};
  for (const [key, config] of Object.entries(layer.definition.props)) {
    const raw = layer.props?.[key] ?? config.default;
    const value = config.transform ? config.transform(raw) : raw;
    handles[key] = { accessorPath: key, cpu: typeof value === "string", value };
  }
  for (const [key, field] of Object.entries(layer.definition.extraFields ?? {})) {
    handles[key] = { accessorPath: key, cpu: false, value: field.initial };
  }
  return { id: `layer${index}`, componentName: layer.definition.name, parentId: layer.parent,
    definition: layer.definition, handles,
    metadata: { blendMode: layer.blend ?? "normal", opacity: layer.opacity ?? 1, renderOrder: index, visible: true } };
});
const registry = { rootId: "layer0", getNode: (id) => nodes.find((node) => node.id === id),
  getChildren: (id) => nodes.filter((node) => node.parentId === id), resolveCustomId: () => null,
  store: { layout, gpuAccessor: (handle) => literal(handle.value) } };
const ir = compose(registry, { premultiplyAlpha: true });
assert.equal(ir.rttPasses.length, 0, "Homepage must remain a single GPU pass");
assert.equal(ir.textures.length, 0, "Homepage must not download textures");
let code = tgpu.resolve([ir.finalPass.entry]);
// Bake the chosen fixed prop values; preserve the upstream animated clocks.
code = code.replace(/uniforms\.n_(layer\d+)\.(\w+)/g, (_, id, field) => {
  const node = registry.getNode(id);
  assert.ok(node, `Unknown node: ${id}`);
  if (field === "_animTime") return `(uniforms._sys.time * ${number(node.handles.speed?.value ?? 1)})`;
  if (field === "_opacity") return number(node.metadata.opacity);
  assert.ok(node.handles[field], `Unbaked upstream uniform: ${id}.${field}`);
  return literal(node.handles[field].value);
});
assert.ok(!code.includes("uniforms.n_"));
code = code.replace(/@fragment fn \w+\(/, "@fragment fn fragment(");
const vertex = `
struct HeroVertex { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex fn vertex(@builtin(vertex_index) index: u32) -> HeroVertex {
  let positions = array<vec2f, 3>(vec2f(-1., -1.), vec2f(3., -1.), vec2f(-1., 3.));
  let p = positions[index];
  var out: HeroVertex;
  out.position = vec4f(p, 0., 1.);
  out.uv = vec2f((p.x + 1.) * .5, (1. - p.y) * .5);
  return out;
}
`;
const license = fs.readFileSync(path.join(packageRoot, "../../LICENSE"), "utf8").trim();
const output = `// GENERATED by scripts/compile-home-shaders.mjs. Edit the recipe, not this file.\n// FlowingGradient + Aurora + FilmGrain + DotGrid, shaders@4.0.4.\n/*\n${license}\n*/\n${code}\n${vertex}`;
const target = new URL("../src/shaders/star-map.wgsl", import.meta.url);
if (process.argv.includes("--check")) {
  assert.equal(fs.readFileSync(target, "utf8"), output, "Generated shader is stale; run npm run shaders:compile");
} else {
  fs.writeFileSync(target, output);
}
console.log(`PASS: upstream FlowingGradient + Aurora + FilmGrain + DotGrid; single pass; ${Buffer.byteLength(output)} B WGSL; 64 B uniforms`);
