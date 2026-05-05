import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';

// Mock query function
const mockQueryFn = jest.fn();

// Mock Cloudinary uploader
const mockCloudinaryUpload = jest.fn();
const mockCloudinaryDestroy = jest.fn();

// Mock database module (ESM)
jest.unstable_mockModule('../config/database.js', () => ({
  getDatabasePool: jest.fn(() => ({ query: mockQueryFn })),
}));

// Mock cloudinary module
jest.unstable_mockModule('../config/cloudinary.js', () => ({
  cloudinary: {
    uploader: {
      upload_stream: mockCloudinaryUpload,
      destroy: mockCloudinaryDestroy,
    },
  },
}));

// Dynamic import after mocking
let uploadPhotos, deletePhoto, getListingPhotos;
beforeAll(async () => {
  const mod = await import('./photoController.js');
  uploadPhotos = mod.uploadPhotos;
  deletePhoto = mod.deletePhoto;
  getListingPhotos = mod.getListingPhotos;
});

// Helper to create mock req/res/next
function mockReqRes(params = {}, body = {}, user = null, files = null) {
  return {
    req: { params, body, user, files },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

// Helper to create mock files with buffer
function createMockFile(name) {
  return {
    filename: name,
    buffer: Buffer.from(`mock file content for ${name}`),
    mimetype: 'image/jpeg',
  };
}

describe('BE-05: Photo Upload Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryFn.mockReset();
  });

  describe('uploadPhotos', () => {
    const listingId = 123;
    const landlordId = 1;
    const mockFiles = [
      createMockFile('photo1.jpg'),
      createMockFile('photo2.jpg'),
    ];

    it('should upload photos successfully', async () => {
      const { req, res, next } = mockReqRes(
        { id: String(listingId) },
        {},
        { id: landlordId },
        mockFiles
      );

      // Mock Cloudinary upload_stream for first file
      mockCloudinaryUpload.mockImplementationOnce((opts, callback) => {
        const stream = {
          end: jest.fn((_buffer) => {
            callback(null, {
              secure_url: 'https://res.cloudinary.com/demo/image/upload/photo1.jpg',
              public_id: 'student-housing/listing-123/photo1',
            });
          }),
        };
        return stream;
      });

      // Mock Cloudinary upload_stream for second file
      mockCloudinaryUpload.mockImplementationOnce((opts, callback) => {
        const stream = {
          end: jest.fn((_buffer) => {
            callback(null, {
              secure_url: 'https://res.cloudinary.com/demo/image/upload/photo2.jpg',
              public_id: 'student-housing/listing-123/photo2',
            });
          }),
        };
        return stream;
      });

      // 1. Listing exists and is owned by user
      mockQueryFn.mockResolvedValueOnce([[{ id: listingId, landlord_id: landlordId, deleted_at: null }]]);
      // 2. Count existing photos (0)
      mockQueryFn.mockResolvedValueOnce([[{ count: 0 }]]);
      // 3. Insert photo 1
      mockQueryFn.mockResolvedValueOnce([{ insertId: 101 }]);
      // 4. Insert photo 2
      mockQueryFn.mockResolvedValueOnce([{ insertId: 102 }]);

      await uploadPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          listing_id: listingId,
          photos: [
            { id: 101, url: 'https://res.cloudinary.com/demo/image/upload/photo1.jpg', public_id: 'student-housing/listing-123/photo1' },
            { id: 102, url: 'https://res.cloudinary.com/demo/image/upload/photo2.jpg', public_id: 'student-housing/listing-123/photo2' },
          ],
        },
      });
    });

    it('should return 400 for invalid listing ID', async () => {
      const { req, res, next } = mockReqRes(
        { id: 'abc' },
        {},
        { id: landlordId },
        mockFiles
      );

      await uploadPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Invalid listing ID' }) })
      );
    });

    it('should return 404 if listing not found', async () => {
      const { req, res, next } = mockReqRes(
        { id: String(listingId) },
        {},
        { id: landlordId },
        mockFiles
      );

      // No listing found
      mockQueryFn.mockResolvedValueOnce([[]]);

      await uploadPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Listing not found' }) })
      );
    });

    it('should return 403 if user is not the listing owner', async () => {
      const { req, res, next } = mockReqRes(
        { id: String(listingId) },
        {},
        { id: 999 }, // different user
        mockFiles
      );

      // Listing exists but owned by landlordId=1
      mockQueryFn.mockResolvedValueOnce([[{ id: listingId, landlord_id: landlordId, deleted_at: null }]]);

      await uploadPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Forbidden: not listing owner' }) })
      );
    });

    it('should return 400 if no files uploaded', async () => {
      const { req, res, next } = mockReqRes(
        { id: String(listingId) },
        {},
        { id: landlordId },
        [] // empty files
      );

      // Listing exists
      mockQueryFn.mockResolvedValueOnce([[{ id: listingId, landlord_id: landlordId, deleted_at: null }]]);

      await uploadPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'No photos uploaded' }) })
      );
    });

    it('should handle DB errors gracefully', async () => {
      const { req, res, next } = mockReqRes(
        { id: String(listingId) },
        {},
        { id: landlordId },
        mockFiles
      );

      // Mock Cloudinary upload for first file
      mockCloudinaryUpload.mockImplementationOnce((opts, callback) => {
        const stream = {
          end: jest.fn((_buffer) => {
            callback(null, {
              secure_url: 'https://res.cloudinary.com/demo/image/upload/photo1.jpg',
              public_id: 'student-housing/listing-123/photo1',
            });
          }),
        };
        return stream;
      });

      mockQueryFn.mockRejectedValueOnce(new Error('DB error'));

      await uploadPhotos(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deletePhoto', () => {
    const photoId = 456;
    const listingId = 123;
    const landlordId = 1;

    it('should delete photo successfully', async () => {
      const { req, res, next } = mockReqRes(
        { photoId: String(photoId) },
        {},
        { id: landlordId }
      );

      const cloudinaryPublicId = 'student-housing/listing-123/photo1';

      // Photo exists and user owns it
      mockQueryFn.mockResolvedValueOnce([[
        { id: photoId, listing_id: listingId, url: 'https://res.cloudinary.com/demo/image/upload/photo.jpg', public_id: cloudinaryPublicId, landlord_id: landlordId }
      ]]);
      // Mock Cloudinary destroy
      mockCloudinaryDestroy.mockResolvedValueOnce({ result: 'ok' });
      // Delete query
      mockQueryFn.mockResolvedValueOnce([{}]);

      await deletePhoto(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        { success: true, message: `Photo ${photoId} deleted` }
      );
      expect(mockCloudinaryDestroy).toHaveBeenCalledWith(cloudinaryPublicId);
      expect(mockQueryFn).toHaveBeenCalledWith('DELETE FROM listing_photos WHERE id = ?', [photoId]);
    });

    it('should return 400 for invalid photo ID', async () => {
      const { req, res, next } = mockReqRes(
        { photoId: 'abc' },
        {},
        { id: landlordId }
      );

      await deletePhoto(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Invalid photo ID' }) })
      );
    });

    it('should return 404 if photo not found', async () => {
      const { req, res, next } = mockReqRes(
        { photoId: String(photoId) },
        {},
        { id: landlordId }
      );

      // No photo found
      mockQueryFn.mockResolvedValueOnce([[]]);

      await deletePhoto(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Photo not found' }) })
      );
    });

    it('should return 403 if user is not the listing owner', async () => {
      const { req, res, next } = mockReqRes(
        { photoId: String(photoId) },
        {},
        { id: 999 } // different user
      );

      // Photo exists but owned by landlordId=1
      mockQueryFn.mockResolvedValueOnce([[
        { id: photoId, listing_id: listingId, landlord_id: landlordId }
      ]]);

      await deletePhoto(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Forbidden: not listing owner' }) })
      );
    });

    it('should handle DB errors gracefully', async () => {
      const { req, res, next } = mockReqRes(
        { photoId: String(photoId) },
        {},
        { id: landlordId }
      );

      mockQueryFn.mockRejectedValueOnce(new Error('DB error'));

      await deletePhoto(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getListingPhotos', () => {
    const listingId = 789;

    it('should return photos for a listing', async () => {
      const { req, res, next } = mockReqRes(
        { listingId: String(listingId) }
      );

      // Listing exists
      mockQueryFn.mockResolvedValueOnce([[{ id: listingId }]]);
      // Photos
      mockQueryFn.mockResolvedValueOnce([
        [
          { id: 101, url: 'https://res.cloudinary.com/demo/image/upload/photo1.jpg', public_id: 'student-housing/listing-789/photo1', created_at: '2026-01-01' },
          { id: 102, url: 'https://res.cloudinary.com/demo/image/upload/photo2.jpg', public_id: 'student-housing/listing-789/photo2', created_at: '2026-01-02' },
        ]
      ]);

      await getListingPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          { id: 101, url: 'https://res.cloudinary.com/demo/image/upload/photo1.jpg', public_id: 'student-housing/listing-789/photo1', created_at: '2026-01-01' },
          { id: 102, url: 'https://res.cloudinary.com/demo/image/upload/photo2.jpg', public_id: 'student-housing/listing-789/photo2', created_at: '2026-01-02' },
        ],
      });
    });

    it('should return empty array if listing has no photos', async () => {
      const { req, res, next } = mockReqRes(
        { listingId: String(listingId) }
      );

      // Listing exists
      mockQueryFn.mockResolvedValueOnce([[{ id: listingId }]]);
      // No photos
      mockQueryFn.mockResolvedValueOnce([[]]);

      await getListingPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return 400 for invalid listing ID', async () => {
      const { req, res, next } = mockReqRes(
        { listingId: 'abc' }
      );

      await getListingPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Invalid listing ID' }) })
      );
    });

    it('should return 404 if listing not found', async () => {
      const { req, res, next } = mockReqRes(
        { listingId: String(listingId) }
      );

      // No listing found
      mockQueryFn.mockResolvedValueOnce([[]]);

      await getListingPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.objectContaining({ message: 'Listing not found' }) })
      );
    });

    it('should also work with params.id (fallback)', async () => {
      const { req, res, next } = mockReqRes(
        { id: String(listingId) } // using id instead of listingId
      );

      // Listing exists
      mockQueryFn.mockResolvedValueOnce([[{ id: listingId }]]);
      // Photos
      mockQueryFn.mockResolvedValueOnce([[]]);

      await getListingPhotos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle DB errors gracefully', async () => {
      const { req, res, next } = mockReqRes(
        { listingId: String(listingId) }
      );

      mockQueryFn.mockRejectedValueOnce(new Error('DB error'));

      await getListingPhotos(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
