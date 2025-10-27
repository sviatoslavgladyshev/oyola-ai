# Reusable Components Documentation

This project uses a component-based architecture with global CSS styling for maximum reusability and maintainability.

## Architecture Overview

### Global CSS System
All styles are centralized in `src/index.css`, eliminating the need for component-specific CSS files. This approach provides:
- **Consistency**: Uniform styling across the entire application
- **Easy Maintenance**: Change styles in one place
- **No Specificity Issues**: Clear, predictable CSS cascade
- **Better Performance**: Single CSS file reduces HTTP requests

### Component Structure

## Core Reusable Components

### 1. Card Component (`Card.js`)
A highly flexible card component with composable subcomponents.

**Usage:**
```jsx
import Card from './components/Card';

<Card>
  <Card.Image src="image.jpg" alt="Description" badge="Featured" />
  <Card.Content>
    <Card.Title>Card Title</Card.Title>
    <Card.Subtitle>Subtitle text</Card.Subtitle>
    <Card.Description>Description text</Card.Description>
    <Card.Specs>
      <Card.Spec>Spec 1</Card.Spec>
      <Card.Spec>Spec 2</Card.Spec>
    </Card.Specs>
    <Card.Price>$99.99</Card.Price>
  </Card.Content>
</Card>
```

**Subcomponents:**
- `Card.Image` - Image with optional badge overlay
- `Card.Content` - Main content wrapper
- `Card.Title` - Title heading
- `Card.Subtitle` - Subtitle text
- `Card.Description` - Longer description text
- `Card.Specs` - Container for specifications
- `Card.Spec` - Individual specification item
- `Card.Price` - Price display

### 2. Button Component (`Button.js`)
A versatile button component with multiple variants.

**Usage:**
```jsx
import Button from './components/Button';

// Primary button
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>

// Filter button with active state
<Button variant="filter" active={isActive} onClick={handleFilter}>
  Filter
</Button>

// Reset button
<Button variant="reset" onClick={handleReset}>
  Reset
</Button>
```

**Props:**
- `variant`: 'default' | 'filter' | 'reset' | 'primary'
- `active`: boolean - highlights the button (used with filter variant)
- `onClick`: function - click handler
- `className`: string - additional CSS classes
- `type`: 'button' | 'submit' | 'reset'

### 3. FilterPanel Component (`FilterPanel.js`)
A container for filter controls with composable subcomponents.

**Usage:**
```jsx
import FilterPanel from './components/FilterPanel';

<FilterPanel title="Filters" onReset={handleReset}>
  <FilterPanel.Group label="Category">
    <select>
      <option>All</option>
      <option>Category 1</option>
    </select>
  </FilterPanel.Group>
  
  <FilterPanel.Group label="Price Range">
    <FilterPanel.InputGroup>
      <input type="number" placeholder="Min" />
      <span>to</span>
      <input type="number" placeholder="Max" />
    </FilterPanel.InputGroup>
  </FilterPanel.Group>
  
  <FilterPanel.Group label="Options">
    <FilterPanel.ButtonGroup>
      <Button variant="filter" active={true}>Option 1</Button>
      <Button variant="filter">Option 2</Button>
    </FilterPanel.ButtonGroup>
  </FilterPanel.Group>
</FilterPanel>
```

**Subcomponents:**
- `FilterPanel.Group` - Groups related filter controls with optional label
- `FilterPanel.InputGroup` - Horizontal layout for multiple inputs
- `FilterPanel.ButtonGroup` - Groups filter buttons

## Domain-Specific Components

### PropertyCard Component
Built using the reusable `Card` component, specialized for property listings.

### PropertyFilters Component
Built using the reusable `FilterPanel` and `Button` components, specialized for property filtering.

## Global CSS Classes

### Layout Classes
- `.container` - Main content container with responsive grid
- `.sidebar` - Sticky sidebar layout
- `.main-content` - Main content area

### Card Classes
- `.card` - Base card styling
- `.card-image` - Image container
- `.card-badge` - Overlay badge
- `.card-content` - Content wrapper
- `.card-title` - Title styling
- `.card-subtitle` - Subtitle styling
- `.card-description` - Description text
- `.card-specs` - Specs container
- `.card-spec` - Individual spec item
- `.card-price` - Price styling

### Button Classes
- `.btn` - Base button styling
- `.btn-filter` - Filter button variant
- `.btn-reset` - Reset button variant
- `.btn-primary` - Primary action button
- `.active` - Active state modifier

### Filter Classes
- `.filter-panel` - Filter container
- `.filter-header` - Filter header with title and reset
- `.filter-group` - Individual filter group
- `.input-group` - Horizontal input layout
- `.button-group` - Button group layout

### Utility Classes
- `.empty-state` - Empty state container
- `.empty-state-icon` - Empty state icon
- `.property-grid` - Grid layout for properties
- `.results-header` - Results header with count
- `.result-count` - Result count badge

## Creating New Components

When creating new components:

1. **Use existing global CSS classes** where possible
2. **Compose from reusable components** (Card, Button, FilterPanel)
3. **Add new global classes** to `index.css` if needed
4. **Follow naming conventions**: `.component-element` or `.component-modifier`

## Benefits of This Architecture

1. **Reusability**: Components can be used anywhere in the app
2. **Consistency**: Global CSS ensures uniform appearance
3. **Maintainability**: Single source of truth for styles
4. **Flexibility**: Composable components adapt to different needs
5. **Performance**: No duplicate CSS, smaller bundle size
6. **Developer Experience**: Easy to understand and modify

## Example: Creating a New Feature

To create a product listing feature, you can reuse existing components:

```jsx
import Card from './components/Card';
import FilterPanel from './components/FilterPanel';
import Button from './components/Button';

const ProductCard = ({ product }) => (
  <Card>
    <Card.Image src={product.image} alt={product.name} badge={product.category} />
    <Card.Content>
      <Card.Title>{product.name}</Card.Title>
      <Card.Description>{product.description}</Card.Description>
      <Card.Price>${product.price}</Card.Price>
    </Card.Content>
  </Card>
);

const ProductFilters = ({ filters, onFilterChange, onReset }) => (
  <FilterPanel title="Filter Products" onReset={onReset}>
    <FilterPanel.Group label="Category">
      <select value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)}>
        <option>All</option>
        <option>Electronics</option>
        <option>Clothing</option>
      </select>
    </FilterPanel.Group>
  </FilterPanel>
);
```

No new CSS needed - everything uses global classes!

