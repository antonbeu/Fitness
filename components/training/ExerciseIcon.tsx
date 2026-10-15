import { iconKindFor, type IconKind } from "@/lib/training/exercise-icons";
import { cn } from "@/lib/utils";

/*
 * Kleine flache Piktogramme (Seitenansicht, Figur in der Akzentfarbe, Geräte in
 * gedecktem Lavendelgrau, Gewichte dunkelgrau). Jedes Symbol ist aus wenigen
 * Gelenkpunkten gezeichnet; Koordinaten im 64×64-Raster.
 */

type P = [number, number];

const ACC = "var(--primary)";
const FAR = "color-mix(in oklch, var(--primary) 42%, white)";
const EQ = "oklch(0.86 0.035 80)";
const EQD = "oklch(0.7 0.05 70)";
const PLATE = "oklch(0.4 0.04 60)";
const HUB = "oklch(0.7 0.04 70)";

const TILE = "oklch(0.935 0.04 148)";

function Limb({ pts, far, w = 7 }: { pts: P[]; far?: boolean; w?: number }) {
  const points = pts.map((p) => p.join(",")).join(" ");
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Dünne Glieder (Arme) bekommen eine Kontur in Kachelfarbe, damit sie sich vom Rumpf lösen */}
      {w <= 6.5 && <polyline points={points} stroke={TILE} strokeWidth={w + 2.4} />}
      <polyline points={points} stroke={far ? FAR : ACC} strokeWidth={w} />
    </g>
  );
}

const Torso = ({ pts, w = 11 }: { pts: P[]; w?: number }) => <Limb pts={pts} w={w} />;

function Head({ at, r = 5 }: { at: P; r?: number }) {
  return <circle cx={at[0]} cy={at[1]} r={r} fill={ACC} />;
}

