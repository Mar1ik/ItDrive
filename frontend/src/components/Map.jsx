import React, { useEffect, useRef, useState } from 'react'
import './Map.css'

const Map = ({ fromBuilding, toBuilding, height = '400px' }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const routeRef = useRef(null)
  const routeActiveRef = useRef(true) // Флаг для отслеживания актуальности маршрута
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Инициализация карты только один раз при монтировании компонента
    let isMounted = true
    let checkInterval = null

    // Динамическая загрузка 2GIS Maps API
    const load2GISAPI = () => {
      // Если карта уже инициализирована, не делаем ничего
      if (mapInstanceRef.current) {
        console.log('Карта уже инициализирована, пропускаем загрузку')
        return
      }

      // Если уже загружен, сразу инициализируем
      if (window.DG && typeof window.DG.then === 'function') {
        console.log('2GIS API уже загружен, инициализируем карту')
        initMap()
        return
      }

      // Проверяем, не загружается ли уже
      if (document.querySelector('script[data-2gis]')) {
        console.log('2GIS API уже загружается, ждем...')
        // Ждем загрузки существующего скрипта
        checkInterval = setInterval(() => {
          if (window.DG && typeof window.DG.then === 'function') {
            clearInterval(checkInterval)
            if (isMounted) {
              initMap()
            }
          }
        }, 100)
        
        // Таймаут на случай, если скрипт не загрузится
        setTimeout(() => {
          if (checkInterval) {
            clearInterval(checkInterval)
          }
          if (isMounted && (!window.DG || typeof window.DG.then !== 'function')) {
            setError('Превышено время ожидания загрузки 2GIS API')
          }
        }, 10000)
        
        return
      }

      console.log('Загружаем 2GIS Maps API...')
      const script = document.createElement('script')
      // Используем правильный URL с .ru и добавляем ключ
      script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full&key=0447c91e-819e-4160-957a-dd8bd5eb9356'
      script.async = true
      script.setAttribute('data-2gis', 'true')
      
      script.onload = () => {
        console.log('2GIS API скрипт загружен, window.DG:', window.DG)
        // Проверяем, что DG.then доступен
        if (isMounted && window.DG && typeof window.DG.then === 'function') {
          initMap()
        } else if (isMounted) {
          console.error('window.DG.then не найден после загрузки скрипта')
          setError('Ошибка инициализации 2GIS API. Проверьте API ключ.')
        }
      }
      
      script.onerror = (err) => {
        console.error('Ошибка загрузки скрипта 2GIS API:', err)
        if (isMounted) {
          setError('Не удалось загрузить 2GIS Maps API. Проверьте подключение к интернету и API ключ.')
        }
      }
      
      document.head.appendChild(script)
    }

    // Функция инициализации карты
    const initMap = () => {
      // Проверяем, что компонент еще смонтирован
      if (!isMounted) {
        return
      }

      console.log('Инициализация карты 2GIS...')
      console.log('mapRef.current:', mapRef.current)
      
      if (!mapRef.current) {
        console.warn('mapRef.current не готов')
        return
      }

      // Проверяем, не инициализирована ли карта уже
      if (mapInstanceRef.current) {
        console.log('Карта уже инициализирована')
        return
      }

      // Проверяем, не содержит ли контейнер уже инициализированную карту
      if (mapRef.current._dgisMap) {
        console.log('Карта уже инициализирована в DOM')
        mapInstanceRef.current = { map: mapRef.current._dgisMap, dgis: window.DG }
        setMapReady(true)
        return
      }

      // Используем DG.then согласно документации 2GIS
      if (window.DG && typeof window.DG.then === 'function') {
        console.log('Используем window.DG.then()')
        window.DG.then(() => {
          // Проверяем еще раз, что компонент смонтирован
          if (!isMounted) {
            return
          }

          // Проверяем, не инициализирована ли карта пока ждали
          if (mapInstanceRef.current) {
            console.log('Карта уже инициализирована во время ожидания')
            return
          }

          console.log('DG.then выполнен, window.DG:', window.DG)
          try {
            // Центр по умолчанию - Санкт-Петербург
            let center = [59.9343, 30.3351]
            
            // Если есть координаты начальной точки, используем их
            if (fromBuilding?.latitude && fromBuilding?.longitude) {
              center = [fromBuilding.latitude, fromBuilding.longitude]
            }

            console.log('Создаем карту с центром:', center)
            const map = window.DG.map(mapRef.current, {
              center: center,
              zoom: 13,
              fullscreenControl: true,
            })
            
            console.log('Карта создана:', map)
            mapInstanceRef.current = { map, dgis: window.DG }
            setMapReady(true)
            setError(null)
          } catch (err) {
            // Если карта уже инициализирована, это нормально
            if (err.message && err.message.includes('already initialized')) {
              console.log('Карта уже инициализирована, используем существующую')
              // Пытаемся получить существующую карту
              if (mapRef.current._dgisMap) {
                mapInstanceRef.current = { map: mapRef.current._dgisMap, dgis: window.DG }
                setMapReady(true)
                setError(null)
              }
            } else {
              console.error('Ошибка инициализации карты:', err)
              if (isMounted) {
                setError('Ошибка инициализации карты: ' + err.message)
              }
            }
          }
        }).catch((err) => {
          console.error('Ошибка в DG.then:', err)
          if (isMounted) {
            setError('Ошибка загрузки 2GIS Maps API. Проверьте API ключ. ' + (err.message || ''))
          }
        })
      } else {
        console.warn('window.DG.then не найден или не является функцией')
        console.log('window.DG:', window.DG)
        console.log('typeof window.DG.then:', typeof window.DG?.then)
        if (isMounted) {
          setError('Ошибка инициализации 2GIS API. Проверьте API ключ и консоль браузера.')
        }
      }
    }

    // Загружаем API только если карта еще не инициализирована
    if (!mapInstanceRef.current) {
      load2GISAPI()
    }

    // Cleanup функция
    return () => {
      isMounted = false
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      // Очищаем карту при размонтировании
      if (mapInstanceRef.current) {
        try {
          const { map } = mapInstanceRef.current
          if (map && typeof map.remove === 'function') {
            map.remove()
          }
        } catch (e) {
          console.warn('Ошибка при удалении карты:', e)
        }
        mapInstanceRef.current = null
        markersRef.current = []
        routeRef.current = null
        setMapReady(false)
      }
    }
  }, []) // Пустой массив зависимостей - инициализация только один раз

  useEffect(() => {
    // Обновляем маршрут при изменении корпусов
    if (!mapReady || !mapInstanceRef.current || !fromBuilding || !toBuilding) {
      return
    }

    // Сохраняем ссылку на текущую карту
    const currentMapInstance = mapInstanceRef.current
    if (!currentMapInstance || !currentMapInstance.map || !currentMapInstance.dgis) {
      return
    }

    const { map, dgis } = currentMapInstance
    
    // Проверяем, что карта все еще существует
    if (!map || !dgis) {
      console.warn('Карта или dgis не найдены, пропускаем обновление маршрута')
      return
    }
    
    console.log('Обновление маршрута:', { fromBuilding: fromBuilding?.name, toBuilding: toBuilding?.name })

    // Очищаем предыдущие маркеры и маршрут
    // Сохраняем копию массива маркеров перед очисткой
    const oldMarkers = [...markersRef.current]
    markersRef.current = []

    oldMarkers.forEach(marker => {
      try {
        if (marker) {
          // Пробуем разные способы удаления маркера
          if (typeof marker.remove === 'function') {
            // Используем метод remove() самого маркера
            marker.remove()
          } else if (typeof marker.removeFrom === 'function') {
            // Используем метод removeFrom(), если доступен
            marker.removeFrom(map)
          } else if (map && typeof map.remove === 'function') {
            // Используем метод remove() карты только если другие методы недоступны
            try {
              map.remove(marker)
            } catch (e) {
              // Если ошибка, игнорируем - маркер уже удален или относится к другой карте
              if (!e.message || !e.message.includes('reused')) {
                console.warn('Ошибка удаления маркера через map.remove:', e)
              }
            }
          }
        }
      } catch (e) {
        // Игнорируем ошибки удаления - маркер может быть уже удален или относится к другой карте
        if (!e.message || !e.message.includes('reused') && !e.message.includes('not found')) {
          console.warn('Ошибка удаления маркера:', e)
        }
      }
    })

    if (routeRef.current) {
      try {
        const oldRoute = routeRef.current
        routeRef.current = null
        
        // Пробуем разные способы удаления маршрута
        if (typeof oldRoute.remove === 'function') {
          oldRoute.remove()
        } else if (typeof oldRoute.removeFrom === 'function') {
          oldRoute.removeFrom(map)
        } else if (map && typeof map.remove === 'function') {
          try {
            map.remove(oldRoute)
          } catch (e) {
            // Игнорируем ошибки, если маршрут уже удален
            if (!e.message || !e.message.includes('reused') && !e.message.includes('not found')) {
              console.warn('Ошибка удаления маршрута:', e)
            }
          }
        }
      } catch (e) {
        // Игнорируем ошибки удаления маршрута
        if (!e.message || !e.message.includes('reused') && !e.message.includes('not found')) {
          console.warn('Ошибка удаления маршрута:', e)
        }
      }
    }

    // Получаем координаты (в 2GIS порядок: [широта, долгота])
    const getOrigin = () => {
      if (fromBuilding.latitude && fromBuilding.longitude) {
        return [fromBuilding.latitude, fromBuilding.longitude]
      }
      return null
    }

    const getDestination = () => {
      if (toBuilding.latitude && toBuilding.longitude) {
        return [toBuilding.latitude, toBuilding.longitude]
      }
      return null
    }

    const origin = getOrigin()
    const destination = getDestination()

    if (!origin || !destination) {
      console.warn('Координаты не найдены для построения маршрута')
      return
    }

    // Помечаем маршрут как актуальный
    routeActiveRef.current = true
    
    try {
      console.log('Добавление маркеров:', { origin, destination })
      
      // Добавляем маркеры
      const originMarker = dgis.marker(origin)
        .addTo(map)
        .bindLabel(fromBuilding.name || 'Отправление', {
          static: true,
        })

      const destMarker = dgis.marker(destination)
        .addTo(map)
        .bindLabel(toBuilding.name || 'Назначение', {
          static: true,
        })

      console.log('Маркеры добавлены:', { originMarker, destMarker })
      markersRef.current = [originMarker, destMarker]

      // Строим маршрут через Routing API
      if (dgis.routing && typeof dgis.routing.route === 'function') {
        dgis.routing.route(
          [origin, destination],
          {
            mode: 'car', // Режим: car, pedestrian, transit
          },
          (err, result) => {
            // Проверяем, что маршрут все еще актуален
            if (!routeActiveRef.current || !mapInstanceRef.current) {
              console.log('Маршрут устарел, пропускаем обработку результата')
              return
            }
            
            const currentMap = mapInstanceRef.current.map
            if (!currentMap) {
              console.log('Карта не найдена, пропускаем обработку результата')
              return
            }
            if (err) {
              console.error('Ошибка построения маршрута:', err)
              // Если не удалось построить маршрут, просто центрируем карту на обеих точках
              try {
                const currentMap = mapInstanceRef.current?.map
                if (!currentMap) {
                  return
                }
                
                // Вычисляем центр между точками и устанавливаем зум
                const centerLat = (origin[0] + destination[0]) / 2
                const centerLon = (origin[1] + destination[1]) / 2
                // Вычисляем примерное расстояние для определения зума
                const latDiff = Math.abs(origin[0] - destination[0])
                const lonDiff = Math.abs(origin[1] - destination[1])
                const maxDiff = Math.max(latDiff, lonDiff)
                let zoom = 13
                if (maxDiff > 0.1) zoom = 11
                else if (maxDiff > 0.05) zoom = 12
                else if (maxDiff < 0.01) zoom = 14
                
                currentMap.setView([centerLat, centerLon], zoom)
              } catch (e) {
                console.warn('Ошибка центрирования карты:', e)
              }
              return
            }

            if (result && result.length > 0 && result[0].geometry) {
              try {
                // Отображаем маршрут
                const route = dgis.polyline(result[0].geometry, {
                  color: '#4285f4',
                  weight: 5,
                  opacity: 0.7,
                }).addTo(currentMap)

                routeRef.current = route

                // Центрируем карту на маршруте
                // Вычисляем границы маршрута вручную
                if (result[0].geometry && result[0].geometry.length > 0) {
                  let minLat = result[0].geometry[0][0]
                  let maxLat = result[0].geometry[0][0]
                  let minLon = result[0].geometry[0][1]
                  let maxLon = result[0].geometry[0][1]
                  
                  result[0].geometry.forEach(point => {
                    minLat = Math.min(minLat, point[0])
                    maxLat = Math.max(maxLat, point[0])
                    minLon = Math.min(minLon, point[1])
                    maxLon = Math.max(maxLon, point[1])
                  })
                  
                  const centerLat = (minLat + maxLat) / 2
                  const centerLon = (minLon + maxLon) / 2
                  const latDiff = maxLat - minLat
                  const lonDiff = maxLon - minLon
                  const maxDiff = Math.max(latDiff, lonDiff)
                  
                  let zoom = 13
                  if (maxDiff > 0.1) zoom = 11
                  else if (maxDiff > 0.05) zoom = 12
                  else if (maxDiff < 0.01) zoom = 14
                  else if (maxDiff < 0.005) zoom = 15
                  
                  currentMap.setView([centerLat, centerLon], zoom)
                }
              } catch (e) {
                console.warn('Ошибка отображения маршрута:', e)
                // Fallback - центрируем на точках
                try {
                  const centerLat = (origin[0] + destination[0]) / 2
                  const centerLon = (origin[1] + destination[1]) / 2
                  const latDiff = Math.abs(origin[0] - destination[0])
                  const lonDiff = Math.abs(origin[1] - destination[1])
                  const maxDiff = Math.max(latDiff, lonDiff)
                  let zoom = 13
                  if (maxDiff > 0.1) zoom = 11
                  else if (maxDiff > 0.05) zoom = 12
                  else if (maxDiff < 0.01) zoom = 14
                  
                  currentMap.setView([centerLat, centerLon], zoom)
                } catch (e2) {
                  console.warn('Ошибка центрирования карты:', e2)
                }
              }
            } else {
              // Если маршрут не построен, центрируем на точках
              try {
                const centerLat = (origin[0] + destination[0]) / 2
                const centerLon = (origin[1] + destination[1]) / 2
                const latDiff = Math.abs(origin[0] - destination[0])
                const lonDiff = Math.abs(origin[1] - destination[1])
                const maxDiff = Math.max(latDiff, lonDiff)
                let zoom = 13
                if (maxDiff > 0.1) zoom = 11
                else if (maxDiff > 0.05) zoom = 12
                else if (maxDiff < 0.01) zoom = 14
                
                currentMap.setView([centerLat, centerLon], zoom)
              } catch (e) {
                console.warn('Ошибка центрирования карты:', e)
              }
            }
          }
        )
      } else {
        // Если Routing API недоступен, просто центрируем карту на обеих точках
        try {
          const centerLat = (origin[0] + destination[0]) / 2
          const centerLon = (origin[1] + destination[1]) / 2
          const latDiff = Math.abs(origin[0] - destination[0])
          const lonDiff = Math.abs(origin[1] - destination[1])
          const maxDiff = Math.max(latDiff, lonDiff)
          let zoom = 13
          if (maxDiff > 0.1) zoom = 11
          else if (maxDiff > 0.05) zoom = 12
          else if (maxDiff < 0.01) zoom = 14
          
          map.setView([centerLat, centerLon], zoom)
        } catch (e) {
          console.warn('Ошибка центрирования карты:', e)
        }
      }
    } catch (err) {
      console.error('Ошибка при работе с картой:', err)
      setError('Ошибка при работе с картой: ' + err.message)
    }

    // Cleanup: помечаем маршрут как устаревший при размонтировании или изменении зависимостей
    return () => {
      routeActiveRef.current = false
    }
  }, [fromBuilding, toBuilding, mapReady])

  return (
    <div className="map-container" style={{ height }}>
      <div ref={mapRef} className="map-wrapper" style={{ height: '100%', minHeight: height }} />
      {error && (
        <div className="map-placeholder">
          <div style={{ color: '#dc3545', marginBottom: '8px' }}>⚠️ {error}</div>
          <small>Проверьте консоль браузера (F12) для подробностей</small>
        </div>
      )}
      {!mapReady && !error && (
        <div className="map-placeholder">
          Загрузка карты...
          <br />
          <small>Для работы карты нужен API ключ 2GIS</small>
          <br />
          <small style={{ fontSize: '11px', color: '#999' }}>
            Подробнее в 2GIS_MAPS_SETUP.md
          </small>
        </div>
      )}
    </div>
  )
}

export default Map
