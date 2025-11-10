import { mergeBufferGeometries } from "./BufferGeometryUtils.js";
import { Water } from './water.js';

function clamp(lo, hi, x) {
    return Math.max(lo, Math.min(hi, x));
}

export class Terrain {

    constructor(scene, info) {
        // Gets terrain and ocean meshes and adds them to scene
        this.manager = new TerrainMeshManager(info);

        // for (let i = 0; i < 2; i++) {
        //     for (let j = 0; j < 2; j++) {
        //         scene.add(this.manager.meshes[i][j].terrainMesh);
        //     }
        // }

        scene.add(this.manager.meshes[0][0].terrainMesh);
        this.manager.meshes[0][0].updateMesh(info, info.x, info.z);

        this.oceanMesh = new OceanMesh(info).oceanMesh;

        scene.add(this.oceanMesh)

        this.prevTime = performance.now();
    }

    update(camera, info) {

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        // Resets camera and moves terrain if camera goes outside tile bounds
        if (Math.abs(camera.position.x) > info.tileSize / 2) {
            const shiftX = Math.sign(camera.position.x) * info.tileSize
            info.x += shiftX;
            camera.position.x -= shiftX;
            //this.manager.meshes[0][0].terrainMesh.position.x += shiftX;
            this.manager.meshes[0][0].updateMesh(info, info.x, info.z);
            this.oceanMesh.material.uniforms['extraX'].value = info.x;
        }
        if (Math.abs(camera.position.z) > info.tileSize / 2) {
            const shiftZ = Math.sign(camera.position.z) * info.tileSize
            info.z += shiftZ;
            camera.position.z -= shiftZ;
            //this.manager.meshes[0][0].terrainMesh.position.z += shiftZ;
            this.manager.meshes[0][0].updateMesh(info, info.x, info.z);
            this.oceanMesh.material.uniforms['extraZ'].value = info.z;
        }

        this.oceanMesh.material.uniforms['time'].value += delta;

        //let oceanCamera = camera.clone();
        //oceanCamera.position.x = (info.x + camera.position.x) % 1024;
        //oceanCamera.position.z = (info.z + camera.position.z) % 1024;
        //oceanCamera.updateMatrixWorld(true);

        //this.oceanMesh.oceanCamera = oceanCamera;

        this.prevTime = time;
    }

}

export class TerrainInfo {

    constructor(x, z) {
        // Terrain constants
        this.maxRes = 64;
        this.scale = 10;
        this.tileSize = this.maxRes * this.scale;
        this.radius = 2 * this.maxRes * this.scale;
        this.renderDist = 600 * this.scale;
        this.falloffExp = function (dist) {
            return (dist - this.radius) / this.tileSize;
        };
        //this.generation = new TerrainGeneration();
        // this.layers = [
        //     new TerrainLayer(1000, 20 * this.scale),
        //     new TerrainLayer(150, 4 * this.scale),
        //     new TerrainLayer(50, 1 * this.scale),
        //     new TerrainLayer(5, 0.04 * this.scale),
        // ];
        this.maxExp = Math.log2(this.maxRes);
        this.geoDist = this.tileSize * Math.ceil(this.renderDist / this.tileSize);
        this.x = x;
        this.z = z;
        this.sunDirection = new THREE.Vector3();
        const phi = THREE.MathUtils.degToRad(60);
        const theta = THREE.MathUtils.degToRad(180);
        this.sunDirection.setFromSphericalCoords(1, phi, theta);
        this.oceanLevel = 0;
        this.grassColor = new THREE.Color(0x27db57);
        this.rockColor = new THREE.Color(0x4f3622);
    }
}

class TerrainGeneration {

    // Normalized fractal Brownian motion
    // x, z, frequency, amplitude, octaves, lacunarity, persistence, turbulence?, seed for Perlin noise
    static fbm(x, z, freq, amp, oct, lac = 2, per = 0.5, turb = false, seed = 0) {
        let sum = 0;
        let val;
        let ampSum = 0;
        const ampOld = amp;

        for (let i = 0; i < oct; i++) {
            noise.seed(seed++);
            val = amp * noise.perlin2(freq * x, freq * z);
            if (turb) {
                sum -= Math.abs(val) * 2;
            } else {
                sum += val;
            }
            ampSum += amp;
            freq *= lac;
            amp *= per;
        }

        return sum * (ampOld / ampSum);
    }

