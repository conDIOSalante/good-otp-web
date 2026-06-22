export const siteConfig = {
  name: 'GOOD OTP',
  tagline: 'Quiet strength through Christ, discipline, and fitness.',
  description:
    'Practical mentorship for quiet Christians and veterans who want to grow spiritually, mentally, and physically without the noise.',
  siteVersion: 'v1-launch',
  primaryOffer: {
    id: 'newsletter_waitlist',
    title: 'Weekly direction and discipline support',
    ctaLabel: 'Join the list',
  },
  links: {
    privacy: '/privacy',
    thankYou: '/thank-you',
  },
} as const;

export type SiteConfig = typeof siteConfig;
