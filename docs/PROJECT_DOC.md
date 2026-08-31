# AR Desk Companion — Project Documentation

A WebAR app that places a 3D robot on your physical desk with a live floating
dashboard (clock, calendar, tasks, notifications, system status). Built with
**React + Three.js + WebXR**.

---

## 1. What we built

A browser-based Augmented Reality experience:

- You open the site on an AR-capable phone.
- Tap **Start AR** → the camera opens.
- Aim at your desk → a blue ring (reticle) marks the detected surface.
- Tap → a **3D robot** drops onto the desk with a **floating dashboard** beside it.
- Tap again → toggles the dashboard on/off.

The robot has an idle animation (gentle bob, head sway, glowing antenna) and
the dashboard always faces the camera as you move around.

---

## 2. Tech stack

| Layer            | Choice                    | Why                                        |
| ---------------- | ------------------------- | ------------------------------------------ |
| UI framework     | React 18                  | Component structure + state for the 2D UI  |
| 3D engine        | Three.js                  | Renders robot, dashboard, reticle          |
| AR runtime       | WebXR (`immersive-ar`)    | Native browser AR + real surface detection |
| Build tool       | Vite 5                    | Fast dev server + production build         |
| Dev HTTPS        | @vitejs/plugin-basic-ssl  | WebXR requires HTTPS, even on localhost     |
| Hosting          | Vercel                    | Real HTTPS cert, works on any phone        |

---

## 3. Project structure

```
Augmented_Reality/
├─ index.html              App shell + base styling
├─ vite.config.js          Vite config; dev-only self-signed HTTPS
├─ vercel.json             Vercel build settings (framework, output dir)
├─ package.json            Dependencies and scripts
├─ .gitignore
├─ README.md               Quick start
├─ docs/
│  └─ PROJECT_DOC.md       This document
├─ public/
│  └─ models/
│     └─ README.md         Where to drop your own robot.glb
└─ src/
   ├─ main.jsx             React entry point
   ├─ App.jsx              UI, AR support check, live data, Start button
   └─ ar/
      ├─ arScene.js        WebXR session, hit-test, placement, render loop
      ├─ robot.js          Procedural 3D robot + idle animation
      └─ dashboard.js      Canvas-based floating dashboard panel
```

---

## 4. How each file works

### `src/App.jsx`

- Checks whether the device supports `immersive-ar` and shows status text.
- Holds all **dashboard data** in a ref (`dashboardRef`): greeting, name,
  clock, date, weather, tasks, meetings, notifications, system status,
  Pomodoro timer.
- Runs a **1-second interval** that updates the live clock, date, greeting,
  and counts down the Pomodoro timer.
- The **Start AR** button hands the data getter to the AR scene.

### `src/ar/arScene.js`

The core AR engine:

- Creates the Three.js renderer with `xr.enabled = true`.
- Requests an `immersive-ar` session with the **hit-test** feature and a
  **DOM overlay** (for the "Exit AR" button).
- Uses a **hit-test source** to find real surfaces and shows a reticle ring.
- On first tap → places the robot + dashboard at the reticle position.
- On later taps → toggles the dashboard.
- Render loop updates robot animation and redraws the dashboard each frame.
- Tries to load `/models/robot.glb`; if absent, falls back to the built-in robot.

### `src/ar/robot.js`

- Builds a friendly robot from Three.js primitives (base, capsule body,
  sphere head, glowing eyes, antenna with pulsing bulb, angled arms).
- Roughly 15 cm tall in AR units.
- Exposes `userData.update(dt)` for the idle bob + head sway animation.

### `src/ar/dashboard.js`

- Draws the dashboard onto a **2D canvas**, used as a texture on a 3D plane.
- Renders: greeting + name, live clock + date, weather, Pomodoro, calendar
  (multiple meetings), tasks with checkboxes + strike-through for done items,
  notification count, and system status dots (Backend, Firebase, GitHub).
- **Billboards** toward the camera so it's always readable.
- Redraws only when the data changes (cheap dirty check).

---

## 5. What the dashboard shows

- **Header**: time-aware greeting (morning/afternoon/evening) + your name.
- **Top-right**: live clock + date, updating every second.
- **Weather** and **Pomodoro** countdown.
- **Calendar**: list of meetings with times and titles.
- **Tasks**: checklist; completed items show a green check and strike-through.
- **Notifications**: unread count.
- **System status**: green/red dots for Backend, Firebase, GitHub.

---

## 6. Running locally

```bash
npm install
npm run dev
```

Vite serves over HTTPS with `--host` and prints a LAN URL like
`https://192.168.x.x:5173`. Open that on an Android phone (same Wi-Fi),
accept the self-signed cert warning, and tap Start AR.

**Firewall note:** Windows Firewall can block the phone. We opened port 5173
with an inbound rule:

```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Any
```

---

## 7. Deploying to Vercel

Vercel gives a real HTTPS certificate (no warning) and avoids firewall/router
issues, so it's the best way to demo on a phone.

Git-based deploy:

```bash
git init
git add .
git commit -m "AR Desk Companion"
git branch -M main
git remote add origin https://github.com/<username>/ar-desk-companion.git
git push -u origin main
```

Then import the repo at vercel.com → Add New → Project. Vercel auto-detects
Vite (`npm run build`, output `dist`).

`vite.config.js` disables the self-signed SSL plugin in production builds so
the Vercel build succeeds.

---

## 8. Device support

| Device / browser        | AR session      | Page loads |
| ----------------------- | --------------- | ---------- |
| Android Chrome + ARCore | ✅ Works         | ✅          |
| Android (no ARCore)     | ❌ Install ARCore| ✅          |
| iPhone Safari/Chrome    | ❌ No WebXR AR   | ✅          |
| Desktop browsers        | ❌ No camera AR  | ✅          |

Requirements for the AR session: **HTTPS** and an **AR-capable device**.

---

## 9. Using your own 3D model

Drop a glTF file named `robot.glb` into `public/models/`. If present it's
loaded and animated automatically; otherwise the built-in procedural robot is
used. Free sources: Khronos glTF sample models (RobotExpressive), Sketchfab
(CC-licensed), Poly Pizza.

---

## 10. Ideas for next steps

- Wire the calendar to the **Google Calendar API** and tasks to **Firebase**.
- Make tapping a task **check it off** in AR (raycast against the panel).
- Add a **real weather** lookup by location.
- Add sound / voice greeting from the robot.
- Add multiple placeable objects or drag-to-reposition.
