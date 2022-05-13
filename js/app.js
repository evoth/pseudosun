import { World } from './world.js';

let world;

init();
animate();

function init() {

    world = new World();
}

function animate() {

    requestAnimationFrame(animate);

    world.doFrame();

}