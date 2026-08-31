# 🤖 AR Desk Companion

A WebAR project built with **React + Three.js + WebXR**. Point your phone at
your desk and a 3D robot appears, sitting on the surface with a floating
dashboard showing your Pomodoro timer, tasks, next meeting, notifications, and
backend status.

## Features

- Real surface detection using **WebXR hit-testing** (finds your desk).
- A **3D robot** (procedural by default, or load your own `robot.glb`).
- A **live dashboard** panel that billboards toward the camera.
- Tap to place the robot; tap again to toggle the dashboard.
- Live Pomodoro countdown; data is easy to wire to Firebase / your API.

## Requirements

- An **AR-capable phone**: Android with Chrome + ARCore, or an AR headset
  browser that supports `immersive-ar`.
- **HTTPS** (WebXR requires it). This project uses a self-signed cert in dev.

## Getting started

```bash
npm install
npm run dev
```

Vite serves over HTTPS with `--host`, so it prints a LAN URL like
`https://192.168.x.x:5173`. Open that on your phone (accept the self-signed
certificate warning), tap **Start AR**, grant camera access, aim at your desk,
and tap to place the robot.

> iOS Safari does not support WebXR `immersive-ar` yet. Use Android/Chrome or
> a compatible headset browser.

## Use your own 3D model

Put a `robot.glb` file in `public/models/`. See
[`public/models/README.md`](public/models/README.md).

## Project structure

```
index.html
vite.config.js
src/
  main.jsx          React entry
  App.jsx           UI, AR support check, live data, start button
  ar/
    arScene.js      WebXR session, hit-test, reticle, placement, loop
    robot.js        Procedural 3D robot with idle animation
    dashboard.js    Canvas-based floating dashboard panel
public/
  models/           Drop robot.glb here (optional)
```

## Wiring real data

In `src/App.jsx`, `dashboardRef.current` holds the dashboard data. Replace the
static values with calls to Firebase / your backend and update the ref; the AR
panel redraws automatically when the data changes.
