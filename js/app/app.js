import { World } from './world.js';

let world;

init();
animate();

function init() {

    world = new World();
}

// Main animation loop
function animate() {

    world.doFrame();
    requestAnimationFrame(animate);

}