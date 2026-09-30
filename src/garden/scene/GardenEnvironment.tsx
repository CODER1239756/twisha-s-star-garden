import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LAYOUT, pathX } from "../placement";
import { lawnTexture, soilTexture, stoneTexture } from "./textures";

/** Ground, soil bed, stepping-stone path and rocks. */
export function GardenGround() {
  const lawn = useMemo(() => lawnTexture(), []);
  const soil = useMemo(() => soilTexture(), []);
  const stone = useMemo(() => stoneTexture(), []);

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
    const out: { p: [number, number, number]; s: [number, number, number]; r: number }[] = [];
    for (let z = 6; z > -5; z -= 0.72) {
      const zz = z + (Math.random() - 0.5) * 0.15;
      out.push({
        p: [pathX(zz) + (Math.random() - 0.5) * 0.15, 0.02, zz],
        s: [0.34 + Math.random() * 0.1, 0.06, 0.26 + Math.random() * 0.08],
        r: Math.random() * Math.PI,
      });
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
        o.rotation.set(0, s.r, 0);
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
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const grassFrag = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uTip;
  uniform float uLight;
  varying float vH;
  varying vec3 vTint;
  #include <fog_pars_fragment>
  void main() {
    vec3 col = mix(uBase, uTip, vH) * vTint * uLight;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/** Instanced wind-blown grass tufts around the edges of the composition. */
export function Grass({ count, light }: { count: number; light: number }) {
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
        },
      }),
    [],
  );
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
  });

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />;
}
