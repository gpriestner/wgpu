import { wcode } from "/shaders.js";
import { TriangleMesh } from "/triangle_mesh.js";

const Initialize = async() => {

    const canvas = document.querySelector("canvas");
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu");
    const format = "bgra8unorm";
    context.configure({device, format, alphaMode: "opaque"});

    const triangleMesh = new TriangleMesh(device);

    const bindGroupLayout = device.createBindGroupLayout({ entries: [] });
    const bindGroup = device.createBindGroup({ layout: bindGroupLayout, entries: [] });
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({
                code: wcode
            }),
            entryPoint: "vs_main",
            buffers: [triangleMesh.bufferLayout]
        },
        fragment: {
            module: device.createShaderModule({
                code: wcode
            }),
            entryPoint: "fs_main",
            targets: [{ format }]
        },
        primitive: {
            topology: "triangle-list"
        },
        layout: pipelineLayout // "auto"
    });

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderpass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
            loadOp: "clear",
            storeOp: "store"
        }]
    });
    renderpass.setPipeline(pipeline);
    renderpass.setBindGroup(0, bindGroup);
    renderpass.setVertexBuffer(0, triangleMesh.buffer);
    renderpass.draw(3, 1, 0, 0);
    renderpass.end();

    device.queue.submit([commandEncoder.finish()]);
}

Initialize();
