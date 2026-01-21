import React, { useEffect, useRef, useState } from 'react'
import './Map.css'

const Map = ({ fromBuilding, toBuilding, height = '400px' }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    // Ждем загрузки Google Maps API
    const initMap = () => {
      if (window.google && mapRef.current && !mapInstanceRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: { lat: 59.9343, lng: 30.3351 }, // Санкт-Петербург
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })
        mapInstanceRef.current = map
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
        })
        setMapReady(true)
      }
    }

    if (window.google) {
      initMap()
    } else {
      // Ожидаем загрузки Google Maps API
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle)
          initMap()
        }
      }, 100)

      return () => clearInterval(checkGoogle)
    }
  }, [])

  useEffect(() => {
    // Обновляем маршрут при изменении корпусов
    if (!mapReady || !mapInstanceRef.current || !fromBuilding || !toBuilding) {
      return
    }

    const directionsService = new window.google.maps.DirectionsService()
    const directionsRenderer = directionsRendererRef.current

    // Очищаем предыдущий маршрут
    directionsRenderer.setDirections({ routes: [] })

    // Получаем координаты или адрес для построения маршрута
    const getOrigin = () => {
      if (fromBuilding.latitude && fromBuilding.longitude) {
        return { lat: fromBuilding.latitude, lng: fromBuilding.longitude }
      }
      return fromBuilding.address || fromBuilding.name || ''
    }

    const getDestination = () => {
      if (toBuilding.latitude && toBuilding.longitude) {
        return { lat: toBuilding.latitude, lng: toBuilding.longitude }
      }
      return toBuilding.address || toBuilding.name || ''
    }

    const request = {
      origin: getOrigin(),
      destination: getDestination(),
      travelMode: window.google.maps.TravelMode.DRIVING,
    }

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result)
        // Центрируем карту на маршруте
        const bounds = new window.google.maps.LatLngBounds()
        result.routes[0].legs.forEach((leg) => {
          bounds.extend(leg.start_location)
          bounds.extend(leg.end_location)
        })
        mapInstanceRef.current.fitBounds(bounds)
      } else {
        console.error('Directions request failed:', status)
        // Если не удалось построить маршрут, показываем маркеры
        const origin = getOrigin()
        const dest = getDestination()

        if (typeof origin === 'object' && typeof dest === 'object') {
          // Добавляем маркеры
          new window.google.maps.Marker({
            position: origin,
            map: mapInstanceRef.current,
            label: 'A',
            title: fromBuilding.name,
          })

          new window.google.maps.Marker({
            position: dest,
            map: mapInstanceRef.current,
            label: 'B',
            title: toBuilding.name,
          })

          // Центрируем карту на обоих точках
          const bounds = new window.google.maps.LatLngBounds()
          bounds.extend(origin)
          bounds.extend(dest)
          mapInstanceRef.current.fitBounds(bounds)
        }
      }
    })
  }, [fromBuilding, toBuilding, mapReady])

  return (
    <div className="map-container" style={{ height }}>
      <div ref={mapRef} className="map-wrapper" style={{ height: '100%', minHeight: height }} />
      {!window.google && (
        <div className="map-placeholder">
          Загрузка карты...
          <br />
          <small>Для работы карты нужен API ключ Google Maps</small>
          <br />
          <small style={{ fontSize: '11px', color: '#999' }}>
            Подробнее в GOOGLE_MAPS_SETUP.md
          </small>
        </div>
      )}
    </div>
  )
}

export default Map
