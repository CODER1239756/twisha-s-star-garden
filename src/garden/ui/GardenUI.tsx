import { useProgress } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Send, Settings2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gardenAudio } from "../audio";
import type { QualityLevel, TimeOfDay } from "../config";
import { useGarden } from "../store";

function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={`sprig text-primary ${className}`} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M60 155 C58 120 62 80 60 20" />
      <path d="M60 120 C45 112 36 100 34 86 C48 90 57 102 60 120" />
      <path d="M60 96 C75 88 84 76 86 62 C72 66 63 78 60 96" />
      <path d="M60 70 C48 62 42 52 41 40 C52 44 58 56 60 70" />
      <path d="M60 20 C54 14 54 6 60 2 C66 6 66 14 60 20" />
    </svg>
  );
}

export function EntryScreen() {
  const { progress, active } = useProgress();
  const entered = useGarden((s) => s.entered);
  const enter = useGarden((s) => s.enter);
  const [leaving, setLeaving] = useState(false);
  const ready = !active && progress >= 100;
  if (entered) return null;
  return (
    <div
      className={`fixed inset-0 z-30 flex flex-col items-center justify-center bg-background px-6 text-center transition-opacity duration-1000 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 30%, var(--color-secondary) 0%, transparent 60%)" }}
    >
      <Sprig className="mb-6 h-28 w-20" />
      <h1 className="font-serif text-5xl font-medium uppercase text-foreground sm:text-7xl">Twisha</h1>
      <p className="mt-4 max-w-sm font-serif text-lg italic text-muted-foreground">
        a little place for the things that grow
      </p>
      <p className="mt-3 font-serif text-sm text-muted-foreground">05.11</p>
      <div className="mt-10 h-14">
        {ready ? (
          <Button
            type="button"
            onClick={() => {
              setLeaving(true);
              setTimeout(enter, 1000);
            }}
            variant="ghost"
            className="glass h-auto rounded-full px-10 py-3 font-serif text-lg text-foreground transition hover:scale-105"
          >
            ENTER THE GARDEN
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Preparing a little world…</p>
            <div className="h-px w-48 overflow-hidden bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThoughtInput() {
  const [text, setText] = useState("");
  const [detaching, setDetaching] = useState<string | null>(null);
  const plant = useGarden((s) => s.plantThought);
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSubmit = text.trim().length > 0 && !detaching;
  const submit = () => {
    const v = text.trim();
    if (!v || !ref.current || detaching) return;
    const r = ref.current.getBoundingClientRect();
    const nx = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
    // the node rises a little above the glass before entering the world
    const ny = -(((r.top - 40) / window.innerHeight) * 2 - 1);
    setDetaching(v);
    setText("");
    gardenAudio.chime();
    const reduced = useGarden.getState().settings.reducedMotion;
    setTimeout(() => {
      plant(v, [nx, ny]);
      setDetaching(null);
    }, reduced ? 150 : 900);
  };
  return (
    <div className="pointer-events-auto glass relative mx-auto flex w-full max-w-lg items-end gap-2 rounded-3xl px-5 py-3 transition-shadow focus-within:ring-2 focus-within:ring-primary/40 focus-within:shadow-lg">
      {detaching && (
        <div aria-hidden className="thought-detach pointer-events-none absolute inset-x-5 top-3 flex items-center justify-center">
          <span className="thought-detach-text truncate font-serif text-lg text-foreground">{detaching}</span>
          <span className="thought-detach-node absolute h-3 w-3 rounded-full bg-glow" />
        </div>
      )}
      <textarea
        ref={ref}
        value={text}
        maxLength={280}
        rows={1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={detaching ? "" : "Feed the plant with your imagination..."}
        aria-label="Write a thought and press Enter to plant it"
        className="min-h-8 max-h-32 w-full resize-none bg-transparent py-1 font-serif text-lg text-foreground outline-none placeholder:italic placeholder:text-muted-foreground"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Plant thought"
        title="Plant thought"
        disabled={!canSubmit}
        onClick={submit}
        className="mb-0.5 shrink-0 rounded-full text-primary"
      >
        <Send aria-hidden="true" />
      </Button>
    </div>
  );
}

function ThoughtCard() {
  const t = useGarden((s) => s.thoughts.find((x) => x.id === s.selectedId));
  const select = useGarden((s) => s.select);
  if (!t) return null;
  return (
    <div className="pointer-events-auto glass absolute left-1/2 top-24 w-[min(90vw,24rem)] -translate-x-1/2 rounded-3xl p-6 text-center">
      <p className="font-serif text-xl leading-snug text-foreground">“{t.text}”</p>
      <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
        planted {new Date(t.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long" })}
      </p>
        <Button variant="link" onClick={() => select(null)} className="mt-4 h-auto p-0 text-sm">
        close
        </Button>
    </div>
  );
}

const Chip = ({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) => (
  <Button variant={on ? "default" : "ghost"} onClick={onClick} className="h-8 rounded-full px-3 text-sm capitalize">
    {children}
  </Button>
);

function Settings() {
  const [open, setOpen] = useState(false);
  const s = useGarden((x) => x.settings);
  const update = useGarden((x) => x.updateSettings);
  useEffect(() => gardenAudio.setRain(s.weather === "rain"), [s.weather]);
  return (
    <div className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={s.audio ? "Mute sound" : "Play sound"}
          title={s.audio ? "Mute sound" : "Play sound"}
          onClick={() => {
            gardenAudio.setEnabled(!s.audio);
            update({ audio: !s.audio });
          }}
          className="glass rounded-full text-foreground"
        >
          {s.audio ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} className="glass rounded-full text-foreground" aria-expanded={open} aria-label={open ? "Close garden settings" : "Open garden settings"} title="Garden settings">
          <Settings2 aria-hidden="true" />
        </Button>
      </div>
      {open && (
        <div className="glass w-72 space-y-4 rounded-3xl p-5">
          <Group label="Time of day">
            {(["morning", "afternoon", "evening", "night"] as TimeOfDay[]).map((t) => (
              <Chip key={t} on={s.timeOfDay === t} onClick={() => update({ timeOfDay: t })}>{t}</Chip>
            ))}
          </Group>
          <Group label="Weather">
            <Chip on={s.weather === "clear"} onClick={() => update({ weather: "clear" })}>clear</Chip>
            <Chip on={s.weather === "rain"} onClick={() => update({ weather: "rain" })}>rain</Chip>
          </Group>
          <Group label="Quality">
            {(["mobile", "balanced", "high"] as QualityLevel[]).map((q) => (
              <Chip key={q} on={s.quality === q} onClick={() => update({ quality: q })}>{q === "mobile" ? "light" : q}</Chip>
            ))}
          </Group>
          <Group label="Motion">
            <Chip on={!s.reducedMotion} onClick={() => update({ reducedMotion: false })}>full</Chip>
            <Chip on={s.reducedMotion} onClick={() => update({ reducedMotion: true })}>reduced</Chip>
          </Group>
        </div>
      )}
    </div>
  );
}

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-1.5 font-serif text-sm italic text-muted-foreground">{label}</p>
    <div className="flex flex-wrap gap-1">{children}</div>
  </div>
);

export function GardenOverlay() {
  const entered = useGarden((s) => s.entered);
  const count = useGarden((s) => s.thoughts.length);
  const selected = useGarden((s) => s.selectedId !== null);
  if (!entered) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <div aria-hidden="true" className={`absolute inset-0 bg-foreground/20 transition-opacity duration-700 ${selected ? "opacity-100" : "opacity-0"}`} />
      <div className="absolute left-4 top-4 rounded-full border border-border/50 bg-background/20 px-4 py-2 backdrop-blur-sm">
        <p className="font-serif text-xl text-foreground drop-shadow-sm">Twisha's Garden</p>
        <p className="text-xs text-muted-foreground">{count === 0 ? "a quiet little garden" : `${count} thought${count > 1 ? "s" : ""} growing`}</p>
      </div>
      <Settings />
      <ThoughtCard />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <ThoughtInput />
      </div>
    </div>
  );
}
