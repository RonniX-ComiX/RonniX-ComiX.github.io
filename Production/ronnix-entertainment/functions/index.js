
const {onCall, onRequest, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2/options");
const admin = require("firebase-admin");

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Set Global Options (Region)
// IMPORTANT: This must match the region in your firebase.ts (europe-west1)
setGlobalOptions({region: "europe-west1", cors: true});

/**
 * Generates a Cross-Domain Custom Token for the currently logged-in user.
 * This token can be used to sign in on another domain sharing the same Project.
 */
exports.generateCrossDomainToken = onCall(async (request) => {
  // 1. Verify Authentication
  // In V2, auth context is available on request.auth
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "The user must be authenticated to generate a cross-domain token.",
    );
  }

  const uid = request.auth.uid;

  try {
    // 2. Create Custom Token
    // REQUIRES: "IAM Service Account Credentials API" enabled in Google Cloud
    const customToken = await admin.auth().createCustomToken(uid);
    return {token: customToken};
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw new HttpsError(
        "internal",
        "Unable to generate token. Check IAM permissions and API enablement.",
        error
    );
  }
});

/**
 * Revokes all refresh tokens for the user AND updates Firestore.
 * This signals all active clients to log out immediately.
 */
exports.globalSignOut = onCall(async (request) => {
  if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in to sign out globally.');
  }

  const uid = request.auth.uid;

  try {
      // 1. Revoke all refresh tokens (Server-side security)
      await admin.auth().revokeRefreshTokens(uid);

      // 2. Set a flag in Firestore (Client-side realtime signal)
      // This allows other domains to "see" the logout immediately via onSnapshot
      await admin.firestore().collection('users').doc(uid).set({
          lastLogoutAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true };
  } catch (error) {
      console.error("Global SignOut Error:", error);
      throw new HttpsError('internal', 'Could not revoke tokens.');
  }
});

/**
 * INTELLIGENT SEO SITEMAP GENERATOR
 * Generates specific sitemaps based on the domain being accessed.
 * 
 * Logic:
 * - ronnixentertainment.de -> Shows ALL posts and ALL main links.
 * - ronnixcomix.de -> Shows ONLY 'comics' posts and relevant links.
 * - ronnixboox.de -> Shows ONLY 'books' posts and relevant links.
 * etc.
 */
exports.sitemap = onRequest(async (req, res) => {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'ronnixentertainment.de';
    // Remove 'www.' for matching logic
    const cleanHost = host.replace('www.', '').toLowerCase();
    
    const protocol = 'https';
    const baseUrl = `${protocol}://${host}`;

    // Map Domains to Firestore Categories
    const DOMAIN_CATEGORY_MAP = {
      'ronnixcomix.de': 'comics',
      'ronnixboox.de': 'books',
      'lamazgamez.de': 'games',
      'ronnixmoviez.de': 'movies',
      'ronnixseriez.de': 'series'
    };

    // Determine the specific category for this domain (undefined if main domain)
    const filterCategory = DOMAIN_CATEGORY_MAP[cleanHost];

    // --- 1. BUILD FIRESTORE QUERY ---
    let query = admin.firestore().collection('posts')
      .where('publishedAt', '<=', new Date())
      .orderBy('publishedAt', 'desc');

    // If we are on a niche domain, ONLY fetch posts for that category
    if (filterCategory) {
      query = query.where('category', '==', filterCategory);
    }

    const postsSnapshot = await query.get();

    // --- 2. START XML GENERATION ---
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // --- 3. DEFINE STATIC PAGES ---
    // Start with root page (Always included)
    let staticPages = ['/'];

    // If we are on the MAIN domain, we include global pages (news, contact, legal) and category hubs
    // For Sub-Domains, we omit these to avoid duplicate content in sitemaps and focus on the niche content
    if (!filterCategory) {
      staticPages.push(
        '/news',
        '/contact',
        '/impressum',
        '/datenschutz',
        '/comix', 
        '/boox', 
        '/gamez', 
        '/moviez', 
        '/seriez'
      );
    } 

    staticPages.forEach(page => {
      xml += `
      <url>
        <loc>${baseUrl}${page}</loc>
        <changefreq>weekly</changefreq>
        <priority>${page === '/' ? '1.0' : '0.8'}</priority>
      </url>`;
    });

    // --- 4. DYNAMIC POSTS ---
    postsSnapshot.forEach(doc => {
      const data = doc.data();
      
      const lastModDate = data.updatedAt ? data.updatedAt.toDate() : (data.publishedAt ? data.publishedAt.toDate() : new Date());
      const lastMod = lastModDate.toISOString();

      xml += `
      <url>
        <loc>${baseUrl}/post/${doc.id}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
      </url>`;
    });

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    // Set cache to 1 hour
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
    res.status(200).send(xml);

  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});
