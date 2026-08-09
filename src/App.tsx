import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Edges, ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// =========================================================
// DATA
// =========================================================
type Project = {
  id: string; title: string; subtitle: string; description: string;
  technologies: string[]; color: string; accent: string; bg: string;
  link?: string; year: string;
};
const projects: Project[] = [
  { id: 'sagar', title: 'Sagar Raksha', subtitle: 'Marine Safety & IoT Communication', description: 'Developing a marine safety communication system utilizing LoRa technology for long-range connectivity to assist local fishermen. Completed initial system architecture and component selection; currently seeking sponsorship for hardware implementation and prototyping.', technologies: ['LoRa', 'IoT', 'Embedded C', 'Sensors', 'Arduino IDE'], color: '#2ecc71', accent: '#27ae60', bg: '#0f2a1d', link: 'https://github.com/shridhar-1', year: '2026' },
  { id: 'vtu', title: 'VTU CGPA Calculator', subtitle: 'Web Development Project', description: 'Designed and developed a custom web-based CGPA calculator tailored for VTU engineering students. Integrated the tool into a personal portfolio website to provide accessible utility for peers. Applied HTML, CSS and scripting logic to create a responsive interface with an accurate grade calculation engine.', technologies: ['HTML', 'CSS', 'JavaScript', 'GitHub'], color: '#e67e22', accent: '#d35400', bg: '#2a1a0c', link: 'https://www.shridharmadival.com', year: '2026' },
  { id: 'classd', title: 'Class-D Audio Amplifier', subtitle: 'Analog Electronics Project', description: 'Designed and constructed a cost-effective, high-efficiency Class-D audio amplifier circuit. Integrated a 555 Timer IC for Pulse Width Modulation (PWM) generation and MOSFETs for switching. Simulated circuit behaviour and implemented the physical hardware prototype for laboratory demonstration.', technologies: ['555 Timer', 'PWM', 'MOSFET', 'Multisim', 'PCB'], color: '#e67e22', accent: '#c0392b', bg: '#2a1a0c', link: 'https://github.com/shridhar-1', year: '2025' },
  { id: 'doorlock', title: 'Smart Door Lock', subtitle: 'IoT Embedded Systems Project', description: 'Engineered a home security system that automatically unlocks doors upon successful biometric or PIN authentication via a connected mobile device. Implemented a hardware-software bridge using a custom Android application communicating over USB-OTG with a microcontroller. Controlled a 12V solenoid lock and motor actuation mechanism for electronic unlatching.', technologies: ['Microcontroller', 'USB-OTG', 'Android', 'Solenoid 12V', 'Embedded C'], color: '#2ecc71', accent: '#1abc9c', bg: '#0c241c', link: 'https://github.com/shridhar-1', year: '2025' },
];

type Cert = { id: string; title: string; issuer: string; date: string; skills: string; file: string; color: string };
const certificates: Cert[] = [
  { id: 'buildathon', title: 'Buildathon 2026', issuer: 'Tech4Hack', date: 'Aug 2026', skills: 'Artificial Intelligence (AI) • Team Leadership', file: '/certs/buildathon-2026.jpg', color: '#2ecc71' },
  { id: 'cyber', title: 'Cybersecurity: Password Hacking & Malware Security', issuer: 'Udemy', date: 'Aug 2026', skills: 'Cybersecurity • Malware Analysis • Ethical Hacking', file: '/certs/cybersecurity-udemy.jpg', color: '#e67e22' },
  { id: 'embedded', title: 'Online Internship on Embedded Systems', issuer: 'Emertxe Information Technologies', date: 'Jul 2026', skills: 'Embedded Systems • Electric Vehicle (EV) System', file: '/certs/embedded-systems-emertxe.jpg', color: '#2ecc71' },
  { id: 'iot', title: 'Internship on Internet of Things (IoT)', issuer: 'Emertxe Information Technologies', date: 'Apr 2026', skills: 'C (Programming) • Microcontrollers', file: '/certs/iot-emertxe.jpg', color: '#e67e22' },
  { id: 'pitch', title: 'Participation — Pitch Night Edition', issuer: 'Google Student Ambassador — India', date: 'May 2026', skills: 'Public Speaking • Presentation Skills', file: '/certs/pitch-night-google.jpg', color: '#2ecc71' },
  { id: 'music', title: 'Participation — Music Night Edition', issuer: 'Google Student Ambassador', date: 'Jun 2026', skills: 'Creativity Skills', file: '/certs/music-night-google.jpg', color: '#e67e22' },
];

type Zone = 'outside' | 'home' | 'corridor' | 'skills' | 'projects' | 'about';
type DoorId = 'main' | 'skills' | 'projects' | 'about';

// =========================================================
// PLAYER STATE
// =========================================================
const playerState = { x: 0, z: 9.2, yaw: 0, pitch: 0, bob: 0, moving: false };
const keys = { fw: 0, st: 0, q: false, e: false };
const joyInput = { fw: 0, st: 0 };
const autoWalk = { waypoints: [] as [number, number][] };
const globalLocks: Record<DoorId, boolean> = { main: true, skills: true, projects: true, about: true };
const intro = { locked: true };

const DOOR_WALK: Record<DoorId, { a: [number, number]; b: [number, number] }> = {
  main: { a: [0, 7.8], b: [0, 3.0] },
  skills: { a: [0.35, -7.5], b: [3.6, -7.5] },
  projects: { a: [-0.35, -10.5], b: [-3.8, -10.5] },
  about: { a: [0, -12.6], b: [0, -16.2] },
};

const WALLS: [number, number, number, number][] = [
  [-5.40, 5.10, -1.20, 5.40], [1.20, 5.10, 5.40, 5.40],
  [-5.40, -5.40, -1.40, -5.10], [1.40, -5.40, 5.40, -5.10],
  [-5.40, -5.40, -5.10, 5.40], [5.10, -5.40, 5.40, 5.40],
  [1.40, -6.90, 1.70, -5.10], [1.40, -14.20, 1.70, -8.10],
  [-1.70, -9.90, -1.40, -5.10], [-1.70, -14.20, -1.40, -11.10],
  [-1.70, -14.20, -0.70, -13.90], [0.70, -14.20, 1.70, -13.90],
  [1.40, -11.30, 8.30, -11.00], [1.40, -4.80, 8.30, -4.50], [8.00, -11.30, 8.30, -4.50], [1.40, -5.10, 1.70, -4.80],
  [-8.30, -14.30, -1.40, -14.00], [-8.30, -7.80, -1.40, -7.50], [-8.30, -14.30, -8.00, -7.50],
  [-3.80, -20.30, 3.80, -20.00], [3.50, -20.30, 3.80, -14.00], [-3.80, -20.30, -3.50, -14.00],
  [-3.80, -14.30, -0.70, -14.00], [0.70, -14.30, 3.80, -14.00],
];

const DOOR_BLOCK: Record<DoorId, [number, number, number, number]> = {
  main: [-1.28, 5.05, 1.28, 5.50],
  skills: [1.30, -8.18, 1.85, -6.82],
  projects: [-1.85, -11.18, -1.30, -9.82],
  about: [-0.78, -14.25, 0.78, -13.85],
};

const R = 0.36;
function collide(px: number, pz: number): [number, number] {
  let x = px, z = pz;
  const list: [number, number, number, number][] = [...WALLS];
  (Object.keys(globalLocks) as DoorId[]).forEach(id => { if (globalLocks[id]) list.push(DOOR_BLOCK[id]); });
  for (const w of list) {
    const minX = w[0], minZ = w[1], maxX = w[2], maxZ = w[3];
    const cx = Math.max(minX, Math.min(x, maxX));
    const cz = Math.max(minZ, Math.min(z, maxZ));
    const dx = x - cx, dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < R * R) {
      if (d2 === 0) {
        const l = x - minX, rr = maxX - x, u = z - minZ, dd = maxZ - z;
        const m = Math.min(l, rr, u, dd);
        if (m === l) x = minX - R; else if (m === rr) x = maxX + R; else if (m === u) z = minZ - R; else z = maxZ + R;
      } else {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * R; z = cz + (dz / d) * R;
      }
    }
  }
  return [x, z];
}
function zoneOf(x: number, z: number): Zone {
  if (z > 5.55) return 'outside';
  if (z > -5.30) return 'home';
  if (z < -14.05) return 'about';
  if (x > 1.55) return 'skills';
  if (x < -1.55) return 'projects';
  return 'corridor';
}

// =========================================================
// AUDIO
// =========================================================
let audioCtx: AudioContext | null = null;
function ensureAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { } } if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }
function blip(a: number, b: number, d: number, v: number, t: OscillatorType = 'sine') {
  if (!audioCtx) return; const t0 = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = t; o.frequency.setValueAtTime(a, t0); o.frequency.exponentialRampToValueAtTime(b, t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
  o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + d + 0.02);
}
const playStep = () => blip(100, 48, 0.09, 0.10);
const playDoor = () => blip(260, 90, 0.22, 0.09, 'triangle');
const playUnlock = () => { blip(520, 880, 0.14, 0.10); setTimeout(() => blip(880, 660, 0.18, 0.08), 90); };

// =========================================================
// CAMERA + MOVEMENT
// =========================================================
function CameraController({ onStep, onZone }: { onStep: () => void; onZone: (z: Zone) => void }) {
  const { camera } = useThree();
  const vel = useRef({ x: 0, z: 0 });
  const prevT = useRef(0), prevS = useRef(0);
  const lastZone = useRef<Zone>('outside');
  useFrame((state) => {
    const et = state.clock.elapsedTime;
    const dt = Math.min(0.05, et - prevT.current); prevT.current = et;
    const p = playerState;
    if (intro.locked) { p.yaw = THREE.MathUtils.lerp(p.yaw, 0, 0.12); p.pitch = THREE.MathUtils.lerp(p.pitch, 0, 0.12); }
    else { if (keys.q) p.yaw -= 1.95 * dt; if (keys.e) p.yaw += 1.95 * dt; }
    let tvx = 0, tvz = 0;
    if (autoWalk.waypoints.length) {
      const [tx, tz] = autoWalk.waypoints[0];
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.30) autoWalk.waypoints.shift();
      else { tvx = (dx / d) * 3.5; tvz = (dz / d) * 3.5; }
    } else if (intro.locked) {
      const fwd = Math.max(0, (joyInput.fw + keys.fw));
      tvx = 0; tvz = -fwd * 3.0;
    } else {
      const f = { x: Math.sin(p.yaw), z: -Math.cos(p.yaw) };
      const r = { x: Math.cos(p.yaw), z: Math.sin(p.yaw) };
      const fw = Math.max(-1, Math.min(1, joyInput.fw + keys.fw));
      const st = Math.max(-1, Math.min(1, joyInput.st + keys.st));
      tvx = (f.x * fw + r.x * st) * 3.4;
      tvz = (f.z * fw + r.z * st) * 3.4;
    }
    vel.current.x = THREE.MathUtils.lerp(vel.current.x, tvx, 0.22);
    vel.current.z = THREE.MathUtils.lerp(vel.current.z, tvz, 0.22);
    let nx = p.x + vel.current.x * dt, nz = p.z + vel.current.z * dt;
    if (intro.locked) { nx = 0; nz = Math.max(6.6, nz); }
    [nx, nz] = collide(nx, nz);
    p.x = nx; p.z = nz;
    const spd = Math.hypot(vel.current.x, vel.current.z);
    p.moving = spd > 0.18;
    p.bob += dt * (p.moving ? 8.8 : 1.5);
    const bob = p.moving ? Math.sin(p.bob) * 0.045 : Math.sin(p.bob) * 0.004;
    if (p.moving) { const s = Math.sin(p.bob); if (s > 0.9 && prevS.current <= 0.9) onStep(); prevS.current = s; }
    camera.position.set(nx, 1.85 + bob, nz);
    camera.lookAt(nx + Math.sin(p.yaw) * 5.5, 1.72 + p.pitch * 2.2, nz - Math.cos(p.yaw) * 5.5);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(cam.fov, p.moving ? 61.5 : 60, 0.06);
    cam.updateProjectionMatrix();
    const zz = zoneOf(nx, nz);
    if (zz !== lastZone.current) { lastZone.current = zz; onZone(zz); }
  });
  return null;
}

