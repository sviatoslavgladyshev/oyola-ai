import React, { useState, useEffect, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import CityCard from './CityCard';
import { US_CITIES } from '../../data/cities';
import { getCityPhotos } from '../../services/cityPhotoService';

const CityGrid = ({ onCitySelect, maxItems, compact = false, onSeeMore, autoRotate = true, rotateIntervalMs = 3000, autoRotateSpeed = 0.8 }) => {
  const [cities, setCities] = useState(US_CITIES);
  const gridRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const rafIdRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // Load city photos on mount
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const citiesWithPhotos = await getCityPhotos(US_CITIES);
        setCities(citiesWithPhotos);
      } catch (error) {
        console.error('Error loading city photos:', error);
        setCities(US_CITIES); // Fallback to original cities
      }
    };

    loadPhotos();
  }, []);

  // Create multiple copies for truly endless infinite scroll
  const visibleCities = maxItems ? cities.slice(0, maxItems) : cities;
  // Create 4 copies to ensure seamless infinite scrolling
  const duplicatedCities = [...visibleCities, ...visibleCities, ...visibleCities, ...visibleCities];

  // Auto-rotate carousel using rAF for ultra-smooth motion
  useEffect(() => {
    if (!autoRotate) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }
    
    if (visibleCities.length === 0) return;
    
    const timeoutIds = [];

    const startAnimation = (retryCount = 0) => {
      const el = gridRef.current;
      
      if (!el) {
        if (retryCount < 20) {
          const id = setTimeout(() => startAnimation(retryCount + 1), 50);
          timeoutIds.push(id);
        }
        return;
      }
      
      // Force layout calculation
      void el.offsetHeight;
      
      // Wait a bit for images to load if first attempt
      if (retryCount < 5) {
        const id = setTimeout(() => startAnimation(retryCount + 1), 150);
        timeoutIds.push(id);
        return;
      }
      
      const maxScroll = el.scrollWidth - el.clientWidth;
      
      // If still not ready after retries, force start anyway (will check again in step)
      if (maxScroll <= 0 && retryCount < 30) {
        const id = setTimeout(() => startAnimation(retryCount + 1), 100);
        timeoutIds.push(id);
        return;
      }

      // Clear any existing animation
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Start at 1/4 position (after first copy) for seamless looping
      const setSize = el.scrollWidth / 4;
      if (el.scrollLeft < setSize) {
        el.scrollLeft = setSize;
      }

      let lastScrollTime = null;
      
      const step = (currentTime) => {
        const currentEl = gridRef.current;
        if (!currentEl) {
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          return;
        }
        
        // Initialize time on first frame
        if (lastScrollTime === null) {
          lastScrollTime = currentTime;
        }
        
        // When hovered, pause smoothly - just keep the animation loop running but don't scroll
        if (isHovered) {
          lastScrollTime = currentTime;
          rafIdRef.current = requestAnimationFrame(step);
          return;
        }
        
        const totalWidth = currentEl.scrollWidth;
        const viewportWidth = currentEl.clientWidth;
        const maxScroll = totalWidth - viewportWidth;
        
        if (maxScroll <= 0) {
          rafIdRef.current = requestAnimationFrame(step);
          return;
        }
        
        // Calculate scroll increment based on time delta for smoother animation
        const deltaTime = currentTime - lastScrollTime;
        const scrollIncrement = (autoRotateSpeed / 16.67) * deltaTime; // Normalize to 60fps
        
        // Calculate reset points - we have 4 copies, so reset after 2.5 copies
        const singleSetWidth = totalWidth / 4;
        const resetPoint = singleSetWidth * 2.5; // Reset when we're 2.5 sets in
        let currentScroll = currentEl.scrollLeft;
        
        // Check if we need to reset for seamless infinite scroll
        if (currentScroll >= resetPoint) {
          // Reset to an earlier position seamlessly (user won't notice since content is identical)
          currentEl.scrollLeft = currentScroll - (singleSetWidth * 2);
          currentScroll = currentEl.scrollLeft;
        }
        
        // Continue scrolling from current position
        currentEl.scrollLeft = currentScroll + scrollIncrement;
        
        lastScrollTime = currentTime;
        rafIdRef.current = requestAnimationFrame(step);
      };

      rafIdRef.current = requestAnimationFrame(step);
    };

    // Start with delay to ensure DOM is ready
    timeoutIds.push(setTimeout(() => startAnimation(0), 200));

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
    };
  }, [autoRotate, isHovered, autoRotateSpeed, visibleCities.length, cities.length]);

  const scrollStep = (dir) => {
    const el = gridRef.current;
    if (!el) return;
    
    // Clear any existing pause timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    
    // Temporarily pause auto-scroll when user clicks arrow
    setIsHovered(true);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      pauseTimeoutRef.current = null;
    }, 2000);
    
    const firstChild = el.firstElementChild;
    const cardWidth = firstChild ? firstChild.getBoundingClientRect().width : 200;
    const gap = 16;
    const distance = (cardWidth + gap) * 2; // scroll 2 cards per click
    
    // Handle looping for left arrow
    if (dir === -1 && el.scrollLeft <= 10) {
      // If at start and going left, scroll to near the end (middle of duplicated content)
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollTo({ left: maxScroll / 2, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: dir * distance, behavior: 'smooth' });
    }
  };

  return (
    <div className={`city-grid-container ${compact ? 'compact' : ''}`}>
      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={() => scrollStep(-1)} aria-label="Previous cities">
          <HiChevronLeft size={24} />
        </button>
        <div 
          className="city-grid animate-on-load carousel"
          ref={gridRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ scrollBehavior: 'auto', scrollSnapType: 'none' }}
        >
          {duplicatedCities.map((city, index) => (
            <CityCard 
              key={`${city.id}-${index}`} 
              city={city} 
              onClick={onCitySelect}
            />
          ))}
        </div>
        <button className="carousel-arrow right" onClick={() => scrollStep(1)} aria-label="Next cities">
          <HiChevronRight size={24} />
        </button>
        <div className="carousel-fade left" />
        <div className="carousel-fade right" />
      </div>


      {compact && typeof onSeeMore === 'function' && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button className="header-nav-button" onClick={onSeeMore}>See more cities →</button>
        </div>
      )}
    </div>
  );
};

export default CityGrid;

