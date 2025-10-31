const functions = require("firebase-functions");
const {onCall, onRequest, HttpsError} =
  require("firebase-functions/v2/https");
const {onDocumentCreated} =
  require("firebase-functions/v2/firestore");
const {onSchedule} =
  require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {Resend} = require("resend");
const axios = require("axios");

// Initialize Firebase Admin
admin.initializeApp();

// Get environment variables (v2-ready).
// Prefer process.env; fallback to legacy config()
const getResendApiKey = () => {
  return process.env.RESEND_API_KEY || functions.config().resend?.api_key || "";
};

const getAppUrl = () => {
  return process.env.APP_URL || functions.config().app?.url ||
    "https://sviatoslavgladyshev.github.io/oyola-ai";
};

const getRapidApiKey = () => {
  return process.env.RAPIDAPI_KEY || functions.config().rapidapi?.key || "";
};

const getGoogleOAuthClientId = () => {
  return process.env.GOOGLE_OAUTH_CLIENT_ID ||
    functions.config().google?.oauth_client_id ||
    "";
};

const getGoogleOAuthClientSecret = () => {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
    functions.config().google?.oauth_client_secret ||
    "";
};

// Cities to rotate through for property searches
const TARGET_CITIES = [
  {name: "Los Angeles", state: "CA", location: "Los Angeles, CA"},
  {name: "Miami", state: "FL", location: "Miami, FL"},
  {name: "Phoenix", state: "AZ", location: "Phoenix, AZ"},
  {name: "Atlanta", state: "GA", location: "Atlanta, GA"},
  {name: "Dallas", state: "TX", location: "Dallas, TX"},
  {name: "Houston", state: "TX", location: "Houston, TX"},
  {name: "Las Vegas", state: "NV", location: "Las Vegas, NV"},
  {name: "Orlando", state: "FL", location: "Orlando, FL"},
  {name: "San Antonio", state: "TX", location: "San Antonio, TX"},
  {name: "Jacksonville", state: "FL", location: "Jacksonville, FL"},
  {name: "Charlotte", state: "NC", location: "Charlotte, NC"},
  {name: "Memphis", state: "TN", location: "Memphis, TN"},
  {name: "Nashville", state: "TN", location: "Nashville, TN"},
  {name: "Denver", state: "CO", location: "Denver, CO"},
  {name: "Indianapolis", state: "IN", location: "Indianapolis, IN"},
];

// Seller situation keywords to identify motivated sellers
// Used for reference and future enhancements
// eslint-disable-next-line no-unused-vars
const MOTIVATED_SELLER_KEYWORDS = [
  "motivated",
  "divorce",
  "foreclosure",
  "must sell",
  "quick sale",
  "inheritance",
  "estate sale",
  "relocating",
  "job transfer",
  "reduced",
  "price drop",
  "bank owned",
  "reo",
  "short sale",
  "as is",
  "fixer",
  "investor special",
];