    // Returns height of a point, obtained from multiple transformed layers of fbm
    static height(info, x, z) {
        let y = 0;
        // Mountains
        let mtn = this.fbm(x, z, 0.001, 1, 5, 2, 0.5, true);
        // Mountain mask
        let mtn_amount = this.fbm(x, z, 0.00005, 1, 3, 2, 0.5, false, 1);
        // Continent elevation
        let continent = this.fbm(x, z, 0.00001, 1000, 2);
        y += continent;
        // This is... a mess. But it's also where the magic happens.
        // Makes mountain ranges in some areas, and some areas hillier than others. Also flattens the land near the ocean
        y += (mtn * 200 + 200) * (clamp(0, 0.85 + this.fbm(x, z, 0.00005, 0.15, 1), mtn_amount * (10 * Math.tanh(mtn_amount * 4 + 0.2)) - 0.8) + clamp(-4, 0.2, mtn_amount * 4)) * (-0.92 / (Math.cosh(0.02 * (y - info.oceanLevel))) + 1);
        //y = (y - info.oceanLevel) * (-0.8 / (Math.cosh(0.005 * (y - info.oceanLevel))) + 1) + info.oceanLevel;

        return y;

    }
}

class TerrainMeshManager {
    constructor(info) {

        // Very basic material for now, with custom vertex colors
        const material = new THREE.MeshStandardMaterial({
            //color: 0x27db57,
            side: THREE.FrontSide,
            vertexColors: THREE.VertexColors,
            //wireframe: true,
            //flatShading: true,
            //transparent: true,
        });


        // It turns out that things are running smoothly enough without my buffer idea for now, but I'll keep
        // these things in place in case I need it later
        this.bufferDir = [1, 1];

        this.meshes = this.newBufferMeshes(info, material, this.bufferDir);
    }

    newBufferMeshes(info, material, bufferDir) {
        let meshes = [[], []];

        // for (let i = 0; i < 2; i++) {
        //     for (let j = 0; j < 2; j++) {
        //         meshes[i][j] = new TerrainMesh(info, info.x + i * bufferDir[0] * info.tileSize, info.z + j * bufferDir[1] * info.tileSize, material, i == 0 && j == 0);
        //     }
        // }

        meshes[0][0] = new TerrainMesh(info, info.x, info.z, material, true);

        return meshes;
    }
}

class TerrainMesh {

    constructor(info, meshWorldX, meshWorldZ, material, visible) {
        this.meshWorldX = meshWorldX;
        this.meshWorldZ = meshWorldZ;
        this.terrainMesh = this.createTerrainMesh(info, this.meshWorldX, this.meshWorldZ, material, visible);
    }

    getVertexHeight(info, x, z) {
        // let height = 0.0;
        // for (let i = 0; i < info.layers.length; i++) {
        //     height += noise.perlin2(x / info.layers[i].scale, z / info.layers[i].scale) * info.layers[i].maxHeight;
        // }
        // return height
        return TerrainGeneration.height(info, x, z);
    }

