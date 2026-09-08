const {onCall, onRequest, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {setGlobalOptions} = require("firebase-functions/v2/options");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

// Region muss mit firebase.ts (europe-west1) übereinstimmen
setGlobalOptions({region: "europe-west1", cors: true});

const db = () => admin.firestore();

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login erforderlich.");
  }
  return request.auth;
}

function requireVerifiedEmail(request) {
  const auth = requireAuth(request);
  // Email/Password-User müssen verifiziert sein; Google-User sind es i.d.R. bereits.
  if (auth.token && auth.token.email && auth.token.email_verified === false) {
    throw new HttpsError("permission-denied", "Bitte zuerst E-Mail verifizieren.");
  }
  return auth;
}

function parseVote(value) {
  if (value !== 1 && value !== -1 && value !== "like" && value !== "dislike") {
    throw new HttpsError("invalid-argument", "value muss 1/-1 bzw. like/dislike sein.");
  }
  if (value === "like") return 1;
  if (value === "dislike") return -1;
  return value;
}

/**
 * Cross-Domain Custom Token (SSO). Callback-URLs werden clientseitig auf Allowlist geprüft.
 */
exports.generateCrossDomainToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The user must be authenticated to generate a cross-domain token.");
  }
  const uid = request.auth.uid;
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    return {token: customToken};
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw new HttpsError("internal", "Unable to generate token. Check IAM permissions and API enablement.", error);
  }
});

/**
 * Global Logout: revoke + Signal in logoutSignals (neu) + legacy users.lastLogoutAt für Migration.
 */
exports.globalSignOut = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in to sign out globally.");
  }
  const uid = request.auth.uid;
  try {
    await admin.auth().revokeRefreshTokens(uid);
    const payload = {lastLogoutAt: admin.firestore.FieldValue.serverTimestamp()};
    await db().collection("logoutSignals").doc(uid).set(payload, {merge: true});
    // Legacy-Pfad für alte Clients (wird nach Migration entfernt)
    await db().collection("users").doc(uid).set(payload, {merge: true}).catch(() => {});
    return {success: true};
  } catch (error) {
    console.error("Global SignOut Error:", error);
    throw new HttpsError("internal", "Could not revoke tokens.");
  }
});

/**
 * Vote für Posts — EINZIGER Schreibweg für likesCount/dislikesCount (Client-Rules verbieten Counter-Writes).
 * Body: { postId: string, value: 1 | -1 | 'like' | 'dislike' }
 */
exports.votePost = onCall({enforceAppCheck: false}, async (request) => {
  const auth = requireVerifiedEmail(request);
  const {postId, value} = request.data || {};
  if (!postId || typeof postId !== "string") throw new HttpsError("invalid-argument", "postId erforderlich.");
  const val = parseVote(value);
  const uid = auth.uid;
  const postRef = db().collection("posts").doc(postId);
  const voteRef = postRef.collection("votes").doc(uid);
  try {
    const result = await db().runTransaction(async (tx) => {
      const [voteSnap, postSnap] = await Promise.all([tx.get(voteRef), tx.get(postRef)]);
      if (!postSnap.exists) throw new HttpsError("not-found", "Post nicht gefunden.");
      const post = postSnap.data() || {};
      let likes = post.likesCount || 0;
      let dislikes = post.dislikesCount || 0;
      let userVote = null;
      if (voteSnap.exists) {
        const old = voteSnap.data().value;
        if (old === val) {
          tx.delete(voteRef);
          if (val === 1) likes--; else dislikes--;
        } else {
          tx.set(voteRef, {value: val, updatedAt: admin.firestore.FieldValue.serverTimestamp()}, {merge: true});
          if (val === 1) { likes++; dislikes--; } else { dislikes++; likes--; }
          userVote = val === 1 ? "like" : "dislike";
        }
      } else {
        tx.set(voteRef, {value: val, updatedAt: admin.firestore.FieldValue.serverTimestamp()});
        if (val === 1) likes++; else dislikes++;
        userVote = val === 1 ? "like" : "dislike";
      }
      tx.update(postRef, {likesCount: Math.max(0, likes), dislikesCount: Math.max(0, dislikes)});
      return {likesCount: Math.max(0, likes), dislikesCount: Math.max(0, dislikes), userVote};
    });
    return result;
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    console.error("votePost failed", e);
    throw new HttpsError("internal", "Voting fehlgeschlagen.");
  }
});

