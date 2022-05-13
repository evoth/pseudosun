# PseudoSun

## Plan

A 3D experience that allows you to explore a virtual, procedurally generated world with realtime weather effects.

## Current State

A very rough test for camera movement (click to start, controls are WASD or arrow keys).

## Updates since last commit

- Adapted code from three.js examples for camera control and movement.
- Added app.js and world.js for future use.

## Todo

- Start creating some terrain.
   - I've though a lot about how I'm going to achieve this, especially the levels of detail.
   - I've settled on using one big custom buffer geometry which moves over the landscape in "chunks".
   - The implementation might be tricky, but I think it should work and end up being very flexible.