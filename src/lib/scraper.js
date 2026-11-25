import puppeteer from 'puppeteer';

/**
 * Helper to fetch a website and extract email addresses (mailto: or regex)
 */
async function extractEmailFromWebsite(url, browser) {
  if (!url || !url.startsWith('http')) return '';
  let page = null;
  try {
    page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    // Fast abort heavy assets
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });

    const email = await page.evaluate(() => {
      // 1. Look for mailto links
      const mailto = document.querySelector('a[href^="mailto:"]');
      if (mailto) {
        const mail = mailto.getAttribute('href').replace('mailto:', '').split('?')[0].trim();
        if (mail && mail.includes('@')) return mail;
      }

      // 2. Scan text for email regex
      const text = document.body ? document.body.innerText : '';
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
      const matches = text.match(emailRegex);
      if (matches && matches.length > 0) {
        // Filter out junk image formats mistakenly matched
        const valid = matches.find((m) => !m.endsWith('.png') && !m.endsWith('.jpg') && !m.endsWith('.webp') && !m.includes('sentry') && !m.includes('example.com'));
        if (valid) return valid;
      }
      return '';
    });

    await page.close();
    return email || '';
  } catch {
    if (page) await page.close().catch(() => {});
    return '';
  }
}

/**
 * Scrapes Google Maps search results for a given query (e.g. "Dental Clinic in Rohini, Delhi")
 */
export async function scrapeGoogleMaps(query, maxResults = 30) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,900',
        '--lang=en-US,en',
      ],
    });

    const page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

    // Handle Consent dialog
    try {
      const consentBtn = await page.$('button[aria-label="Accept all"], form[action*="consent"] button');
      if (consentBtn) {
        await consentBtn.click();
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 4000 }).catch(() => {});
      }
    } catch {}

    // Wait for feed container
    await page.waitForSelector('div[role="feed"], div[role="main"]', { timeout: 15000 }).catch(() => {});

    // Scroll dynamically based on maxResults requested
    const scrollRounds = Math.min(Math.ceil(maxResults / 5) + 3, 25);
    await page.evaluate(async (maxItems, rounds) => {
      const feed = document.querySelector('div[role="feed"]');
      if (!feed) return;

      let lastHeight = 0;
      let idleCount = 0;
      for (let i = 0; i < rounds; i++) {
        feed.scrollTop = feed.scrollHeight;
        await new Promise((resolve) => setTimeout(resolve, 1400));
        const items = feed.querySelectorAll('div[role="article"], a[href*="/maps/place/"]');
        if (items.length >= maxItems) break;
        if (feed.scrollHeight === lastHeight) {
          idleCount++;
          if (idleCount >= 3) break;
        } else {
          idleCount = 0;
        }
        lastHeight = feed.scrollHeight;
      }
    }, maxResults, scrollRounds);

    // Extract listing basic data
    const rawListings = await page.evaluate((maxItems) => {
      const listings = [];
      const articles = Array.from(document.querySelectorAll('div[role="article"]'));

      for (const el of articles) {
        if (listings.length >= maxItems) break;

        // Title
        const titleEl = el.querySelector('div.fontHeadlineSmall, [class*="qBF1Pd"], h3');
        const title = titleEl ? titleEl.textContent.trim() : '';
        if (!title) continue;

        // GMB Link
        const linkEl = el.querySelector('a[href*="/maps/place/"]');
        const gmbUrl = linkEl ? linkEl.getAttribute('href') : '';

        // Rating & Reviews
        let rating = 0;
        let reviewsCount = 0;
        const ratingEl = el.querySelector('span[role="img"], span.MW4etd');
        if (ratingEl) {
          const aria = ratingEl.getAttribute('aria-label') || ratingEl.textContent || '';
          const matchRating = aria.match(/([0-9.]+)\s*(?:stars|out of 5)?/i);
          if (matchRating) rating = parseFloat(matchRating[1]) || 0;
        }

        const reviewEl = el.querySelector('span.UY7F9, span[aria-label*="reviews"]');
        if (reviewEl) {
          const countMatch = reviewEl.textContent.replace(/[(),]/g, '').match(/\d+/);
          if (countMatch) reviewsCount = parseInt(countMatch[0], 10);
        }

        // Category & Address
        const textLines = Array.from(el.querySelectorAll('div.W4Efsd, div[class*="W4Efsd"]'))
          .map((d) => d.textContent.trim())
          .filter(Boolean);

        let category = '';
        let address = '';

        if (textLines.length > 0) {
          const parts = textLines[0].split('·').map((p) => p.trim());
          if (parts.length > 0 && !parts[0].match(/\d/)) {
            category = parts[0];
          }
        }
        if (textLines.length > 1) {
          address = textLines[1];
        }

        // Full Phone Extraction from all spans and text
        let phone = '';
        const allSpans = Array.from(el.querySelectorAll('span, div'));
        for (const span of allSpans) {
          const text = span.textContent.trim();
          // Regex for full 10-12 digit phone numbers: e.g. 098111 22334, +91 98111 22334, 011 2788 9900, 9876543210
          const match = text.match(/(?:(?:\+91|0)[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|(?:0\d{2,4}[\s-]?)?\d{6,8}/);
          if (match && match[0].replace(/\D/g, '').length >= 10) {
            phone = match[0].trim();
            break;
          }
        }

        // Website Button Detection
        let website = '';
        const websiteBtn = el.querySelector('a[data-value="Website"], a[aria-label*="website"], a[href^="http"]:not([href*="google.com"]):not([href*="goo.gl"])');
        if (websiteBtn) {
          website = websiteBtn.getAttribute('href') || '';
        }

        const hasWebsite = Boolean(website && website.length > 4 && !website.includes('google.com/maps'));

        // Lead Opportunity calculation
        let leadScore = 50;
        let priority = 'MEDIUM';

        if (!hasWebsite) {
          leadScore += 35; // Prime opportunity to sell website!
          if (phone) leadScore += 15; // Directly contactable
          priority = 'HIGH';
        } else {
          if (rating > 0 && rating < 4.0) leadScore += 15;
          if (reviewsCount < 10) leadScore += 10;
          if (leadScore < 60) priority = 'LOW';
        }

        listings.push({
          title,
          gmbUrl,
          hasGmb: Boolean(gmbUrl),
          rating,
          reviewsCount,
          category,
          address,
          phone,
          website: hasWebsite ? website : '',
          hasWebsite,
          leadScore: Math.min(leadScore, 100),
          priority,
        });
      }

      return listings;
    }, maxResults);

    await page.close();

    // Now extract emails for businesses with websites (in parallel batch of up to 5)
    for (let i = 0; i < rawListings.length; i++) {
      if (rawListings[i].hasWebsite && rawListings[i].website) {
        try {
          rawListings[i].email = await extractEmailFromWebsite(rawListings[i].website, browser);
        } catch {
          rawListings[i].email = '';
        }
      } else {
        rawListings[i].email = '';
      }
    }

    await browser.close();
    return rawListings;
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error('Error in scrapeGoogleMaps:', error);
    throw error;
  }
}
