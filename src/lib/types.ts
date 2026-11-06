export type Img = { src: string; alt: string };
export type Link = { label: string; href: string };
export type NavItem = Link & { children?: Link[] };

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
  nav: NavItem[];
  navCta: Link;
  email: string;
  phones: { label: string; number: string }[];
  address: string;
  hours: string;
  mapQuery: string;
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

export type EventItem = { title: string; tag: string; date: string; location: string; summary: string; website: string; image: Img | null; upcoming: boolean };

type SectionBase = { eyebrow: string; heading: string; intro: string };
export type Section =
  | (SectionBase & { _type: 'textSection'; paragraphs: string[]; chipsLabel: string; chips: string[]; image: Img | null })
  | (SectionBase & { _type: 'groupsSection'; groups: { title: string; items: string[] }[] })
  | (SectionBase & { _type: 'listSection'; items: string[] })
  | (SectionBase & { _type: 'featuresSection'; items: { title: string; text: string; image: Img | null }[] })
  | (SectionBase & { _type: 'linkCardsSection'; cards: { title: string; text: string; href: string; image: Img | null }[] })
  | (SectionBase & { _type: 'eventsSection'; showSummaries: boolean })
  | (SectionBase & { _type: 'clientsSection' })
  | (SectionBase & { _type: 'contactSection'; formHeading: string });

export interface Page {
  slug: string;
  title: string;
  description: string;
  showCta: boolean;
  hero: { eyebrow: string; heading: string; intro: string; image: Img | null };
  sections: Section[];
}
