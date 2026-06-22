import { siteConfig } from '../config/site';

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      init: (key: string, options?: Record<string, unknown>) => void;
    };
  }
}

type AnalyticsContext = {
  pagePath: string;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
};

function readUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') ?? '',
    utm_medium: params.get('utm_medium') ?? '',
    utm_campaign: params.get('utm_campaign') ?? '',
    utm_content: params.get('utm_content') ?? '',
    utm_term: params.get('utm_term') ?? '',
  };
}

function deriveSessionSource(referrer: string, utmSource: string): string {
  if (utmSource) {
    return utmSource.toLowerCase();
  }

  if (!referrer) {
    return 'direct';
  }

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('youtube') || host.includes('youtu.be')) {
      return 'youtube';
    }
    if (host.includes('google')) {
      return 'organic_search';
    }
    if (host.includes('facebook') || host.includes('instagram') || host.includes('twitter') || host.includes('x.com')) {
      return 'organic_social';
    }
    return 'referral';
  } catch {
    return 'unknown';
  }
}

function baseProperties(context: AnalyticsContext): Record<string, string> {
  const utm = readUtmParams();
  return {
    page_path: context.pagePath,
    page_url: context.pageUrl,
    page_title: context.pageTitle,
    referrer: context.referrer,
    ...utm,
    session_source: deriveSessionSource(context.referrer, utm.utm_source),
    site_version: siteConfig.siteVersion,
  };
}

function capture(event: string, properties: Record<string, unknown>): void {
  if (!window.posthog) {
    return;
  }

  window.posthog.capture(event, properties);
}

export function initAnalytics(): void {
  const posthogKey = import.meta.env.PUBLIC_POSTHOG_KEY;
  const posthogHost = import.meta.env.PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  if (!posthogKey || !window.posthog) {
    return;
  }

  window.posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
  });

  const context: AnalyticsContext = {
    pagePath: window.location.pathname,
    pageUrl: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer,
  };

  capture('page_view', baseProperties(context));
}

export function trackCtaClick(details: {
  ctaId: string;
  ctaLabel: string;
  ctaVariant: 'primary' | 'secondary' | 'text_link';
  ctaLocation: string;
  destinationType: 'form' | 'internal_page' | 'external_channel' | 'download';
  destinationUrl: string;
}): void {
  const context: AnalyticsContext = {
    pagePath: window.location.pathname,
    pageUrl: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer,
  };

  capture('cta_click', {
    ...baseProperties(context),
    cta_id: details.ctaId,
    cta_label: details.ctaLabel,
    cta_variant: details.ctaVariant,
    cta_location: details.ctaLocation,
    destination_type: details.destinationType,
    destination_url: details.destinationUrl,
  });
}

let formStarted = false;

export function trackLeadFormStarted(details: {
  formId: string;
  formLocation: string;
  offerId: string;
}): void {
  if (formStarted) {
    return;
  }

  formStarted = true;

  const context: AnalyticsContext = {
    pagePath: window.location.pathname,
    pageUrl: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer,
  };

  capture('lead_form_started', {
    ...baseProperties(context),
    form_id: details.formId,
    form_location: details.formLocation,
    offer_id: details.offerId,
  });
}

export function trackLeadFormSubmitted(details: {
  formId: string;
  formLocation: string;
  offerId: string;
  submissionResult: 'success' | 'error';
}): void {
  const context: AnalyticsContext = {
    pagePath: window.location.pathname,
    pageUrl: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer,
  };

  capture('lead_form_submitted', {
    ...baseProperties(context),
    form_id: details.formId,
    form_location: details.formLocation,
    offer_id: details.offerId,
    submission_result: details.submissionResult,
  });
}
