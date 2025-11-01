# Lovable Website Creation Prompt for Oyola AI

## Project Overview

Create a modern, responsive marketing website for **Oyola AI**, a real estate technology platform that automates property offer management. The site should be built using React (or Next.js if preferred) with a component-based architecture, modern styling (Tailwind CSS or styled-components), and full responsiveness.

## Company Information

**Company Name:** Oyola AI  
**Industry:** Real Estate Technology / PropTech  
**Product:** SaaS Platform - Automated Property Offer Management System  
**Contact Email:** support@oyola.ai  
**Website Purpose:** Marketing site to attract buyers and property owners to the platform

## Business Description

Oyola AI is an intelligent real estate technology platform that revolutionizes property transactions by automating the offer process. The platform connects property buyers with property owners, enabling buyers to automatically find matching properties and send purchase offers without manual searching, while giving property owners a streamlined dashboard to manage and respond to offers.

**Mission:** To simplify and accelerate real estate transactions through intelligent automation, making property buying and selling more efficient, transparent, and accessible for everyone.

## Technical Stack Requirements

- **Framework:** React (or Next.js for SEO benefits)
- **Styling:** Tailwind CSS (preferred) or styled-components
- **Icons:** React Icons (react-icons) - use Heroicons outline/solid variants
- **Animations:** Framer Motion or CSS transitions
- **Forms:** React Hook Form with validation
- **Responsive:** Mobile-first approach, fully responsive
- **SEO:** Proper meta tags, semantic HTML, structured data

## Design System

### Color Palette

```css
/* Primary Colors */
--primary: #667eea;          /* Purple-blue - main brand color */
--primary-dark: #5568d3;    /* Darker shade for hover states */
--primary-light: #7c8ff0;   /* Lighter shade for backgrounds */

/* Neutral Colors */
--dark: #111827;             /* Dark background (charcoal) */
--dark-light: #1f2937;      /* Slightly lighter dark */
--gray-100: #f3f4f6;        /* Light backgrounds */
--gray-200: #e5e7eb;        /* Borders */
--gray-600: #4b5563;        /* Secondary text */
--gray-800: #1f2937;        /* Primary text on light bg */
--white: #ffffff;

/* Status Colors */
--success: #10b981;          /* Green - accepted/positive */
--error: #ef4444;           /* Red - declined/negative */
--warning: #f59e0b;         /* Orange - pending/warning */
--info: #3b82f6;            /* Blue - informational */
```

### Typography