// =========================================================
// BUILDING BLOCKS
// =========================================================
const H = 5.6;
const paperColor = '#1e272e';
const GOLD = '#e67e22';
const COPPER = '#e67e22';
const CIRCUIT = '#2ecc71';
const SILICON = '#1e272e';
const SILICON_MID = '#263238';

function BoxWall({ b, color = '#fdf6e8' }: { b: [number, number, number, number]; color?: string }) {
  const w = b[2] - b[0], d = b[3] - b[1];
  const cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, H / 2, 0]}><boxGeometry args={[w, H, d]} /><meshStandardMaterial color={color} roughness={0.92} /><Edges color="#0f172a" threshold={15} /></mesh>
      <mesh position={[0, H - 0.14, 0]}><boxGeometry args={[w + 0.07, 0.2, d + 0.07]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD} emissiveIntensity={0.13} /></mesh>
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[w + 0.06, 0.84, d + 0.06]} /><meshStandardMaterial color="#0f1418" roughness={0.55} metalness={0.25} /></mesh>
      <mesh position={[0, 0.88, 0]}><boxGeometry args={[w + 0.09, 0.09, d + 0.09]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} /></mesh>
    </group>
  );
}
function Floor({ x, z, w, d, color, accent = '#2a3a46' }: { x: number; z: number; w: number; d: number; color: string; accent?: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={color} roughness={0.28} metalness={0.16} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}><ringGeometry args={[Math.min(w, d) / 2 - 0.55, Math.min(w, d) / 2 - 0.42, 4, 1]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.14} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}><circleGeometry args={[Math.min(w, d) * 0.20, 40]} /><meshStandardMaterial color={accent} roughness={0.25} metalness={0.2} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}><ringGeometry args={[Math.min(w, d) * 0.20, Math.min(w, d) * 0.215, 40]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.2} /></mesh>
    </group>
  );
}
function Ceil({ x, z, w, d, color }: { x: number; z: number; w: number; d: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={color} /></mesh>
      {[-0.25, 0.25].map((t, i) => <mesh key={`x${i}`} position={[t * w, H - 0.06, 0]}><boxGeometry args={[0.09, 0.1, d]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD} emissiveIntensity={0.1} /></mesh>)}
      {[-0.25, 0.25].map((t, i) => <mesh key={`z${i}`} position={[0, H - 0.06, t * d]}><boxGeometry args={[w, 0.1, 0.09]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD} emissiveIntensity={0.1} /></mesh>)}
    </group>
  );
}
function Column({ pos, h = H }: { pos: [number, number, number]; h?: number }) {
  return (
    <group position={pos} raycast={() => null}>
      <mesh position={[0, 0.16, 0]} raycast={() => null}><cylinderGeometry args={[0.42, 0.48, 0.32, 16]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.28} /></mesh>
      <mesh position={[0, h / 2, 0]} raycast={() => null}><cylinderGeometry args={[0.30, 0.34, h - 0.7, 20]} /><meshStandardMaterial color="#2c3a45" roughness={0.45} metalness={0.25} /></mesh>
      <mesh position={[0, h - 0.26, 0]} raycast={() => null}><cylinderGeometry args={[0.46, 0.34, 0.34, 16]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD} emissiveIntensity={0.12} /></mesh>
      <mesh position={[0, h - 0.06, 0]} raycast={() => null}><boxGeometry args={[0.95, 0.14, 0.95]} /><meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} /></mesh>
    </group>
  );
}
function Chandelier({ pos, color = '#ffd9a0', scale = 1 }: { pos: [number, number, number]; color?: string; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.12; });
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.03, 0.03, 1.1, 8]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} /></mesh>
      <group ref={ref}>
        <mesh><torusGeometry args={[0.52, 0.045, 10, 32]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.18} emissive={GOLD} emissiveIntensity={0.25} /></mesh>
        <mesh position={[0, 0.26, 0]}><torusGeometry args={[0.3, 0.035, 10, 24]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.18} /></mesh>
        <mesh position={[0, -0.3, 0]}><sphereGeometry args={[0.13, 14, 14]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} /></mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.52, 0.06, Math.sin(a) * 0.52]}>
              <mesh><sphereGeometry args={[0.085, 12, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} /></mesh>
            </group>
          );
        })}
      </group>
      <pointLight position={[0, -0.2, 0]} intensity={2.0} distance={11} color={color} />
    </group>
  );
}
function Sconce({ pos, rotY, color = '#ffca6b' }: { pos: [number, number, number]; rotY: number; color?: string }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.16, 0.5, 0.1]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} /></mesh>
      <mesh position={[0, 0.28, 0.16]}><coneGeometry args={[0.17, 0.3, 12]} /><meshStandardMaterial color="#222e38" emissive={color} emissiveIntensity={1.2} /></mesh>
      <pointLight position={[0, 0.35, 0.4]} intensity={1.0} distance={5} color={color} />
    </group>
  );
}
function Rug({ pos, w, d, main = '#0f2a1d', edge = GOLD }: { pos: [number, number, number]; w: number; d: number; main?: string; edge?: string }) {
  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={edge} roughness={0.8} metalness={0.3} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><planeGeometry args={[w - 0.24, d - 0.24]} /><meshStandardMaterial color={main} roughness={0.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}><planeGeometry args={[w - 0.6, d - 0.6]} /><meshStandardMaterial color="#163528" roughness={0.9} /></mesh>
    </group>
  );
}

// speaking avatar — sits on throne, plays dialogue on click
function SpeakingAvatar() {
  const [speaking, setSpeaking] = useState(false);
  const [hasModel, setHasModel] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  useEffect(() => {
    audioRef.current = new Audio('/dialogue.mp3');
    audioRef.current.preload = 'auto';
    const a = audioRef.current;
    const onEnd = () => setSpeaking(false);
    a.addEventListener('ended', onEnd);
    let cancelled = false;
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load('/shridhar-avatar.glb', (gltf) => {
        if (cancelled) return;
        modelRef.current = gltf.scene;
        setHasModel(true);
      }, undefined, () => {});
    }).catch(() => {});
    return () => { cancelled = true; a.pause(); a.removeEventListener('ended', onEnd); };
  }, []);
  const play = (e: any) => {
    e.stopPropagation();
    (e as any).nativeEvent?.stopImmediatePropagation?.();
    autoWalk.waypoints = [];
    const a = audioRef.current;
    if (!a) return;
    if (speaking) { a.pause(); a.currentTime = 0; setSpeaking(false); return; }
    a.currentTime = 0;
    a.play().then(() => setSpeaking(true)).catch(() => setSpeaking(false));
  };
  return (
    <group position={[0, 1.5, -0.15]} scale={1.15} onClick={play} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      userData={{ type: 'avatar' }}
    >
      {hasModel && modelRef.current ? <primitive object={modelRef.current} /> : (
        <group>
          <mesh position={[0, 0.95, 0]}><sphereGeometry args={[0.28, 24, 24]} /><meshStandardMaterial color="#d4a574" roughness={0.55} /></mesh>
          <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.32, 0.38, 0.9, 16]} /><meshStandardMaterial color={CIRCUIT} roughness={0.5} metalness={0.15} /></mesh>
          <mesh position={[0, -0.25, 0.05]}><boxGeometry args={[0.55, 0.45, 0.5]} /><meshStandardMaterial color="#1a2330" roughness={0.7} /></mesh>
          <mesh position={[0, 1.05, 0]}><torusGeometry args={[0.34, 0.035, 10, 28]} /><meshStandardMaterial color={COPPER} emissive={COPPER} emissiveIntensity={speaking ? 1.4 : 0.35} metalness={0.8} roughness={0.25} /></mesh>
          <pointLight position={[0, 1.2, 0.4]} intensity={speaking ? 1.6 : 0.4} distance={3} color={speaking ? CIRCUIT : COPPER} />
        </group>
      )}
    </group>
  );
}

function PhotoFrame({ pos, rotY, w, h, label }: { pos: [number, number, number]; rotY: number; w: number; h: number; label: string }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh><boxGeometry args={[w + 0.14, h + 0.14, 0.07]} /><meshStandardMaterial color="#10161c" /></mesh>
      <mesh position={[0, 0, 0.045]}><boxGeometry args={[w, h, 0.03]} /><meshStandardMaterial color="#2c3a45" /></mesh>
      <mesh position={[0, 0.035, 0.065]}><planeGeometry args={[w - 0.16, h - 0.30]} /><meshStandardMaterial color="#1a232e" /></mesh>
      <Text position={[0, 0.02, 0.075]} fontSize={h * 0.11} color="#6b7d8c" anchorX="center" anchorY="middle" fontWeight={700}>YOUR PHOTO</Text>
      <Text position={[0, -h * 0.40, 0.075]} fontSize={0.055} color="#8a9aa8" anchorX="center" anchorY="middle" fontWeight={700}>{label}</Text>
    </group>
  );
}

function CertFrame({ pos, rotY, cert, w = 1.35, h = 1.0, onOpen }: { pos: [number, number, number]; rotY: number; cert: { id: string; title: string; issuer: string; date: string; skills: string; file: string; color: string }; w?: number; h?: number; onOpen: (c: any) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <group position={pos} rotation={[0, rotY, 0]}
      onPointerOver={() => { setHov(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHov(false); document.body.style.cursor = 'auto'; }}
    >
      <mesh userData={{ type: 'cert', certId: cert.id }} onClick={(e: any) => { e.stopPropagation(); autoWalk.waypoints = []; onOpen(cert); if ('vibrate' in navigator) navigator.vibrate(12); }}>
        <boxGeometry args={[w + 0.12, h + 0.42, 0.06]} /><meshStandardMaterial color={hov ? cert.color : '#1a252f'} metalness={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.06, 0.04]}><boxGeometry args={[w, h, 0.03]} /><meshStandardMaterial color="#233241" /></mesh>
      <mesh position={[0, 0.06, 0.06]} userData={{ type: 'cert', certId: cert.id }}><planeGeometry args={[w - 0.1, h - 0.1]} /><meshStandardMaterial color="#0f191f" /></mesh>
      <Text position={[0, 0.20, 0.075]} fontSize={0.068} color={cert.color} anchorX="center" anchorY="middle" fontWeight={800}>🏅 CERTIFICATE</Text>
      <Text position={[0, 0.04, 0.075]} fontSize={0.038} color="#6d7d8c" anchorX="center" anchorY="middle" maxWidth={w - 0.18} textAlign="center">{cert.file}</Text>
      <Text position={[0, -0.12, 0.075]} fontSize={0.036} color={hov ? '#e6edf2' : '#5b6670'} anchorX="center" anchorY="middle" fontWeight={700}>{hov ? '▶ TAP TO VIEW DETAILS' : 'TAP TO OPEN'}</Text>
      <mesh position={[0, -h / 2 - 0.09, 0.05]}><boxGeometry args={[w + 0.02, 0.30, 0.02]} /><meshStandardMaterial color={cert.color} /></mesh>
      <Text position={[0, -h / 2 - 0.04, 0.07]} fontSize={0.042} color="#0c1217" anchorX="center" anchorY="middle" fontWeight={800} maxWidth={w - 0.05} textAlign="center">{cert.title}</Text>
      <Text position={[0, -h / 2 - 0.155, 0.07]} fontSize={0.032} color="#0c1217" anchorX="center" anchorY="middle" maxWidth={w - 0.05} textAlign="center">{cert.issuer} • {cert.date}</Text>
      <pointLight position={[0, 0.2, 0.5]} intensity={hov ? 0.9 : 0.3} distance={2.2} color={cert.color} />
    </group>
  );
}

