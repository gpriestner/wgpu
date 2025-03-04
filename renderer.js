import { shader } from "/shaders.js";
import { TriangleMesh } from "/triangle_mesh.js";
import { Material } from "/material.js";

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.angle = 0.01;

        this.projection = glMatrix.mat4.create();
        glMatrix.mat4.perspective(this.projection, Math.PI / 4, 800/600, 0.1, 10);
    }
    async Initialize() {
        await this.setupDevice();
        await this.createAssets();
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

        
        this.textureView = this.context.getCurrentTexture().createView();
    }
    async makePipeline() {

        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 3, // 4x4 matrix each element is 4 bytes * 3 matrices
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST // used  as a uniform in the shader and can be copied to
        });

        const bindGroupLayout = this.device.createBindGroupLayout({ 
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX, // used in the vertex shader
                    buffer: {} // this specifies that the binding is a buffer
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
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
                },
                {
                    binding: 1,
                    resource: this.material.view
                },
                {
                    binding: 2,
                    resource: this.material.sampler
                }
            ] 
        });

        const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

        this.pipeline = this.device.createRenderPipeline({
            vertex: {
                module: this.device.createShaderModule({
                    code: shader
                }),
                entryPoint: "vs_main",
                buffers: [this.triangleMesh.bufferLayout]
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: shader
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

    async createAssets() {
        this.triangleMesh = new TriangleMesh(this.device);
        this.material = new Material();

        await this.material.initialize(this.device, "/greenhead.png");
    }

    render() {

        this.angle += 0.01;
        this.angle %= Math.PI * 2;

        //const projection = glMatrix.mat4.create();
        // perspective (field of view in rads, aspect ratio [w/h], nearest, furthest) - convert to 2d + clip space
        //glMatrix.mat4.perspective(projection, Math.PI / 4, 800/600, 0.1, 10);

        const view = glMatrix.mat4.create();
        // lookAt (location of camera, looking at point, up vector) - convert to camera space
        glMatrix.mat4.lookAt(view, [-2, 0, 2], [0, 0, 0], [0, 0, 1]);

        const model = glMatrix.mat4.create();
        // rotate (angle to rotate, axis around which to rotate 0,0,1=z 0,0,-1=reverse z) - convert to world space
        glMatrix.mat4.rotate(model, model, this.angle, [0, 0, 1]);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, model);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, view);
        this.device.queue.writeBuffer(this.uniformBuffer, 128, this.projection);


        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        const renderpass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        renderpass.setPipeline(this.pipeline);
        renderpass.setVertexBuffer(0, this.triangleMesh.buffer); // set the vertex buffer into slot 0 of the vertex shader
        renderpass.setBindGroup(0, this.bindGroup);
        renderpass.draw(3, 1, 0, 0);
        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}