- **Headings:** Modern sans-serif (Inter, Poppins, or system font stack)
- **Body:** Same sans-serif family, readable at 16px base
- **Font Sizes:**
  - Hero: 3.5rem - 4.5rem (56px - 72px)
  - H1: 2.5rem - 3rem (40px - 48px)
  - H2: 2rem - 2.5rem (32px - 40px)
  - H3: 1.5rem - 2rem (24px - 32px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

### Spacing & Layout

- Use consistent spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
- Max content width: 1200px - 1400px for main content
- Container padding: 16px mobile, 24px tablet, 32px desktop

### Component Styles

**Buttons:**
- Primary: `#667eea` background, white text, rounded-lg (8px), padding: 12px 24px
- Secondary: Transparent with border, `#667eea` border and text
- Ghost: Transparent background, `#667eea` text on hover
- Hover effects: Scale transform (1.02) or slight elevation increase

**Cards:**
- White or dark background based on section
- Border radius: 12px - 16px
- Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- Padding: 24px - 32px
- Hover: Slight elevation increase

**Input Fields:**
- Rounded: 8px
- Border: 1px solid `#e5e7eb`
- Focus: Border color `#667eea`, ring shadow
- Padding: 12px 16px

## Page Structure & Components

### 1. Homepage (`/`)

#### Hero Section Component
```jsx
// Full-width hero with gradient background
<HeroSection>
  - Headline: "Automate Your Property Offers with AI-Powered Matching"
  - Subheadline: "Find properties, submit offers, and track responses—all automatically. Save hours of manual searching with intelligent property matching."
  - CTA Buttons: 
    * Primary: "Start as Buyer" (links to /buyers or signup)
    * Secondary: "List Property as Owner" (links to /owners or signup)
  - Hero Image: Dashboard screenshot or animated illustration
  - Background: Gradient from #667eea to #764ba2 or subtle pattern
  - Animation: Fade in on scroll or subtle parallax
```

#### Problem/Solution Section
```jsx
<ProblemSolutionSection>
  - Two-column layout (image left, content right on desktop)
  - Headline: "The Problem with Traditional Real Estate"
  - List pain points:
    * Manual property searching is time-consuming
    * No centralized offer tracking
    * Missed opportunities
    * Inefficient communication
  - Solution introduction leading to next section
```

#### How It Works Section
```jsx
<HowItWorksSection>
  - Headline: "How Oyola AI Works"
  - 4-step process with icons and descriptions:
    1. "Sign Up & Set Criteria" - User profile and search preferences
    2. "AI Finds Matches" - Automated property matching
    3. "Submit Offers Automatically" - Batch offer submission
    4. "Track in Real-Time" - Dashboard with status updates
  - Visual: Numbered steps with connecting line/arrow
  - Use icons from react-icons (HiOutlineCheckCircle, HiOutlineSearch, etc.)
```

#### Features Grid Section
```jsx
<FeaturesGridSection>
  - Headline: "Everything You Need to Close Deals Faster"
  - Grid: 2 columns mobile, 3 columns desktop
  - Feature cards with:
    * Icon (HiOutline icons)
    * Title
    * Description
  - Features:
    1. "Smart Property Matching" - AI-powered search
    2. "Automated Outreach" - Send multiple offers instantly
    3. "Real-Time Tracking" - Status updates and notifications
    4. "Dual User Experience" - Separate dashboards for buyers/owners
    5. "Location-Based Search" - City, state, or geolocation
    6. "Flexible Offer Options" - Multiple financing types and timelines
```

#### Stats Section
```jsx
<StatsSection>
  - Background: Dark section (#111827) or gradient
  - Animated counters (use framer-motion or similar)
  - 3-4 key metrics:
    * "10,000+ Properties" (or placeholder)
    * "5,000+ Offers Submitted"
    * "1,000+ Active Users"
    * "95% Time Saved"
```

#### Testimonials Section
```jsx
<TestimonialsSection>
  - Headline: "What Our Users Say"
  - Carousel or grid of testimonial cards
  - Each card: Avatar, name, role, quote, rating (stars)
  - Sample testimonials (placeholder content):
    * Buyer testimonial
    * Owner testimonial
    * Investor testimonial
```

#### CTA Section
```jsx
<CTASection>
  - Background: Gradient or primary color
  - Headline: "Ready to Transform Your Property Search?"
  - Subheadline: "Join thousands of users automating their real estate transactions"
  - Primary CTA: "Get Started Free"
  - Secondary link: "Schedule a Demo"
```

### 2. Navigation Component

```jsx
<Header>
  - Logo: Left side (use logo.png from public folder or placeholder)
  - Navigation Links: 
    * Home
    * For Buyers (dropdown: Features, How It Works, Pricing)
    * For Owners (dropdown: Features, How It Works, Pricing)
    * About
    * Contact
  - CTA Button: "Get Started" (right side)
  - Mobile: Hamburger menu with slide-out drawer
  - Sticky header: Shadow on scroll
```

### 3. For Buyers Page (`/buyers`)

```jsx
<BuyersPage>
  - Hero: Buyer-focused headline and CTA
  - Benefits Section: List of buyer-specific benefits
  - Features Detail: Expanded feature descriptions
  - Property Types Section: Visual showcase of supported types
  - Offer Tracking Demo: Screenshot or mockup of dashboard
  - Pricing Section: If applicable
  - FAQ Section: Buyer-specific questions
  - CTA: "Start Your Property Search"
```

### 4. For Owners Page (`/owners`)

```jsx
<OwnersPage>
  - Hero: Owner-focused headline and CTA
  - Benefits Section: List of owner-specific benefits
  - Dashboard Demo: Screenshot or mockup of owner dashboard
  - Offer Management Features: Detailed explanation
  - Listing Process: How to add properties
  - Pricing Section: If applicable
  - FAQ Section: Owner-specific questions
  - CTA: "List Your Property"
```

### 5. How It Works Page (`/how-it-works`)

```jsx
<HowItWorksPage>
  - Two tabs or sections: "For Buyers" and "For Owners"
  - Step-by-step visual process for each
  - Animated diagrams or illustrations
  - Video placeholder or GIF showing workflow
  - FAQ Section at bottom
```

### 6. Features Page (`/features`)

```jsx
<FeaturesPage>
  - Hero: "Powerful Features for Modern Real Estate"
  - Detailed feature cards with icons, descriptions, benefits
  - Comparison table: "Oyola AI vs Traditional Methods"
  - Screenshots/mockups of platform
  - Integration capabilities section
```

### 7. About Page (`/about`)

```jsx
<AboutPage>
  - Company story and mission
  - Vision and values
  - Team section (if applicable) or "Built by real estate experts"
  - Technology highlights
  - Timeline/milestones (if applicable)
```

### 8. Contact Page (`/contact`)

```jsx
<ContactPage>
  - Two-column layout:
    * Left: Contact form (React Hook Form)
      - Name (required)
      - Email (required, validated)
      - Subject/Inquiry Type (dropdown)
      - Message (required, textarea)
      - Submit button
    * Right: Contact information
      - Email: support@oyola.ai
      - Office address (if applicable)
      - Response time expectations
  - FAQ section below form
```

### 9. Footer Component

```jsx
<Footer>
  - 4-column layout desktop, stacked mobile:
    * Company: Logo, mission statement
    * Product: Links to key pages
    * Resources: Blog, FAQ, Documentation
    * Legal: Privacy, Terms, Contact
  - Social media links (if applicable)
  - Copyright: "© {year} Oyola AI. All rights reserved."
  - Background: Dark (#111827)
```

## Reusable Components to Create

1. **Button** - Variants: primary, secondary, ghost, outline
2. **Card** - Flexible card with optional image, icon, footer
3. **Section** - Wrapper with consistent spacing and max-width
4. **FeatureCard** - Specialized card for features grid
5. **TestimonialCard** - Card for testimonials
6. **CTA** - Reusable call-to-action section
7. **Container** - Max-width container with padding
8. **Input** - Form input with validation styling
9. **Textarea** - Form textarea component
10. **Modal** - For signup/login modals if needed

## Responsive Breakpoints

```css
Mobile: < 640px (default, mobile-first)
Tablet: 640px - 1024px
Desktop: > 1024px
Large Desktop: > 1280px
```

## Animations & Interactions

- **Page Load:** Fade in content (stagger children)
- **Scroll Animations:** Fade in elements when they enter viewport (Intersection Observer)
- **Hover Effects:** 
  - Buttons: Scale 1.02, shadow increase
  - Cards: Elevation increase, slight scale
  - Links: Color transition
- **Smooth Scrolling:** Enable for anchor links
- **Loading States:** Skeleton loaders for async content

## Content & Copy

### Headlines:
- "The Future of Property Offers is Automated"
- "Find Properties, Submit Offers, Close Deals - All in One Platform"
- "Real Estate Transactions Made Simple with AI"
- "Save Time. Make Offers. Close Deals."

### Value Propositions:
- "Stop manually searching for properties. Let AI find them for you."
- "Send offers to multiple properties in seconds, not hours."
- "Real-time tracking keeps you informed every step of the way."
- "For buyers: Find properties faster. For owners: Manage offers smarter."

### Key Messaging:
- Emphasize speed and efficiency
- Highlight automation and AI intelligence
- Focus on time-saving benefits
- Build trust through transparency and real-time updates
- Appeal to both sides of the marketplace

## SEO Requirements

### Meta Tags:
```html
<title>Oyola AI - Automated Property Offer Management Platform</title>
<meta name="description" content="Automate your property offers with AI-powered matching. Find properties, submit offers, and track responses in real-time. Join thousands of buyers and property owners." />
<meta name="keywords" content="automated property offers, real estate automation, property investment platform, AI property matching, real estate technology" />
```

### Structured Data:
- Organization schema
- Product schema
- FAQ schema (for FAQ sections)

### Semantic HTML:
- Use proper heading hierarchy (h1, h2, h3)
- Use semantic elements (nav, header, main, section, article, footer)
- Alt text for all images
- ARIA labels where appropriate

## Form Handling

### Contact Form:
- Use React Hook Form for validation
- Email validation (regex pattern)
- Required field indicators
- Error message display
- Success message on submit
- Optional: Integrate with email service (Formspree, SendGrid, etc.)

### Lead Capture:
- Newsletter signup (email only)
- Demo request form
- Both should have clear value proposition

## Performance Requirements

- **Lazy Loading:** Images below fold should lazy load
- **Code Splitting:** Route-based code splitting (if using Next.js)
- **Image Optimization:** Use next/image or similar for responsive images
- **Font Loading:** Optimize font loading (preload, font-display: swap)
- **Minimal Bundle Size:** Tree-shake unused code
- **Load Time Target:** < 3 seconds on 3G connection

## Accessibility Requirements

- **WCAG 2.1 AA Compliance:**
  - Color contrast ratios: 4.5:1 for text, 3:1 for UI components
  - Keyboard navigation support
  - Screen reader compatibility
  - Focus indicators visible
  - Alt text for images
- **ARIA Labels:** Where semantic HTML isn't sufficient
- **Skip Links:** For main content navigation

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Integration Points

- **Analytics:** Google Analytics or similar (placeholder ready)
- **Email Service:** Contact form submission handling
- **Chat/Support:** Optional live chat widget integration point
- **Social Media:** Social sharing meta tags, Open Graph tags

## Implementation Notes

1. **Start with mobile-first design** - Build for mobile, enhance for desktop
2. **Use consistent spacing** - Establish spacing system early
3. **Component composition** - Build small, reusable components
4. **State management** - Use React hooks (useState, useEffect) or context for global state
5. **Routing** - Use React Router or Next.js routing
6. **Environment variables** - For API keys, contact form endpoints, etc.
7. **Error boundaries** - Implement error boundaries for better UX
8. **404 Page** - Create a custom 404 page

## Optional Enhancements

- **Blog Section:** For SEO and content marketing
- **Case Studies:** Success stories from users
- **Video Section:** Demo videos or explainer videos
- **Interactive Demo:** Embedded iframe or link to sandbox
- **Pricing Calculator:** Interactive pricing tool
- **Resource Library:** Downloads, guides, whitepapers

## Deliverables Checklist

- [ ] Responsive homepage with all sections
- [ ] Navigation component (desktop & mobile)
- [ ] Footer component
- [ ] For Buyers page
- [ ] For Owners page
- [ ] How It Works page
- [ ] Features page
- [ ] About page
- [ ] Contact page with form
- [ ] Privacy Policy page (can link to external or include content)
- [ ] Terms of Service page (can link to external or include content)
- [ ] 404 error page
- [ ] SEO optimization (meta tags, structured data)
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility
- [ ] Accessibility compliance
- [ ] Performance optimization
- [ ] Form validation and error handling

---

## Quick Start Instructions for Lovable

1. **Initialize Project:**
   - Create new React project (or Next.js)
   - Install dependencies: tailwindcss, react-icons, framer-motion, react-hook-form
   - Set up Tailwind CSS configuration with custom colors

2. **Set Up Structure:**
   - Create component folders (components/common, components/sections, components/layout)
   - Set up pages folder
   - Configure routing

3. **Build Components:**
   - Start with layout components (Header, Footer)
   - Build reusable UI components (Button, Card, Input)
   - Create section components (Hero, Features, Testimonials)
   - Assemble pages using components

4. **Style & Polish:**
   - Apply design system colors and typography
   - Add animations and transitions
   - Test responsiveness at all breakpoints
   - Optimize images and assets

5. **SEO & Performance:**
   - Add meta tags to all pages
   - Implement structured data
   - Optimize bundle size
   - Test performance metrics

6. **Final Checks:**
   - Test all forms and links
   - Verify mobile experience
   - Check accessibility
   - Validate HTML/CSS

---

This prompt provides comprehensive specifications for creating a modern, professional marketing website for Oyola AI using Lovable's component-based development approach. Focus on clean code, reusable components, and excellent user experience across all devices.

