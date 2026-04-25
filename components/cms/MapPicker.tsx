'use client'

import { useState } from 'react'

interface MapPickerProps {
  lat: string
  lng: string
  zoom: string
  onLatChange: (v: string) => void
  onLngChange: (v: string) => void
  onZoomChange: (v: string) => void
}

export default function MapPicker({
  lat,
  lng,
  zoom,
  onLatChange,
  onLngChange,
  onZoomChange,
}: MapPickerProps) {
  const [pasteLink, setPasteLink] = useState('')
  const [linkError, setLinkError] = useState('')

  const inputClass =
    'w-full bg-[rgba(255,255,255,0.04)] border border-[var(--color-border)] text-[var(--color-text)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#C9A84C]'

  const hasValidCoords =
    lat.length > 0 &&
    lng.length > 0 &&
    !isNaN(Number(lat)) &&
    !isNaN(Number(lng))

  function handlePasteLink(url: string) {
    setPasteLink(url)
    setLinkError('')

    if (!url) return

    const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (match) {
      onLatChange(match[1])
      onLngChange(match[2])
      setLinkError('')
    } else if (url.startsWith('http')) {
      setLinkError('Could not extract coordinates — ensure the URL contains @lat,lng')
    }
  }

  return (
    <div>
      {/* Section heading */}
      <p
        className="mb-3 text-[10px] font-semibold tracking-wider uppercase"
        style={{ color: '#C9A84C' }}
      >
        Map Location
      </p>

      {/* Info helper */}
      <div
        className="rounded p-3 mb-4 text-xs"
        style={{
          backgroundColor: 'rgba(201,168,76,0.05)',
          borderLeft: '3px solid rgba(201,168,76,0.4)',
          color: 'var(--color-text-dim)',
        }}
      >
        Find coordinates: Go to{' '}
        <a
          href="https://maps.google.com"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#C9A84C' }}
        >
          maps.google.com
        </a>{' '}
        → right-click your location → click coordinates at top → copy and paste below
      </div>

      {/* Lat / Lng inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label
            className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: 'var(--color-text-dim)' }}
          >
            Latitude
          </label>
          <input
            type="number"
            step="0.0001"
            className={inputClass}
            placeholder="51.5074"
            value={lat}
            onChange={(e) => onLatChange(e.target.value)}
          />
        </div>
        <div>
          <label
            className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
            style={{ color: 'var(--color-text-dim)' }}
          >
            Longitude
          </label>
          <input
            type="number"
            step="0.0001"
            className={inputClass}
            placeholder="-0.1278"
            value={lng}
            onChange={(e) => onLngChange(e.target.value)}
          />
        </div>
      </div>

      {/* Zoom slider */}
      <div className="mb-4">
        <label
          className="block mb-2 text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: 'var(--color-text-dim)' }}
        >
          Zoom:{' '}
          <span style={{ color: 'var(--color-text)' }}>{zoom}</span>
        </label>
        <input
          type="range"
          min={8}
          max={18}
          step={1}
          value={zoom}
          onChange={(e) => onZoomChange(e.target.value)}
          className="w-full accent-[#C9A84C]"
        />
        <div
          className="flex justify-between text-[10px] mt-0.5"
          style={{ color: 'var(--color-text-dim)' }}
        >
          <span>City (8)</span>
          <span>Street (18)</span>
        </div>
      </div>

      {/* Map preview iframe */}
      {hasValidCoords && (
        <iframe
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`}
          className="w-full h-48 rounded-lg mt-3"
          style={{ border: '1px solid rgba(201,168,76,0.2)' }}
          loading="lazy"
          title="Location preview"
        />
      )}

      {/* Paste Google Maps URL helper */}
      <div className="mt-4">
        <label
          className="block mb-1 text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: 'var(--color-text-dim)' }}
        >
          Paste Google Maps URL
        </label>
        <input
          type="url"
          className={inputClass}
          placeholder="https://maps.google.com/maps?..."
          value={pasteLink}
          onChange={(e) => handlePasteLink(e.target.value)}
        />
        {linkError && (
          <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>
            {linkError}
          </p>
        )}
        {!linkError && pasteLink && hasValidCoords && (
          <p className="mt-1 text-xs" style={{ color: 'rgb(134,239,172)' }}>
            Coordinates extracted successfully
          </p>
        )}
      </div>
    </div>
  )
}
