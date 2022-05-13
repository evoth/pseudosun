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

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

const _vector = new THREE.Vector3();

const _changeEvent = {
    type: 'change'
};
const _lockEvent = {
    type: 'lock'
};
const _unlockEvent = {
    type: 'unlock'
};

const _PI_2 = Math.PI / 2;

export class CameraMovement extends THREE.EventDispatcher {

    constructor(camera, domElement) {

        super();

        this.domElement = domElement;

        // Whether cursor is locked
        this.isLocked = false;

        // Range is 0 to Math.PI radians
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        this.pointerSpeed = 1.0;
        const scope = this;

        // Adjusts camera angle on mouse move
        function onMouseMove(event) {

            if (scope.isLocked === false) return;
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            _euler.setFromQuaternion(camera.quaternion);

            _euler.y -= movementX * 0.002 * scope.pointerSpeed;
            _euler.x -= movementY * 0.002 * scope.pointerSpeed;
            _euler.x = Math.max(_PI_2 - scope.maxPolarAngle, Math.min(_PI_2 - scope.minPolarAngle, _euler.x));
            camera.quaternion.setFromEuler(_euler);
            scope.dispatchEvent(_changeEvent);

        }

        function onPointerlockChange() {

            if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {

                scope.dispatchEvent(_lockEvent);
                scope.isLocked = true;

            } else {

                scope.dispatchEvent(_unlockEvent);
                scope.isLocked = false;

            }

        }

        function onPointerlockError() {

            console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');

        }

        this.connect = function () {

            scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove);
            scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange);
            scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError);

        };

        this.disconnect = function () {

            scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove);
            scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange);
            scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError);

        };

        this.dispose = function () {

            this.disconnect();

        };

        this.getObject = function () {

            // retaining this method for backward compatibility
            return camera;

        };

        this.getDirection = function () {

            const direction = new THREE.Vector3(0, 0, - 1);
            return function (v) {

                return v.copy(direction).applyQuaternion(camera.quaternion);

            };

        }();

        this.moveForward = function (distance) {

            // move forward in direction of camera
            camera.getWorldDirection(_vector);
            camera.position.addScaledVector(_vector, distance);

        };

        this.moveRight = function (distance) {

            _vector.setFromMatrixColumn(camera.matrix, 0);

            camera.position.addScaledVector(_vector, distance);

        };

        this.lock = function () {

            this.domElement.requestPointerLock();

        };

        this.unlock = function () {

            scope.domElement.ownerDocument.exitPointerLock();

        };

        this.connect();

    }

}