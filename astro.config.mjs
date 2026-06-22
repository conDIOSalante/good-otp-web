// @ts-check
import { defineConfig } from 'astro/config';

const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://goodotp.com';

export default defineConfig({
  site: siteUrl,
  output: 'static',
});
