// The site's built-in pages, each with its own editor in the Studio (named tabs, one per section).
// Shared by the Studio schema (sanity/schemas/fixedPages.ts) and the site's content loader (src/lib/content.ts).
// A section field name always holds the same section type, whichever page it is on.
export const FIXED_PAGES = [
  { type: 'aboutPage', slug: 'about', title: 'About AAYERA', sections: [
    { name: 'whoWeAre', title: 'Who we are', type: 'textSection' },
    { name: 'purpose', title: 'Vision & mission', type: 'featuresSection' },
    { name: 'values', title: 'Values', type: 'featuresSection' },
    { name: 'approach', title: 'Our approach', type: 'textSection' },
    { name: 'verticals', title: 'Business verticals', type: 'verticalsSection' },
  ] },
  { type: 'businessVerticalsPage', slug: 'business-verticals', title: 'Business Verticals', sections: [
    { name: 'verticals', title: 'Our verticals', type: 'verticalsSection' },
    { name: 'capabilities', title: 'Supporting capabilities', type: 'groupsSection' },
  ] },
  { type: 'eventsConferencesPage', slug: 'business-verticals/events-conferences', title: 'Events & Conferences', parent: 'business-verticals', sections: [
    { name: 'overview', title: 'Overview', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
    { name: 'services', title: 'Our services', type: 'groupsSection' },
    { name: 'formats', title: 'Formats', type: 'listSection' },
    { name: 'platformLinks', title: 'Our platforms', type: 'linkCardsSection' },
  ] },
  { type: 'businessPlatformsPage', slug: 'business-verticals/business-platforms', title: 'Business Platforms', parent: 'business-verticals', sections: [
    { name: 'overview', title: 'Overview', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
    { name: 'networking', title: 'Networking', type: 'featuresSection' },
  ] },
  { type: 'exhibitionsExperiencesPage', slug: 'business-verticals/exhibitions-experiences', title: 'Exhibitions & Experiences', parent: 'business-verticals', sections: [
    { name: 'overview', title: 'Overview', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
  ] },
  { type: 'intelligenceResearchPage', slug: 'business-verticals/intelligence-research', title: 'Intelligence & Research', parent: 'business-verticals', sections: [
    { name: 'overview', title: 'Overview', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
  ] },
  { type: 'marketingCommunicationsPage', slug: 'business-verticals/marketing-communications', title: 'Marketing & Communications', parent: 'business-verticals', sections: [
    { name: 'overview', title: 'Overview', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
  ] },
  { type: 'corporateSolutionsPage', slug: 'business-verticals/corporate-solutions', title: 'Corporate Solutions', parent: 'business-verticals', sections: [
    { name: 'overview', title: 'Overview', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
  ] },
  { type: 'digitalCommercePage', slug: 'business-verticals/digital-commerce', title: 'Digital Commerce', parent: 'business-verticals', sections: [
    { name: 'overview', title: 'Overview', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
  ] },
  { type: 'academyPage', slug: 'business-verticals/academy', title: 'Academy & Professional Development', parent: 'business-verticals', sections: [
    { name: 'training', title: 'Training', type: 'textSection' },
    { name: 'offer', title: 'What we offer', type: 'listSection' },
    { name: 'categories', title: 'Training categories', type: 'groupsSection' },
    { name: 'courses', title: 'Courses', type: 'listSection' },
    { name: 'webinars', title: 'Webinars', type: 'textSection' },
    { name: 'webinarFeatures', title: 'Webinar features', type: 'featuresSection' },
  ] },
  { type: 'industriesPage', slug: 'industries', title: 'Industries', sections: [
    { name: 'industries', title: 'Industries', type: 'industriesSection' },
  ] },
  { type: 'ourPlatformsPage', slug: 'our-platforms', title: 'Our Platforms', sections: [
    { name: 'platforms', title: 'Flagship platforms', type: 'platformsSection' },
    { name: 'eventFormats', title: 'Event formats', type: 'featuresSection' },
    { name: 'events', title: 'Event track record', type: 'eventsSection' },
  ] },
  { type: 'clientsPage', slug: 'clients', title: 'Clients', sections: [
    { name: 'clients', title: 'Client logos', type: 'clientsSection' },
  ] },
  { type: 'contactPage', slug: 'contact', title: 'Contact', sections: [
    { name: 'contact', title: 'Contact details & form', type: 'contactSection' },
  ] },
]
export const FIXED_SLUGS = FIXED_PAGES.map((p) => p.slug)
