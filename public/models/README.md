# 3D Robot Model

Drop a glTF binary file here named **`robot.glb`** to use your own 3D robot.

- If `robot.glb` exists, the app loads and animates it.
- If it does not exist, the app falls back to a built-in procedural robot,
  so everything works out of the box with no download.

## Where to get a free robot model

- Khronos glTF sample models (RobotExpressive): a rigged, animated robot
- Sketchfab (filter by "Downloadable" + CC license)
- Poly Pizza (public-domain low-poly models)

Rename your downloaded file to `robot.glb` and place it in this folder:

```
public/models/robot.glb
```

The app scales it to ~15 cm for the desk. Adjust `model.scale.setScalar(...)`
in `src/ar/arScene.js` if your model comes in at a different size.
