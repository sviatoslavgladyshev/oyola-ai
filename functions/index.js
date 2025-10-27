const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {defineString} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {Resend} = require("resend");

// Initialize Firebase Admin
admin.initializeApp();

// Define environment variables
const resendApiKey = defineString("RESEND_API_KEY");
const appUrl = defineString("APP_URL", {default: "https://sviatoslavgladyshev.github.io/oyola-ai"});

// For cost control, you can set the maximum number of containers
setGlobalOptions({maxInstances: 10});

/**
 * Cloud Function to send offer notifications to property owners
 * This function would be triggered when a buyer submits an offer
 */
exports.sendOfferToOwners = onCall(async (request) => {
  try {
    const {offers, buyerInfo} = request.data;

    logger.info("Processing offer submissions", {
      offerCount: offers.length,
      buyer: buyerInfo.email,
    });

    // In a real implementation, this would:
    // 1. Send emails to property owners using SendGrid, Mailgun, or similar
    // 2. Send SMS notifications using Twilio
    // 3. Create in-app notifications
    // 4. Store offer records in Firestore

    const results = await Promise.all(
        offers.map(async (offer) => {
        // Simulate sending email
          logger.info("Sending offer to property owner", {
            propertyId: offer.property.id,
            propertyTitle: offer.property.title,
            offerAmount: offer.offerAmount,
          });

          // Email sending would happen here
          // Example: await sendEmail({
          //   to: owner email,
          //   subject: 'New Purchase Offer',
          //   body: offer details...
          // });

          return {
            propertyId: offer.property.id,
            status: "sent",
            sentAt: new Date().toISOString(),
          };
        }),
    );

    return {
      success: true,
      message: `Successfully sent ${results.length} offers to property owners`,
      results: results,
    };
  } catch (error) {
    logger.error("Error sending offers", error);
    throw new Error("Failed to send offers to property owners");
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
    throw new Error("Failed to process owner response");
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
exports.sendWelcomeEmail = onDocumentCreated(
    "users/{userId}",
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
              <a href="${appUrl.value()}" class="button">
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
        
        Get started at: ${appUrl.value()}
        
        Best regards,
        The Property Offer Platform Team
      `,
        };

        // Send email with Resend
        const resend = new Resend(resendApiKey.value());

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

        return {
          success: true,
          message: "Welcome email sent",
        };
      } catch (error) {
        logger.error("Error sending welcome email", error);
        // Don't throw error - don't fail user creation
        return {
          success: false,
          error: error.message,
        };
      }
    },
);
