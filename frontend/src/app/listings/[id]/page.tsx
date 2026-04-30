// Add this inside the property detail page where you display listing info

<div className="mb-4">
  <span className="text-sm font-medium text-gray-500">Status:</span>
  <span 
    className="ml-2 px-2 py-1 rounded-full text-xs font-medium"
    style={{
      backgroundColor: 
        listing.status === 'available' ? '#002A2220' :
        listing.status === 'rented' ? '#EA638C20' :
        '#B33C8620',
      color:
        listing.status === 'available' ? '#002A22' :
        listing.status === 'rented' ? '#EA638C' :
        '#B33C86',
    }}
  >
    {listing.status === 'available' ? 'Available' :
     listing.status === 'rented' ? 'Rented' :
     'Under Negotiation'}
  </span>
</div>