function WallDoc({ pos, rotY, w, h, header, headerColor, lines }: { pos: [number, number, number]; rotY: number; w: number; h: number; header: string; headerColor: string; lines: string[] }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh><boxGeometry args={[w, h, 0.06]} /><meshStandardMaterial color="#e6edf2" /><Edges color="#0f172a" threshold={12} /></mesh>
      <mesh position={[0, h / 2 - 0.23, 0.04]}><boxGeometry args={[w - 0.10, 0.38, 0.02]} /><meshStandardMaterial color={headerColor} /></mesh>
      <Text position={[0, h / 2 - 0.23, 0.055]} fontSize={0.10} color="white" anchorX="center" anchorY="middle" fontWeight={800}>{header}</Text>
      {lines.map((l, i) => <Text key={i} position={[-w / 2 + 0.16, h / 2 - 0.62 - i * 0.185, 0.045]} fontSize={0.055} color="#0f172a" anchorX="left" anchorY="middle" maxWidth={w - 0.30}>{l}</Text>)}
    </group>
  );
}

// DOOR — NO GREEN CIRCLE AFTER OPENING
function SolidDoor({ pos, rotY, w, hinge, swing, color, label, doorId, locked, onUnlock, onWalk, grand = false }: {
  pos: [number, number, number]; rotY: number; w: number;
  hinge: 1 | -1; swing: number; color: string; label: string; doorId: DoorId;
  locked: boolean; onUnlock: () => void; onWalk: (p: [number, number]) => void; grand?: boolean;
}) {
  const leaf = useRef<THREE.Group>(null);
  const leaf2 = useRef<THREE.Group>(null);
  const lockRef = useRef<THREE.Group>(null);
  const [near, setNear] = useState(false);
  const dh = grand ? 3.9 : 3.1;
  useFrame((st) => {
    const d = Math.hypot(playerState.x - pos[0], playerState.z - pos[2]);
    const n = d < 3.2; if (n !== near) setNear(n);
    const open = locked ? 0 : d < 3.0 ? swing : 0;
    if (leaf.current) leaf.current.rotation.y = THREE.MathUtils.lerp(leaf.current.rotation.y, open, 0.1);
    if (leaf2.current) leaf2.current.rotation.y = THREE.MathUtils.lerp(leaf2.current.rotation.y, -open, 0.1);
    if (lockRef.current) { const s = 1 + Math.sin(st.clock.elapsedTime * 3) * 0.06; lockRef.current.scale.setScalar(s); }
  });
  const go = (e: any) => {
    e.stopPropagation();
    ensureAudio();
    if (locked) { onUnlock(); playUnlock(); if ('vibrate' in navigator) navigator.vibrate([20, 30, 20]); return; }
    playDoor();
    const dir = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));
    const A: [number, number] = [pos[0] + dir.x * -2.2, pos[2] + dir.z * -2.2];
    const B: [number, number] = [pos[0] + dir.x * 2.2, pos[2] + dir.z * 2.2];
    const da = Math.hypot(playerState.x - A[0], playerState.z - A[1]);
    const db = Math.hypot(playerState.x - B[0], playerState.z - B[1]);
    onWalk(da < db ? B : A);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };
  const ft = grand ? 0.32 : 0.20;
  const frameCol = grand ? '#7c4a03' : '#0f172a';
  const goldCol = '#d4af37';

  const LockBadge = locked ? (
    <group ref={lockRef} position={[0, dh * 0.5, 0]}>
      <group position={[0, 0, 0.15]}>
        <mesh position={[0, 0, -0.02]}><ringGeometry args={[0.34, 0.44, 32]} /><meshStandardMaterial color={goldCol} emissive={goldCol} emissiveIntensity={0.4} side={THREE.DoubleSide} /></mesh>
        <mesh><circleGeometry args={[0.34, 32]} /><meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.3} /></mesh>
        <Text position={[0, 0.05, 0.02]} fontSize={0.24} anchorX="center" anchorY="middle">🔒</Text>
        <Text position={[0, -0.20, 0.02]} fontSize={0.075} color="white" anchorX="center" anchorY="middle" fontWeight={800}>TAP TO UNLOCK</Text>
      </group>
      <group position={[0, 0, -0.15]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0, -0.02]}><ringGeometry args={[0.34, 0.44, 32]} /><meshStandardMaterial color={goldCol} emissive={goldCol} emissiveIntensity={0.4} side={THREE.DoubleSide} /></mesh>
        <mesh><circleGeometry args={[0.34, 32]} /><meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.3} /></mesh>
        <Text position={[0, 0.05, 0.02]} fontSize={0.24} anchorX="center" anchorY="middle">🔒</Text>
        <Text position={[0, -0.20, 0.02]} fontSize={0.075} color="white" anchorX="center" anchorY="middle" fontWeight={800}>TAP TO UNLOCK</Text>
      </group>
    </group>
  ) : null;

  return (
    <group position={[pos[0], 0, pos[2]]} rotation={[0, rotY, 0]}>
      <mesh position={[0, dh + ft / 2, 0]}><boxGeometry args={[w + ft * 2 + 0.1, ft, 0.4]} /><meshStandardMaterial color={frameCol} roughness={0.6} metalness={grand ? 0.3 : 0} /></mesh>
      <mesh position={[-(w / 2 + ft / 2 + 0.05), dh / 2, 0]}><boxGeometry args={[ft, dh, 0.4]} /><meshStandardMaterial color={frameCol} roughness={0.6} metalness={grand ? 0.3 : 0} /></mesh>
      <mesh position={[(w / 2 + ft / 2 + 0.05), dh / 2, 0]}><boxGeometry args={[ft, dh, 0.4]} /><meshStandardMaterial color={frameCol} roughness={0.6} metalness={grand ? 0.3 : 0} /></mesh>
      {grand && (
        <group>
          <mesh position={[0, dh + 0.55, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[1.0, 1.0, 0.42]} /><meshStandardMaterial color={frameCol} metalness={0.35} roughness={0.55} /></mesh>
          <mesh position={[0, dh + 0.9, 0.22]}><coneGeometry args={[0.22, 0.6, 4]} /><meshStandardMaterial color={goldCol} emissive={goldCol} emissiveIntensity={0.5} metalness={0.8} roughness={0.2} /></mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * (w / 2 + ft + 0.35), 0, 0]}>
              <mesh position={[0, 2.4, 0]}><cylinderGeometry args={[0.32, 0.36, 4.8, 10]} /><meshStandardMaterial color="#8b5e14" metalness={0.3} roughness={0.6} /></mesh>
              <mesh position={[0, 4.95, 0]}><coneGeometry args={[0.42, 0.9, 10]} /><meshStandardMaterial color={goldCol} emissive={goldCol} emissiveIntensity={0.45} metalness={0.8} roughness={0.2} /></mesh>
              <mesh position={[0, 5.55, 0]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color={goldCol} emissive={goldCol} emissiveIntensity={1} /></mesh>
              <pointLight position={[0, 3.2, 0.6]} intensity={1.4} distance={5} color="#ffca6b" />
            </group>
          ))}
          <mesh position={[0, dh + 0.15, 0]}><boxGeometry args={[w + 0.3, 0.5, 0.5]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
          <Text position={[0, dh + 0.15, 0.27]} fontSize={0.2} color={goldCol} anchorX="center" anchorY="middle" fontWeight={800}>◈ PAPER VERSE ◈</Text>
          <Text position={[0, dh + 0.15, -0.27]} rotation={[0, Math.PI, 0]} fontSize={0.2} color={goldCol} anchorX="center" anchorY="middle" fontWeight={800}>◈ PAPER VERSE ◈</Text>
        </group>
      )}
      {!grand && <mesh position={[0, dh + 0.2 + (H - dh - 0.2) / 2, 0]}><boxGeometry args={[w + 0.42, H - dh - 0.2, 0.30]} /><meshStandardMaterial color="#111a22" /><Edges color="#0f172a" threshold={15} /></mesh>}
      <mesh position={[0, dh / 2, 0]} visible={false} userData={{ type: 'door', doorId }} onClick={go} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = 'auto')}>
        <boxGeometry args={[w + 1.6, dh + 0.6, 2.6]} /><meshBasicMaterial transparent opacity={0} />
      </mesh>
      {grand ? (
        <>
          <group ref={leaf} position={[-w / 2, 0, 0]}>
            <mesh position={[w / 4, dh / 2, 0]}><boxGeometry args={[w / 2 - 0.02, dh, 0.18]} /><meshStandardMaterial color="#5b3a1a" roughness={0.5} metalness={0.25} /></mesh>
            {[0.75, 0.45, 0.18].map((t, i) => <mesh key={i} position={[w / 4, dh * t, 0.10]}><boxGeometry args={[w / 2 - 0.22, 0.5, 0.02]} /><meshStandardMaterial color="#6b4423" /><Edges color={goldCol} threshold={12} /></mesh>)}
            <mesh position={[w / 2 - 0.14, dh * 0.5, 0.12]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={goldCol} metalness={0.9} roughness={0.1} emissive={goldCol} emissiveIntensity={0.3} /></mesh>
          </group>
          <group ref={leaf2} position={[w / 2, 0, 0]}>
            <mesh position={[-w / 4, dh / 2, 0]}><boxGeometry args={[w / 2 - 0.02, dh, 0.18]} /><meshStandardMaterial color="#5b3a1a" roughness={0.5} metalness={0.25} /></mesh>
            {[0.75, 0.45, 0.18].map((t, i) => <mesh key={i} position={[-w / 4, dh * t, 0.10]}><boxGeometry args={[w / 2 - 0.22, 0.5, 0.02]} /><meshStandardMaterial color="#6b4423" /><Edges color={goldCol} threshold={12} /></mesh>)}
            <mesh position={[-(w / 2 - 0.14), dh * 0.5, 0.12]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={goldCol} metalness={0.9} roughness={0.1} emissive={goldCol} emissiveIntensity={0.3} /></mesh>
          </group>
          {LockBadge}
        </>
      ) : (
        <group ref={leaf} position={[hinge * (w / 2), 0, 0]}>
          <mesh position={[-hinge * (w / 2), dh / 2, 0]}><boxGeometry args={[w, dh, 0.16]} /><meshStandardMaterial color="#fdf6e3" roughness={0.65} /></mesh>
          <mesh position={[-hinge * (w / 2), dh * 0.82, 0.09]}><boxGeometry args={[w * 0.82, 0.5, 0.03]} /><meshStandardMaterial color={locked ? '#334155' : color} /></mesh>
          <Text position={[-hinge * (w / 2), dh * 0.82, 0.115]} fontSize={0.14} color="white" anchorX="center" anchorY="middle" fontWeight={800}>{label}</Text>
          <mesh position={[-hinge * (w / 2), dh * 0.5, 0.085]}><boxGeometry args={[w * 0.7, 0.9, 0.02]} /><meshStandardMaterial color="#f5e9cf" /></mesh>
          <mesh position={[-hinge * (w * 0.40), dh * 0.5, 0.10]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.045, 0.045, 0.2, 12]} /><meshStandardMaterial color="#475569" metalness={0.75} roughness={0.28} /></mesh>
          <group position={[-hinge * (w / 2), 0, 0]}>{LockBadge}</group>
        </group>
      )}
      {near && locked && [0.5, -0.5].map((zo) => (
        <group key={zo} position={[0, grand ? 1.0 : 0.9, zo]} rotation={[0, zo > 0 ? 0 : Math.PI, 0]} raycast={() => null}>
          <mesh raycast={() => null}><planeGeometry args={[1.7, 0.24]} /><meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} /></mesh>
          <Text raycast={() => null} fontSize={0.062} color="white" anchorX="center" anchorY="middle" position={[0, 0, 0.01]}>🔒 PRESS DOOR / F TO UNLOCK</Text>
        </group>
      ))}
    </group>
  );
}