/**
 * Helper function to send email via Gmail API
 * @param {string} buyerId - The buyer's user ID
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 */
const sendEmailViaGmail = async (buyerId, toEmail, subject, htmlBody) => {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(buyerId).get();

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const gmailData = userData?.gmail;

    if (!gmailData?.accessToken || !gmailData?.refreshToken) {
      throw new Error(
          "Gmail not connected. Please connect Gmail in your profile.",
      );
    }

    const {google} = require("googleapis");

    const oauth2Client = new google.auth.OAuth2(
        getGoogleOAuthClientId(),
        getGoogleOAuthClientSecret(),
        getAppUrl(),
    );

    // Helper function to refresh access token
    const refreshAccessToken = async () => {
      logger.info("Refreshing Gmail access token", {buyerId: buyerId});
      oauth2Client.setCredentials({
        refresh_token: gmailData.refreshToken,
      });

      const {credentials} = await oauth2Client.refreshAccessToken();

      // Update stored token in database
      const updatedGmailData = {
        ...gmailData,
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date ?
          new Date(credentials.expiry_date).toISOString() : null,
        connected: true,
        storedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("users").doc(buyerId).set({
        gmail: updatedGmailData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      // Update local gmailData for use below
      gmailData.accessToken = credentials.access_token;
      gmailData.expiryDate = updatedGmailData.expiryDate;

      // Set new credentials
      oauth2Client.setCredentials(credentials);

      logger.info("Gmail access token refreshed successfully", {
        buyerId: buyerId,
      });

      return credentials;
    };

    // Check if token is expired and refresh if needed
    const isExpired = !gmailData.expiryDate ||
        new Date(gmailData.expiryDate) < new Date();

    if (isExpired) {
      await refreshAccessToken();
    } else {
      // Set credentials with current token
      oauth2Client.setCredentials({
        access_token: gmailData.accessToken,
        refresh_token: gmailData.refreshToken,
      });
    }

    const gmail = google.gmail({version: "v1", auth: oauth2Client});

    // Get user's email address
    const profile = await gmail.users.getProfile({userId: "me"});
    const fromEmail = profile.data.emailAddress;

    // Create email message
    const message = [
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      htmlBody,
    ].join("\n");

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    // Send email with retry logic if token expires during send
    try {
      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      logger.info("Email sent successfully", {
        from: fromEmail,
        to: toEmail,
        subject: subject,
      });

      return {success: true, from: fromEmail};
    } catch (sendError) {
      // If token expired during send, refresh and retry once
      const isAuthError = sendError.code === 401 ||
          sendError.message?.includes("Invalid Credentials");
      if (isAuthError) {
        logger.warn(
            "Token expired during send, refreshing and retrying",
            {error: sendError.message},
        );

        // Refresh token
        await refreshAccessToken();

        // Retry sending
        const gmailRetry = google.gmail({version: "v1", auth: oauth2Client});
        await gmailRetry.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });

        logger.info("Email sent successfully after token refresh", {
          from: fromEmail,
          to: toEmail,
          subject: subject,
        });

        return {success: true, from: fromEmail};
      }
      throw sendError;
    }
  } catch (error) {
    logger.error("Error sending email via Gmail", error);
    throw error;
  }
};

/**
 * Cloud Function to send offer notifications to property owners
 * This function sends emails via Gmail API
 */
