/*
The MIT License

Copyright © 2010-2022 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Modified by Ethan Voth

import { CameraMovement } from './movement.js';

let camera, scene, movement;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let boost = 1;
let prevForwardTime = performance.now();

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const motionSmooth = 10.0;
const speed = 4000.0;
const boostDelay = 300;

export class Controls {
    constructor(camera, scene) {

        movement = new CameraMovement(camera, document.body);

        const blocker = document.getElementById('blocker');
        const menuHint = document.getElementById('menu-hint');

        document.getElementById('play-button').addEventListener('click', function () {

            movement.lock();

        });

        movement.addEventListener('lock', function () {

            menuHint.style.opacity = '1';
            blocker.style.opacity = '0';
            blocker.style.pointerEvents = 'none';

        });

        movement.addEventListener('unlock', function () {

            menuHint.style.opacity = '0';
            blocker.style.opacity = '1';
            blocker.style.pointerEvents = '';

        });

        scene.add(movement.getObject());

        const onKeyDown = function (event) {

            switch (event.code) {

                case 'ArrowUp':
                case 'KeyW':
                    const delta = performance.now() - prevForwardTime;
                    if (!moveForward) {
                        if (delta < boostDelay) {
                            boost *= 2;
                        } else {
                            boost = 1;
                        }
                    }
                    prevForwardTime = performance.now();
                    moveForward = true;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = true;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = true;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = true;
                    break;

                case 'Space':
                    moveUp = true;
                    break;

            }

            moveDown = event.shiftKey;

        };

        const onKeyUp = function (event) {

            switch (event.code) {

                case 'ArrowUp':
                case 'KeyW':
                    moveForward = false;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = false;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = false;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = false;
                    break;

                case 'Space':
                    moveUp = false;
                    break;

                case 'KeyE':
                    if (movement.isLocked) {
                        movement.unlock();
                    } else {
                        movement.lock();
                    }
                    break;

            }

            moveDown = event.shiftKey;

        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

    }

    // Runs every frame, controls movement of camera
    update() {

        const time = performance.now();

        if (movement.isLocked === true) {

            const delta = (time - prevTime) / 1000;

            velocity.x -= velocity.x * motionSmooth * delta;
            velocity.z -= velocity.z * motionSmooth * delta;
            velocity.y -= velocity.y * motionSmooth * delta;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.y = Number(moveUp) - Number(moveDown);
            direction.normalize(); // this ensures consistent movements in all directions

            if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;
            if (moveUp || moveDown) velocity.y -= direction.y * speed * delta;

            movement.moveRight(- velocity.x * boost * delta);
            movement.moveForward(- velocity.z * boost * delta);
            movement.moveUp(- velocity.y * boost * delta);

        }

        prevTime = time;

    }
}