    createTerrainMesh(info, meshWorldX, meshWorldZ, material, visible) {
        let terrainGeo;

        let scope = this;

        // Creates PlaneBufferGeometry for a given tile, and positions each point to fit into the overall geometry
        function createTile(info, tileX, tileZ, tileDist) {
            const tileExp = Math.round(info.falloffExp(tileDist));
            const tileRes = info.maxRes / (Math.pow(2, Math.min(info.maxExp, Math.max(0, tileExp))));
            const tileScale = info.tileSize / tileRes;
            const skirt = [Number(tileX > 0), Number(tileX < 0), Number(tileZ > 0), Number(tileZ < 0)];
            const tileResX = tileRes + skirt[0] + skirt[1];
            const tileResZ = tileRes + skirt[2] + skirt[3];
            const newGeo = new THREE.PlaneBufferGeometry(info.tileSize, info.tileSize, tileResX, tileResZ);
            newGeo.rotateX(Math.PI * -0.5);

            for (let z = -skirt[2]; z <= tileRes + skirt[3]; z++) {
                for (let x = -skirt[0]; x <= tileRes + skirt[1]; x++) {
                    const index = 3 * ((z + skirt[2]) * (tileResX + 1) + (x + skirt[0]));
                    const worldX = tileX + (x * tileScale);
                    const worldZ = tileZ + (z * tileScale);
                    newGeo.attributes.position.array[index + 0] = worldX;
                    newGeo.attributes.position.array[index + 2] = worldZ;

                    const height = scope.getVertexHeight(info, meshWorldX + worldX, meshWorldZ + worldZ);
                    newGeo.attributes.position.array[index + 1] = height;
                }
            }
            newGeo.attributes.position.needsUpdate = true;

            return newGeo;
        }

        // Combines tile geometries into one terrain geometry and creates a mesh for it
        for (let tileX = -info.geoDist; tileX <= info.geoDist; tileX += info.tileSize) {
            for (let tileZ = -info.geoDist; tileZ <= info.geoDist; tileZ += info.tileSize) {
                const tileDist = Math.hypot(tileX, tileZ);
                if (tileDist <= info.renderDist) {
                    const newGeo = createTile(info, tileX, tileZ, tileDist);

                    if (terrainGeo === undefined) {
                        terrainGeo = newGeo;
                    } else {
                        terrainGeo = mergeBufferGeometries([terrainGeo, newGeo]);
                    }
                }
            }
        }

        const terrain = new THREE.Mesh(terrainGeo, material);
        terrain.visible = visible;
        terrain.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(terrain.geometry.attributes.position.length), 3));

        // compute normals so shading works properly
        terrainGeo.computeVertexNormals();

        return terrain;
    }

    // Updates height and color of each vertex according to the new terrain position
    updateMesh(info, meshWorldX, meshWorldZ) {
        this.meshWorldX = meshWorldX;
        this.meshWorldZ = meshWorldZ;

        const positions = this.terrainMesh.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] = this.getVertexHeight(info, meshWorldX + positions[i + 0], meshWorldZ + positions[i + 2]);
        }

        this.terrainMesh.geometry.attributes.position.needsUpdate = true;
        this.terrainMesh.geometry.computeVertexNormals();

        const normals = this.terrainMesh.geometry.attributes.normal.array;
        const colors = this.terrainMesh.geometry.attributes.color.array;
        let vertexColor;
        let vertexAngle;
        const colorObj = new THREE.Color();
        // Updates the colors for each vertex based on its angle from parallel. Very rough as of now
        for (let i = 0; i < normals.length; i += 3) {
            vertexAngle = new THREE.Vector3(normals[i + 0], normals[i + 1], normals[i + 2]);
            vertexAngle = vertexAngle.angleTo(new THREE.Vector3(vertexAngle.x, 0, vertexAngle.z));
            vertexColor = colorObj.lerpColors(info.rockColor, info.grassColor, clamp(0, 1, (vertexAngle / THREE.MathUtils.degToRad(90) - 0.7) * 4));
            colors[i + 0] = vertexColor.r;
            colors[i + 1] = vertexColor.g;
            colors[i + 2] = vertexColor.b;
        }

        this.terrainMesh.geometry.attributes.color.needsUpdate = true;
    }
}

class OceanMesh {
    constructor(info) {
        this.oceanMesh = this.createOceanMesh(info);
    }

    createOceanMesh(info) {
        const waterGeometry = new THREE.PlaneGeometry(info.renderDist * 2, info.renderDist * 2);

        let water = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('../textures/ocean/waternormals.jpg', function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }),
                sunDirection: info.sunDirection,
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: false
            }
        );

        water.rotation.x = - Math.PI / 2;
        water.position.y = info.oceanLevel;

        return water;
    }
}