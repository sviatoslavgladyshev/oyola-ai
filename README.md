# 🏡 Automated Property Offer Platform

An intelligent platform that enables property buyers to automatically find matching properties and send purchase offers to owners without manual searching. Built with React and designed for modern real estate transactions.

## ✨ Features

- 🔍 **Smart Property Matching** - Automatically find properties based on your criteria
- 📨 **Automated Outreach** - Send offers to multiple property owners instantly
- 📊 **Offer Dashboard** - Track all your offers in one place with timeline view
- 👤 **Dual User Types** - Separate experiences for buyers and property owners
- 🎨 **Modern UI** - Beautiful, responsive design with smooth animations
- 🏗️ **Well-Organized** - Clean architecture with reusable components

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/oyola-ai.git
cd oyola-ai

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Create optimized production build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.js    # Versatile button with variants
│   │   ├── Card.js      # Flexible card component
│   │   └── FilterPanel.js # Form panel with groups
│   ├── layout/          # Global layout components
│   │   ├── Header.js    # App header with user menu
│   │   └── Notification.js # Toast notifications
│   └── features/        # Feature-specific components
│       ├── OfferForm.js
│       ├── OfferResults.js
│       ├── OfferDetail.js
│       └── PropertyCard.js
├── pages/               # Page components
│   ├── SignIn.js
│   ├── SignUp.js
│   ├── OwnerDashboard.js
│   └── Profile.js
├── services/            # Business logic & API
│   ├── authService.js
│   ├── propertyService.js
│   └── offerService.js
├── config/              # Configuration & constants
│   └── constants.js     # Global constants
├── utils/               # Utility functions
│   └── formatters.js    # Formatting utilities
└── data/                # Sample data
    └── properties.js
```

## 🎯 How It Works

### For Buyers

1. **Sign up** and specify your property criteria
2. **Set your offer details** - amount, financing, timeline, contingencies
3. **Submit** - The system automatically finds matching properties
4. **Track responses** - Monitor offer status in real-time

### For Property Owners

1. **List your property** with details and photos
2. **Receive offers** automatically from interested buyers
3. **Review and respond** - Accept, decline, or counter-offer
4. **Manage** all offers in one dashboard

## 🏗️ Architecture Highlights

### Component Organization

- **UI Components**: Reusable presentational components (`Button`, `Card`, `FilterPanel`)
- **Layout Components**: Global elements like `Header` and `Notification`
- **Feature Components**: Domain-specific components for offers and properties
- **Pages**: Top-level page views for authentication and dashboards

### Global Constants & Utilities

All dropdown options, formatting functions, and reusable values are centralized in:
- `src/config/constants.js` - Property types, locations, financing options, etc.
- `src/utils/formatters.js` - Price formatting, date formatting, status colors

**Benefits:**
- Change values in one place to update everywhere
- No hardcoded strings scattered across components
- Consistent formatting throughout the app

### Barrel Exports

Clean imports using `index.js` files:

```javascript
// Instead of:
import Button from './components/ui/Button';
import Card from './components/ui/Card';

// You can use:
import { Button, Card } from './components/ui';
```

## 🎨 Styling

All styles are in `src/index.css` using a global CSS approach:
- Single source of truth for all styles
- No component-specific CSS files
- Consistent design across the app
- Easy to maintain and update

## 🔧 Technologies Used

- **React 19.2** - Modern React with latest features
- **Firebase** - Authentication and backend services
- **Create React App** - Build tooling
- **GitHub Pages** - Hosting & deployment

## 📝 Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run deploy`
Deploys the production build to GitHub Pages

### `npm run eject`
**One-way operation** - Ejects from Create React App for full configuration control

## 🌐 Deployment to GitHub Pages

The app is configured for GitHub Pages deployment:

1. **Update package.json** with your repository URL:
```json
"homepage": "https://yourusername.github.io/oyola-ai"
```

2. **Deploy:**
```bash
npm run deploy
```

Your app will be live at the URL specified in `homepage`!

## 🔐 Authentication

Currently using local storage for demo purposes. For production:
- Firebase Authentication integration ready
- User roles (buyer/owner) supported
- Profile management included

## 🚀 Future Enhancements

- [ ] Email notifications via SendGrid
- [ ] SMS alerts via Twilio
- [ ] Real-time chat between buyers and owners
- [ ] Document upload (pre-approval letters)
- [ ] Appointment scheduling
- [ ] Payment integration
- [ ] Advanced search filters
- [ ] Saved searches & alerts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use and modify for your projects!

## 🙋‍♂️ Support

For questions or issues, please create an issue in the GitHub repository.

---

Built with ❤️ using React
