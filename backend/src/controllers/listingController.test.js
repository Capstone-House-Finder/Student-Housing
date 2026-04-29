/**
 * Simple test to verify controller exports work.
 */
import { describe, it, expect } from '@jest/globals';
import * as listingController from './listingController.js';

describe('Listing Controller', () => {
  it('should export all required functions', () => {
    expect(typeof listingController.createListing).toBe('function');
    expect(typeof listingController.getListing).toBe('function');
    expect(typeof listingController.updateListing).toBe('function');
    expect(typeof listingController.deleteListing).toBe('function');
    expect(typeof listingController.listAll).toBe('function');
  });
});
