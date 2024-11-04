export const wcode = `
struct TransformData {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>
};
@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>
};

//fn vs_main(@builtin(vertex_index) v_id: u32) -> Fragment {
@vertex
fn vs_main(@location(0) vertexPosition: vec3<f32>, @location(1) vertexTexCoord: vec2<f32>) -> Fragment {

    // var positions = array<vec2<f32>, 3> (
    //     vec2<f32>(0.0, 0.5),
    //     vec2<f32>(-0.5, -0.5),
    //     vec2<f32>(0.5, -0.5),
    // );

    // var colors = array<vec3<f32>, 3> (
    //     vec3<f32>(1.0, 0.0, 0.0),
    //     vec3<f32>(0.0, 1.0, 0.0),
    //     vec3<f32>(0.0, 0.0, 1.0)
    // );

    var output : Fragment;
    // output.Position = vec4<f32>(positions[v_id], 0.0, 1.0);
    output.Position = transformUBO.projection * transformUBO.view * transformUBO.model *  vec4<f32>(vertexPosition, 1.0);
    // output.Color = vec4<f32>(colors[v_id], 1.0);
    output.TexCoord = vertexTexCoord;

    return output;
}

@fragment
fn fs_main(@location(0) TexCoord: vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(myTexture, mySampler, TexCoord);
}
`;
