import { wcode } from "/shaders.js";
import { TriangleMesh } from "/triangle_mesh.js";

const p = glMatrix.mat4.create();

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.t = 0.01;
    }
    async Initialize() {

        await this.setupDevice();

        this.createAssets();

        await this.makePipeline();

        this.render();
    }
    async setupDevice() {
        this.adapter = await navigator.gpu?.requestAdapter();
        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });
    }
    async makePipeline() {

        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const bindGroupLayout = this.device.createBindGroupLayout({ 
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ] 
        });

        this.bindGroup = this.device.createBindGroup({ 
            layout: bindGroupLayout, 
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer
                    }
                }
            ] 
        });

        const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

        this.pipeline = this.device.createRenderPipeline({
            vertex: {
                module: this.device.createShaderModule({
                    code: wcode
                }),
                entryPoint: "vs_main",
                buffers: [this.triangleMesh.bufferLayout]
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: wcode
                }),
                entryPoint: "fs_main",
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: "triangle-list"
            },
            layout: pipelineLayout // "auto"
        });
    }

    createAssets() {
        this.triangleMesh = new TriangleMesh(this.device);
    }

    render = () => {

        this.t += 0.01;
        this.t %= Math.PI * 2;

        const projection = glMatrix.mat4.create();
        // perspective ( field of view in rads, aspect ratio [w/h], nearest, furthest)
        glMatrix.mat4.perspective(projection, Math.PI / 4, 800/600, 0.1, 10);

        const view = glMatrix.mat4.create();
        // lookAt ( location of camera, looking at point, up vector)
        glMatrix.mat4.lookAt(view, [-2, 0, 2], [0, 0, 0], [0, 0, 1]);

        const model = glMatrix.mat4.create();
        // rotate ( angle to rotate, axis around which to rotate)
        glMatrix.mat4.rotate(model, model, this.t, [0, 0, -1]);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, model);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, view);
        this.device.queue.writeBuffer(this.uniformBuffer, 128, projection);


        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        const renderpass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 1, g: 1, b: 1, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        renderpass.setPipeline(this.pipeline);
        renderpass.setVertexBuffer(0, this.triangleMesh.buffer);
        renderpass.setBindGroup(0, this.bindGroup);
        renderpass.draw(3, 1, 0, 0);
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(this.render);
    }
}