function Petals({ count = 60, area = 9, x = 0, z = 8, height = 8 }: { count?: number; area?: number; x?: number; z?: number; height?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useRef(Array.from({ length: count }, () => ({
    x: x + (Math.random() - 0.5) * area,
    y: Math.random() * height,
    z: z + (Math.random() - 0.5) * (area * 1.4),
    rot: Math.random() * Math.PI, rs: (Math.random() - 0.5) * 2,
    fall: 0.7 + Math.random() * 0.8, sway: Math.random() * Math.PI * 2,
    col: Math.floor(Math.random() * 3),
  })));
  const dummy = useRef(new THREE.Object3D());
  const cols = [new THREE.Color('#f9a8d4'), new THREE.Color('#fca5a5'), new THREE.Color('#fecdd3')];
  useEffect(() => {
    if (!ref.current) return;
    data.current.forEach((d, i) => ref.current!.setColorAt(i, cols[d.col]));
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    data.current.forEach((d, i) => {
      d.y -= d.fall * dt;
      d.sway += dt;
      const sx = d.x + Math.sin(d.sway) * 0.4;
      const sz = d.z + Math.cos(d.sway * 0.8) * 0.3;
      d.rot += d.rs * dt;
      if (d.y < 0) { d.y = height; d.x = x + (Math.random() - 0.5) * area; d.z = z + (Math.random() - 0.5) * (area * 1.4); }
      dummy.current.position.set(sx, d.y, sz);
      dummy.current.rotation.set(d.rot, d.rot * 0.6, d.rot * 0.3);
      dummy.current.scale.setScalar(0.14);
      dummy.current.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.current.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]} raycast={() => null}>
      <planeGeometry args={[1, 0.6]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
    </instancedMesh>
  );
}

function ProjectPanel({ pos, rotY, p, onOpen }: { pos: [number, number, number]; rotY: number; p: Project; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh
        userData={{ type: 'project', projectId: p.id }}
        onClick={(e: any) => { e.stopPropagation(); autoWalk.waypoints = []; onOpen(); if ('vibrate' in navigator) navigator.vibrate(10); }}
        onPointerOver={() => { setHov(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHov(false); document.body.style.cursor = 'auto'; }}
        scale={hov ? 1.04 : 1}
      >
        <boxGeometry args={[1.55, 1.05, 0.07]} /><meshStandardMaterial color={hov ? '#ffffff' : p.bg} /><Edges color={hov ? p.color : '#0f172a'} threshold={12} />
      </mesh>
      <mesh position={[0, 0.34, 0.05]} scale={hov ? 1.04 : 1} raycast={() => null}><boxGeometry args={[1.40, 0.30, 0.02]} /><meshStandardMaterial color={p.color} /></mesh>
      <Text position={[0, 0.34, 0.075]} fontSize={0.095} color="white" anchorX="center" anchorY="middle" fontWeight={800} raycast={() => null}>{p.title}</Text>
      <Text position={[0, 0.02, 0.05]} fontSize={0.05} color="#9fb0c3" anchorX="center" anchorY="middle" maxWidth={1.35} textAlign="center" raycast={() => null}>{p.subtitle}</Text>
      <Text position={[0, -0.20, 0.05]} fontSize={0.045} color="#7d8da0" anchorX="center" anchorY="middle" raycast={() => null}>{p.technologies.slice(0, 3).join(' • ')}</Text>
      <Text position={[0, -0.38, 0.05]} fontSize={0.052} color={p.accent} anchorX="center" anchorY="middle" fontWeight={800} raycast={() => null}>{p.year} • {hov ? 'CLICK FOR DETAILS →' : 'TAP TO OPEN'}</Text>
      <pointLight position={[0, 0.2, 0.5]} intensity={hov ? 0.85 : 0.35} distance={2.4} color={p.color} />
    </group>
  );
}

// CROSSHAIR INTERACTION — when mouse is locked, raycast from centre for doors/projects/certs
function LockedCrosshairInteractor({ isLocked, locks, unlock, walkTo, openProject, openCert }: {
  isLocked: boolean;
  locks: Record<DoorId, boolean>;
  unlock: (id: DoorId) => void;
  walkTo: (p: [number, number]) => void;
  openProject: (p: Project) => void;
  openCert: (c: Cert) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  useEffect(() => {
    if (!isLocked) return;
    const onClick = () => {
      if (document.pointerLockElement == null) return;
      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = raycaster.current.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        for (let i = 0; i < 6 && obj; i++) {
          const ud: any = (obj as any).userData;
          if (ud?.type === 'door') {
            const id = ud.doorId as DoorId;
            ensureAudio();
            if (locks[id]) { unlock(id); playUnlock(); if ('vibrate' in navigator) navigator.vibrate([20, 30, 20]); }
            else {
              const w = DOOR_WALK[id];
              const da = Math.hypot(playerState.x - w.a[0], playerState.z - w.a[1]);
              const db = Math.hypot(playerState.x - w.b[0], playerState.z - w.b[1]);
              intro.locked = false;
              autoWalk.waypoints = [[playerState.x, playerState.z], da < db ? w.b : w.a];
              playDoor();
            }
            return;
          }
          if (ud?.type === 'project') {
            const proj = projects.find(pr => pr.id === ud.projectId);
            if (proj) { autoWalk.waypoints = []; openProject(proj); if ('vibrate' in navigator) navigator.vibrate(10); }
            return;
          }
          if (ud?.type === 'cert') {
            const cert = certificates.find(c => c.id === ud.certId);
            if (cert) { autoWalk.waypoints = []; openCert(cert); if ('vibrate' in navigator) navigator.vibrate(10); }
            return;
          }
          if (ud?.type === 'contact') {
            if (ud.action === 'email') openEmail();
            else if (ud.action === 'phone') openPhone();
            else if (ud.action === 'github') openGitHub();
            else if (ud.url) window.open(ud.url, '_blank');
            return;
          }
          if (ud?.type === 'avatar') { return; }
          obj = obj.parent;
        }
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [isLocked, locks, unlock, walkTo, openProject, openCert, camera, scene]);
  return null;
}

// =========================================================
// WORLD
// =========================================================
function World({ locks, unlock, walkTo, openProject, openCert }: {
  locks: Record<DoorId, boolean>; unlock: (id: DoorId) => void;
  walkTo: (p: [number, number]) => void; openProject: (p: Project) => void; openCert: (c: Cert) => void;
}) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -4]}><planeGeometry args={[90, 90]} /><meshStandardMaterial color="#131a20" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 10.0]}><planeGeometry args={[2.6, 9.6]} /><meshStandardMaterial color="#5a1212" roughness={0.9} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10.0]}><planeGeometry args={[1.9, 9.6]} /><meshStandardMaterial color="#7f1d1d" roughness={0.85} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.15, 0.03, 10.0]}><planeGeometry args={[0.12, 9.6]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.25} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.15, 0.03, 10.0]}><planeGeometry args={[0.12, 9.6]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.25} /></mesh>
      {[-1, 1].map((s) => [13.5, 11.5, 9.5, 7.5].map((cz, i) => (
        <group key={`${s}-${i}`} position={[s * 1.55, 0, cz]}>
          <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.05, 0.06, 1.1, 10]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.2} /></mesh>
          <mesh position={[0, 1.12, 0]}><sphereGeometry args={[0.09, 12, 12]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} emissive={GOLD} emissiveIntensity={0.3} /></mesh>
          <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.16, 0.18, 0.1, 12]} /><meshStandardMaterial color={SILICON_MID} /></mesh>
        </group>
      )))}
      <Petals count={70} area={2.6} x={0} z={10.5} height={9} />
      <pointLight position={[0, 4, 11]} intensity={1.2} distance={12} color="#ffd8a8" />
      <pointLight position={[0, 3, 7]} intensity={1.1} distance={8} color="#ffca6b" />
      <Text position={[0, 0.06, 12.6]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color={GOLD} anchorX="center" anchorY="middle" fontWeight={800} letterSpacing={0.2}>W E L C O M E</Text>

      {/* HOME — palace grand hall */}
      <Floor x={0} z={0} w={10.5} d={10.5} color={SILICON} accent={SILICON_MID} />
      <Ceil x={0} z={0} w={10.5} d={10.5} color="#161d23" />
      <BoxWall b={[-5.40, 5.10, -1.20, 5.40]} color={SILICON_MID} />
      <BoxWall b={[1.20, 5.10, 5.40, 5.40]} color={SILICON_MID} />
      <BoxWall b={[-5.40, -5.40, -1.40, -5.10]} color={SILICON_MID} />
      <BoxWall b={[1.40, -5.40, 5.40, -5.10]} color={SILICON_MID} />
      <BoxWall b={[-5.40, -5.40, -5.10, 5.40]} color={SILICON_MID} />
      <BoxWall b={[5.10, -5.40, 5.40, 5.40]} color={SILICON_MID} />
      <Column pos={[-3.9, 0, -3.9]} />
      <Column pos={[3.9, 0, -3.9]} />
      <Column pos={[-3.9, 0, 3.9]} />
      <Column pos={[3.9, 0, 3.9]} />
      <Chandelier pos={[0, 4.5, 0]} scale={1.35} color={GOLD} />
      <Sconce pos={[-5.02, 3.0, -2.0]} rotY={Math.PI / 2} color={CIRCUIT} />
      <Sconce pos={[-5.02, 3.0, 3.2]} rotY={Math.PI / 2} color={CIRCUIT} />
      <Sconce pos={[5.02, 3.0, -2.0]} rotY={-Math.PI / 2} color={COPPER} />
      <Sconce pos={[5.02, 3.0, 3.2]} rotY={-Math.PI / 2} color={COPPER} />
      <Rug pos={[0, 0, 0.4]} w={2.4} d={9.6} main="#0b1f16" />
      <mesh position={[0, 4.55, -5.08]}><boxGeometry args={[6.4, 0.9, 0.1]} /><meshStandardMaterial color="#2a0f0f" metalness={0.25} roughness={0.6} /></mesh>
      <mesh position={[0, 4.55, -5.02]}><boxGeometry args={[6.1, 0.68, 0.03]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.18} /></mesh>
      <Text position={[0, 4.55, -4.99]} fontSize={0.27} color="#ffd8a0" anchorX="center" anchorY="middle" fontWeight={800} letterSpacing={0.14}>◈ THE GRAND HALL ◈</Text>
      <WallDoc pos={[-5.02, 2.55, 1.2]} rotY={Math.PI / 2} w={2.60} h={1.85} header="WELCOME, TRAVELLER" headerColor={COPPER} lines={[
        "You stand in a walk-in 3D palace.",
        "▸ Royal corridor ahead — 3 chambers",
        "▸ RIGHT door → SKILLS CHAMBER",
        "▸ LEFT door  → PROJECTS GALLERY",
        "▸ END door   → THRONE & CONTACT",
        "All chambers sealed — tap to unlock.",
      ]} />
      <PhotoFrame pos={[5.02, 2.55, 1.0]} rotY={-Math.PI / 2} w={1.30} h={1.55} label="/photo.jpg" />
      <SolidDoor doorId="main" pos={[0, 0, 5.25]} rotY={Math.PI} w={2.6} hinge={1} swing={-1.45} color="#0f172a" label="MAIN DOOR" locked={locks.main} onUnlock={() => unlock('main')} onWalk={walkTo} grand />
      <Sparkles count={22} scale={[9, 4.5, 9]} size={0.4} speed={0.14} color={GOLD} position={[0, 3.0, 0]} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.14} scale={12} blur={2} far={12} />

      {/* CORRIDOR */}
      <Floor x={0} z={-9.7} w={2.8} d={9.0} color={SILICON} accent={SILICON_MID} />
      <Ceil x={0} z={-9.7} w={2.8} d={9.0} color="#161d23" />
      <Rug pos={[0, 0, -9.7]} w={1.7} d={8.6} main="#051a0f" />
      <BoxWall b={[1.40, -6.90, 1.70, -5.10]} color={SILICON_MID} />
      <BoxWall b={[1.40, -14.20, 1.70, -8.10]} color={SILICON_MID} />
      <BoxWall b={[-1.70, -9.90, -1.40, -5.10]} color={SILICON_MID} />
      <BoxWall b={[-1.70, -14.20, -1.40, -11.10]} color={SILICON_MID} />
      <BoxWall b={[-1.70, -14.20, -0.70, -13.90]} color={SILICON_MID} />
      <BoxWall b={[0.70, -14.20, 1.70, -13.90]} color={SILICON_MID} />
      {[-6.3, -8.6, -10.9, -13.2].map((cz, i) => (
        <group key={i}>
          <mesh position={[1.33, H / 2, cz]}><boxGeometry args={[0.14, H - 0.9, 0.5]} /><meshStandardMaterial color="#2c3a45" roughness={0.5} /></mesh>
          <mesh position={[1.30, H - 0.55, cz]}><boxGeometry args={[0.2, 0.2, 0.62]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} /></mesh>
          <mesh position={[-1.33, H / 2, cz]}><boxGeometry args={[0.14, H - 0.9, 0.5]} /><meshStandardMaterial color="#2c3a45" roughness={0.5} /></mesh>
          <mesh position={[-1.30, H - 0.55, cz]}><boxGeometry args={[0.2, 0.2, 0.62]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} /></mesh>
          <Sconce pos={[1.26, 2.9, cz]} rotY={-Math.PI / 2} color={CIRCUIT} />
          <Sconce pos={[-1.26, 2.9, cz]} rotY={Math.PI / 2} color={COPPER} />
        </group>
      ))}
      <Chandelier pos={[0, 4.6, -7.6]} scale={0.7} color={GOLD} />
      <Chandelier pos={[0, 4.6, -11.8]} scale={0.7} color={GOLD} />
      <SolidDoor doorId="skills" pos={[1.55, 0, -7.5]} rotY={-Math.PI / 2} w={1.25} hinge={-1} swing={1.3} color={COPPER} label="SKILLS" locked={locks.skills} onUnlock={() => unlock('skills')} onWalk={walkTo} />
      <SolidDoor doorId="projects" pos={[-1.55, 0, -10.5]} rotY={Math.PI / 2} w={1.25} hinge={1} swing={-1.3} color={CIRCUIT} label="PROJECTS" locked={locks.projects} onUnlock={() => unlock('projects')} onWalk={walkTo} />
      <SolidDoor doorId="about" pos={[0, 0, -14.05]} rotY={0} w={1.4} hinge={-1} swing={-1.3} color={CIRCUIT} label="ABOUT" locked={locks.about} onUnlock={() => unlock('about')} onWalk={walkTo} />

      {/* SKILLS — with certs */}
      <Floor x={4.85} z={-7.75} w={6.3} d={6.5} color={SILICON} accent={SILICON_MID} />
      <Ceil x={4.85} z={-7.75} w={6.3} d={6.5} color="#161d23" />
      <BoxWall b={[1.40, -11.30, 8.30, -11.00]} color={SILICON_MID} />
      <BoxWall b={[1.40, -4.80, 8.30, -4.50]} color={SILICON_MID} />
      <BoxWall b={[8.00, -11.30, 8.30, -4.50]} color={SILICON_MID} />
      <BoxWall b={[1.40, -5.10, 1.70, -4.80]} color={SILICON_MID} />
      <Column pos={[2.05, 0, -10.35]} /><Column pos={[7.60, 0, -10.35]} /><Column pos={[2.05, 0, -5.20]} /><Column pos={[7.60, 0, -5.20]} />
      <Chandelier pos={[4.85, 4.5, -7.75]} scale={1.05} color={COPPER} />
      <Rug pos={[4.85, 0, -7.75]} w={3.4} d={3.4} main="#1a0f04" />
      <mesh position={[4.85, 4.45, -10.90]}><boxGeometry args={[5.4, 0.85, 0.1]} /><meshStandardMaterial color="#2a0f0a" metalness={0.3} roughness={0.55} /></mesh>
      <mesh position={[4.85, 4.45, -10.84]}><boxGeometry args={[5.1, 0.62, 0.03]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.18} /></mesh>
      <Text position={[4.85, 4.45, -10.81]} fontSize={0.25} color="#fde68a" anchorX="center" anchorY="middle" fontWeight={800}>◈ SKILLS CHAMBER ◈</Text>
      <WallDoc pos={[7.94, 3.55, -7.75]} rotY={-Math.PI / 2} w={3.10} h={1.95} header="TECHNICAL SKILLS" headerColor={COPPER} lines={[
        "▸ Programming : C • Python",
        "▸ Electronics : Circuit Design • Analog • PCB",
        "▸ Software    : MATLAB • ModelSim • Multisim • Arduino IDE",
        "▸ Cyber & Web : Kali Linux • Ethical Hacking • HTML/CSS/GitHub",
      ]} />
      <WallDoc pos={[4.85, 3.85, -10.92]} rotY={0} w={3.30} h={1.05} header="LICENSES & CERTIFICATIONS" headerColor={CIRCUIT} lines={["6 verified credentials — tap any frame below for details"]} />
      <CertFrame pos={[2.95, 1.85, -10.92]} rotY={0} cert={certificates[2]} w={1.25} onOpen={openCert} />
      <CertFrame pos={[4.85, 1.85, -10.92]} rotY={0} cert={certificates[3]} w={1.25} onOpen={openCert} />
      <CertFrame pos={[6.75, 1.85, -10.92]} rotY={0} cert={certificates[4]} w={1.25} onOpen={openCert} />
      <CertFrame pos={[7.94, 1.55, -6.05]} rotY={-Math.PI / 2} cert={certificates[0]} onOpen={openCert} />
      <CertFrame pos={[7.94, 1.55, -9.45]} rotY={-Math.PI / 2} cert={certificates[1]} onOpen={openCert} />
      <CertFrame pos={[5.95, 1.95, -4.60]} rotY={Math.PI} cert={certificates[5]} w={1.25} onOpen={openCert} />
      <PhotoFrame pos={[3.55, 2.20, -4.60]} rotY={Math.PI} w={1.10} h={1.25} label="/photo.jpg" />

      {/* PROJECTS */}
      <Floor x={-4.85} z={-10.75} w={6.3} d={6.5} color={SILICON} accent={SILICON_MID} />
      <Ceil x={-4.85} z={-10.75} w={6.3} d={6.5} color="#161d23" />
      <BoxWall b={[-8.30, -14.30, -1.40, -14.00]} color={SILICON_MID} />
      <BoxWall b={[-8.30, -7.80, -1.40, -7.50]} color={SILICON_MID} />
      <BoxWall b={[-8.30, -14.30, -8.00, -7.50]} color={SILICON_MID} />
      <Column pos={[-2.00, 0, -12.35]} /><Column pos={[-7.60, 0, -12.35]} /><Column pos={[-2.00, 0, -8.20]} /><Column pos={[-7.60, 0, -8.20]} />
      <Chandelier pos={[-4.85, 4.5, -10.75]} scale={1.05} color={CIRCUIT} />
      <Rug pos={[-4.85, 0, -10.75]} w={3.4} d={3.4} main="#061a12" />
      <mesh position={[-4.85, 4.45, -13.90]}><boxGeometry args={[5.4, 0.85, 0.1]} /><meshStandardMaterial color="#0b241c" metalness={0.3} roughness={0.55} /></mesh>
      <mesh position={[-4.85, 4.45, -13.84]}><boxGeometry args={[5.1, 0.62, 0.03]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.18} /></mesh>
      <Text position={[-4.85, 4.45, -13.81]} fontSize={0.24} color="#7eedd0" anchorX="center" anchorY="middle" fontWeight={800}>◈ PROJECTS GALLERY ◈</Text>
      <WallDoc pos={[-4.85, 3.55, -13.92]} rotY={0} w={4.60} h={1.15} header="ACADEMIC & PERSONAL PROJECTS" headerColor={SILICON} lines={["Tap any panel to read the full case study."]} />
      <WallDoc pos={[-2.20, 2.30, -13.92]} rotY={0} w={2.10} h={1.55} header="EXPERIENCE" headerColor={COPPER} lines={[
        "▸ IoT Intern — Emertxe (Present)",
        "   Hands-on IoT, hardware interfacing,",
        "   Arduino IDE & PicSimLab testing.",
        "▸ Telecaller — Zoodle Kid",
        "   Client communication & support.",
      ]} />
      <ProjectPanel pos={[-7.94, 2.10, -9.30]} rotY={Math.PI / 2} p={projects[0]} onOpen={() => openProject(projects[0])} />
      <ProjectPanel pos={[-7.94, 2.10, -11.30]} rotY={Math.PI / 2} p={projects[1]} onOpen={() => openProject(projects[1])} />
      <ProjectPanel pos={[-7.94, 2.10, -13.20]} rotY={Math.PI / 2} p={projects[2]} onOpen={() => openProject(projects[2])} />
      <ProjectPanel pos={[-4.85, 2.10, -7.62]} rotY={Math.PI} p={projects[3]} onOpen={() => openProject(projects[3])} />
      <PhotoFrame pos={[-1.46, 2.40, -10.4]} rotY={-Math.PI / 2} w={1.10} h={1.30} label="/photo.jpg" />

      {/* THRONE ROOM */}
      <Floor x={0} z={-17.1} w={7.0} d={5.8} color={SILICON} accent={SILICON_MID} />
      <Ceil x={0} z={-17.1} w={7.0} d={5.8} color="#161d23" />
      <BoxWall b={[-3.80, -20.30, 3.80, -20.00]} color={SILICON_MID} />
      <BoxWall b={[3.50, -20.30, 3.80, -14.00]} color={SILICON_MID} />
      <BoxWall b={[-3.80, -20.30, -3.50, -14.00]} color={SILICON_MID} />
      <BoxWall b={[-3.80, -14.30, -0.70, -14.00]} color={SILICON_MID} />
      <BoxWall b={[0.70, -14.30, 3.80, -14.00]} color={SILICON_MID} />
      <Column pos={[-3.15, 0, -19.40]} /><Column pos={[3.15, 0, -19.40]} /><Column pos={[-3.15, 0, -14.80]} /><Column pos={[3.15, 0, -14.80]} />
      <Chandelier pos={[0, 4.5, -17.1]} scale={1.15} color={CIRCUIT} />
      <Rug pos={[0, 0, -17.4]} w={2.6} d={4.6} main="#061a12" />
      <group position={[0, 0, -19.2]}>
        <mesh position={[0, 0.13, 0]}><boxGeometry args={[3.0, 0.26, 1.5]} /><meshStandardMaterial color="#2c3a45" roughness={0.4} metalness={0.15} /></mesh>
        <mesh position={[0, 0.29, 0]}><boxGeometry args={[2.4, 0.2, 1.2]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} /></mesh>
        <mesh position={[0, 0.62, -0.1]}><boxGeometry args={[1.1, 0.4, 0.9]} /><meshStandardMaterial color="#5a1212" roughness={0.85} /></mesh>
        <mesh position={[0, 1.35, -0.5]}><boxGeometry args={[1.15, 1.7, 0.18]} /><meshStandardMaterial color="#6b1212" roughness={0.8} /></mesh>
        <mesh position={[0, 2.28, -0.5]}><coneGeometry args={[0.4, 0.5, 4]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.35} /></mesh>
        {[-0.62, 0.62].map(sx => (
          <group key={sx}>
            <mesh position={[sx, 0.72, 0.05]}><boxGeometry args={[0.14, 0.6, 0.85]} /><meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} /></mesh>
            <mesh position={[sx, 1.06, -0.45]}><cylinderGeometry args={[0.09, 0.09, 1.3, 10]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} /></mesh>
            <mesh position={[sx, 1.78, -0.45]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.15} emissive={GOLD} emissiveIntensity={0.5} /></mesh>
          </group>
        ))}
        <pointLight position={[0, 2.2, 1.0]} intensity={1.6} distance={6} color="#a8f0c6" />
        <SpeakingAvatar />
      </group>
      <mesh position={[0, 4.35, -19.90]}><boxGeometry args={[5.8, 0.85, 0.1]} /><meshStandardMaterial color="#0b1a12" metalness={0.3} roughness={0.55} /></mesh>
      <mesh position={[0, 4.35, -19.84]}><boxGeometry args={[5.5, 0.62, 0.03]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.18} /></mesh>
      <Text position={[0, 4.35, -19.81]} fontSize={0.24} color="#c7e8d8" anchorX="center" anchorY="middle" fontWeight={800}>◈ THE THRONE ROOM ◈</Text>
      <WallDoc pos={[0, 3.05, -19.92]} rotY={0} w={5.20} h={2.05} header="PROFESSIONAL SUMMARY" headerColor={SILICON} lines={[
        "SHRIDHAR MADIVAL — Arolli, Honnavar, Uttara Kannada, Karnataka 581334",
        "4th-semester ECE student with applied experience in IoT, analog circuit",
        "design and web development. Seeking entry-level role / internship",
        "in electronics & systems security. Languages: English • Kannada",
        "Goal: core engineering + GATE",
      ]} />
      <WallDoc pos={[-3.44, 2.75, -17.1]} rotY={Math.PI / 2} w={2.90} h={2.15} header="EDUCATION" headerColor={CIRCUIT} lines={[
        "▸ B.E. ECE — Anjuman Institute of Technology",
        "   and Management (AITM), Bhatkal — 2028",
        "▸ SDM PU College, Karnataka Board — 78.33%",
        "▸ SSLC, Karnataka Board — 91.00%",
      ]} />
      <WallDoc pos={[-3.44, 1.10, -17.1]} rotY={Math.PI / 2} w={2.90} h={0.95} header="CORE COMPETENCIES" headerColor={COPPER} lines={["Digital Electronics • Network Analysis •", "Electronic Devices & Instrumentation"]} />

      {/* ========================================================= */}
      {/* 📧📞🐙  ABOUT — 3 BLOCKS — moved in front of wall so they  */}
      {/* are never hidden by pillars / wall geometry                */}
      {/* ========================================================= */}
      <group position={[3.32, 2.55, -17.1]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Email block — icon + Email label, hidden value — opens Gmail compose */}
        <group position={[0, 0.42, 0]}>
          <mesh userData={{ type: 'contact', action: 'email' }} onClick={(e: any) => { e.stopPropagation(); openEmail(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
            <boxGeometry args={[2.70, 0.52, 0.07]} /><meshStandardMaterial color="#2ecc71" /><Edges color="#0f172a" threshold={12} />
          </mesh>
          <Text position={[-0.55, 0, 0.04]} fontSize={0.18} color="#0a1a12" anchorX="center" anchorY="middle">✉</Text>
          <Text position={[0.38, 0, 0.04]} fontSize={0.085} color="#0a1a12" anchorX="center" anchorY="middle" fontWeight={800}>Email</Text>
        </group>
        {/* Phone block — icon + Phone label, hidden value — opens phone dialer */}
        <group position={[0, -0.14, 0]}>
          <mesh userData={{ type: 'contact', action: 'phone' }} onClick={(e: any) => { e.stopPropagation(); openPhone(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
            <boxGeometry args={[2.70, 0.52, 0.07]} /><meshStandardMaterial color="#e67e22" /><Edges color="#0f172a" threshold={12} />
          </mesh>
          <Text position={[-0.55, 0, 0.04]} fontSize={0.18} color="white" anchorX="center" anchorY="middle">☎</Text>
          <Text position={[0.38, 0, 0.04]} fontSize={0.085} color="white" anchorX="center" anchorY="middle" fontWeight={800}>Phone</Text>
        </group>
        {/* GitHub block — icon + GitHub label, hidden value — opens your GitHub profile */}
        <group position={[0, -0.70, 0]}>
          <mesh userData={{ type: 'contact', action: 'github' }} onClick={(e: any) => { e.stopPropagation(); openGitHub(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
            <boxGeometry args={[2.70, 0.52, 0.07]} /><meshStandardMaterial color="#1a252f" /><Edges color="#2ecc71" threshold={12} />
          </mesh>
          <Text position={[-0.55, 0, 0.04]} fontSize={0.18} color="#2ecc71" anchorX="center" anchorY="middle">⬢</Text>
          <Text position={[0.38, 0, 0.04]} fontSize={0.085} color="#e6edf2" anchorX="center" anchorY="middle" fontWeight={800}>GitHub</Text>
        </group>
      </group>

      <PhotoFrame pos={[3.46, 1.10, -14.8]} rotY={-Math.PI / 2} w={1.15} h={1.25} label="/photo.jpg" />
      <ContactShadows position={[0, 0.02, -17.1]} opacity={0.14} scale={7} blur={2} far={9} />
    </>
  );
}

// =========================================================
// 📧 CONTACT ACTIONS — values hidden until click
// =========================================================
function openEmail() {
  window.open('https://mail.google.com/mail/?view=cm&fs=1&to=madivalshridhar1@gmail.com&su=Hello%20Shridhar%20—%20from%20your%20palace', '_blank');
}
function openPhone() {
  window.open('tel:+919972752670', '_blank');
}
function openGitHub() {
  window.open('https://github.com/shridhar-1', '_blank');
}

// =========================================================
// APP (with modals that unlock the mouse on exit)
// =========================================================
export default function App() {
  const [zone, setZone] = useState<Zone>('outside');
  const [selected, setSelected] = useState<Project | null>(null);
  const [selectedCert, setSelectedCert] = useState<(typeof certificates)[number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [joy, setJoy] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const [locks, setLocks] = useState<Record<DoorId, boolean>>({ main: true, skills: true, projects: true, about: true });
  const [isLocked, setIsLocked] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ mode: 'none' | 'joy' | 'look' | 'two'; x: number; y: number; syaw: number; spitch: number; lx: number; ly: number }>({ mode: 'none', x: 0, y: 0, syaw: 0, spitch: 0, lx: 0, ly: 0 });
  const wheelAccum = useRef(0); const wheelTime = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toastMsg = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2300);
  }, []);

  const unlock = useCallback((id: DoorId) => {
    globalLocks[id] = false;
    if (id === 'main') intro.locked = false;
    setLocks(s => ({ ...s, [id]: false }));
    toastMsg('🔓 UNLOCKED — tap again to walk in');
  }, [toastMsg]);
  const walkTo = useCallback((p: [number, number]) => { intro.locked = false; autoWalk.waypoints = [[playerState.x, playerState.z], p]; }, []);

  // 🔊 EXIT POINTER LOCK whenever a detail modal opens or closes
  // (so the user can actually exit the info instead of being trapped)
  useEffect(() => {
    if (selected || selectedCert) {
      document.exitPointerLock();
    }
  }, [selected, selectedCert]);

  const closeModal = useCallback(() => {
    document.exitPointerLock();
    setSelected(null);
    setSelectedCert(null);
  }, []);

  useEffect(() => { (Object.keys(locks) as DoorId[]).forEach(k => { globalLocks[k] = locks[k]; }); }, [locks]);

  useEffect(() => {
    const onChange = () => setIsLocked(document.pointerLockElement === containerRef.current);
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 10000);
    const ua = () => ensureAudio();
    window.addEventListener('pointerdown', ua, { once: true });
    window.addEventListener('keydown', ua, { once: true });
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', ua); window.removeEventListener('keydown', ua); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setProgress(p => {
      if (p >= 100) { clearInterval(id); setTimeout(() => setLoading(false), 380); return 100; }
      return p + (p < 68 ? 7 : 3.2);
    }), 92);
    return () => clearInterval(id);
  }, []);

  const onZone = useCallback((z: Zone) => {
    setZone(z);
    if (!loading) toastMsg(`📍 ${z === 'outside' ? 'OUTSIDE — MAIN DOOR' : z.toUpperCase()}`);
  }, [loading, toastMsg]);

  const onStep = useCallback(() => playStep(), []);

  const DOORS: { id: DoorId; pos: [number, number] }[] = [
    { id: 'main', pos: [0, 5.25] }, { id: 'skills', pos: [1.55, -7.5] },
    { id: 'projects', pos: [-1.55, -10.5] }, { id: 'about', pos: [0, -14.05] },
  ];
  const DOOR_WALK: Record<DoorId, { a: [number, number]; b: [number, number] }> = {
    main: { a: [0, 7.8], b: [0, 3.0] }, skills: { a: [0.35, -7.5], b: [3.6, -7.5] },
    projects: { a: [-0.35, -10.5], b: [-3.8, -10.5] }, about: { a: [0, -12.6], b: [0, -16.2] },
  };
  const interactNearestDoor = useCallback(() => {
    const fx = Math.sin(playerState.yaw), fz = -Math.cos(playerState.yaw);
    let best: DoorId | null = null, bd = Infinity;
    for (const d of DOORS) {
      const dx = d.pos[0] - playerState.x, dz = d.pos[1] - playerState.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 3.2 || dist < 0.01) continue;
      const dot = (dx * fx + dz * fz) / dist;
      if (dot < 0.55) continue;
      if (dist < bd) { bd = dist; best = d.id; }
    }
    if (!best) return false;
    ensureAudio();
    if (locks[best]) { globalLocks[best] = false; if (best === 'main') intro.locked = false; setLocks(s => ({ ...s, [best!]: false })); playUnlock(); toastMsg('🔓 UNLOCKED — click again to walk in'); if ('vibrate' in navigator) navigator.vibrate([20, 30, 20]); return true; }
    const w = DOOR_WALK[best]; const da = Math.hypot(playerState.x - w.a[0], playerState.z - w.a[1]); const db = Math.hypot(playerState.x - w.b[0], playerState.z - w.b[1]);
    intro.locked = false; autoWalk.waypoints = [[playerState.x, playerState.z], da < db ? w.b : w.a]; playDoor(); toastMsg('🚪 WALKING IN…'); return true;
  }, [locks, toastMsg]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.pointerLockElement) { document.exitPointerLock(); e.preventDefault(); return; }
        if (selected || selectedCert) { setSelected(null); setSelectedCert(null); return; }
        autoWalk.waypoints = [[playerState.x, playerState.z], [0, 6.8]]; toastMsg('🏠 EXITING'); return;
      }
      if (selected || selectedCert) return;
      ensureAudio();
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') { keys.fw = 1; e.preventDefault(); }
      if (k === 's' || k === 'arrowdown') { keys.fw = -1; e.preventDefault(); }
      if (k === 'a' || k === 'arrowleft') { keys.st = -1; e.preventDefault(); }
      if (k === 'd' || k === 'arrowright') { keys.st = 1; e.preventDefault(); }
      if (k === 'q') keys.q = true;
      if (k === 'e') keys.e = true;
      if (k === 'f' || k === ' ') { if (!interactNearestDoor()) toastMsg('Walk closer to a door, then press F'); e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'arrowup', 's', 'arrowdown'].includes(k)) keys.fw = 0;
      if (['a', 'arrowleft', 'd', 'arrowright'].includes(k)) keys.st = 0;
      if (k === 'q') keys.q = false;
      if (k === 'e') keys.e = false;
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [selected, selectedCert, interactNearestDoor, toastMsg]);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a, [data-scrollable]')) return;
      if (selected || selectedCert || loading) return;
      if (document.pointerLockElement !== el) { el.requestPointerLock(); return; }
      interactNearestDoor();
    };
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('[data-scrollable]') || (e as any).ctrlKey || loading) return;
      const now = Date.now();
      if (now - wheelTime.current > 240) wheelAccum.current = 0;
      wheelTime.current = now; wheelAccum.current += (e as any).deltaY;
      if (Math.abs(wheelAccum.current) < 90) return;
      const dir = wheelAccum.current > 0; wheelAccum.current = 0;
      e.preventDefault(); ensureAudio();
      const f = { x: Math.sin(playerState.yaw), z: -Math.cos(playerState.yaw) };
      autoWalk.waypoints = [[playerState.x, playerState.z], [playerState.x + f.x * (dir ? 2.2 : -2.2), playerState.z + f.z * (dir ? 2.2 : -2.2)]];
    };
    const onDown = (e: any) => {
      if (document.pointerLockElement === el || loading || selected || selectedCert) return;
      if ((e.target as HTMLElement).closest('button, a, [data-scrollable]')) return;
      touchRef.current = { mode: 'look', x: e.clientX, y: e.clientY, syaw: playerState.yaw, spitch: playerState.pitch, lx: e.clientX, ly: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement === el) {
        playerState.yaw += (e.movementX || 0) * 0.0032;
        playerState.pitch = Math.max(-0.55, Math.min(0.55, playerState.pitch - (e.movementY || 0) * 0.0030));
        return;
      }
      const tr = touchRef.current; if (tr.mode !== 'look') return;
      playerState.yaw = tr.syaw + (e.clientX - tr.x) * 0.0055;
      playerState.pitch = Math.max(-0.5, Math.min(0.5, tr.spitch - (e.clientY - tr.y) * 0.004));
    };
    const onUp = () => { if (touchRef.current.mode === 'look') touchRef.current.mode = 'none'; };
    const onTS = (e: TouchEvent) => {
      if (loading || selected || selectedCert) return;
      if (e.touches.length === 1) {
        const t = e.touches[0], left = t.clientX < window.innerWidth * 0.42;
        touchRef.current = { mode: left ? 'joy' : 'look', x: t.clientX, y: t.clientY, syaw: playerState.yaw, spitch: playerState.pitch, lx: t.clientX, ly: t.clientY };
        if (left) setJoy({ x: t.clientX, y: t.clientY, dx: 0, dy: 0 });
      } else if (e.touches.length === 2) {
        touchRef.current.mode = 'two';
        touchRef.current.lx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        touchRef.current.ly = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    };
    const onTM = (e: TouchEvent) => {
      const tr = touchRef.current;
      if (tr.mode === 'joy' && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0]; let dx = t.clientX - tr.x, dy = t.clientY - tr.y;
        const d = Math.hypot(dx, dy); if (d > 50) { dx = dx / d * 50; dy = dy / d * 50; }
        joyInput.fw = Math.max(-1, Math.min(1, -dy / 50));
        joyInput.st = Math.max(-1, Math.min(1, dx / 50));
        setJoy({ x: tr.x, y: tr.y, dx, dy });
      } else if (tr.mode === 'look' && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        playerState.yaw = tr.syaw + (t.clientX - tr.x) * 0.006;
        playerState.pitch = Math.max(-0.5, Math.min(0.5, tr.spitch - (t.clientY - tr.y) * 0.0045));
      } else if (tr.mode === 'two' && e.touches.length === 2) {
        e.preventDefault();
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const dx = mx - tr.lx, dy = my - tr.ly; tr.lx = mx; tr.ly = my;
        playerState.yaw += dx * 0.006;
        if (Math.abs(dy) > 28) {
          const f = { x: Math.sin(playerState.yaw), z: -Math.cos(playerState.yaw) };
          autoWalk.waypoints = [[playerState.x, playerState.z], [playerState.x + f.x * (dy > 0 ? 1.9 : -1.9), playerState.z + f.z * (dy > 0 ? 1.9 : -1.9)]];
          tr.mode = 'none';
        }
      }
    };
    const onTE = (e: TouchEvent) => {
      if (touchRef.current.mode === 'joy') { joyInput.fw = 0; joyInput.st = 0; setJoy(null); }
      if (e.touches.length === 0) touchRef.current.mode = 'none';
    };
    el.addEventListener('click', onClick as any);
    el.addEventListener('wheel', onWheel as any, { passive: false });
    el.addEventListener('mousedown', onDown as any);
    window.addEventListener('mousemove', onMove as any);
    window.addEventListener('mouseup', onUp as any);
    el.addEventListener('touchstart', onTS as any, { passive: false });
    el.addEventListener('touchmove', onTM as any, { passive: false });
    el.addEventListener('touchend', onTE as any, { passive: false });
    el.addEventListener('touchcancel', onTE as any, { passive: false });
    return () => {
      el.removeEventListener('click', onClick as any);
      el.removeEventListener('wheel', onWheel as any);
      el.removeEventListener('mousedown', onDown as any);
      window.removeEventListener('mousemove', onMove as any);
      window.removeEventListener('mouseup', onUp as any);
      el.removeEventListener('touchstart', onTS as any);
      el.removeEventListener('touchmove', onTM as any);
      el.removeEventListener('touchend', onTE as any);
      el.removeEventListener('touchcancel', onTE as any);
    };
  }, [loading, selected, selectedCert, interactNearestDoor]);

  const zoneLabel: Record<Zone, string> = { outside: 'OUTSIDE • MAIN DOOR', home: 'ROOM 1 — HOME', corridor: 'CORRIDOR', skills: 'ROOM 2 — SKILLS', projects: 'ROOM 3 — PROJECTS', about: 'ROOM 4 — ABOUT' };
  const zoneDot: Record<Zone, string> = { outside: 'bg-stone-400', home: 'bg-amber-500', corridor: 'bg-yellow-500', skills: 'bg-orange-500', projects: 'bg-sky-500', about: 'bg-emerald-500' };
  const lockedCount = Object.values(locks).filter(Boolean).length;

  return (
    <div ref={containerRef} className="relative h-[100dvh] w-screen overflow-hidden bg-[#1e272e] select-none overscroll-none" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif', touchAction: 'none', overscrollBehavior: 'none', cursor: isLocked ? 'none' : 'auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');*{overscroll-behavior:none}`}</style>

      <Canvas gl={{ antialias: true }} dpr={[1, 2]} style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
        <color attach="background" args={[paperColor]} />
        <fog attach="fog" args={[paperColor, 26, 60]} />
        <CameraController onStep={onStep} onZone={onZone} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[8, 12, 8]} intensity={0.75} />
        <hemisphereLight args={['#3d4f5c', '#1e272e', 0.55]} />
        <pointLight position={[0, 4.4, 0]} intensity={0.9} color={COPPER} distance={14} />
        <World locks={locks} unlock={unlock} walkTo={walkTo} openProject={(p) => { autoWalk.waypoints = []; setSelected(p); }} openCert={(c) => { autoWalk.waypoints = []; setSelectedCert(c); }} />
        <LockedCrosshairInteractor isLocked={isLocked} locks={locks} unlock={unlock} walkTo={walkTo} openProject={(p) => { autoWalk.waypoints = []; setSelected(p); }} openCert={(c) => { autoWalk.waypoints = []; setSelectedCert(c); }} />
      </Canvas>

      {isLocked && <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.7)]" />}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-3 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f172a] text-white shadow-lg"><span className="text-[11px] font-black">SM</span></div>
          <div className="leading-none">
            <div className="text-[13px] font-extrabold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>PAPER VERSE</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${zoneDot[zone]} animate-pulse`} />
              <span className="text-[10px] font-bold tracking-[0.14em] text-[#94a3b8]">{zoneLabel[zone]}</span>
              {lockedCount > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">🔒 {lockedCount}</span>}
            </div>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button onClick={() => containerRef.current?.requestPointerLock()} className={`hidden sm:flex h-9 items-center rounded-full border-2 px-3 text-[11px] font-black transition ${isLocked ? 'bg-[#2ecc71] border-[#2ecc71] text-[#0a1a12]' : 'bg-[#1e272e] border-[#e67e22] text-white hover:bg-[#e67e22]'}`}>{isLocked ? '○ LOCKED' : '◐ LOCK MOUSE'}</button>
          <button onClick={() => { (['main', 'skills', 'projects', 'about'] as DoorId[]).forEach(k => globalLocks[k] = false); setLocks({ main: false, skills: false, projects: false, about: false }); toastMsg('🔓 ALL UNLOCKED'); playUnlock(); }} className="hidden sm:flex h-9 items-center rounded-full border-2 border-slate-900 bg-[#1e272e] px-3 text-[11px] font-black text-white hover:bg-[#e67e22]">🔓 UNLOCK ALL</button>
          <button onClick={() => { autoWalk.waypoints = [[playerState.x, playerState.z], [0, 8.2]]; toastMsg('🏠 HOME'); }} className="inline-flex items-center gap-2 rounded-full border-2 border-[#e67e22] bg-[#1e272e] px-3.5 py-2.5 text-xs font-black tracking-widest text-white hover:bg-[#e67e22] transition min-h-[44px]">⌂ EXIT</button>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-14 z-[25] -translate-x-1/2">
          <div className="rounded-full border-2 border-slate-900 bg-[#e6edf2] px-4 py-2 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]"><span className="text-[11px] font-black text-[#0f172a]">{toast}</span></div>
        </div>
      )}

      {showHint && !loading && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 px-4 w-full max-w-[350px]">
          <div className="pointer-events-auto flex w-full flex-col items-center gap-2.5 rounded-[18px] border-2 border-[#e67e22] bg-[#1e272e] px-5 py-4 shadow-[6px_6px_0px_rgba(0,0,0,0.6)]">
            <div className="rounded-full bg-[#2ecc71] px-3 py-1 text-[10px] font-black tracking-widest text-[#0a1a12]">🏠 4 ROOMS • 4 DOORS</div>
            <p className="text-center text-[11px] font-semibold leading-relaxed text-[#b8c5d1]">
              <b>MAIN DOOR</b> → ROOM 1 HOME → walled corridor<br />
              <b className="text-[#e67e22]">RIGHT door → ROOM 2 SKILLS</b><br />
              <b className="text-[#2ecc71]">LEFT door → ROOM 3 PROJECTS</b><br />
              <b className="text-[#6ee7b7]">END door → ROOM 4 ABOUT</b><br />
              All doors <span className="rounded bg-red-500 px-1 text-white">LOCKED</span> — tap to unlock, tap again to enter.
            </p>
            <button onClick={() => setShowHint(false)} className="w-full rounded-full bg-[#2ecc71] px-4 py-2.5 text-xs font-black text-[#0a1a12] hover:bg-[#27ae60]">START — TAP MAIN DOOR</button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-20 flex justify-center px-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
        <div className="pointer-events-auto flex max-w-[98vw] flex-wrap items-center justify-center gap-1 rounded-2xl border-2 border-[#e67e22] bg-[#1e272e]/96 backdrop-blur px-2.5 py-2 shadow-lg">
          <span className="hidden sm:inline-flex rounded-full bg-[#2ecc71] px-2 py-1 text-[9px] font-black tracking-widest text-[#0a1a12]">CONTROLS</span>
          <Chip icon="◐" label={isLocked ? 'MOVE MOUSE = LOOK' : 'CLICK = LOCK MOUSE'} />
          <Chip icon="WASD" label="WALK" />
          <Chip icon="F" label="UNLOCK DOOR" />
          <Chip icon="🚪" label="TAP DOOR = ENTER" />
          <span className="rounded-full border border-[#e67e22] bg-[#0f1a12] px-2 py-1 text-[9px] font-black text-[#9fb0c3]">HOME → CORRIDOR → RIGHT SKILLS • LEFT PROJECTS • END ABOUT</span>
          <button onClick={() => setShowGuide(true)} className="rounded-full bg-[#e67e22] px-3 py-1.5 text-[10px] font-black tracking-widest text-white hover:bg-[#d35400]">GUIDE</button>
        </div>
      </div>

      {joy && (
        <div className="pointer-events-none absolute z-30" style={{ left: joy.x - 52, top: joy.y - 52 }}>
          <div className="relative h-[104px] w-[104px] rounded-full border-2 border-[#e67e22] bg-[#1e272e]/35 backdrop-blur-sm">
            <div className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full border-2 border-[#e67e22] bg-[#e67e22]/80" style={{ transform: `translate(${joy.dx}px, ${joy.dy}px) translate(-50%,-50%)` }} />
          </div>
        </div>
      )}

      {showGuide && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0f172a]/60 backdrop-blur-[5px] p-4" onClick={() => setShowGuide(false)}>
          <div data-scrollable onClick={e => e.stopPropagation()} className="relative w-full max-w-[520px] max-h-[86vh] overflow-auto rounded-[20px] border-[3px] border-[#e67e22] bg-[#1e272e] p-5 shadow-[10px_10px_0px_rgba(0,0,0,0.6)]">
            <button onClick={() => setShowGuide(false)} className="absolute right-3 top-3 h-9 w-9 rounded-full border-2 border-[#e67e22] bg-[#1e272e] text-white font-black">✕</button>
            <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>HOUSE MAP & CONTROLS</h2>
            <div className="mt-1 h-1 w-14 rounded-full bg-[#e67e22]" />
            <GuideSection title="🗺 4 ROOMS — EACH FULLY CLOSED, ONE DOOR">
              <div className="rounded-xl border-2 border-[#e67e22] bg-[#0f1a12] p-3 text-[11px] font-bold leading-relaxed text-[#b8c5d1]">
                OUTSIDE → 🚪 MAIN DOOR → <b>ROOM 1 · HOME</b><br />
                HOME → open archway → <b>CORRIDOR</b> (solid walls both sides, 2.8m wide)<br />
                <span className="text-[#e67e22]">🚪 RIGHT door → ROOM 2 · SKILLS ATELIER (6 cert frames)</span><br />
                <span className="text-[#2ecc71]">🚪 LEFT door → ROOM 3 · PROJECTS ROOM (4 projects)</span><br />
                <span className="text-[#6ee7b7]">🚪 END door → ROOM 4 · ABOUT & CONTACT (throne)</span>
              </div>
            </GuideSection>
            <GuideSection title="🔒 LOCKED DOORS">
              <GuideRow k="TAP / F" v="unlock the door you stand near (red → disappears)" />
              <GuideRow k="TAP AGAIN" v="walk through it automatically" />
              <GuideRow k="BLOCKED" v="locked doors physically stop you" />
            </GuideSection>
            <GuideSection title="🖱 MOVEMENT">
              <GuideRow k="CLICK SCENE" v="lock mouse — move mouse to free-look (ESC to release)" />
              <GuideRow k="W A S D" v="free walk with wall collision" />
              <GuideRow k="Q / E" v="turn left / right" />
              <GuideRow k="TOUCH" v="left thumb = joystick, right thumb = look" />
            </GuideSection>
            <GuideSection title="🎓 CERTIFICATES — UPLOAD LATER">
              <div className="rounded-xl border-2 border-[#e67e22] bg-[#0f1a12] p-3 text-[11px] font-bold text-[#b8c5d1]">
                Save images to <b className="text-[#e67e22]">public/certs/</b> with exact names:<br />
                <span className="font-mono text-[10px] text-[#2ecc71]">buildathon-2026.jpg<br/>cybersecurity-udemy.jpg<br/>embedded-systems-emertxe.jpg<br/>iot-emertxe.jpg<br/>pitch-night-google.jpg<br/>music-night-google.jpg</span><br />
                In <b className="text-[#e67e22]">CertFrame</b>: add <span className="font-mono text-[10px] text-[#2ecc71]">const tex = useTexture(cert.file)</span> and use <span className="font-mono text-[10px] text-[#2ecc71]">map={`{tex}`}</span>
              </div>
              <div className="mt-2 rounded-xl border-2 border-[#2ecc71] bg-[#0f1a12] p-3 text-[11px] font-bold text-[#b8c5d1]">
                Portrait: save as <b className="text-[#e67e22]">public/photo.jpg</b> then in <b>PhotoFrame</b> use <span className="font-mono text-[10px] text-[#2ecc71]">useTexture('/photo.jpg')</span>
              </div>
            </GuideSection>
            <button onClick={() => setShowGuide(false)} className="mt-4 w-full rounded-full bg-[#e67e22] px-4 py-3 text-xs font-black text-white">GOT IT</button>
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0f172a]/65 backdrop-blur-[6px] sm:p-4" onClick={() => closeModal()}>
          <div data-scrollable onClick={e => e.stopPropagation()} className="relative w-full max-h-[92dvh] sm:max-h-[85vh] max-w-[560px] overflow-auto rounded-t-[22px] sm:rounded-[22px] border-t-[3px] sm:border-[3px] border-[#e67e22] bg-[#1e272e] shadow-[10px_10px_0px_rgba(0,0,0,0.7)]" style={{ touchAction: 'pan-y' }}>
            <div className="relative h-[130px]" style={{ background: selected.bg }}>
              <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${selected.color} 0 10px, transparent 10px 20px)` }} />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0f172a] px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white"><span className="h-1.5 w-1.5 rounded-full" style={{ background: selected.color }} />{selected.year}</div>
                <h2 className="mt-2 text-[24px] font-black leading-none text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{selected.title}</h2>
                <p className="text-[13px] font-semibold text-[#94a3b8]">{selected.subtitle}</p>
              </div>
              <button onClick={() => closeModal()} className="absolute right-3 top-3 h-10 w-10 rounded-full border-2 border-[#e67e22] bg-[#1e272e] text-white font-black">✕</button>
            </div>
            <div className="p-6" data-scrollable>
              <p className="text-[14px] leading-6 text-[#b8c5d1]">{selected.description}</p>
              <h3 className="mt-5 text-[11px] font-black tracking-[0.18em] text-[#e67e22]">STACK</h3>
              <div className="mt-3 flex flex-wrap gap-2">{selected.technologies.map(t => <span key={t} className="rounded-full border border-[#e67e22] bg-[#0f1a12] px-3 py-1.5 text-xs font-bold text-[#e6edf2]">{t}</span>)}</div>
              <div className="mt-6 flex gap-3">
                <a href={selected.link} target="_blank" rel="noreferrer" onClick={() => { autoWalk.waypoints = []; }} className="flex-1 rounded-full bg-[#2ecc71] px-5 py-3 text-center text-sm font-black text-[#0a1a12]">View Project →</a>
                <button onClick={() => closeModal()} className="rounded-full border-2 border-[#e67e22] bg-[#1e272e] px-5 py-3 text-sm font-black text-white">Close & Stay Here</button>
              </div>
              <p className="mt-3 text-center text-[10px] font-bold tracking-widest text-[#6b7d8c]">Mouse is unlocked — move and click to exit info</p>
            </div>
          </div>
        </div>
      )}

      {selectedCert && (
        <div className="absolute inset-0 z-[45] flex items-end sm:items-center justify-center bg-[#0f172a]/70 backdrop-blur-[6px] sm:p-4" onClick={() => closeModal()}>
          <div data-scrollable onClick={e => e.stopPropagation()} className="relative w-full max-h-[92dvh] sm:max-h-[85vh] max-w-[560px] overflow-auto rounded-t-[22px] sm:rounded-[22px] border-t-[3px] sm:border-[3px] border-[#e67e22] bg-[#1e272e] shadow-[10px_10px_0px_rgba(0,0,0,0.7)]" style={{ touchAction: 'pan-y' }}>
            <div className="relative h-[190px] bg-[#0f1a12] flex flex-col items-center justify-center p-5">
              <div className="w-[88px] h-[88px] rounded-xl border-2 border-[#2ecc71] bg-[#0f1a12] flex items-center justify-center text-4xl">🏅</div>
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-3 py-1 text-[10px] font-black tracking-[0.15em] text-[#94a3b8]">{selectedCert.issuer} • {selectedCert.date}</div>
                <h2 className="mt-2 text-[20px] font-black leading-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{selectedCert.title}</h2>
                <p className="mt-1 text-[11px] font-semibold text-[#e67e22]">{selectedCert.skills}</p>
              </div>
              <button onClick={() => closeModal()} className="absolute right-3 top-3 h-10 w-10 rounded-full border-2 border-[#e67e22] bg-[#1e272e] text-white font-black">✕</button>
            </div>
            <div className="p-6" data-scrollable>
              <div className="rounded-xl border-2 border-dashed border-[#2ecc71]/60 bg-[#0a1a12] p-4 text-center">
                <p className="text-[10px] font-black tracking-[0.15em] text-[#2ecc71]">IMAGE FILE</p>
                <p className="mt-1 text-[11px] font-mono font-bold text-white break-all">{selectedCert.file}</p>
                <p className="mt-2 text-[11px] text-[#6b7d8c]">Save your certificate image to <b className="text-white">public{selectedCert.file}</b></p>
                <p className="mt-2 text-[11px] text-[#94a3b8]">After uploading, in <b>CertFrame</b> component add:</p>
                <pre className="mt-2 rounded-lg bg-[#0f172a] p-2 text-left text-[10px] font-mono text-[#2ecc71] overflow-auto">{`const tex = useTexture(cert.file)\n<meshStandardMaterial map={tex} />`}</pre>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => closeModal()} className="flex-1 rounded-full bg-[#e67e22] px-5 py-3 text-sm font-black text-white">Close & Stay Here</button>
                <button onClick={() => { navigator.clipboard?.writeText(selectedCert.file); toastMsg('📋 Copied: ' + selectedCert.file); }} className="rounded-full border-2 border-[#2ecc71] bg-[#1e272e] px-5 py-3 text-sm font-black text-[#2ecc71]">Copy Path</button>
              </div>
              <p className="mt-3 text-center text-[10px] font-bold tracking-widest text-[#6b7d8c]">Mouse is unlocked — click outside to stay in room</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1e272e] p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2ecc71] text-[#0a1a12] shadow-[6px_6px_0px_rgba(0,0,0,0.6)]"><span className="text-lg font-black">SM</span></div>
          <h1 className="mt-4 text-3xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>PAPER VERSE</h1>
          <p className="mt-1 text-xs font-bold tracking-[0.2em] text-[#e67e22]">SILICON PALACE • 4 CLOSED ROOMS</p>
          <div className="mt-8 w-[280px] overflow-hidden rounded-full border-2 border-[#2ecc71] bg-[#0f1a12] p-1.5"><div className="h-3 rounded-full bg-[#2ecc71] transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-2 flex w-[280px] justify-between text-[10px] font-black tracking-widest text-[#6b7d8c]"><span>BOOTING CIRCUITS...</span><span>{Math.round(progress)}%</span></div>
        </div>
      )}
    </div>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-[#e67e22] bg-[#131a20] px-2 py-1 text-[9px] font-black tracking-wider text-[#9fb0c3]"><span className="text-[10px]">{icon}</span>{label}</span>;
}
function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-4"><h3 className="text-[11px] font-black tracking-[0.18em] text-[#e67e22]">{title}</h3><div className="mt-2 space-y-1.5">{children}</div></div>;
}
function GuideRow({ k, v }: { k: string; v: string }) {
  return <div className="flex items-start gap-2 rounded-lg border border-[#2c3a45] bg-[#0f1a12] px-2.5 py-1.5"><span className="shrink-0 rounded bg-[#e67e22] px-1.5 py-0.5 text-[9px] font-black text-white">{k}</span><span className="text-[11px] font-medium text-[#b8c5d1]">{v}</span></div>;
}
