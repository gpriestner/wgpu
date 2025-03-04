import { Renderer } from "/renderer.js";

const canvas = document.querySelector("canvas");

const renderer = new Renderer(canvas);

await renderer.Initialize();

function animate() {
    renderer.render();
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);