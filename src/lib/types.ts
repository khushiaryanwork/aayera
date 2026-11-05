export type Img = { src: string; alt: string };
export type Link = { label: string; href: string };

export type Slide = { image: Img; tag: string; title: string; short?: string; meta: string };
export type MosaicTile = { image: Img; caption: string };
export type EventCard = { image: Img; tag: string; title: string; meta: string };
export type Stat = { value: number; suffix: string; label: string; image: Img | null };
export type WallTile = { image: Img; full: string; ratio: string; caption: string };
export type Industry = { name: string; text: string; count: string; image: Img | null };
export type Logo = { src: string; alt: string; plain: boolean };
export type Button = Link & { style: 'gold' | 'ghost' };

export interface Site {
  title: string;
  description: string;
  shareImage: string | null;
  logo: Img;
  nav: Link[];
  navCta: Link;
  email: string;
  phones: { label: string; number: string }[];
  address: string;
}

export interface Home {
  hero: {
    eyebrow: string;
    heading: string;
    primaryCta: Link;
    secondaryCta: Link;
    slideCta: Link;
    slides: Slide[];
    mosaic: MosaicTile[];
  };
  marquee: { text: string; serif?: boolean }[];
  events: { heading: string; intro: string; items: EventCard[] };
  statement: { image: Img | null; words: string[] };
  stats: Stat[];
  moments: { eyebrow: string; heading: string; tiles: WallTile[] };
  industries: { eyebrow: string; heading: string; items: Industry[] };
  filmstrip: Img[];
  clients: { eyebrow: string; heading: string; intro: string; logos: Logo[] };
  cta: { eyebrow: string; heading: string; image: Img | null; buttons: Button[] };
}
