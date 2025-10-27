const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers
setGlobalOptions({ maxInstances: 10 });

/**
 * Cloud Function to send offer notifications to property owners
 * This function would be triggered when a buyer submits an offer
 */
exports.sendOfferToOwners = onCall(async (request) => {
  try {
    const { offers, buyerInfo } = request.data;
    
    logger.info("Processing offer submissions", {
      offerCount: offers.length,
      buyer: buyerInfo.email
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
          offerAmount: offer.offerAmount
        });

        // Example email content
        const emailContent = {
          to: `owner-${offer.property.id}@example.com`, // Would come from property owner data
          subject: `New Purchase Offer for ${offer.property.title}`,
          body: `
            Hello Property Owner,
            
            You have received a new purchase offer for your property: ${offer.property.title}
            
            Buyer Information:
            - Name: ${buyerInfo.name}
            - Email: ${buyerInfo.email}
            - Phone: ${buyerInfo.phone}
            
            Offer Details:
            - Offer Amount: $${offer.offerAmount.toLocaleString()}
            - Financing Type: ${offer.financingType}
            - Closing Timeline: ${offer.closingTimeline}
            - Contingencies: ${offer.contingencies.join(', ') || 'None'}
            
            ${offer.offerMessage ? `Personal Message:\n${offer.offerMessage}` : ''}
            
            Please log in to your dashboard to review and respond to this offer.
            
            Best regards,
            Property Offer Platform Team
          `
        };

        // Here you would actually send the email
        // await sendEmail(emailContent);
        
        return {
          propertyId: offer.property.id,
          status: 'sent',
          sentAt: new Date().toISOString()
        };
      })
    );

    return {
      success: true,
      message: `Successfully sent ${results.length} offers to property owners`,
      results: results
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
  const { offerId } = req.query;
  
  if (!offerId) {
    res.status(400).send({ error: "Offer ID is required" });
    return;
  }

  logger.info("Tracking offer view", { offerId });

  // In a real app, update Firestore with view timestamp
  // await admin.firestore().collection('offers').doc(offerId).update({
  //   status: 'viewed',
  //   viewedAt: admin.firestore.FieldValue.serverTimestamp()
  // });

  res.send({ success: true, message: "Offer view tracked" });
});

/**
 * Callable function to handle owner responses to offers
 */
exports.respondToOffer = onCall(async (request) => {
  try {
    const { offerId, response, ownerMessage } = request.data;
    
    logger.info("Processing owner response", {
      offerId,
      response
    });

    // In a real implementation:
    // 1. Update offer status in Firestore
    // 2. Send notification to buyer
    // 3. Create activity log

    // Example notification to buyer
    const buyerNotification = {
      subject: response === 'accepted' ? 
        'Great News! Your Offer Was Accepted' : 
        'Update on Your Property Offer',
      body: `
        Your offer has been ${response}.
        ${ownerMessage ? `\nOwner's message: ${ownerMessage}` : ''}
      `
    };

    // Send notification
    // await sendEmail(buyerNotification);

    return {
      success: true,
      message: `Offer ${response} successfully`,
      notification: buyerNotification
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
    message: "Follow-up checks completed" 
  });
});
