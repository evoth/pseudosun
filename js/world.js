import { Controls } from "./controls.js";

let camera, scene, renderer, cube, controls;

export class World {
    constructor() {

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.y = 10;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        scene.fog = new THREE.Fog(0xffffff, 0, 750);

        const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
        light.position.set(0.5, 1, 0.75);
        scene.add(light);

        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        for (let i = 0; i < 100; i++) {
            cube = new THREE.Mesh(geometry, material);
            cube.position.x = Math.random() * 40 - 20;
            cube.position.y = Math.random() * 40 - 20;
            cube.position.z = Math.random() * 40 - 20;
            scene.add(cube);
        }

        controls = new Controls(camera, scene);

        //

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        //

        window.addEventListener('resize', this.onWindowResize);
    }

    doFrame() {

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        controls.update();

        renderer.render(scene, camera);
    }

    onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }
}