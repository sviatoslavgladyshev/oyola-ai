#!/bin/bash

# Set ATTOM API key as Firebase secret
echo "Setting ATTOM API key as Firebase secret..."
firebase functions:secrets:set ATTOM_API_KEY

# When prompted, enter: 23364207340238528444c4ccd88cb02f

echo "Secret set successfully!"
echo "Now redeploy functions:"
echo "firebase deploy --only functions"