exports.sendOfferToOwners = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const buyerId = request.auth.uid;
    const {offers} = request.data;

    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      throw new HttpsError(
          "invalid-argument",
          "Offers array is required",
      );
    }

    logger.info("Processing offer submissions", {
      offerCount: offers.length,
      buyerId: buyerId,
    });

    const results = await Promise.all(
        offers.map(async (offer) => {
          try {
            const ownerEmail = offer.ownerEmail || "glsvyatoslav@gmail.com";
            const propertyAddress = offer.property?.address ||
                offer.property?.title || "Property";
            const offerAmount = offer.offerAmount ?
              `$${offer.offerAmount.toLocaleString()}` : "N/A";
            const propertyPrice = offer.property?.price ?
              `$${offer.property.price.toLocaleString()}` : "N/A";

            // Create HTML email body
            const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .offer-details { background: white; padding: 20px; border-radius: 8px; 
                     margin: 20px 0; border-left: 4px solid #667eea; }
    .detail-row { display: flex; justify-content: space-between; 
                  padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #666; }
    .value { color: #333; }
    .offer-amount { font-size: 24px; font-weight: 700; color: #667eea; }
    .button { display: inline-block; background: #667eea; color: white; 
              padding: 12px 24px; text-decoration: none; border-radius: 6px; 
              margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 New Property Offer</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have received a new purchase offer for your property:</p>
      
      <div class="offer-details">
        <div class="detail-row">
          <span class="label">Property:</span>
          <span class="value"><strong>${propertyAddress}</strong></span>
        </div>
        <div class="detail-row">
          <span class="label">Asking Price:</span>
          <span class="value">${propertyPrice}</span>
        </div>
        <div class="detail-row">
          <span class="label">Offer Amount:</span>
          <span class="offer-amount">${offerAmount}</span>
        </div>
        <div class="detail-row">
          <span class="label">Buyer:</span>
          <span class="value">${offer.buyerName || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Buyer Email:</span>
          <span class="value">${offer.buyerEmail || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Buyer Phone:</span>
          <span class="value">${offer.buyerPhone || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Financing Type:</span>
          <span class="value">${offer.financingType || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Closing Timeline:</span>
          <span class="value">${offer.closingTimeline || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contingencies:</span>
          <span class="value">${
  offer.contingencies?.join(", ") || "None"
}</span>
        </div>
      </div>

      ${offer.offerMessage ? `
      <div class="offer-details">
        <h3>Message from Buyer:</h3>
        <p>${offer.offerMessage}</p>
      </div>
      ` : ""}

      <p>Please review this offer and respond at your earliest convenience.</p>
      
      <p>Best regards,<br>The Oyola AI Team</p>
    </div>
  </div>
</body>
</html>
            `;

            const subject =
                `New Purchase Offer for ${propertyAddress} - ${offerAmount}`;

            // Send email via Gmail
            await sendEmailViaGmail(buyerId, ownerEmail, subject, htmlBody);

            logger.info("Offer email sent successfully", {
              propertyId: offer.property?.id,
              propertyTitle: propertyAddress,
              offerAmount: offerAmount,
              ownerEmail: ownerEmail,
            });

            return {
              propertyId: offer.property?.id,
              status: "sent",
              sentAt: new Date().toISOString(),
              ownerEmail: ownerEmail,
            };
          } catch (error) {
            logger.error("Error sending offer email", {
              error: error.message,
              offer: offer.property?.id,
            });
            return {
              propertyId: offer.property?.id,
              status: "failed",
              error: error.message,
            };
          }
        }),
    );

    const successful = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return {
      success: true,
      message: `Successfully sent ${successful} offers. ` +
          `${failed > 0 ? `${failed} failed.` : ""}`,
      results: results,
    };
  } catch (error) {
    logger.error("Error sending offers", error);
    throw new HttpsError(
        "internal",
        `Failed to send offers: ${error.message}`,
    );
  }
});

/**
 * HTTP endpoint to track when property owners view offers
 */
exports.trackOfferView = onRequest(async (req, res) => {
  const {offerId} = req.query;

  if (!offerId) {
    res.status(400).send({error: "Offer ID is required"});
    return;
  }

  logger.info("Tracking offer view", {offerId});

  // In a real app, update Firestore with view timestamp
  // await admin.firestore().collection('offers').doc(offerId).update({
  //   status: 'viewed',
  //   viewedAt: admin.firestore.FieldValue.serverTimestamp()
  // });

  res.send({success: true, message: "Offer view tracked"});
});

/**
 * Callable function to handle owner responses to offers
 */
exports.respondToOffer = onCall(async (request) => {
  try {
    const {offerId, response, ownerMessage} = request.data;

    logger.info("Processing owner response", {
      offerId,
      response,
    });

    // In a real implementation:
    // 1. Update offer status in Firestore
    // 2. Send notification to buyer
    // 3. Create activity log

    // Example notification to buyer
    const buyerNotification = {
      subject: response === "accepted" ?
        "Great News! Your Offer Was Accepted" :
        "Update on Your Property Offer",
      body: `
        Your offer has been ${response}.
        ${ownerMessage ? `\nOwner's message: ${ownerMessage}` : ""}
      `,
    };

    // Send notification
    // await sendEmail(buyerNotification);

    return {
      success: true,
      message: `Offer ${response} successfully`,
      notification: buyerNotification,
    };
  } catch (error) {
    logger.error("Error processing owner response", error);
    throw new HttpsError(
        "internal",
        "Failed to process owner response",
    );
  }
});

/**
 * Example function to send automated follow-ups
 */
exports.sendOfferFollowUps = onRequest(async (req, res) => {
  logger.info("Running automated follow-up checks");

  // In a real implementation, this would:
  // 1. Query Firestore for offers sent > 48 hours ago with no response
  // 2. Send reminder emails to property owners
  // 3. Update offer with follow-up timestamp

  res.send({
    success: true,
    message: "Follow-up checks completed",
  });
});

/**
 * Send welcome email when a new user signs up
 * Triggered automatically when a new document is created
 * in the users collection
 */
exports.sendWelcomeEmail = onDocumentCreated("users/{userId}",
    async (event) => {
      try {
        const userData = event.data.data();
        const userId = event.params.userId;

        logger.info("Sending welcome email to new user", {
          userId: userId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        });

        // In a real implementation, this would use a service like:
        // - SendGrid
        // - Mailgun
        // - AWS SES
        // - Resend
        // - Firebase Extensions (Trigger Email)

        // Email template subject
        const emailSubject = [
          "Welcome to Automated Property Offer Platform,",
          `${userData.name}! 🏡`,
        ].join(" ");

        const welcomeEmail = {
          to: userData.email,
          subject: emailSubject,
          html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(
                135deg,
                #667eea 0%,
                #764ba2 100%
              );
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏡 Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userData.name}! 👋</h2>
              <p>We're excited to have you join our automated
              property offer platform!</p>
              
              ${userData.role === "buyer" ? `
                <h3>As a Buyer, you can:</h3>
                <ul>
                  <li>🔍 Search for properties that match your criteria</li>
                  <li>📧 Send automated offers to property owners</li>
                  <li>📊 Track all your offers in one place</li>
                  <li>⚡ Get instant notifications when owners respond</li>
                </ul>
              ` : `
                <h3>As a Property Owner, you can:</h3>
                <ul>
                  <li>🏠 List your properties</li>
                  <li>📬 Receive offers from interested buyers</li>
                  <li>📊 Manage all offers in your dashboard</li>
                  <li>✅ Accept or decline offers with one click</li>
                </ul>
              `}
              
              <p>Ready to get started?</p>
              <a href="${getAppUrl()}" class="button">
                Go to Dashboard →
              </a>
              
              <p style="margin-top: 30px;">If you have any
              questions, feel free to reply to this email or
              check out our help center.</p>
              
              <p>Best regards,<br>The Property Offer Platform Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Automated
              Property Offer Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
          text: `
        Welcome to Automated Property Offer Platform, ${userData.name}!
        
        We're excited to have you join us!
        
        ${userData.role === "buyer" ?
          "As a Buyer, you can search for properties, " +
          "send automated offers, and track responses." :
          "As a Property Owner, you can list properties, " +
          "receive offers, and manage them easily."
}
        
        Get started at: ${getAppUrl()}
        
        Best regards,
        The Property Offer Platform Team
      `,
        };

        // Send email with Resend
        const resend = new Resend(getResendApiKey());

        try {
          await resend.emails.send({
            from: "Oyola Property Platform <onboarding@resend.dev>",
            to: userData.email,
            subject: welcomeEmail.subject,
            html: welcomeEmail.html,
            text: welcomeEmail.text,
          });

          logger.info("Welcome email sent successfully", {
            userId,
            email: userData.email,
          });
        } catch (emailError) {
          logger.error("Failed to send welcome email", {
            userId,
            error: emailError.message,
            email: userData.email,
          });
          // Don't throw - don't fail user creation if email fails
        }

        return null;
      } catch (error) {
        logger.error("Error sending welcome email", error);
        // Don't throw error - don't fail user creation
        return null;
      }
    });

/**
 * Helper function to analyze seller situation from property data
 * @param {object} property - The property data from Zillow API
 * @return {object} Analysis with situations, flags and motivation score
 */
const analyzeSellerSituation = (property) => {
  const situations = [];
  const description = (property.description || "").toLowerCase();
  const remarks = (property.remarks || "").toLowerCase();
  const listingRemarks = (property.listingRemarks || "").toLowerCase();
  const fullText = `${description} ${remarks} ${listingRemarks}`;

  // Check for motivated seller keywords
  if (fullText.includes("divorce") || fullText.includes("divorced")) {
    situations.push("divorce");
  }
  if (fullText.includes("foreclosure") ||
      fullText.includes("pre-foreclosure")) {
    situations.push("foreclosure");
  }
  if (fullText.includes("inheritance") ||
      fullText.includes("estate sale") || fullText.includes("estate")) {
    situations.push("inheritance");
  }
  if (fullText.includes("must sell") || fullText.includes("quick sale") ||
      fullText.includes("motivated")) {
    situations.push("motivated_seller");
  }
  if (fullText.includes("relocat") || fullText.includes("job transfer") ||
      fullText.includes("moving")) {
    situations.push("relocation");
  }
  if (fullText.includes("bank owned") || fullText.includes("reo") ||
      fullText.includes("short sale")) {
    situations.push("bank_owned");
  }
  if (fullText.includes("as is") || fullText.includes("fixer") ||
      fullText.includes("investor")) {
    situations.push("fixer_opportunity");
  }

  // Check days on market (high DOM suggests motivated seller)
  const daysOnMarket = property.daysOnZillow || property.daysOnMarket || 0;
  if (daysOnMarket > 90) {
    situations.push("long_on_market");
  }

  // Check for price reductions
  if (property.priceChange && property.priceChange < 0) {
    situations.push("price_reduced");
  }

  return {
    situations: situations.length > 0 ? situations : ["standard"],
    isMotivatedSeller: situations.length > 0,
    motivationScore: situations.length,
  };
};

/**
 * Helper function to fetch properties from Zillow API
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {number} maxResults - Maximum number of results to fetch
 * @return {Promise<Array>} Array of property objects from Zillow
 */
const fetchZillowProperties = async (city, state, maxResults = 40) => {
  try {
    logger.info(
        `Fetching properties from Zillow for ${city}, ${state}`,
    );
    const rapidApiKey = getRapidApiKey();
    if (!rapidApiKey) {
      logger.error(
          "RapidAPI key is missing. Set functions config rapidapi.key",
      );
      return [];
    }

    const attempts = [
      {
        host: "zillow-com4.p.rapidapi.com",
        url: "https://zillow-com4.p.rapidapi.com/properties/search",
        params: {
          location: `${city}, ${state}`,
          status: "forSale",
          sort: "relevance",
          sortType: "asc",
          priceType: "listPrice",
          listingType: "agent",
          limit: Math.max(1, Math.min(50, Number(maxResults) || 20)),
        },
        parse: (data) => Array.isArray(data?.data) ? data.data : [],
      },
    ];

    let properties = [];
    for (const attempt of attempts) {
      try {
        const response = await axios.request({
          method: "GET",
          url: attempt.url,
          params: attempt.params,
          headers: {
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": attempt.host,
          },
        });
        properties = attempt.parse ? attempt.parse(response.data) :
          (
            response.data?.data ||
            response.data?.props ||
            response.data?.results ||
            []
          );
        if (Array.isArray(properties) && properties.length >= 0) break;
      } catch (err) {
        logger.warn("RapidAPI attempt failed", {
          hostTried: attempt.host,
          pathTried: attempt.url,
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.message,
        });
        continue;
      }
    }

    if (!Array.isArray(properties)) properties = [];

    logger.info(
        `Fetched ${properties.length} properties from Zillow`,
        {
          city,
          state,
          count: properties.length,
        },
    );

    return properties;
  } catch (error) {
    let responseDataSnippet = undefined;
    try {
      const data = error.response?.data;
      const str = typeof data === "string" ? data : JSON.stringify(data);
      responseDataSnippet = str?.slice(0, 500);
    } catch (_) {
      // ignore snippet extraction errors
    }

    logger.error("Error fetching Zillow properties", {
      error: error.message,
      city,
      state,
      status: error.response?.status,
      statusText: error.response?.statusText,
      dataSnippet: responseDataSnippet,
    });
    return [];
  }
};

/**
 * Helper function to transform and enrich Zillow property data
 * @param {object} property - Raw property data from Zillow
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @return {object} Transformed property with additional analysis
 */
const transformPropertyData = (property, city, state) => {
  const sellerAnalysis = analyzeSellerSituation(property);

  const zillowId = property.zpid || property.id || null;
  const priceValue = (property.price && typeof property.price === "object") ?
    (property.price.value || 0) : (property.price || property.listPrice || 0);
  const livingArea = property.livingArea || property.lotAreaValue || 0;
  const addressObj = property.address || {};
  const composedAddress = addressObj.streetAddress ?
    `${addressObj.streetAddress}, ${addressObj.city || city}, ` +
    `${addressObj.state || state} ${addressObj.zipcode || ""}`.trim() :
    (property.address || `${city}, ${state}`);
  const imagesHighRes =
    property.media?.allPropertyPhotos?.highResolution || [];
  const heroImage =
    property.media?.propertyPhotoLinks?.highResolutionLink || null;
  const allImages = heroImage ? [heroImage, ...imagesHighRes] : imagesHighRes;

  return {
    // Original Zillow data
    zillowId: zillowId,
    rawData: property,

    // Main criteria
    price: priceValue,
    area: livingArea,

    // Secondary criteria
    bedrooms: property.bedrooms || property.beds || 0,
    bathrooms: property.bathrooms || property.baths || 0,
    daysOnMarket: property.daysOnZillow || property.daysOnMarket || 0,

    // Seller situation (MOST IMPORTANT)
    sellerSituation: sellerAnalysis.situations,
    isMotivatedSeller: sellerAnalysis.isMotivatedSeller,
    motivationScore: sellerAnalysis.motivationScore,

    // Additional important details
    address: composedAddress,
    city: addressObj.city || city,
    state: addressObj.state || state,
    zipCode: addressObj.zipcode || property.zipcode || property.zip || "",
    propertyType: property.propertyType || property.homeType || "Unknown",
    yearBuilt: property.yearBuilt || null,
    lotSize: property.lotAreaValue || property.lotSize || 0,
    pricePerSqFt: priceValue && livingArea ?
      Math.round(priceValue / livingArea) : 0,

    // Price history and changes
    priceChange: (property.price && typeof property.price === "object" &&
      typeof property.price.priceChange === "number") ?
      property.price.priceChange : (property.priceChange || 0),
    priceHistory: property.priceHistory || [],

    // Images and details
    images: allImages.length > 0 ? allImages :
      (property.imgSrc ? [property.imgSrc] :
        (property.photos || []).map((p) => p.url || p)),
    description: property.description || "",
    listingRemarks: property.listingRemarks || "",

    // Contact and listing info
    listingAgent: property.attributionInfo?.agentName || null,
    listingAgentPhone: property.attributionInfo?.agentPhoneNumber || null,
    brokerName: property.attributionInfo?.brokerName || null,

    // Metadata
    importedAt: admin.firestore.FieldValue.serverTimestamp(),
    importSource: "zillow_api",
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    status: "active",

    // Search scoring (higher = better opportunity)
    opportunityScore: calculateOpportunityScore(property, sellerAnalysis),
  };
};

/**
 * Calculate opportunity score for property
 * @param {object} property - Raw property data from Zillow
 * @param {object} sellerAnalysis - Seller situation analysis
 * @return {number} Opportunity score from 0-100
 */
const calculateOpportunityScore = (property, sellerAnalysis) => {
  let score = 0;

  // Motivated seller situations (highest weight)
  score += sellerAnalysis.motivationScore * 30;

  // Days on market (longer = higher score)
  const daysOnMarket = property.daysOnZillow || property.daysOnMarket || 0;
  if (daysOnMarket > 120) score += 25;
  else if (daysOnMarket > 90) score += 20;
  else if (daysOnMarket > 60) score += 15;
  else if (daysOnMarket > 30) score += 10;

  // Price reduction
  if (property.priceChange && property.priceChange < -10000) score += 20;
  else if (property.priceChange && property.priceChange < -5000) score += 10;

  // Property condition indicators
  const description = (property.description || "").toLowerCase();
  if (description.includes("fixer") || description.includes("tlc") ||
      description.includes("needs work")) {
    score += 15;
  }

  return Math.min(score, 100); // Cap at 100
};

/**
 * Helper function to get the next city to search
 */
const getNextCity = async () => {
  const db = admin.firestore();
  const configRef = db.collection("config").doc("propertyFetcher");

  const configDoc = await configRef.get();
  const currentIndex = configDoc.exists ?
    (configDoc.data().currentCityIndex || 0) : 0;

  const nextIndex = (currentIndex + 1) % TARGET_CITIES.length;
  const city = TARGET_CITIES[currentIndex];

  // Update the index for next time
  await configRef.set({
    currentCityIndex: nextIndex,
    lastFetchedCity: city.location,
    lastFetchTime: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  return city;
};

/**
 * Scheduled function to periodically fetch properties from Zillow via RapidAPI
 * Stores transformed properties in Firestore under `properties`
 * Also records import stats in `importStats`
 */
exports.scheduledZillowFetch = onSchedule({
  schedule: "every 6 hours",
  timeZone: "America/Los_Angeles",
}, async (event) => {
  try {
    const db = admin.firestore();

    // Determine next target city in rotation
    const targetCity = await getNextCity();
    logger.info(`Scheduled fetch started for ${targetCity.location}`);

    // Fetch properties from RapidAPI (Zillow)
    const properties = await fetchZillowProperties(
        targetCity.name,
        targetCity.state,
        40,
    );

    if (properties.length === 0) {
      await db.collection("importStats").add({
        success: true,
        city: targetCity.location,
        propertiesFetched: 0,
        propertiesImported: 0,
        motivatedSellers: 0,
        opportunityRate: 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        triggerType: "schedule",
      });
      logger.info(`No properties found for ${targetCity.location}`);
      return null;
    }

    // Transform and save in batch
    const batch = db.batch();
    let importedCount = 0;
    let motivatedCount = 0;

    for (const property of properties) {
      try {
        const transformed = transformPropertyData(
            property,
            targetCity.name,
            targetCity.state,
        );

        if (transformed.price > 0 && transformed.zillowId) {
          const ref = db.collection("properties").doc();
          batch.set(ref, transformed, {merge: true});
          importedCount++;
          if (transformed.isMotivatedSeller) motivatedCount++;
        }
      } catch (e) {
        logger.error("Error transforming property", {
          error: e.message,
        });
      }
    }

    await batch.commit();

    const stats = {
      success: true,
      city: targetCity.location,
      propertiesFetched: properties.length,
      propertiesImported: importedCount,
      motivatedSellers: motivatedCount,
      opportunityRate:
        importedCount > 0 ?
          Math.round((motivatedCount / importedCount) * 100) :
          0,
    };

    await db.collection("importStats").add({
      ...stats,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      triggerType: "schedule",
    });

    logger.info("Scheduled Zillow fetch completed", stats);
    return null;
  } catch (error) {
    logger.error("Scheduled Zillow fetch failed", error);
    return null;
  }
});

/**
 * SCHEDULED FUNCTION REMOVED FOR FREE TIER COMPATIBILITY
 *
 * To enable automatic scheduled fetching:
 * 1. Upgrade to Firebase Blaze (pay-as-you-go) plan
 * 2. Uncomment the scheduled function code
 * 3. Add back: const {onSchedule} = require("firebase-functions/v2/scheduler");
 *
 * For now, use the manual fetch function (fetchZillowPropertiesManual)
 * to import properties on demand.
 */

/**
 * Manual trigger function to fetch properties on demand
 * Can be called from the app or Firebase console
 */
exports.fetchZillowPropertiesManual = onCall(
    async (request) => {
      try {
        // Check if user is authenticated
        if (!request.auth) {
          throw new HttpsError(
              "unauthenticated",
              "Authentication required",
          );
        }

        const {city, state, location} = request.data;
        const db = admin.firestore();

        // Use provided location or get next in rotation
        const targetCity = city && state ? {name: city, state, location} :
      await getNextCity();

        logger.info(
            `Manual fetch requested for ${targetCity.location}`,
            {
              userId: request.auth.uid,
            },
        );

        // Fetch properties
        const properties = await fetchZillowProperties(
            targetCity.name,
            targetCity.state,
            40,
        );

        if (properties.length === 0) {
          return {
            success: true,
            message: `No properties found for ${targetCity.location}`,
            propertiesImported: 0,
          };
        }

        // Transform and save
        const batch = db.batch();
        let importedCount = 0;
        let motivatedCount = 0;

        for (const property of properties) {
          try {
            const transformedProperty = transformPropertyData(
                property,
                targetCity.name,
                targetCity.state,
            );

            if (transformedProperty.price > 0 && transformedProperty.zillowId) {
              const propertyRef = db.collection("properties").doc();
              batch.set(propertyRef, transformedProperty, {merge: true});
              importedCount++;

              if (transformedProperty.isMotivatedSeller) {
                motivatedCount++;
              }
            }
          } catch (error) {
            logger.error("Error transforming property", {
              error: error.message,
            });
          }
        }

        await batch.commit();

        const result = {
          success: true,
          city: targetCity.location,
          propertiesFetched: properties.length,
          propertiesImported: importedCount,
          motivatedSellers: motivatedCount,
          opportunityRate: importedCount > 0 ?
        Math.round((motivatedCount / importedCount) * 100) : 0,
        };

        // Log statistics
        await db.collection("importStats").add({
          ...result,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          triggeredBy: request.auth.uid,
          triggerType: "manual",
        });

        logger.info("Manual Zillow fetch completed", result);

        return result;
      } catch (error) {
        logger.error("Error in manual Zillow fetch", error);
        throw new HttpsError(
            "internal",
            `Failed to fetch properties: ${error.message}`,
        );
      }
    });

/**
 * Function to get import statistics
 */
exports.getImportStats = onCall(async (request) => {
  try {
    const db = admin.firestore();
    const statsSnapshot = await db.collection("importStats")
        .orderBy("timestamp", "desc")
        .limit(30)
        .get();

    const stats = [];
    statsSnapshot.forEach((doc) => {
      stats.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      stats: stats,
      totalImports: stats.length,
    };
  } catch (error) {
    logger.error("Error fetching import stats", error);
    throw new HttpsError(
        "internal",
        "Failed to fetch import statistics",
    );
  }
});

/**
 * Get Gmail OAuth authorization URL
 * Returns a URL that the user should visit to authorize Gmail access
 */
exports.getGmailAuthUrl = onCall(async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const userId = request.auth.uid;
    const {google} = require("googleapis");

    // Use provided redirectUri or fallback to app URL
    let redirectUri = request.data?.redirectUri || getAppUrl();
    // Ensure no trailing slash for exact match with Google OAuth Console
    redirectUri = redirectUri.replace(/\/$/, "");
    // Log selected redirect URI
    logger.info(
        "Gmail OAuth - Using redirect URI:",
        {redirectUri: redirectUri, provided: request.data?.redirectUri},
    );

    const oauth2Client = new google.auth.OAuth2(
        getGoogleOAuthClientId(),
        getGoogleOAuthClientSecret(),
        redirectUri,
    );

    const scopes = [
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.send",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // This is required to get refresh token
      scope: scopes,
      state: userId, // Pass user ID in state for verification
      prompt: "consent", // Force consent screen to ensure refresh token
    });

    return {
      success: true,
      authUrl: authUrl,
    };
  } catch (error) {
    logger.error("Error generating Gmail auth URL", error);
    throw new HttpsError(
        "internal",
        `Failed to generate auth URL: ${error.message}`,
    );
  }
});

/**
 * Exchange Gmail OAuth authorization code for tokens
 * Stores both access token and refresh token in Firestore
 */
exports.exchangeGmailAuthCode = onCall(async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const userId = request.auth.uid;
    const {code, state, redirectUri} = request.data;

    if (!code) {
      throw new HttpsError(
          "invalid-argument",
          "Authorization code is required",
      );
    }

    // Verify state matches user ID (security check)
    if (state !== userId) {
      throw new HttpsError(
          "invalid-argument",
          "Invalid state parameter",
      );
    }

    const {google} = require("googleapis");

    // Use provided redirectUri or fallback to app URL
    // Must match what was used in getGmailAuthUrl
    let redirectUriToUse = redirectUri || getAppUrl();
    // Ensure no trailing slash for exact match
    redirectUriToUse = redirectUriToUse.replace(/\/$/, "");
    logger.info(
        "Gmail OAuth Exchange - Using redirect URI:",
        {redirectUriToUse: redirectUriToUse, provided: redirectUri},
    );

    const oauth2Client = new google.auth.OAuth2(
        getGoogleOAuthClientId(),
        getGoogleOAuthClientSecret(),
        redirectUriToUse,
    );

    // Exchange code for tokens
    const {tokens} = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      logger.warn(
          "No refresh token received. " +
          "User may need to revoke and re-authorize.",
      );
    }

    // Store tokens in Firestore
    const db = admin.firestore();
    const userRef = db.collection("users").doc(userId);

    const gmailData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope || "https://www.googleapis.com/auth/gmail.compose",
      tokenType: tokens.token_type || "Bearer",
      expiryDate: tokens.expiry_date ?
        new Date(tokens.expiry_date).toISOString() :
        null,
      connected: true,
      storedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set({
      gmail: gmailData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    logger.info("Gmail tokens stored successfully", {
      userId: userId,
      connected: gmailData.connected,
    });

    return {
      success: true,
      message: "Gmail access granted successfully",
      hasRefreshToken: !!tokens.refresh_token,
    };
  } catch (error) {
    logger.error("Error exchanging Gmail auth code", error);
    throw new HttpsError(
        "internal",
        `Failed to exchange auth code: ${error.message}`,
    );
  }
});

/**
 * Refresh Gmail access token using stored refresh token
 */
exports.refreshGmailToken = onCall(async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const userId = request.auth.uid;
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists()) {
      throw new HttpsError(
          "not-found",
          "User not found",
      );
    }

    const userData = userDoc.data();
    const gmailData = userData?.gmail;

    if (!gmailData?.refreshToken) {
      throw new HttpsError(
          "failed-precondition",
          "No refresh token available. Please re-authorize Gmail access.",
      );
    }

    const {google} = require("googleapis");

    const oauth2Client = new google.auth.OAuth2(
        getGoogleOAuthClientId(),
        getGoogleOAuthClientSecret(),
        getAppUrl(),
    );

    oauth2Client.setCredentials({
      refresh_token: gmailData.refreshToken,
    });

    // Refresh the access token
    const {credentials} = await oauth2Client.refreshAccessToken();

    // Update stored tokens
    await db.collection("users").doc(userId).set({
      gmail: {
        ...gmailData,
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date ?
          new Date(credentials.expiry_date).toISOString() : null,
        connected: true,
        storedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    logger.info("Gmail token refreshed successfully", {userId: userId});

    return {
      success: true,
      message: "Token refreshed successfully",
    };
  } catch (error) {
    logger.error("Error refreshing Gmail token", error);
    throw new HttpsError(
        "internal",
        `Failed to refresh token: ${error.message}`,
    );
  }
});
