import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import AquaLayout from "@/components/AquaLayout";
import { Boxes } from "lucide-react";

interface Node {
  id: string;
  label: string;
  pos: [number, number, number];
  color: string;
  metrics: { label: string; value: string; health: number }[];
  valve: "OPEN" | "CLOSED" | "MODULATING";
}

const NODES: Node[] = [
  { id: "influent", label: "Influent Pumping Station", pos: [-6, 0.5, 3], color: "#4facfe",
    metrics: [{ label: "Flow", value: "112 MLD", health: 92 }, { label: "Pressure", value: "2.4 bar", health: 88 }, { label: "Pump Vib.", value: "3.1 mm/s", health: 94 }], valve: "OPEN" },
  { id: "aeration", label: "Aeration Basin", pos: [-2.5, 0.5, 3], color: "#00e676",
    metrics: [{ label: "DO", value: "2.4 mg/L", health: 91 }, { label: "MLSS", value: "3800 mg/L", health: 87 }, { label: "Blower Temp", value: "68 °C", health: 90 }], valve: "MODULATING" },
  { id: "clarifier", label: "Secondary Clarifier", pos: [1, 0.5, 3], color: "#00f2fe",
    metrics: [{ label: "SVI", value: "112 mL/g", health: 89 }, { label: "TSS", value: "18 mg/L", health: 93 }, { label: "RAS", value: "45%", health: 90 }], valve: "OPEN" },
  { id: "mbr", label: "MBR Membrane Filter", pos: [4.5, 0.5, 3], color: "#7000ff",
    metrics: [{ label: "TMP", value: "0.68 bar", health: 78 }, { label: "Flux", value: "22 LMH", health: 82 }, { label: "Permeability", value: "32 LMH/bar", health: 80 }], valve: "OPEN" },
  { id: "struvite", label: "Bio-Struvite Reactor", pos: [-4, 0.5, -1], color: "#ffd600",
    metrics: [{ label: "pH", value: "9.1", health: 95 }, { label: "Mg dose", value: "220 mg/L", health: 92 }, { label: "Yield", value: "78 kg/day", health: 90 }], valve: "MODULATING" },
  { id: "reuse", label: "Effluent Reuse Gateway", pos: [3, 0.5, -1], color: "#00e676",
    metrics: [{ label: "BOD out", value: "6 mg/L", health: 96 }, { label: "Reuse ratio", value: "62%", health: 88 }, { label: "Cat A OK", value: "✔", health: 99 }], valve: "OPEN" },
];

function Pipe({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dir = end.clone().sub(start);
  const length = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={mid.toArray()} quaternion={quat}>
      <cylinderGeometry args={[0.08, 0.08, length, 16]} />
      <meshStandardMaterial color="#0b3a55" emissive="#00f2fe" emissiveIntensity={0.4} metalness={0.8} roughness={0.3} />
    </mesh>
  );
}

function FlowParticle({ from, to, offset }: { from: [number, number, number]; to: [number, number, number]; offset: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = ((state.clock.elapsedTime * 0.3 + offset) % 1);
    if (!ref.current) return;
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 0.1,
      from[2] + (to[2] - from[2]) * t
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshStandardMaterial color="#00f2fe" emissive="#00f2fe" emissiveIntensity={2} />
    </mesh>
  );
}

function NodeMesh({ node, selected, onClick }: { node: Node; selected: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.3; });
  return (
    <group position={node.pos}>
      <mesh ref={ref} onClick={onClick} onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = "pointer"))} onPointerOut={() => (document.body.style.cursor = "auto")}>
        <cylinderGeometry args={[0.9, 0.9, 1.1, 32]} />
        <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={selected ? 1.2 : 0.5} metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[1.0, 0.05, 12, 40]} />
        <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={selected ? 2 : 0.8} />
      </mesh>
      <Html position={[0, 1.6, 0]} center distanceFactor={10}>
        <div className={`px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap ${selected ? "bg-cyan-400 text-slate-950" : "bg-slate-950/80 text-cyan-200 border border-cyan-500/40"}`}>
          {node.label}
        </div>
      </Html>
    </group>
  );
}

function Scene({ selected, setSelected }: { selected: string; setSelected: (id: string) => void }) {
  const pipes: [Node, Node][] = [
    [NODES[0], NODES[1]], [NODES[1], NODES[2]], [NODES[2], NODES[3]],
    [NODES[1], NODES[4]], [NODES[3], NODES[5]], [NODES[4], NODES[5]],
  ];
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#00f2fe" />
      <pointLight position={[-10, 5, -10]} intensity={0.6} color="#7000ff" />
      {/* Ground grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#060913" metalness={0.7} roughness={0.4} />
      </mesh>
      <gridHelper args={[30, 30, "#0b3a55", "#062033"]} position={[0, -0.59, 0]} />
      {pipes.map(([a, b], i) => (
        <group key={i}>
          <Pipe from={a.pos} to={b.pos} />
          <FlowParticle from={a.pos} to={b.pos} offset={0} />
          <FlowParticle from={a.pos} to={b.pos} offset={0.33} />
          <FlowParticle from={a.pos} to={b.pos} offset={0.66} />
        </group>
      ))}
      {NODES.map((n) => (
        <NodeMesh key={n.id} node={n} selected={selected === n.id} onClick={() => setSelected(n.id)} />
      ))}
    </>
  );
}

export default function Plant3D() {
  const [selected, setSelected] = useState<string>("influent");
  const node = NODES.find((n) => n.id === selected)!;

  return (
    <AquaLayout
      icon={<Boxes className="w-6 h-6" />}
      title="3D Digital Twin & SCADA Plant Map"
      subtitle="Interactive isometric model of the wastewater treatment plant. Click a hotspot to inspect."
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="glass-card rounded-2xl overflow-hidden h-[620px]">
          <Canvas camera={{ position: [8, 8, 12], fov: 45 }} shadows>
            <Suspense fallback={null}>
              <Scene selected={selected} setSelected={setSelected} />
              <Environment preset="night" />
              <OrbitControls enablePan makeDefault target={[0, 0, 1]} />
            </Suspense>
          </Canvas>
        </div>
        <aside className="glass-card-strong rounded-2xl p-6">
          <div className="text-xs uppercase tracking-widest cyber-cyan mb-2">Node Inspector</div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">{node.label}</h2>
          <div className="flex items-center gap-2 mb-6">
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              node.valve === "OPEN" ? "bg-cyber-green text-slate-950" :
              node.valve === "CLOSED" ? "bg-cyber-red text-white" : "bg-cyber-yellow text-slate-950"
            }`}>VALVE {node.valve}</span>
            <span className="text-[10px] cyber-cyan">LIVE</span>
          </div>
          <div className="space-y-4">
            {node.metrics.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-200/70">{m.label}</span>
                  <span className="font-mono text-white">{m.value}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${m.health}%`,
                    background: m.health > 85 ? "#00e676" : m.health > 70 ? "#ffd600" : "#ff1744",
                    boxShadow: `0 0 12px ${m.health > 85 ? "#00e676" : m.health > 70 ? "#ffd600" : "#ff1744"}`,
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-cyan-500/20 space-y-2">
            {NODES.map((n) => (
              <button key={n.id} onClick={() => setSelected(n.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                  selected === n.id ? "glass-card-strong text-white" : "text-cyan-200/60 hover:text-white hover:bg-cyan-500/5"
                }`}>
                <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: n.color, boxShadow: `0 0 8px ${n.color}` }} />
                {n.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </AquaLayout>
  );
}
