import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LANTERN_GRASS } from "../config";
import { LAYOUT, pathX } from "../placement";
import { lanternLevels } from "./lanternState";
import { lawnTexture, soilTexture, stoneTexture } from "./textures";

/** Ground, soil bed, stepping-stone path and rocks. */
export function GardenGround() {
  const lawn = useMemo(() => lawnTexture(), []);
  const soil = useMemo(() => soilTexture(), []);
  const stone = useMemo(() => stoneTexture(), []);
  const edge = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    r.addColorStop(0, "#fff");
    r.addColorStop(0.55, "#bbb");
    r.addColorStop(1, "#000");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    // break up the rim so it never reads as a circle
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.5})`;
      const a = Math.random() * Math.PI * 2, d = 34 + Math.random() * 30;
      g.beginPath();
      g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 2 + Math.random() * 6, 0, 7);
      g.fill();
    }
    return new THREE.CanvasTexture(c);
  }, []);
  const pathPatches = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const z = 5.5 - i * 1.2;
        return { x: pathX(z), z, s: 0.9 + Math.random() * 0.5, r: Math.random() };
      }),
    [],
  );

  const bedGeo = useMemo(() => {
    const { bed } = LAYOUT;
    const shape = new THREE.Shape();
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 3) * 0.05 + Math.sin(a * 7 + 1) * 0.03;
      const x = Math.cos(a) * bed.rx * wobble;
      const y = Math.sin(a) * bed.rz * wobble;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const g = new THREE.ShapeGeometry(shape, 24);
    // uv in world units for the soil texture
    const pos = g.attributes["position"]!;
    const uv = g.attributes["uv"]!;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 3, pos.getY(i) / 3);
    return g;
  }, []);

  const stones = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number]; r: number; t?: number }[] = [];
    // irregular spacing, slight sinking/tilt, occasional small side stone
    for (let z = 6; z > -5; ) {
      const zz = z + (Math.random() - 0.5) * 0.12;
      const big = Math.random() > 0.25;
      out.push({
        p: [pathX(zz) + (Math.random() - 0.5) * 0.22, 0.004 + Math.random() * 0.02, zz],
        s: big
          ? [0.3 + Math.random() * 0.14, 0.045 + Math.random() * 0.03, 0.22 + Math.random() * 0.1]
          : [0.18 + Math.random() * 0.06, 0.04, 0.15 + Math.random() * 0.05],
        r: Math.random() * Math.PI,
        t: (Math.random() - 0.5) * 0.08,
      });
      if (Math.random() < 0.18)
        out.push({
          p: [pathX(zz) + (Math.random() > 0.5 ? 0.42 : -0.42), 0.0, zz + 0.2],
          s: [0.09, 0.03, 0.08],
          r: Math.random() * Math.PI,
          t: 0.1,
        });
      z -= big ? 0.62 + Math.random() * 0.22 : 0.45;
    }
    // rocks
    const rocks: [number, number, number, number][] = [
      [LAYOUT.bed.x + 2.1, 0, LAYOUT.bed.z + 1.1, 0.22],
      [LAYOUT.bed.x - 1.9, 0, LAYOUT.bed.z - 1.4, 0.18],
      [LAYOUT.bed.x + 0.8, 0, LAYOUT.bed.z - 1.95, 0.26],
      [-3.4, 0, 2.4, 0.3],
      [2.6, 0, 3.8, 0.2],
    ];
    rocks.forEach(([x, , z, s]) =>
      out.push({ p: [x, s * 0.25, z], s: [s * 1.3, s * 0.8, s], r: Math.random() * Math.PI }),
    );
    return out;
  }, []);

  const stoneRef = useRef<THREE.InstancedMesh>(null);
  const stoneGeo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(1, 1);
    const p = g.attributes["position"]!;
    for (let i = 0; i < p.count; i++) {
      const f = 1 + (Math.sin(p.getX(i) * 5.1) * Math.cos(p.getZ(i) * 4.3)) * 0.08;
      p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useMemo(() => {
    requestAnimationFrame(() => {
      const m = stoneRef.current;
      if (!m) return;
      const o = new THREE.Object3D();
      stones.forEach((s, i) => {
        o.position.set(...s.p);
        o.scale.set(...s.s);
        o.rotation.set(s.t ?? 0, s.r, (s.t ?? 0) * 0.7);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    });
  }, [stones]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial map={lawn} roughness={1} color="#c9cfb8" />
      </mesh>
      <mesh
        geometry={bedGeo}
        rotation-x={-Math.PI / 2}
        position={[LAYOUT.bed.x, 0.012, LAYOUT.bed.z]}
        receiveShadow
      >
        <meshStandardMaterial map={soil} roughness={0.95} color="#d8cbbd" />
      </mesh>
      {/* soft, worn transition from soil into lawn */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[LAYOUT.bed.x, 0.006, LAYOUT.bed.z]}
        scale={[LAYOUT.bed.rx * 2.9, LAYOUT.bed.rz * 2.9, 1]}
        receiveShadow
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial map={soil} alphaMap={edge} transparent depthWrite={false} roughness={1} color="#a89a86" />
      </mesh>
      {/* worn earth along the path */}
      {pathPatches.map((pp, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} rotation-z={pp.r} position={[pp.x, 0.004, pp.z]} scale={[pp.s, pp.s * 1.6, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial map={soil} alphaMap={edge} transparent depthWrite={false} opacity={0.55} roughness={1} color="#b6a993" />
        </mesh>
      ))}
      <instancedMesh
        ref={stoneRef}
        args={[stoneGeo, undefined, stones.length]}
        castShadow
        receiveShadow
        userData={{ wet: true }}
      >
        <meshStandardMaterial map={stone} roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

const grassVert = /* glsl */ `
  uniform float uTime;
  varying float vH;
  varying vec3 vTint;
  varying vec3 vWorld;
  attribute vec3 aTint;
  #include <fog_pars_vertex>
  void main() {
    vec3 p = position;
    vH = uv.y;
    vTint = aTint;
    vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
    float w = sin(uTime * 1.2 + wp.x * 0.55 + wp.z * 0.35) * 0.09
            + sin(uTime * 2.6 + wp.x * 1.9 + wp.z * 1.1) * 0.025;
    float bend = vH * vH;
    wp.x += w * bend;
    wp.z += w * 0.6 * bend;
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const grassFrag = /* glsl */ `
  #define LANTERNS ${LAYOUT.lanterns.length}
  uniform vec3 uBase;
  uniform vec3 uTip;
  uniform float uLight;
  uniform vec3 uTint;
  uniform vec3 uLanternPos[LANTERNS];
  uniform float uLanternLevel[LANTERNS];
  uniform vec3 uLanternColor;
  uniform vec2 uLanternParams; // x = radius, y = strength
  varying float vH;
  varying vec3 vTint;
  varying vec3 vWorld;
  #include <fog_pars_fragment>
  void main() {
    vec3 col = mix(uBase, uTip, vH) * vTint * uTint * uLight;
    // grass is unlit, so fake the warm pool each lantern throws on it (tips catch more)
    for (int i = 0; i < LANTERNS; i++) {
      float a = 1.0 - smoothstep(0.0, uLanternParams.x, distance(vWorld, uLanternPos[i]));
      col += uLanternColor * uLanternLevel[i] * uLanternParams.y * a * a * (0.35 + 0.65 * vH);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/** Instanced wind-blown grass tufts around the edges of the composition. */
export function Grass({ count, light, tint = "#ffffff" }: { count: number; light: number; tint?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: grassVert,
        fragmentShader: grassFrag,
        side: THREE.DoubleSide,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uTime: { value: 0 },
          uBase: { value: new THREE.Color("#3e4b36") },
          uTip: { value: new THREE.Color("#aeb99a") },
          uLight: { value: 1 },
          uTint: { value: new THREE.Color("#ffffff") },
          uLanternPos: {
            value: LAYOUT.lanterns.map((l) => new THREE.Vector3(l.x, LANTERN_GRASS.height, l.z)),
          },
          uLanternLevel: { value: LAYOUT.lanterns.map(() => 0) },
          uLanternColor: { value: new THREE.Color(LANTERN_GRASS.color) },
          uLanternParams: { value: new THREE.Vector2(LANTERN_GRASS.radius, LANTERN_GRASS.strength) },
        },
      }),
    [],
  );
  const tintTarget = useMemo(() => {
    const c = new THREE.Color(tint);
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    return c.multiplyScalar(1 / Math.max(lum, 0.0001));
  }, [tint]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.045, 0.32, 1, 4);
    g.translate(0, 0.16, 0);
    const p = g.attributes["position"]!;
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / 0.32;
      p.setX(i, p.getX(i) * (1 - t * 0.9));
    }
    const tints = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = 0.8 + Math.random() * 0.35;
      tints.set([v, v * (0.95 + Math.random() * 0.1), v * 0.9], i * 3);
    }
    g.setAttribute("aTint", new THREE.InstancedBufferAttribute(tints, 3));
    return g;
  }, [count]);

  useMemo(() => {
    requestAnimationFrame(() => {
      const m = ref.current;
      if (!m) return;
      const o = new THREE.Object3D();
      const { bed } = LAYOUT;
      let i = 0;
      let guard = 0;
      while (i < count && guard++ < count * 6) {
        const r = 1.5 + Math.pow(Math.random(), 0.7) * 13;
        const a = Math.random() * Math.PI * 2;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r - 1;
        const bx = (x - bed.x) / (bed.rx + 0.1);
        const bz = (z - bed.z) / (bed.rz + 0.1);
        if (bx * bx + bz * bz < 1) continue;
        if (Math.abs(x - pathX(z)) < 0.45 && z > -5 && z < 6.5) continue;
        if (Math.hypot(x - LAYOUT.bench.x, z - LAYOUT.bench.z) < 0.9) continue;
        // clumping
        if (Math.sin(x * 1.3) * Math.cos(z * 1.1) < -0.4 && Math.random() < 0.6) continue;
        o.position.set(x, 0, z);
        o.rotation.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
        const s = 0.6 + Math.random() * 0.9;
        o.scale.set(s, s * (0.7 + Math.random() * 0.7), s);
        o.updateMatrix();
        m.setMatrixAt(i++, o.matrix);
      }
      m.count = i;
      m.instanceMatrix.needsUpdate = true;
    });
  }, [count]);

  useFrame((state) => {
    mat.uniforms["uTime"]!.value = state.clock.elapsedTime;
    mat.uniforms["uLight"]!.value += (light - mat.uniforms["uLight"]!.value) * 0.05;
    (mat.uniforms["uTint"]!.value as THREE.Color).lerp(tintTarget, 0.05);
    const levels = mat.uniforms["uLanternLevel"]!.value as number[];
    for (let i = 0; i < levels.length; i++) levels[i] = lanternLevels[i] ?? 0;
  });

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />;
}
