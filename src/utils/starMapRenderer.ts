/// <reference types="@webgpu/types" />
import shaderSource from "../shaders/star-map.wgsl?raw";

/** A single decorative pass: no runtime compiler, component registry, or telemetry. */
export async function createStarMapRenderer(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  onReady: () => void,
  onUnavailable: () => void,
) {
  let device: GPUDevice | undefined;
  let buffer: GPUBuffer | undefined;
  let context: GPUCanvasContext | null = null;
  let frame = 0;
  let disposed = false;
  let running = false;
  let ready = false;
  let elapsed = 0;
  let previous = 0;
  let submitted = 0;
  let frameCount = 0;
  const destroy = () => {
    if (disposed) return;
    disposed = true;
    running = false;
    cancelAnimationFrame(frame);
    signal.removeEventListener("abort", destroy);
    buffer?.destroy();
    context?.unconfigure();
    device?.destroy();
  };
  signal.addEventListener("abort", destroy, { once: true });
  const unavailable = () => {
    if (disposed || signal.aborted) return;
    destroy();
    onUnavailable();
  };
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "low-power" });
    if (signal.aborted) { destroy(); return null; }
    if (!adapter) { unavailable(); return null; }
    device = await adapter.requestDevice();
    if (signal.aborted) { device.destroy(); return null; }
    void device.lost.then(unavailable);
    device.addEventListener("uncapturederror", unavailable);
    context = canvas.getContext("webgpu");
    if (!context) { unavailable(); return null; }
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: "premultiplied" });
    device.pushErrorScope("validation");
    const module = device.createShaderModule({ label: "Upstream four-layer homepage field", code: shaderSource });
    const pipeline = await device.createRenderPipelineAsync({
      layout: "auto", vertex: { module, entryPoint: "vertex" },
      fragment: { module, entryPoint: "fragment", targets: [{ format }] },
      primitive: { topology: "triangle-list" },
    });
    const validation = await device.popErrorScope();
    if (signal.aborted || disposed) { destroy(); return null; }
    if (validation) { unavailable(); return null; }
    buffer = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const group = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer } }] });
    const values = new Float32Array(16);
    const draw = (now: number) => {
      if (!running || disposed) return;
      if (previous) elapsed += Math.min((now - previous) / 1000, .1);
      previous = now;
      // One bounded pass; submit at most 30 frames per second.
      if (now - submitted >= 1000 / 30 && device && context && buffer) {
        submitted = now;
        try {
          // WGSL system layout: scalar(0/4/8), vec2(16/24), scalar(32), vec2(40).
          values[0] = elapsed;
          values[1] = 1 / 30;
          values[2] = frameCount++;
          values[4] = canvas.width; values[5] = canvas.height;
          values[6] = canvas.clientWidth || canvas.width;
          values[7] = canvas.clientHeight || canvas.height;
          values[8] = canvas.width / canvas.height;
          values[10] = .5; values[11] = .5;
          device.queue.writeBuffer(buffer, 0, values);
          const encoder = device.createCommandEncoder();
          const pass = encoder.beginRenderPass({ colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store",
          }] });
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, group);
          pass.draw(3);
          pass.end();
          device.queue.submit([encoder.finish()]);
          if (!ready) { ready = true; onReady(); }
        } catch { unavailable(); return; }
      }
      frame = requestAnimationFrame(draw);
    };
    const resize = (width: number, height: number) => {
      if (disposed || width <= 0 || height <= 0) return;
      const scale = Math.min(devicePixelRatio || 1, 1.5, 960 / width, 600 / height);
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };
    const size = canvas.getBoundingClientRect();
    resize(size.width, size.height);
    return {
      resize, destroy,
      pause() { running = false; cancelAnimationFrame(frame); previous = 0; },
      resume() {
        if (running || disposed) return;
        running = true;
        previous = 0;
        frame = requestAnimationFrame(draw);
      },
    };
  } catch {
    unavailable();
    return null;
  }
}
