import { useState, useEffect } from "react";
import { geoService } from "../services/geoService.js";

export default function IncidentLocation({ lat, lon }) {
  const [address, setAddress] = useState("Cargando ubicación...");

  useEffect(() => {
    let active = true;
    if (lat == null || lon == null) {
      setAddress("Ubicación desconocida");
      return;
    }

    geoService
      .reverseGeocode(Number(lat), Number(lon))
      .then((addr) => {
        if (active) {
          setAddress(addr);
        }
      })
      .catch(() => {
        if (active) {
          setAddress(`Coord: ${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`);
        }
      });

    return () => {
      active = false;
    };
  }, [lat, lon]);

  return <span>📍 {address}</span>;
}
