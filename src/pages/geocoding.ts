// src/utils/geocoding.ts
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string; // Dirección completa formateada por Nominatim
}

export const geocodeAddressNominatim = async (address: string): Promise<GeocodingResult | null> => {
  if (!address || !address.trim()) {
    console.warn('Geocoding: Address is empty.');
    return null;
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&countrycodes=MX&limit=1`;

  try {
    // console.log(`Geocoding address: ${address} with URL: ${nominatimUrl}`);
    const response = await fetch(nominatimUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // Nominatim recomienda un User-Agent personalizado para aplicaciones,
        // pero en el cliente es más difícil de controlar. El Referer se envía automáticamente.
      }
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} - ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      // console.log('Geocoding result:', result);
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      };
    } else {
      console.warn(`No geocoding results found for address: ${address}`);
      return null;
    }
  } catch (error) {
    console.error('Error during geocoding fetch:', error);
    return null;
  }
};