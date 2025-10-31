// Firebase Property Service (replacing Supabase)
import { functions, db } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

/**
 * Fetch properties from Zillow via Firebase Callable Function
 * @param {string} city - Optional city name
 * @param {string} state - Optional state abbreviation
 * @returns {Promise} Result with import stats
 */
export const fetchPropertiesFromZillow = async (city = null, state = null) => {
  try {
    const callFetch = httpsCallable(functions, 'fetchZillowPropertiesManual');
    const payload = city && state ? { city, state, location: `${city}, ${state}` } : {};
    const result = await callFetch(payload);
    return result.data;
  } catch (error) {
    console.error('Failed to fetch properties from Zillow (Firebase):', error);
    throw error;
  }
};

/**
 * Get all properties from Firestore with optional filters
 */
export const getAllProperties = async (filters = {}) => {
  try {
    const constraints = [where('status', '==', 'active')];

    if (filters.city) constraints.push(where('city', '==', filters.city));
    if (filters.propertyType) constraints.push(where('propertyType', '==', filters.propertyType));
    // Firestore doesn't support range filters mixed with orderBy without indexes; keep simple

    // Default ordering by lastUpdated desc if available, else importedAt
    const q = query(
      collection(db, 'properties'),
      ...constraints,
      orderBy('lastUpdated', 'desc')
    );

    const snap = await getDocs(q);
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Client-side numeric filters (min/max price, bedrooms, bathrooms)
    if (filters.minPrice) items = items.filter(p => (p.price || 0) >= filters.minPrice);
    if (filters.maxPrice) items = items.filter(p => (p.price || 0) <= filters.maxPrice);
    if (filters.bedrooms) items = items.filter(p => (p.bedrooms || 0) >= filters.bedrooms);
    if (filters.bathrooms) items = items.filter(p => (p.bathrooms || 0) >= filters.bathrooms);

    return items;
  } catch (error) {
    console.error('Failed to get properties (Firebase):', error);
    throw error;
  }
};

/** Get motivated seller properties */
export const getMotivatedSellers = async (limit = 20) => {
  try {
    const q = query(
      collection(db, 'properties'),
      where('status', '==', 'active'),
      where('isMotivatedSeller', '==', true),
      orderBy('opportunityScore', 'desc'),
      fsLimit(limit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Failed to get motivated sellers (Firebase):', error);
    throw error;
  }
};

/** Get properties by city */
export const getPropertiesByCity = async (city, limit = 50) => {
  try {
    const q = query(
      collection(db, 'properties'),
      where('status', '==', 'active'),
      where('city', '==', city),
      orderBy('opportunityScore', 'desc'),
      fsLimit(limit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Failed to get properties by city (Firebase):', error);
    throw error;
  }
};

/** Get property by document id (e.g., zillow_<id>) */
export const getPropertyById = async (id) => {
  try {
    const ref = doc(db, 'properties', id);
    const d = await getDoc(ref);
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() };
  } catch (error) {
    console.error('Failed to get property (Firebase):', error);
    throw error;
  }
};

/** Get import statistics */
export const getImportStats = async (limit = 30) => {
  try {
    const q = query(
      collection(db, 'importStats'),
      orderBy('timestamp', 'desc'),
      fsLimit(limit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Failed to get import stats (Firebase):', error);
    throw error;
  }
};

/** Simple search across address, city, description (client-side filter) */
export const searchProperties = async (searchTerm) => {
  try {
    const q = query(
      collection(db, 'properties'),
      where('status', '==', 'active'),
      orderBy('lastUpdated', 'desc'),
      fsLimit(200)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const term = (searchTerm || '').toLowerCase();
    return items.filter(p => (
      (p.address || '').toLowerCase().includes(term) ||
      (p.city || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    ));
  } catch (error) {
    console.error('Failed to search properties (Firebase):', error);
    throw error;
  }
};

/** Aggregate basic city stats (client-side) */
export const getCityStats = async () => {
  try {
    const q = query(
      collection(db, 'properties'),
      where('status', '==', 'active'),
      fsLimit(1000)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const statsMap = {};
    for (const p of items) {
      const city = p.city || 'Unknown';
      if (!statsMap[city]) {
        statsMap[city] = {
          city,
          state: p.state || '',
          total: 0,
          motivated: 0,
          totalPrice: 0,
          avgPrice: 0,
        };
      }
      statsMap[city].total += 1;
      if (p.isMotivatedSeller) statsMap[city].motivated += 1;
      statsMap[city].totalPrice += p.price || 0;
    }

    return Object.values(statsMap).map(s => ({
      ...s,
      avgPrice: s.total > 0 ? Math.round(s.totalPrice / s.total) : 0,
    }));
  } catch (error) {
    console.error('Failed to get city stats (Firebase):', error);
    return [];
  }
};

