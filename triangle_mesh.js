export class TriangleMesh {
    buffer
    bufferLayout

    constructor(device) {
        const vertices = new Float32Array(
            [
                0.0,  0.5, 1.0, 0.0, 0.0,
               -0.5, -0.5, 0.0, 1.0, 0.0,
                0.5, -0.5, 0.0, 0.0, 1.0
            ]
        );

        const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

        const descriptor = {
            size: vertices.byteLength,
            usage,
            mappedAtCreation: true
        };

        this.buffer = device.createBuffer(descriptor);

        new Float32Array(this.buffer.getMappedRange()).set(vertices);
        this.buffer.unmap();

        this.bufferLayout = {
            arrayStride: 20,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x2",
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x3",
                    offset: 8
                }
            ]
        }
    }
}
