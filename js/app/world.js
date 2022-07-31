import { Controls } from "./controls.js";
import { Terrain, TerrainInfo } from "./terrain.js";

let camera, scene, renderer, controls, terrain, terrainInfo, sky, sun;

export class World {
    // Sets up the scene and camera, and adds the sky and terrain
    constructor() {

        terrainInfo = new TerrainInfo(0, 0);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, terrainInfo.renderDist * 1.1);
        camera.position.y = 10;

        scene = new THREE.Scene();

        /*
        sky = new Sky();
        sky.scale.setScalar(450000);
        */

        sun = terrainInfo.sunDirection;

        /*
        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = 10;
        uniforms['rayleigh'].value = 3;
        uniforms['mieCoefficient'].value = 0.005;
        uniforms['mieDirectionalG'].value = 0.7;

        uniforms['sunPosition'].value.copy(sun);

        scene.add(sky);
        */

        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            '../textures/skybox/TropicalSunnyDay_px.jpg',
            '../textures/skybox/TropicalSunnyDay_nx.jpg',
            '../textures/skybox/TropicalSunnyDay_py.jpg',
            '../textures/skybox/TropicalSunnyDay_ny.jpg',
            '../textures/skybox/TropicalSunnyDay_pz.jpg',
            '../textures/skybox/TropicalSunnyDay_nz.jpg',
        ]);
        scene.background = texture;

        const skyColor = 0xfafafa;
        //scene.background = new THREE.Color(skyColor);
        //scene.fog = new THREE.Fog(skyColor, 0, terrainInfo.renderDist);

        controls = new Controls(camera, scene);
        terrain = new Terrain(scene, terrainInfo);

        let dl = new THREE.DirectionalLight(0xffffff, 1);
        dl.position.copy(sun);
        scene.add(dl);
        scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 0.2));

        //

        renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        // renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // renderer.toneMappingExposure = 0.3;

        document.body.appendChild(renderer.domElement);

        //

        window.addEventListener('resize', this.onWindowResize);
    }

    doFrame() {

        controls.update();
        terrain.update(camera, terrainInfo);

        renderer.render(scene, camera);
    }

    onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }
}