/**
 * Vote für Comments. Body: { postId, commentId, value }
 */
exports.voteComment = onCall({enforceAppCheck: false}, async (request) => {
  const auth = requireVerifiedEmail(request);
  const {postId, commentId, value} = request.data || {};
  if (!postId || !commentId) throw new HttpsError("invalid-argument", "postId + commentId erforderlich.");
  const val = parseVote(value);
  const uid = auth.uid;
  const commentRef = db().collection("posts").doc(postId).collection("comments").doc(commentId);
  const voteRef = commentRef.collection("votes").doc(uid);
  try {
    const result = await db().runTransaction(async (tx) => {
      const [voteSnap, cSnap] = await Promise.all([tx.get(voteRef), tx.get(commentRef)]);
      if (!cSnap.exists) throw new HttpsError("not-found", "Kommentar nicht gefunden.");
      const c = cSnap.data() || {};
      let likes = c.likesCount || 0;
      let dislikes = c.dislikesCount || 0;
      let userVote = null;
      if (voteSnap.exists) {
        const old = voteSnap.data().value;
        if (old === val) {
          tx.delete(voteRef);
          if (val === 1) likes--; else dislikes--;
        } else {
          tx.set(voteRef, {value: val, updatedAt: admin.firestore.FieldValue.serverTimestamp()}, {merge: true});
          if (val === 1) { likes++; dislikes--; } else { dislikes++; likes--; }
          userVote = val === 1 ? "like" : "dislike";
        }
      } else {
        tx.set(voteRef, {value: val, updatedAt: admin.firestore.FieldValue.serverTimestamp()});
        if (val === 1) likes++; else dislikes++;
        userVote = val === 1 ? "like" : "dislike";
      }
      tx.update(commentRef, {likesCount: Math.max(0, likes), dislikesCount: Math.max(0, dislikes)});
      return {likesCount: Math.max(0, likes), dislikesCount: Math.max(0, dislikes), userVote};
    });
    return result;
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    console.error("voteComment failed", e);
    throw new HttpsError("internal", "Voting fehlgeschlagen.");
  }
});

/**
 * Profil-Update mit serverseitigem 24h-Cooldown (ersetzt Client-Direkt-Write).
 * Body: { displayName?, photoURL? } — nur geänderte Felder werden geprüft.
 */
exports.updateProfileWithCooldown = onCall({enforceAppCheck: false}, async (request) => {
  const auth = requireVerifiedEmail(request);
  const {displayName, photoURL} = request.data || {};
  if (displayName !== undefined && (typeof displayName !== "string" || displayName.trim().length < 1 || displayName.length > 40)) {
    throw new HttpsError("invalid-argument", "displayName 1..40 Zeichen.");
  }
  if (photoURL !== undefined && photoURL !== "" && (typeof photoURL !== "string" || photoURL.length > 2048)) {
    throw new HttpsError("invalid-argument", "photoURL ungültig.");
  }
  const uid = auth.uid;
  const userRef = db().collection("users").doc(uid);
  const snap = await userRef.get();
  const data = snap.exists ? snap.data() : {};
  const now = Date.now();
  const COOLDOWN = 24 * 3600 * 1000;
  const updates = {};
  // Name
  if (displayName !== undefined && displayName !== data.displayName) {
    const last = data.lastUsernameUpdate ? data.lastUsernameUpdate.toMillis() : 0;
    if (now - last < COOLDOWN) throw new HttpsError("failed-precondition", "Name-Cooldown aktiv (24h).");
    updates.displayName = displayName.trim();
    updates.lastUsernameUpdate = admin.firestore.FieldValue.serverTimestamp();
  }
  // Avatar
  if (photoURL !== undefined && photoURL !== (data.photoURL || "")) {
    const last = data.lastAvatarUpdate ? data.lastAvatarUpdate.toMillis() : 0;
    if (now - last < COOLDOWN) throw new HttpsError("failed-precondition", "Avatar-Cooldown aktiv (24h).");
    updates.photoURL = photoURL;
    updates.lastAvatarUpdate = admin.firestore.FieldValue.serverTimestamp();
  }
  if (Object.keys(updates).length === 0) return {updated: false};
  updates.uid = uid;
  await admin.auth().updateUser(uid, {
    ...(updates.displayName ? {displayName: updates.displayName} : {}),
    ...(updates.photoURL !== undefined ? {photoURL: updates.photoURL} : {}),
  }).catch((e) => console.warn("Auth profile sync warn", e));
  await userRef.set(updates, {merge: true});
  return {updated: true};
});

