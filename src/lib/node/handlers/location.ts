// location.get handler — returns the device's GPS coordinates (mobile only)

import type { InvokeResult } from '../types'

interface LocationParams {
  maxAgeMs?: number
  desiredAccuracy?: 'high' | 'low'
  timeoutMs?: number
}

export async function handleLocationGet(params: LocationParams): Promise<InvokeResult> {
  try {
    const { Geolocation } = await import('@capacitor/geolocation')

    // Request permission first
    const permStatus = await Geolocation.checkPermissions()
    if (permStatus.location !== 'granted') {
      const requested = await Geolocation.requestPermissions()
      if (requested.location !== 'granted') {
        return {
          ok: false,
          error: { code: 'PERMISSION_DENIED', message: 'Location permission was denied by the user' }
        }
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: params.desiredAccuracy !== 'low',
      maximumAge: params.maxAgeMs ?? 30_000,
      timeout: params.timeoutMs ?? 10_000
    })

    return {
      ok: true,
      payload: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      }
    }
  } catch (err) {
    return {
      ok: false,
      error: { code: 'LOCATION_FAILED', message: (err as Error).message }
    }
  }
}
