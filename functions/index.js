// const functions = require("firebase-functions"); // Not needed for v2
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
// Using only process.env for Firebase Functions v2 compatibility
const getResendApiKey = () => {
  return process.env.RESEND_API_KEY || "";
};

const getAppUrl = () => {
  return process.env.APP_URL ||
    "https://sviatoslavgladyshev.github.io/oyola-ai";
};

const getRapidApiKey = () => {
  return process.env.RAPIDAPI_KEY || "";
};

const getAttomApiKey = () => {
  return process.env.ATTOM_API_KEY ||
    "23364207340238528444c4ccd88cb02f";
};

const getGoogleOAuthClientId = () => {
  return process.env.GOOGLE_OAUTH_CLIENT_ID || "";
};

const getGoogleOAuthClientSecret = () => {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
};

// Cities to rotate through for property searches
const TARGET_CITIES = [
  {
    name: "Los Angeles",
    state: "CA",
    zipCode: "90210",
    location: "Los Angeles, CA",
  },
  {name: "Miami", state: "FL", zipCode: "33101", location: "Miami, FL"},
  {name: "Phoenix", state: "AZ", zipCode: "85001", location: "Phoenix, AZ"},
  {name: "Atlanta", state: "GA", zipCode: "30301", location: "Atlanta, GA"},
  {name: "Dallas", state: "TX", zipCode: "75201", location: "Dallas, TX"},
  {name: "Houston", state: "TX", zipCode: "77001", location: "Houston, TX"},
  {name: "Las Vegas", state: "NV", zipCode: "89101", location: "Las Vegas, NV"},
  {name: "Orlando", state: "FL", zipCode: "32801", location: "Orlando, FL"},
  {
    name: "San Antonio",
    state: "TX",
    zipCode: "78201",
    location: "San Antonio, TX",
  },
  {
    name: "Jacksonville",
    state: "FL",
    zipCode: "32099",
    location: "Jacksonville, FL",
  },
  {name: "Charlotte", state: "NC", zipCode: "28201", location: "Charlotte, NC"},
  {name: "Memphis", state: "TN", zipCode: "38101", location: "Memphis, TN"},
  {name: "Nashville", state: "TN", zipCode: "37201", location: "Nashville, TN"},
  {name: "Denver", state: "CO", zipCode: "80201", location: "Denver, CO"},
  {
    name: "Indianapolis",
    state: "IN",
    zipCode: "46201",
    location: "Indianapolis, IN",
  },
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

    if (!userDoc.exists) {
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
            const ownerEmail = offer.ownerEmail || "sg7622@nyu.edu";
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
 * Send follow-up email for a specific offer
 * This function sends a reminder email to property owners about an offer
 */
exports.sendOfferFollowUps = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const buyerId = request.auth.uid;
    const {offer} = request.data;

    if (!offer) {
      throw new HttpsError(
          "invalid-argument",
          "Offer object is required",
      );
    }

    logger.info("Sending follow-up email for offer", {
      offerId: offer.id,
      buyerId: buyerId,
    });

    const ownerEmail = offer.ownerEmail || "glsvyatoslav@gmail.com";
    const propertyAddress = offer.property?.address ||
        offer.property?.title || "Property";
    const offerAmount = offer.offerAmount ?
      `$${offer.offerAmount.toLocaleString()}` : "N/A";
    const propertyPrice = offer.property?.price ?
      `$${offer.property.price.toLocaleString()}` : "N/A";

    // Create HTML email body for follow-up
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
    .followup-note { background: #fff3cd; padding: 15px; border-radius: 6px; 
                     margin: 20px 0; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Follow-up: Property Offer Reminder</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>This is a friendly follow-up regarding the purchase offer ` +
        `you received:</p>
      
      <div class="followup-note">
        <strong>💬 Reminder:</strong> We wanted to make sure you ` +
        `received and had a chance to review this offer.
      </div>
      
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
      </div>

      ${offer.offerMessage ? `
      <div class="offer-details">
        <h3>Message from Buyer:</h3>
        <p>${offer.offerMessage}</p>
      </div>
      ` : ""}

      <p>If you have any questions or would like to discuss this offer ` +
        `further, please don't hesitate to reach out.</p>
      
      <p>Best regards,<br>${offer.buyerName || "The Buyer"}</p>
    </div>
  </div>
</body>
</html>
    `;

    const subject =
        `Follow-up: Purchase Offer for ${propertyAddress} - ${offerAmount}`;

    // Send email via Gmail
    await sendEmailViaGmail(buyerId, ownerEmail, subject, htmlBody);

    logger.info("Follow-up email sent successfully", {
      offerId: offer.id,
      propertyTitle: propertyAddress,
      offerAmount: offerAmount,
      ownerEmail: ownerEmail,
    });

    return {
      success: true,
      message: "Follow-up email sent successfully",
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error sending follow-up email", error);
    throw new HttpsError(
        "internal",
        error.message || "Failed to send follow-up email",
    );
  }
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
 * Scheduled function to periodically fetch properties from ATTOM Data API
 * Stores transformed properties in Firestore under `properties`
 * Also records import stats in `importStats`
 */
exports.scheduledAttomFetch = onSchedule({
  schedule: "every 8 hours",
  timeZone: "America/Los_Angeles",
}, async (event) => {
  try {
    const db = admin.firestore();

    // Determine next target city in rotation
    const targetCity = await getNextCity();
    logger.info(`Scheduled ATTOM fetch started for ${targetCity.location}`, {
      cityName: targetCity.name,
      state: targetCity.state,
      zipCode: targetCity.zipCode,
      location: targetCity.location,
    });

    // Fetch properties from ATTOM API using city and state
    // Note: ATTOM API doesn't accept postal1 parameter, use city+state instead
    logger.info("Calling searchAttomProperties with", {
      address: null,
      city: targetCity.name,
      state: targetCity.state,
      zipCode: null,
      radius: 0, // no radius with city/state
      limit: 30,
    });

    const properties = await searchAttomProperties(
        null, // no specific address
        targetCity.name, // use city name
        targetCity.state, // use state
        null, // no postal code (ATTOM API rejects postal1)
        0, // no radius with city/state search
        30, // limit to 30 properties per fetch
    );

    logger.info("ATTOM properties fetched", {
      count: properties.length,
      sampleProperty: properties.length > 0 ? {
        hasIdentifier: !!properties[0].identifier,
        hasAddress: !!properties[0].address,
        attomId: properties[0].identifier?.attomId || properties[0].id,
      } : null,
    });

    if (properties.length === 0) {
      await db.collection("importStats").add({
        success: true,
        city: targetCity.location,
        propertiesFetched: 0,
        propertiesImported: 0,
        importSource: "attom_api",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        triggerType: "schedule_attom",
      });
      logger.info(`No ATTOM properties found for ${targetCity.location}`);
      return null;
    }

    // Transform and save in batch
    const batch = db.batch();
    let importedCount = 0;
    let skippedCount = 0;
    let skippedMissingAttomId = 0;
    let skippedMissingPrice = 0;
    let transformErrors = 0;

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      try {
        const transformed = transformAttomPropertyData(property);

        // Log first property for debugging
        if (i === 0) {
          logger.info("Sample transformed property (first)", {
            attomId: transformed.attomId,
            price: transformed.price,
            priceType: transformed.priceType,
            hasAttomId: !!transformed.attomId,
            hasPrice: transformed.price > 0,
            address: transformed.address,
            rawPropertyId: property.id,
            rawIdentifier: JSON.stringify(property.identifier || {}),
            rawSale: JSON.stringify(property.sale || {}),
            rawAssessment: JSON.stringify(property.assessment || {}),
          });
        }

        // Save properties with valid attomId
        // Note: property/address endpoint may not include pricing data,
        // but we save properties anyway and can fetch pricing details later
        if (transformed.attomId) {
          const ref = db.collection("properties")
              .doc(`attom_${transformed.attomId}`);
          batch.set(ref, transformed, {merge: true});
          importedCount++;
          // Log first saved property
          if (importedCount === 1) {
            logger.info("First property being saved", {
              attomId: transformed.attomId,
              price: transformed.price,
              priceType: transformed.priceType,
              address: transformed.address,
            });
          }
        } else {
          skippedCount++;
          // Track skip reasons
          if (!transformed.attomId) {
            skippedMissingAttomId++;
          } else if (transformed.price === 0) {
            skippedMissingPrice++;
          }
          // Log first skipped property for debugging
          if (i === 0 || skippedCount === 1) {
            const skipReasonText = !transformed.attomId ?
              "Missing attomId" : "Price is 0";
            const detailedMessage = `
❌ PROPERTY SKIPPED (${skipReasonText}):
   Transformed attomId: ${transformed.attomId || "NULL"}
   Transformed price: ${transformed.price}
   Price type: ${transformed.priceType}
   Raw property.id: ${property.id || "NULL"}
   Has identifier: ${!!property.identifier}
   Identifier attomId: ${property.identifier?.attomId || "NULL"}
   Sale amount: ${property.sale?.saleAmount?.saleamt || "NULL"}
   Assessed value: ${property.assessment?.assessed?.assdttlvalue || "NULL"}
   Market value: ${property.assessment?.market?.mktttlvalue || "NULL"}
   Property keys: ${Object.keys(property).join(", ")}
   Has valuation: ${!!property.valuation}
   Has summary: ${!!property.summary}
            `;

            logger.warn("Property skipped - detailed info" + detailedMessage, {
              skipReason: skipReasonText,
              transformedAttomId: transformed.attomId,
              transformedPrice: transformed.price,
              priceType: transformed.priceType,
              rawPropertyKeys: Object.keys(property),
              rawPropertyId: property.id,
              hasIdentifier: !!property.identifier,
              rawIdentifier: JSON.stringify(property.identifier || {}),
              rawIdentifierKeys: property.identifier ?
                Object.keys(property.identifier) : [],
              identifierAttomId: property.identifier?.attomId,
              identifierId: property.identifier?.id,
              saleAmount: property.sale?.saleAmount?.saleamt,
              assessedValue: property.assessment?.assessed?.assdttlvalue,
              marketValue: property.assessment?.market?.mktttlvalue,
              valuationAvm: property.valuation?.avm?.amount,
              valuationAmount: property.valuation?.amount,
              avmAmount: property.avm?.amount,
              summaryAvm: property.summary?.avm?.amount,
              summaryEstimatedValue: property.summary?.estimatedValue,
              hasValuation: !!property.valuation,
              hasSummary: !!property.summary,
              hasAvm: !!property.avm,
              fullPropertySample: JSON.stringify(property).substring(0, 1500),
            });
          }
        }
      } catch (e) {
        transformErrors++;
        logger.error("Error transforming ATTOM property", {
          error: e.message,
          stack: e.stack,
          propertyIndex: i,
          propertySample: JSON.stringify(property).substring(0, 300),
        });
      }
    }

    // Comprehensive summary log with all critical info
    const summaryMessage = `
🔍 ATTOM FETCH SUMMARY:
   Total fetched: ${properties.length}
   ✅ Imported: ${importedCount}
   ⚠️  Skipped: ${skippedCount}
      - Missing attomId: ${skippedMissingAttomId}
      - Missing price: ${skippedMissingPrice}
      - Other: ${skippedCount - skippedMissingAttomId - skippedMissingPrice}
   ❌ Transform errors: ${transformErrors}
   📦 Batch size: ${batch._deferredWrites?.length || 0}
    `;

    logger.info("Batch operations summary" + summaryMessage, {
      totalProperties: properties.length,
      importedCount,
      skippedCount,
      skippedMissingAttomId,
      skippedMissingPrice,
      transformErrors,
      batchSize: batch._deferredWrites?.length || 0,
      skipBreakdown: {
        missingAttomId: skippedMissingAttomId,
        missingPrice: skippedMissingPrice,
        other: skippedCount - skippedMissingAttomId - skippedMissingPrice,
      },
    });

    if (importedCount > 0) {
      try {
        await batch.commit();
        logger.info("✅ Batch committed successfully", {
          importedCount,
          totalFetched: properties.length,
        });
      } catch (commitError) {
        logger.error("Failed to commit batch to Firestore", {
          error: commitError.message,
          stack: commitError.stack,
          importedCount,
        });
        throw commitError; // Re-throw to be caught by outer catch
      }
    } else {
      logger.warn("⚠️ No properties to commit - batch skipped", {
        skippedCount,
        skippedMissingAttomId,
        skippedMissingPrice,
        transformErrors,
        totalFetched: properties.length,
        reason: skippedCount > 0 ?
          `${skippedMissingAttomId} missing attomId, ` +
          `${skippedMissingPrice} missing price` :
          "No properties transformed successfully",
      });
    }

    const stats = {
      success: true,
      city: targetCity.location,
      propertiesFetched: properties.length,
      propertiesImported: importedCount,
      importSource: "attom_api",
    };

    await db.collection("importStats").add({
      ...stats,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      triggerType: "schedule_attom",
    });

    logger.info("Scheduled ATTOM fetch completed", stats);
    return null;
  } catch (error) {
    logger.error("Scheduled ATTOM fetch failed", error);
    return null;
  }
});

/**
 * SCHEDULED FUNCTIONS REMOVED FOR FREE TIER COMPATIBILITY
 *
 * To enable automatic scheduled fetching:
 * 1. Upgrade to Firebase Blaze (pay-as-you-go) plan
 * 2. Uncomment the scheduled function code
 * 3. Add back: const {onSchedule} = require("firebase-functions/v2/scheduler");
 *
 * For now, use the manual fetch functions:
 * - fetchZillowPropertiesManual (for Zillow API)
 * - fetchAttomPropertiesForCity (for ATTOM API)
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

    if (!userDoc.exists) {
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

/**
 * Helper function to make requests to ATTOM Data API
 * @param {string} endpoint - API endpoint path (e.g., 'property/detail')
 * @param {object} params - Query parameters
 * @return {Promise<object>} API response data
 */
const fetchFromAttomApi = async (endpoint, params = {}) => {
  const baseUrl = "https://api.gateway.attomdata.com/propertyapi/v1.0.0";
  const url = `${baseUrl}/${endpoint}`;

  // Build full URL with params for debugging
  const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
  const fullUrl = `${url}?${paramString}`;

  try {
    const apiKey = getAttomApiKey();
    if (!apiKey) {
      throw new Error("ATTOM API key not configured");
    }

    logger.info("Making ATTOM API request", {
      endpoint,
      params: params,
      paramKeys: Object.keys(params),
      url: baseUrl,
      fullUrl: fullUrl,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING",
    });

    const response = await axios.get(url, {
      headers: {
        "Accept": "application/json",
        "APIKey": apiKey,
      },
      params,
      timeout: 30000, // 30 second timeout
    });

    logger.info("ATTOM API request successful", {
      endpoint,
      status: response.status,
      dataLength: JSON.stringify(response.data).length,
    });

    const responseData = response.data;

    // Check if response indicates no results (even on 200 status)
    const statusMsg = responseData?.status?.msg ||
      responseData?.message ||
      responseData?.error ||
      "";
    if (statusMsg.includes("SuccessWithoutResult") ||
        statusMsg.includes("Success Without Result") ||
        statusMsg.includes("No results found")) {
      logger.info("ATTOM API response indicates no properties found", {
        endpoint,
        statusMsg,
      });
      return {property: []}; // Return empty property array
    }

    return responseData;
  } catch (error) {
    // Check for SuccessWithoutResult FIRST before logging errors
    // This is a valid "no results" response, not an actual error
    if (error.response?.status === 400) {
      const apiErrorMsg = error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.status?.msg ||
        JSON.stringify(error.response?.data) ||
        "Invalid request parameters";

      // "SuccessWithoutResult" is a valid response meaning no properties found
      // Return empty array instead of throwing error
      if (apiErrorMsg.includes("SuccessWithoutResult") ||
          apiErrorMsg.includes("Success Without Result")) {
        logger.info(
            "ATTOM API returned SuccessWithoutResult - no properties found",
            {
              endpoint,
            },
        );
        return {property: []}; // Return empty property array
      }
    }

    // For actual errors, log detailed information
    const errorDetails = {
      endpoint,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestParams: params,
      requestUrl: `${baseUrl}/${endpoint}`,
      fullRequestUrl: fullUrl,
      fullError: JSON.stringify({
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        } : null,
      }, null, 2),
    };

    logger.error("ATTOM API request failed - DETAILED", errorDetails);

    // Log response body separately for better visibility
    if (error.response?.data) {
      logger.error("ATTOM API error response body", {
        endpoint,
        responseBody: JSON.stringify(error.response.data, null, 2),
        responseBodyType: typeof error.response.data,
        responseBodyKeys: typeof error.response.data === "object" ?
          Object.keys(error.response.data) : "N/A",
      });
    }

    if (error.response?.status === 401) {
      throw new Error("Invalid ATTOM API key");
    } else if (error.response?.status === 429) {
      throw new Error("ATTOM API rate limit exceeded");
    } else if (error.response?.status === 400) {
      const apiErrorMsg = error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.status?.msg ||
        JSON.stringify(error.response?.data) ||
        "Invalid request parameters";
      throw new Error(`Invalid request parameters: ${apiErrorMsg}`);
    }

    throw error;
  }
};

/**
 * Fetch property details by ATTOM ID
 * @param {string} attomId - ATTOM property identifier
 * @return {Promise<object>} Property details
 */
const fetchAttomPropertyDetail = async (attomId) => {
  if (!attomId) {
    throw new Error("Property ID is required");
  }

  const data = await fetchFromAttomApi("property/detail", {id: attomId});

  if (!data?.property || data.property.length === 0) {
    throw new Error("Property not found");
  }

  return data.property[0]; // ATTOM returns array, take first result
};

/**
 * Search properties by location/address using ATTOM API
 * @param {string} address - Street address
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {string} zipCode - ZIP code
 * @param {number} radius - Search radius in miles (default: 1)
 * @param {number} limit - Maximum results to return (default: 10)
 * @return {Promise<Array>} Array of property objects
 */
const searchAttomProperties = async (
    address,
    city,
    state,
    zipCode,
    radius = 1,
    limit = 10,
) => {
  const params = {
    pagesize: Math.min(limit, 100), // ATTOM max is 100
  };

  logger.info("searchAttomProperties - Input parameters", {
    address: address || null,
    city: city || null,
    state: state || null,
    zipCode: zipCode || null,
    radius,
    limit,
  });

  // Build search criteria - ATTOM API has specific parameter requirements
  // NOTE: postal1 parameter is rejected by ATTOM API, use city+state instead
  // Priority: address > city+state > (zipCode fallback to city+state)
  if (address) {
    // Use exact address
    params.address1 = address;
    logger.info("searchAttomProperties - Using address search", {
      address1: address,
    });
  } else if (city && state) {
    // Use single 'address' parameter with city and state
    // ATTOM API property/address endpoint requires address1 AND address2
    // together, OR use single 'address' parameter with "City, State" format
    params.address = `${city}, ${state}`;
    logger.info("searchAttomProperties - Using city/state search", {
      address: params.address,
    });
  } else if (zipCode) {
    // NOTE: ATTOM API rejects postal1 parameter
    // If only zipCode provided without city+state, log warning and skip
    logger.warn(
        "searchAttomProperties - zipCode provided but postal1 rejected",
        {
          zipCode,
          message: "Need city+state instead of zipCode for ATTOM API",
        },
    );
    throw new Error("ATTOM API requires city+state instead of zipCode. " +
      "Please provide city and state parameters.");
  } else {
    throw new Error("At least one location parameter " +
      "(address or city+state) is required");
  }

  logger.info("searchAttomProperties - Final params being sent", {
    params: params,
    paramCount: Object.keys(params).length,
  });

  const data = await fetchFromAttomApi("property/address", params);

  logger.info("searchAttomProperties - API response received", {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    hasProperty: !!data?.property,
    propertyType: Array.isArray(data?.property) ?
      "array" : typeof data?.property,
    propertyLength: Array.isArray(data?.property) ?
      data.property.length : "N/A",
    sampleData: data ? JSON.stringify(data).substring(0, 500) : null,
    fullResponseStructure: JSON.stringify(data, null, 2)
        .substring(0, 2000), // First 2000 chars of formatted JSON
  });

  const properties = data?.property || [];
  logger.info("searchAttomProperties - Returning properties", {
    count: properties.length,
    sampleProperty: properties.length > 0 ? {
      keys: Object.keys(properties[0]),
      hasIdentifier: !!properties[0].identifier,
      identifierKeys: properties[0].identifier ?
        Object.keys(properties[0].identifier) : [],
      identifierAttomId: properties[0].identifier?.attomId,
      identifierId: properties[0].id,
      hasAddress: !!properties[0].address,
      hasSale: !!properties[0].sale,
      hasAssessment: !!properties[0].assessment,
      rawIdentifier: JSON.stringify(properties[0].identifier || {}),
    } : null,
  });

  return properties;
};

/**
 * Transform ATTOM property data to our internal format
 * @param {object} attomProperty - Raw ATTOM property data
 * @return {object} Transformed property object
 */
const transformAttomPropertyData = (attomProperty) => {
  const address = attomProperty.address || {};
  const location = attomProperty.location || {};
  const building = attomProperty.building || {};
  const sale = attomProperty.sale || {};
  const assessment = attomProperty.assessment || {};
  const valuation = attomProperty.valuation || {};
  const summary = attomProperty.summary || {};
  const avm = attomProperty.avm || {};

  // Extract address components
  const streetAddress = [
    address.line1 || "",
    address.line2 || "",
  ].filter(Boolean).join(" ");

  const fullAddress = [
    streetAddress,
    address.locality || address.city || "",
    address.countrySubd || address.state || "",
    address.postal1 || address.zipCode || "",
  ].filter(Boolean).join(", ");

  // Extract property details
  const bedrooms = building.rooms?.beds || building.bedrooms || 0;
  const bathrooms = building.rooms?.bathstotal || building.bathrooms || 0;
  const area = building.size?.universalsize || building.livingarea || 0;

  // Extract pricing information with multiple fallbacks
  // Priority: sale amount > assessed value > market value >
  //           valuation > AVM (Automated Valuation Model)
  let price = 0;
  let priceType = "unknown";

  if (sale.saleAmount?.saleamt) {
    // Use sale price if available (don't require saleTransDate)
    price = sale.saleAmount.saleamt;
    priceType = "sale";
  } else if (assessment.assessed?.assdttlvalue) {
    // Fall back to assessed value
    price = assessment.assessed.assdttlvalue;
    priceType = "assessed";
  } else if (assessment.market?.mktttlvalue) {
    // Fall back to market value
    price = assessment.market.mktttlvalue;
    priceType = "market";
  } else if (valuation.avm?.amount) {
    // Use AVM from valuation
    price = valuation.avm.amount;
    priceType = "avm";
  } else if (avm.amount) {
    // Use AVM directly
    price = avm.amount;
    priceType = "avm";
  } else if (summary.avm?.amount) {
    // Use AVM from summary
    price = summary.avm.amount;
    priceType = "avm";
  } else if (valuation?.amount) {
    // Use valuation amount
    price = valuation.amount;
    priceType = "valuation";
  } else if (summary?.estimatedValue) {
    // Use estimated value from summary
    price = summary.estimatedValue;
    priceType = "estimated";
  }

  // Extract ATTOM ID with multiple fallbacks
  const attomId = attomProperty.identifier?.attomId ||
    attomProperty.identifier?.id ||
    attomProperty.id ||
    attomProperty.attomId ||
    null;

  return {
    // ATTOM identifiers
    attomId: attomId,
    fips: attomProperty.identifier?.fips,
    apn: attomProperty.identifier?.apn,

    // Address information
    address: fullAddress,
    streetAddress,
    city: address.locality || address.city || "",
    state: address.countrySubd || address.state || "",
    zipCode: address.postal1 || address.zipCode || "",
    country: address.country || "US",

    // Property details
    propertyType: building.propertyType || building.useCode || "Unknown",
    yearBuilt: building.yearbuilt || null,
    bedrooms,
    bathrooms,
    area,

    // Pricing (may be 0 if not available from property/address endpoint)
    // Pricing can be fetched later via property/detail endpoint
    price: price || 0,
    priceType: price > 0 ? priceType : "unavailable",

    // Assessment and tax info
    assessedValue: assessment.assessed?.assdttlvalue || null,
    marketValue: assessment.market?.mktttlvalue || null,
    taxAmount: assessment.tax?.taxamt || null,
    taxYear: assessment.tax?.taxyear || null,

    // Sale information
    lastSaleDate: sale.saleTransDate || null,
    lastSalePrice: sale.saleAmount?.saleamt || null,
    saleRecordingDate: sale.saleRecordingDate || null,

    // Location coordinates
    latitude: location.latitude || null,
    longitude: location.longitude || null,

    // Raw ATTOM data for reference
    rawData: attomProperty,

    // Metadata
    importedAt: admin.firestore.FieldValue.serverTimestamp(),
    importSource: "attom_api",
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    status: "active",
  };
};

/**
 * Callable function to fetch property details from ATTOM API
 */
exports.fetchAttomPropertyDetail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const {attomId} = request.data;

    if (!attomId) {
      throw new HttpsError(
          "invalid-argument",
          "ATTOM property ID is required",
      );
    }

    logger.info("Fetching ATTOM property detail", {
      attomId,
      userId: request.auth.uid,
    });

    const propertyData = await fetchAttomPropertyDetail(attomId);
    const transformedProperty = transformAttomPropertyData(propertyData);

    return {
      success: true,
      property: transformedProperty,
    };
  } catch (error) {
    logger.error("Error fetching ATTOM property detail", error);
    throw new HttpsError(
        "internal",
        `Failed to fetch property details: ${error.message}`,
    );
  }
});

/**
 * Callable function to search properties using ATTOM API
 */
exports.searchAttomProperties = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const {
      address,
      city,
      state,
      zipCode,
      radius = 1,
      limit = 10,
    } = request.data;

    logger.info("Searching ATTOM properties", {
      address,
      city,
      state,
      zipCode,
      radius,
      limit,
      userId: request.auth.uid,
    });

    const properties = await searchAttomProperties(
        address,
        city,
        state,
        zipCode,
        radius,
        limit,
    );

    const transformedProperties = properties.map(transformAttomPropertyData);

    // Save valid properties to Firestore
    const db = admin.firestore();
    const batch = db.batch();
    let savedCount = 0;

    transformedProperties.forEach((property) => {
      // Only save properties with valid ATTOM ID and pricing information
      if (property.attomId && property.price > 0) {
        const ref = db.collection("properties")
            .doc(`attom_${property.attomId}`);
        batch.set(ref, property, {merge: true});
        savedCount++;
      }
    });

    if (savedCount > 0) {
      await batch.commit();
      logger.info("ATTOM properties saved to Firestore", {
        totalFetched: transformedProperties.length,
        savedToFirebase: savedCount,
      });
    } else {
      logger.warn("No valid ATTOM properties found to save", {
        totalFetched: transformedProperties.length,
      });
    }

    return {
      success: true,
      properties: transformedProperties,
      count: transformedProperties.length,
      savedToFirebase: savedCount,
    };
  } catch (error) {
    logger.error("Error searching ATTOM properties", error);
    throw new HttpsError(
        "internal",
        `Failed to search properties: ${error.message}`,
    );
  }
});

/**
 * Manual trigger function to import properties from ATTOM API for a city
 */
exports.fetchAttomPropertiesForCity = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError(
          "unauthenticated",
          "Authentication required",
      );
    }

    const {city, state, limit = 20} = request.data;

    if (!city || !state) {
      throw new HttpsError(
          "invalid-argument",
          "City and state are required",
      );
    }

    logger.info("Fetching ATTOM properties for city", {
      city,
      state,
      limit,
      userId: request.auth.uid,
    });

    // Search properties using postal code for the city
    const properties = await searchAttomProperties(
        null, // no specific address
        null, // no city
        null, // no state
        city === "Los Angeles" ? "90210" :
        city === "Miami" ? "33101" :
        city === "Phoenix" ? "85001" :
        city === "Atlanta" ? "30301" :
        city === "Dallas" ? "75201" :
        city === "Houston" ? "77001" :
        city === "Las Vegas" ? "89101" :
        city === "Orlando" ? "32801" :
        city === "San Antonio" ? "78201" :
        city === "Jacksonville" ? "32099" :
        city === "Charlotte" ? "28201" :
        city === "Memphis" ? "38101" :
        city === "Nashville" ? "37201" :
        city === "Denver" ? "80201" :
        city === "Indianapolis" ? "46201" : "90210", // default to LA
        5, // 5 mile radius
        limit,
    );

    const transformedProperties = properties.map(transformAttomPropertyData);

    // Save to Firestore
    const db = admin.firestore();
    const batch = db.batch();
    let importedCount = 0;

    transformedProperties.forEach((property) => {
      if (property.attomId && property.price > 0) {
        const ref = db.collection("properties")
            .doc(`attom_${property.attomId}`);
        batch.set(ref, property, {merge: true});
        importedCount++;
      }
    });

    if (importedCount > 0) {
      await batch.commit();
    }

    // Log statistics
    await db.collection("importStats").add({
      success: true,
      city: `${city}, ${state}`,
      propertiesFetched: properties.length,
      propertiesImported: importedCount,
      importSource: "attom_api",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      triggeredBy: request.auth.uid,
      triggerType: "manual_attom",
    });

    return {
      success: true,
      city: `${city}, ${state}`,
      propertiesFetched: properties.length,
      propertiesImported: importedCount,
      properties: transformedProperties,
    };
  } catch (error) {
    logger.error("Error fetching ATTOM properties for city", error);
    throw new HttpsError(
        "internal",
        `Failed to fetch ATTOM properties: ${error.message}`,
    );
  }
});
