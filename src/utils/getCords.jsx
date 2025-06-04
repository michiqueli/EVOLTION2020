import { useEffect, useState } from "react";

function useCoordinatesFromAddress(address) {
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    const fetchCoords = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setCoords({ lat: data[0].lat, lon: data[0].lon });
        }
      } catch (err) {
        console.error("Error fetching coordinates", err);
      }
    };

    if (address) {
      fetchCoords();
    }
  }, [address]);

  return coords;
}
export default useCoordinatesFromAddress