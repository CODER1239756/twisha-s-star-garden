import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { NIGHT_ENVIRONMENT, QUALITY, TIME_PRESETS } from "../config";
import { useGarden } from "../store";
import { ASSETS, SafeAsset } from "./AssetLoader";

const tmp = new THREE.Color();
const moonPos = new THREE.Vector3();

/**
 * Night image-based lighting built from a handful of Lightformers: a cool moon
 * softbox, a faint sky wash, a teal horizon band and a dark ground bounce.
 * Rendered into a tiny cubemap once (frames={1}), so it costs a single PMREM
 * pass and nothing per frame. The daytime HDRI is deliberately not used here —
 * dimming a daylight map only gives you a dim *day* (warm sky, wrong reflections).
 */
function NightEnvironment() {
  return (
    <Environment resolution={NIGHT_ENVIRONMENT.resolution} frames={1}>
      {NIGHT_ENVIRONMENT.formers.map((f, i) => (
        <Lightformer
          key={i}
          form="rect"
          position={f.position}
          scale={f.scale}
          color={f.color}
          intensity={f.intensity}
        />
      ))}
    </Environment>
  );
}

/** Blends lighting, fog and sky toward the current time-of-day + weather. */
export function EnvironmentController() {
  const { timeOfDay, weather, quality } = useGarden((s) => s.settings);
  const preset = TIME_PRESETS[timeOfDay];
  const rain = weather === "rain";
  const { scene, gl } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  // Light props are frozen at their first value: the per-frame blend below owns
  // them afterwards, so a time-of-day change eases instead of snapping.
  const initial = useRef(preset);
  const ready = useRef(false);

  useFrame((_, raw) => {
    // first frame snaps straight to the preset (no flash of the wrong lighting on load)
    const k = ready.current ? 1 - Math.exp(-2.2 * Math.min(raw, 0.05)) : 1;
    ready.current = true;
    const dim = rain ? 0.55 : 1;
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color(preset.sky);
    if (!scene.fog) scene.fog = new THREE.Fog(preset.fog, preset.fogNear, preset.fogFar);
    const fog = scene.fog as THREE.Fog;
    tmp.set(preset.sky);
    if (rain) tmp.lerp(new THREE.Color("#9aa39a"), timeOfDay === "night" ? 0.15 : 0.45);
    (scene.background as THREE.Color).lerp(tmp, k);
    fog.color.lerp(tmp, k);
    fog.near += ((rain ? preset.fogNear * 0.6 : preset.fogNear) - fog.near) * k;
    fog.far += ((rain ? preset.fogFar * 0.65 : preset.fogFar) - fog.far) * k;
    scene.environmentIntensity += (preset.env * dim - scene.environmentIntensity) * k;
    gl.toneMappingExposure += (preset.exposure - gl.toneMappingExposure) * k;

    if (sun.current) {
      sun.current.color.lerp(tmp.set(preset.sun), k);
      sun.current.intensity += (preset.sunIntensity * (rain ? 0.35 : 1) - sun.current.intensity) * k;
      sun.current.position.lerp(moonPos.set(...preset.sunPosition), k);
    }
    if (hemi.current) {
      hemi.current.color.lerp(tmp.set(preset.hemiSky), k);
      hemi.current.groundColor.lerp(tmp.set(preset.hemiGround), k);
      hemi.current.intensity += (preset.ambient * 1.6 - hemi.current.intensity) * k;
    }
    if (amb.current) amb.current.intensity += (preset.ambient * dim * 0.6 - amb.current.intensity) * k;
  });

  const map = QUALITY[quality].shadowMap;
  const start = initial.current;
  return (
    <>
      <hemisphereLight ref={hemi} args={[start.hemiSky, start.hemiGround, start.ambient * 1.6]} />
      <ambientLight ref={amb} intensity={start.ambient * 0.6} />
      {/* the sun by day, the moon by night: the only shadow-casting light */}
      <directionalLight
        ref={sun}
        castShadow
        color={start.sun}
        intensity={start.sunIntensity}
        position={start.sunPosition}
        shadow-mapSize={[map, map]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-far={40}
        shadow-radius={4}
      />
      {timeOfDay === "night" ? (
        <NightEnvironment key="night" />
      ) : (
        <SafeAsset
          key="day"
          name="garden_nook HDRI"
          fallback={
            <Environment>
              <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} color="#fff4e2" />
              <Lightformer intensity={1} color="#aeb99a" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
            </Environment>
          }
        >
          <Environment files={ASSETS.hdri} extensions={(l) => l} />
        </SafeAsset>
      )}
    </>
  );
}