function Bar({ from, to, w = 2.5, c = EQD }: { from: P; to: P; w?: number; c?: string }) {
  return (
    <line
      x1={from[0]}
      y1={from[1]}
      x2={to[0]}
      y2={to[1]}
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
}

function Pad({ x, y, w, h, c = EQ }: { x: number; y: number; w: number; h: number; c?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={2.5} fill={c} />;
}

function Plate({ at, r = 6 }: { at: P; r?: number }) {
  return (
    <g>
      <circle cx={at[0]} cy={at[1]} r={r} fill={PLATE} />
      <circle cx={at[0]} cy={at[1]} r={r * 0.32} fill={HUB} />
    </g>
  );
}

/** Kurzhantel von der Seite: kleiner dunkler Block. */
function Dumbbell({ at, vertical = true }: { at: P; vertical?: boolean }) {
  const [w, h] = vertical ? [5, 10] : [10, 5];
  return <rect x={at[0] - w / 2} y={at[1] - h / 2} width={w} height={h} rx={2} fill={PLATE} />;
}

const Floor = ({ y = 58 }: { y?: number }) => <Bar from={[3, y]} to={[61, y]} c={EQ} w={2.5} />;

function Arrow({ from, to }: { from: P; to: P }) {
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  const base: P = [to[0] - ux * 5, to[1] - uy * 5];
  const head = `${to[0]},${to[1]} ${base[0] - uy * 3.5},${base[1] + ux * 3.5} ${base[0] + uy * 3.5},${base[1] - ux * 3.5}`;
  return (
    <g>
      <Bar from={from} to={base} w={2.5} />
      <polygon points={head} fill={EQD} />
    </g>
  );
}

/** Aufrecht sitzende Figur auf einem Gerät (gemeinsame Basis vieler Maschinen). */
function Seated({
  arms,
  back = true,
  head = [25, 9],
}: {
  arms: P[];
  back?: boolean;
  head?: P;
}) {
  return (
    <g>
      {back && <Pad x={14} y={13} w={5} h={29} />}
      <Pad x={14} y={40} w={24} h={5} />
      <Bar from={[26, 45]} to={[26, 58]} w={3} c={EQ} />
      <Limb far pts={[[24, 38], [40, 38], [41, 54]]} />
      <Torso pts={[[24, 18], [24, 38]]} />
      <Limb pts={[[24, 38], [40, 38], [40, 54]]} />
      <Limb pts={arms} w={6} />
      <Head at={head} />
    </g>
  );
}

function Standing({ arms, head = [30, 9] }: { arms?: P[]; head?: P }) {
  return (
    <g>
      <Floor />
      <Limb far pts={[[30, 36], [31, 46], [29, 56]]} />
      <Torso pts={[[30, 18], [30, 36]]} />
      <Limb pts={[[30, 36], [30, 46], [31, 56]]} />
      {arms && <Limb pts={arms} w={6} />}
      <Head at={head} />
    </g>
  );
}

/** Vorderansicht, stehend, Arme einzeln übergeben. */
function Front({ leftArm, rightArm }: { leftArm: P[]; rightArm: P[] }) {
  return (
    <g>
      <Floor />
      <Limb pts={[[29, 38], [27, 56]]} w={6} />
      <Limb pts={[[35, 38], [37, 56]]} w={6} />
      <Torso pts={[[32, 19], [32, 38]]} w={13} />
      <Limb pts={leftArm} w={6} />
      <Limb pts={rightArm} w={6} />
      <Head at={[32, 9]} />
    </g>
  );
}

function Pose({ kind }: { kind: IconKind }) {
  switch (kind) {
    case "squat":
      return (
        <g>
          <Floor />
          <Limb far pts={[[24, 36], [38, 41], [34, 56]]} />
          <Torso pts={[[30, 19], [24, 36]]} />
          <Limb pts={[[24, 36], [40, 40], [32, 56]]} />
          <Limb pts={[[30, 21], [23, 27], [26, 20]]} w={6} />
          <Head at={[33, 10]} />
          <Plate at={[24, 17]} r={6} />
        </g>
      );
    case "goblet":
      return (
        <g>
          <Floor />
          <Limb far pts={[[24, 36], [38, 41], [34, 56]]} />
          <Torso pts={[[30, 19], [24, 36]]} />
          <Limb pts={[[24, 36], [40, 40], [32, 56]]} />
          <Limb pts={[[30, 21], [35, 29], [39, 24]]} w={6} />
          <Head at={[33, 10]} />
          <Dumbbell at={[40, 24]} />
        </g>
      );
    case "legpress":
      return (
        <g>
          <Floor />
          <Bar from={[8, 41]} to={[22, 54]} w={6} c={EQ} />
          <Bar from={[20, 56]} to={[56, 26]} w={3} />
          <Bar from={[44, 12]} to={[58, 28]} w={6} c={EQD} />
          <Limb far pts={[[24, 49], [36, 34], [47, 22]]} />
          <Torso pts={[[13, 42], [24, 49]]} />
          <Limb pts={[[24, 49], [37, 36], [48, 25]]} />
          <Head at={[6, 36]} />
          <Plate at={[56, 40]} r={6} />
        </g>
      );
    case "legext":
      return (
        <g>
          <Pad x={14} y={8} w={5} h={32} />
          <Pad x={14} y={38} w={30} h={5} />
          <Bar from={[22, 43]} to={[22, 58]} w={3} c={EQ} />
          <Limb far pts={[[27, 36], [43, 37], [44, 52]]} />
          <Torso pts={[[27, 14], [27, 36]]} />
          <Limb pts={[[27, 36], [43, 36], [55, 25]]} />
          <Limb pts={[[27, 17], [33, 27], [38, 36]]} w={6} />
          <Head at={[27, 6]} />
          <circle cx={53} cy={28} r={4} fill={EQD} />
        </g>
      );
    case "legcurl":
      return (
        <g>
          <Pad x={4} y={40} w={46} h={5} />
          <Bar from={[10, 45]} to={[10, 58]} w={3} c={EQ} />
          <Bar from={[44, 45]} to={[44, 58]} w={3} c={EQ} />
          <Limb far pts={[[34, 35], [48, 35], [50, 46]]} />
          <Torso pts={[[14, 35], [34, 35]]} w={10} />
          <Limb pts={[[34, 35], [48, 35], [48, 19]]} />
          <Head at={[7, 33]} />
          <circle cx={48} cy={22} r={4} fill={EQD} />
        </g>
      );
    case "lunge":
      return (
        <g>
          <Floor />
          <Limb far pts={[[32, 33], [24, 46], [12, 54]]} />
          <Torso pts={[[32, 17], [32, 33]]} />
          <Limb pts={[[32, 33], [44, 38], [44, 54]]} />
          <Limb pts={[[32, 19], [32, 28], [32, 35]]} w={6} />
          <Head at={[32, 8]} />
          <Dumbbell at={[32, 38]} />
        </g>
      );
    case "deadlift":
      return (
        <g>
          <Floor />
          <Limb far pts={[[26, 30], [30, 44], [27, 56]]} />
          <Limb pts={[[26, 30], [29, 44], [26, 56]]} />
          <Torso pts={[[26, 30], [44, 24]]} />
          <Limb pts={[[44, 26], [43, 38], [42, 47]]} w={6} />
          <Head at={[52, 22]} />
          <Plate at={[42, 49]} r={8} />
        </g>
      );
    case "calf":
      return (
        <g>
          <Floor y={61} />
          <Pad x={24} y={54} w={24} h={7} />
          <Limb far pts={[[32, 34], [32, 46], [36, 52], [41, 53]]} />
          <Torso pts={[[32, 17], [32, 34]]} />
          <Limb pts={[[32, 34], [32, 46], [35, 52], [40, 53]]} />
          <Limb pts={[[32, 19], [34, 30], [35, 40]]} w={6} />
          <Head at={[32, 8]} />
          <Arrow from={[52, 50]} to={[52, 34]} />
        </g>
      );
    case "bridge":
      return (
        <g>
          <Floor y={57} />
          <Limb pts={[[12, 51], [26, 53]]} w={6} />
          <Torso pts={[[11, 49], [28, 34]]} w={10} />
          <Limb pts={[[28, 34], [42, 37], [46, 52]]} />
          <Head at={[5, 51]} />
          <Arrow from={[28, 24]} to={[28, 12]} />
        </g>
      );
    case "bench":
      return (
        <g>
          <Floor />
          <Pad x={5} y={40} w={44} h={5} />
          <Bar from={[12, 45]} to={[12, 58]} w={3} c={EQ} />
          <Bar from={[42, 45]} to={[42, 58]} w={3} c={EQ} />
          <Limb far pts={[[36, 36], [46, 30], [48, 52]]} />
          <Torso pts={[[17, 36], [36, 36]]} w={10} />
          <Limb pts={[[36, 36], [47, 31], [47, 52]]} />
          <Limb pts={[[20, 34], [21, 24], [21, 16]]} w={6} />
          <Head at={[10, 35]} />
          <Plate at={[21, 13]} r={7} />
        </g>
      );
    case "incline":
      return (
        <g>
          <Floor />
          <Bar from={[30, 46]} to={[20, 24]} w={5} c={EQ} />
          <Pad x={30} y={44} w={18} h={5} />
          <Bar from={[38, 49]} to={[38, 58]} w={3} c={EQ} />
          <Limb far pts={[[35, 42], [47, 40], [47, 55]]} />
          <Torso pts={[[26, 27], [35, 42]]} />
          <Limb pts={[[35, 42], [46, 41], [46, 55]]} />
          <Limb pts={[[28, 29], [34, 21], [34, 11]]} w={6} />
          <Head at={[22, 18]} />
          <Dumbbell at={[34, 8]} />
        </g>
      );
    case "chestpress":
      return (
        <g>
          <Seated arms={[[24, 22], [34, 26], [44, 22]]} />
          <Bar from={[46, 15]} to={[46, 29]} w={3.5} />
        </g>
      );
    case "fly":
      return (
        <g>
          <Seated arms={[[24, 22], [33, 25], [37, 12]]} />
          <Pad x={35} y={6} w={5} h={13} c={EQD} />
        </g>
      );
    case "cablefly":
      return (
        <g>
          <Bar from={[58, 2]} to={[58, 58]} w={3} c={EQ} />
          <Bar from={[58, 6]} to={[46, 27]} w={1.5} />
          <Standing arms={[[30, 21], [38, 26], [46, 27]]} />
        </g>
      );
    case "pushup":
      return (
        <g>
          <Floor y={55} />
          <Torso pts={[[14, 33], [36, 39], [56, 46]]} w={9} />
          <Limb pts={[[14, 33], [14, 50]]} w={6} />
          <Head at={[6, 29]} />
          <Limb pts={[[56, 46], [57, 51]]} w={6} />
        </g>
      );
    case "press":
      return (
        <g>
          <Seated arms={[[24, 22], [33, 14], [32, 5]]} />
          <Dumbbell at={[32, 3]} />
        </g>
      );
    case "lateral":
      return (
        <g>
          <Front leftArm={[[27, 21], [10, 21]]} rightArm={[[37, 21], [54, 21]]} />
          <Dumbbell at={[8, 21]} />
          <Dumbbell at={[56, 21]} />
        </g>
      );
    case "facepull":
      return (
        <g>
          <Bar from={[58, 2]} to={[58, 58]} w={3} c={EQ} />
          <Bar from={[43, 10]} to={[58, 6]} w={1.5} />
          <Standing arms={[[30, 21], [38, 25], [41, 12]]} />
        </g>
      );
    case "pulldown":
      return (
        <g>
          <Bar from={[30, 4]} to={[50, 4]} w={3.5} />
          <Bar from={[40, 4]} to={[40, 0]} w={1.5} />
          <Pad x={14} y={43} w={26} h={5} />
          <Bar from={[26, 48]} to={[26, 58]} w={3} c={EQ} />
          <Pad x={30} y={36} w={12} h={4} c={EQD} />
          <Limb far pts={[[26, 42], [42, 42], [42, 56]]} />
          <Torso pts={[[26, 22], [26, 42]]} />
          <Limb pts={[[26, 42], [42, 42], [41, 56]]} />
          <Limb pts={[[26, 24], [33, 15], [36, 5]]} w={6} />
          <Head at={[27, 13]} />
        </g>
      );
    case "pullup":
      return (
        <g>
          <Bar from={[14, 3]} to={[14, 58]} w={3} c={EQ} />
          <Bar from={[50, 3]} to={[50, 58]} w={3} c={EQ} />
          <Bar from={[12, 3]} to={[52, 3]} w={3.5} />
          <Limb far pts={[[32, 42], [36, 50], [30, 56]]} />
          <Torso pts={[[32, 24], [32, 42]]} />
          <Limb pts={[[32, 42], [34, 50], [28, 56]]} />
          <Limb pts={[[32, 26], [35, 14], [34, 4]]} w={6} />
          <Head at={[32, 15]} />
        </g>
      );
    case "row":
      return (
        <g>
          <Bar from={[32, 28]} to={[58, 44]} w={1.5} />
          <Pad x={12} y={43} w={26} h={5} />
          <Bar from={[24, 48]} to={[24, 58]} w={3} c={EQ} />
          <Bar from={[47, 48]} to={[47, 58]} w={4} />
          <Limb far pts={[[24, 38], [40, 38], [45, 53]]} />
          <Torso pts={[[22, 18], [24, 38]]} />
          <Limb pts={[[24, 38], [40, 38], [45, 54]]} />
          <Limb pts={[[22, 21], [13, 27], [30, 28]]} w={6} />
          <Head at={[22, 9]} />
          <Bar from={[32, 23]} to={[32, 33]} w={3.5} />
        </g>
      );
    case "bentrow":
      return (
        <g>
          <Floor />
          <Limb far pts={[[26, 30], [30, 44], [27, 56]]} />
          <Limb pts={[[26, 30], [29, 44], [26, 56]]} />
          <Torso pts={[[26, 30], [44, 24]]} />
          <Limb pts={[[44, 26], [37, 33], [38, 41]]} w={6} />
          <Head at={[52, 22]} />
          <Plate at={[38, 43]} r={7} />
        </g>
      );
    case "hyperext":
      return (
        <g>
          <Floor />
          <Bar from={[22, 38]} to={[34, 44]} w={7} c={EQ} />
          <Bar from={[28, 44]} to={[24, 58]} w={3} c={EQ} />
          <Bar from={[28, 44]} to={[36, 58]} w={3} c={EQ} />
          <Limb pts={[[12, 52], [30, 36]]} />
          <Torso pts={[[30, 36], [44, 28]]} w={10} />
          <Limb pts={[[43, 30], [46, 36]]} w={6} />
          <Head at={[51, 26]} />
        </g>
      );
    case "curl":
      return (
        <g>
          <Standing arms={[[30, 21], [32, 31], [42, 26]]} />
          <Dumbbell at={[44, 25]} />
        </g>
      );
    case "pushdown":
      return (
        <g>
          <Bar from={[54, 1]} to={[54, 58]} w={3} c={EQ} />
          <Bar from={[44, 3]} to={[54, 1]} w={2.5} />
          <Bar from={[41, 40]} to={[44, 3]} w={1.5} />
          <Standing arms={[[30, 21], [34, 30], [40, 40]]} />
          <Bar from={[37, 40]} to={[45, 40]} w={3.5} />
        </g>
      );
    case "dips":
      return (
        <g>
          <Bar from={[16, 41]} to={[16, 58]} w={3} c={EQ} />
          <Bar from={[48, 41]} to={[48, 58]} w={3} c={EQ} />
          <Bar from={[14, 40]} to={[50, 40]} w={3.5} />
          <Limb far pts={[[30, 29], [25, 40], [19, 50]]} />
          <Torso pts={[[30, 13], [30, 29]]} />
          <Limb pts={[[30, 29], [24, 40], [17, 49]]} />
          <Limb pts={[[30, 16], [34, 28], [34, 39]]} w={6} />
          <Head at={[30, 5]} />
        </g>
      );
    case "plank":
    case "sideplank":
      return (
        <g>
          <Floor y={55} />
          <Torso pts={[[14, 34], [36, 40], [56, 47]]} w={9} />
          <Limb pts={[[14, 34], [14, 50], [28, 50]]} w={6} />
          <Head at={[6, 30]} />
          <Limb pts={[[56, 47], [57, 51]]} w={6} />
          {kind === "sideplank" && <Limb far pts={[[16, 34], [20, 20]]} w={6} />}
        </g>
      );
    case "crunch":
      return (
        <g>
          <Floor y={57} />
          <Limb far pts={[[36, 50], [47, 37], [55, 51]]} />
          <Torso pts={[[22, 38], [36, 50]]} w={10} />
          <Limb pts={[[36, 50], [46, 36], [54, 50]]} />
          <Limb pts={[[23, 40], [20, 30]]} w={6} />
          <Head at={[17, 32]} />
        </g>
      );
    case "legraise":
      return (
        <g>
          <Floor y={57} />
          <Torso pts={[[12, 50], [30, 50]]} w={10} />
          <Limb pts={[[12, 50], [10, 52]]} w={6} />
          <Head at={[5, 49]} />
          <Limb far pts={[[30, 50], [41, 28]]} />
          <Limb pts={[[30, 50], [40, 29]]} />
          <Arrow from={[52, 44]} to={[52, 26]} />
        </g>
      );
    case "twist":
      return (
        <g>
          <Bar from={[58, 2]} to={[58, 58]} w={3} c={EQ} />
          <Bar from={[58, 24]} to={[40, 25]} w={1.5} />
          <Standing arms={[[30, 21], [36, 25], [40, 25]]} />
          <path d="M14 14 A14 14 0 0 0 14 38" fill="none" stroke={EQD} strokeWidth={2.5} strokeLinecap="round" />
          <polygon points="14,42 9,36 18,36" fill={EQD} />
        </g>
      );
    case "abductor":
    case "adductor": {
      const out = kind === "abductor";
      return (
        <g>
          <Floor />
          <Pad x={24} y={36} w={16} h={6} />
          <Limb pts={[[27, 39], [15, 43], [14, 56]]} w={6.5} />
          <Limb pts={[[37, 39], [49, 43], [50, 56]]} w={6.5} />
          <Torso pts={[[32, 18], [32, 38]]} w={13} />
          <Head at={[32, 9]} />
          {out ? (
            <g>
              <Arrow from={[24, 30]} to={[8, 30]} />
              <Arrow from={[40, 30]} to={[56, 30]} />
            </g>
          ) : (
            <g>
              <Arrow from={[6, 30]} to={[22, 30]} />
              <Arrow from={[58, 30]} to={[42, 30]} />
            </g>
          )}
        </g>
      );
    }
    case "shrug":
      return (
        <g>
          <Front leftArm={[[25, 21], [19, 40]]} rightArm={[[39, 21], [45, 40]]} />
          <Dumbbell at={[19, 44]} />
          <Dumbbell at={[45, 44]} />
        </g>
      );
    default:
      return (
        <g>
          <Bar from={[14, 32]} to={[50, 32]} w={4} />
          <rect x={9} y={20} width={7} height={24} rx={3} fill={PLATE} />
          <rect x={48} y={20} width={7} height={24} rx={3} fill={PLATE} />
          <rect x={17} y={25} width={5} height={14} rx={2.5} fill={HUB} />
          <rect x={42} y={25} width={5} height={14} rx={2.5} fill={HUB} />
        </g>
      );
  }
}

export function ExerciseIcon({
  name,
  className,
  size = "md",
}: {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const kind = iconKindFor(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.935_0.04_148)]",
        size === "sm" && "size-9 rounded-xl",
        size === "md" && "size-12",
        size === "lg" && "size-16 rounded-3xl",
        className,
      )}
    >
      <svg viewBox="-2 -2 68 66" className="size-[82%]">
        <Pose kind={kind} />
      </svg>
    </span>
  );
}

export function iconKinds(): IconKind[] {
  return [
    "squat", "goblet", "legpress", "legext", "legcurl", "lunge", "deadlift", "calf", "bridge",
    "bench", "incline", "chestpress", "fly", "cablefly", "pushup", "press", "lateral", "facepull",
    "pulldown", "pullup", "row", "bentrow", "hyperext", "curl", "pushdown", "dips", "plank",
    "sideplank", "crunch", "legraise", "twist", "abductor", "adductor", "shrug", "generic",
  ];
}
