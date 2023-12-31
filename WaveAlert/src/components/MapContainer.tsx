import React from 'react';
import { GoogleMap, useLoadScript, DrawingManager, Autocomplete, Polygon, useJsApiLoader, LoadScript, Marker} from '@react-google-maps/api';
import { useState, useRef } from "react";
import CircularWithValueLabel from './CircularWithLabeledValue';

const mapContainerStyle = {
  width: '1000px',
  height: '500px',
  
};
const center = {
  lat: -33.3366134, // default latitude
  lng: -70.2895661, // default longitude
};


const alertas = [
    {id:1, value:"Avalancha"},
    {id:2, value:"Fuera de zona delimitada"},
    {id:3, value:"Zona de riesgo"},
    {id:4, value:"Accidente cerca"}
]

const MapContainer = ({informacionEsquiador}:any) => {
    const [modal, setModal] = useState(false);
    const [count, setCount] = useState(false);
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: 'AIzaSyDd4LbLjZurArUzMUcRJeddv1GtQ6xooKY',
        libraries:['drawing']
      });
      if (loadError) {
        return <div>Error loading maps</div>;
      }
    
      if (!isLoaded) {
        return <div>Loading maps</div>;
      }
    
    function onMarkerClick () {
        informacionEsquiador(true);
    }

    return (
        <div className='rounded-2xl'>
            <GoogleMap
            zoom={15}
            center={center}
            mapContainerStyle={mapContainerStyle}
            >
                <Marker onClick={onMarkerClick} position={center} />
            </GoogleMap>                       
        </div>

        
    );
};

export default MapContainer;