/**
 * Kommentar-Trigger: validiert Länge, reichert Autor-Daten an (Denormalisierung spart N+1 Reads).
 */
exports.onCommentCreated = onDocumentCreated("posts/{postId}/comments/{commentId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const data = snap.data() || {};
  const text = typeof data.text === "string" ? data.text.trim().slice(0, 5000) : "";
  if (!text || !data.userId) {
    await snap.ref.delete().catch(() => {});
    return;
  }
  const patch = {};
  if (data.text !== text) patch.text = text;
  if (!data.authorName || !data.authorPhotoURL) {
    try {
      const u = await db().collection("users").doc(data.userId).get();
      if (u.exists) {
        const ud = u.data() || {};
        if (!data.authorName && ud.displayName) patch.authorName = ud.displayName;
        if (!data.authorPhotoURL && ud.photoURL) patch.authorPhotoURL = ud.photoURL;
      }
    } catch (e) {
      console.warn("author enrich failed", e);
    }
  }
  if (Object.keys(patch).length) await snap.ref.set(patch, {merge: true}).catch(() => {});
});

/**
 * Host-aware Sitemap mit Image-Namespace (Cover für LCP/SEO).
 */
exports.sitemap = onRequest(async (req, res) => {
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "ronnixentertainment.de";
    const cleanHost = String(host).replace("www.", "").toLowerCase();
    const baseUrl = `https://${host}`;
    const DOMAIN_CATEGORY_MAP = {
      "ronnixcomix.de": "comics",
      "ronnixboox.de": "books",
      "lamazgamez.de": "games",
      "ronnixmoviez.de": "movies",
      "ronnixseriez.de": "series",
    };
    const filterCategory = DOMAIN_CATEGORY_MAP[cleanHost];
    let query = admin.firestore().collection("posts").where("publishedAt", "<=", new Date()).orderBy("publishedAt", "desc");
    if (filterCategory) query = query.where("category", "==", filterCategory);
    const postsSnapshot = await query.get();
    const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
    let staticPages = ["/"];
    if (!filterCategory) {
      staticPages.push("/news", "/contact", "/impressum", "/datenschutz", "/comix", "/boox", "/gamez", "/moviez", "/seriez");
    }
    staticPages.forEach((page) => {
      xml += `\n<url><loc>${baseUrl}${page}</loc><changefreq>weekly</changefreq><priority>${page === "/" ? "1.0" : "0.8"}</priority></url>`;
    });
    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      const lastModDate = data.updatedAt ? data.updatedAt.toDate() : (data.publishedAt ? data.publishedAt.toDate() : new Date());
      const title = data.title || doc.id;
      const img = data.coverUrl && typeof data.coverUrl === "string" && data.coverUrl.startsWith("http") ? data.coverUrl : null;
      xml += `\n<url><loc>${baseUrl}/post/${doc.id}</loc><lastmod>${lastModDate.toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority>`;
      if (img) xml += `<image:image><image:loc>${esc(img)}</image:loc><image:title>${esc(title)}</image:title></image:image>`;
      xml += `</url>`;
    });
    xml += `</urlset>`;
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600, s-maxage=7200");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});
