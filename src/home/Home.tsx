import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Play, Microscope } from "lucide-react";
import SushiConveyorMenu from "@/components/ui/sushi-conveyor-menu";
import type { ConveyorDish } from "@/components/ui/sushi-conveyor-menu";

export interface HomeGame {
  id: string;
  title: string;
  sub: string;
  count: string;
  tier: 1 | 2 | 3 | 4 | 5;
  details: string[];
}

/** Every visible word on the belt, already in the chosen language. */
export interface HomeStrings {
  eyebrow: string;
  heading: string;
  caption: string;
  start: string;
  lab: string;
  legend: { [tier: number]: string };
  labels: { add: string; close: string; previous: string; next: string; pause: string };
}

export interface HomeProps {
  games: HomeGame[];
  images: Record<string, string>;
  strings: HomeStrings;
  onPlay: (id: string) => void;
  /** Called when a plate is opened, so its description can be read aloud. */
  onPeek?: (item: ConveyorDish) => void;
}

function Home({ games, images, strings, onPlay, onPeek }: HomeProps) {
  const pending = React.useRef<string | null>(null);
  const items: ConveyorDish[] = games.map((g) => ({
    id: g.id,
    name: g.title,
    description: g.sub,
    price: g.count,
    tier: g.tier,
    image: images[g.id] ?? "",
    details: g.details,
  }));

  return (
    <SushiConveyorMenu
      className="bg-transparent!"
      items={items}
      legend={strings.legend}
      eyebrow={strings.eyebrow}
      heading={strings.heading}
      caption={strings.caption}
      autoplay
      interval={3400}
      labels={strings.labels}
      onAdd={(item) => { pending.current = item.id; }}
      onOpenChange={(index) => {
        if (index !== null) { onPeek?.(items[index]); return; }
        if (pending.current) {
          const id = pending.current;
          pending.current = null;
          onPlay(id);
        }
      }}
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" data-tour="start" onClick={() => onPlay("elements")} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none transition-[translate,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <Play className="size-4" aria-hidden="true" />
            {strings.start}
          </button>
          <button type="button" data-tour="lab" onClick={() => onPlay("lab")} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none backdrop-blur transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <Microscope className="size-4" aria-hidden="true" />
            {strings.lab}
          </button>
        </div>
      }
    />
  );
}

/** Mounts the React home belt into a plain DOM element. Returns an unmount function. */
export function mountHome(el: HTMLElement, props: HomeProps): () => void {
  const root: Root = createRoot(el);
  root.render(<Home {...props} />);
  return () => root.unmount();
}
