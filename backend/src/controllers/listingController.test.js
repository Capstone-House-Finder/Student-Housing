import { describe, it, expect, beforeEach } from '@jest/globals';
import listingController from "./listingController.js";

describe("listingController - Input Validation", () => {
  let req, res;

  beforeEach(() => {
    // Simple mock response object
    res = {
      statusCode: null,
      jsonData: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      }
    };

    req = {
      user: { id: 1 },
      body: {
        title: "Test Listing",
        description: "A great place",
        location: "Downtown",
        price: 1500,
        property_type: "apartment"
      }
    };
  });

  it("should reject missing title", async () => {
    req.body.title = "";
    await listingController.createListing(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("should reject missing description", async () => {
    req.body.description = "";
    await listingController.createListing(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("should reject missing location", async () => {
    req.body.location = "";
    await listingController.createListing(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("should reject missing price", async () => {
    req.body.price = "";
    await listingController.createListing(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("should reject missing property_type", async () => {
    req.body.property_type = "";
    await listingController.createListing(req, res);
    expect(res.statusCode).toBe(400);
  });
});
