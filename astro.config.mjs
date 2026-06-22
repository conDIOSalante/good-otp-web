// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Actions passes empty strings when repo variables are unset; treat those as missing.
const siteUrl = process.env.PUBLIC_SITE_URL?.trim() || 'https://goodotp.com';

export default defineConfig({
  site: siteUrl,
  output: 'static',
});
