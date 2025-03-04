export class TriangleMesh {
    constructor(device) {
        // x y z u v
        // const vertices = new Float32Array(
        //     [
        //         0.0,  0.0,  0.5, 0.5, 0.0,
        //         0.0, -0.5, -0.5, 0.0, 1.0,
        //         0.0,  0.5, -0.5,  1.0, 1.0
        //     ]
        // );

        // x y *z* r g b
        const vertices = new Float32Array(
            [
                0.0,  0.0,  0.5, 1.0, 0.0, 0.0,
                0.0, -0.5, -0.5, 0.0, 1.0, 0.0,
                0.0,  0.5, -0.5, 0.0, 0.0, 1.0
            ]
        );
        
        const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST; // visible to vertex shader and can be copied to

        const descriptor = {
            size: vertices.byteLength,
            usage,
            mappedAtCreation: true // mappedAtCreation is true so that we can write the vertex data to the buffer immediately after creation from the CPU/Javascript side
        };

        this.buffer = device.createBuffer(descriptor);

        new Float32Array(this.buffer.getMappedRange()).set(vertices);
        this.buffer.unmap();

        this.bufferLayout = {
            //arrayStride: 20, // 4 (bytes) * number of floats per vertex (see vertices array above)
            arrayStride: 24,
            attributes: [
                {
                    shaderLocation: 0, // corresponds to the layout(location = 0) in the vertex shader (see 1st argument in vs_main)
                    format: "float32x3",
                    offset: 0
                },
                {
                    shaderLocation: 1, // corresponds to the layout(location = 1) in the vertex shader (see 2nd argument in vs_main)
                    //format: "float32x2",
                    format: "float32x3",
                    offset: 12
                }
            ]
        }
    }
}
