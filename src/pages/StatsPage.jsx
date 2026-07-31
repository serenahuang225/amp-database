import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  buildCollegeBars,
  buildDreamJobHeatmap,
  buildFunnyHighlights,
  buildFruitBars,
  buildLatenessDistribution,
  buildMajorBars,
  buildMissedClassBars,
  formatMinutesAsTime,
} from '../utils/stats.js'
import { buildHometownPins } from '../utils/hometowns.js'
import './StatsPage.css'

const CHART_WIDTH = 720
const CHART_HEIGHT = 280

function HorizontalBars({
  items,
  ariaLabel,
  valueFormatter = (item) => String(item.count),
  showPercent = true,
}) {
  const maxValue = Math.max(
    ...items.map((item) => Number(item.count ?? item.days ?? 0)),
    1,
  )
  const total = items.reduce(
    (sum, item) => sum + Number(item.count ?? item.days ?? 0),
    0,
  )

  if (items.length === 0) {
    return <p className="stats-empty">No data yet.</p>
  }

  return (
    <div className="hbar-chart" role="img" aria-label={ariaLabel}>
      <ul className="hbar-list">
        {items.map((item, index) => {
          const value = Number(item.count ?? item.days ?? 0)
          const widthPct = Math.max((value / maxValue) * 100, value > 0 ? 4 : 0)
          const sharePct = total > 0 ? Math.round((value / total) * 100) : 0
          const label = item.label || item.name || '—'
          const display = valueFormatter(item)

          return (
            <li
              key={`${label}-${index}`}
              className="hbar-row"
              style={{ '--bar-i': index }}
            >
              <div className="hbar-meta">
                <span className="hbar-rank">{index + 1}</span>
                <span className="hbar-label" title={label}>
                  {label}
                </span>
                <span className="hbar-value">
                  {display}
                  {showPercent && total > 0 && value > 0 ? (
                    <span className="hbar-share">{sharePct}%</span>
                  ) : null}
                </span>
              </div>
              <div className="hbar-track" aria-hidden="true">
                <div
                  className="hbar-fill"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function LatenessBellCurve({ contacts }) {
  const data = useMemo(() => buildLatenessDistribution(contacts), [contacts])
  const padding = { top: 24, right: 24, bottom: 48, left: 40 }
  const plotWidth = CHART_WIDTH - padding.left - padding.right
  const plotHeight = CHART_HEIGHT - padding.top - padding.bottom

  if (data.sampleSize === 0) {
    return (
      <p className="stats-empty">
        No parseable bedtimes yet
        {data.allNighters > 0
          ? ` (but ${data.allNighters} all-nighter${data.allNighters === 1 ? '' : 's'} reported)`
          : ''}
        .
      </p>
    )
  }

  const xMin = data.bins[0].start
  const xMax = data.bins[data.bins.length - 1].end
  const yMax = Math.max(data.maxHistogram, data.maxCurve, 1)

  const xScale = (value) =>
    padding.left + ((value - xMin) / (xMax - xMin || 1)) * plotWidth

  const yScale = (value) =>
    padding.top + plotHeight - (value / yMax) * plotHeight

  const barWidth = Math.max(plotWidth / data.bins.length - 4, 2)

  const curvePath = data.curvePoints
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${xScale(point.x)} ${yScale(point.y)}`
    })
    .join(' ')

  const last = data.curvePoints.at(-1)
  const first = data.curvePoints[0]
  const areaPath = `${curvePath} L ${xScale(last.x)} ${padding.top + plotHeight} L ${xScale(first.x)} ${padding.top + plotHeight} Z`

  return (
    <div className="stats-chart-wrap">
      <svg
        className="stats-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Bell curve of how late AMP members stay awake"
      >
        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={CHART_WIDTH - padding.right}
          y2={padding.top + plotHeight}
          className="stats-axis"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
          className="stats-axis"
        />

        {data.bins.map((bin) => {
          const x = xScale(bin.start) + 2
          const y = yScale(bin.count)
          const height = padding.top + plotHeight - y

          return (
            <rect
              key={bin.start}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(height, 0)}
              className="stats-histogram-bar"
              rx="2"
            >
              <title>{`${bin.label}: ${bin.count}`}</title>
            </rect>
          )
        })}

        <path d={areaPath} className="stats-curve-area" />
        <path d={curvePath} className="stats-curve-line" />

        {data.bins.map((bin, index) =>
          index % 2 === 0 ? (
            <text
              key={`label-${bin.start}`}
              x={xScale(bin.center)}
              y={CHART_HEIGHT - 16}
              className="stats-axis-label"
              textAnchor="middle"
            >
              {bin.label}
            </text>
          ) : null,
        )}
      </svg>

      <p className="stats-caption">
        {data.sampleSize} timed responses · mean{' '}
        {formatMinutesAsTime(Math.round(data.meanMinutes))}
        {data.allNighters > 0
          ? ` · ${data.allNighters} all-nighter${data.allNighters === 1 ? '' : 's'} off the chart (literally)`
          : ''}
      </p>
    </div>
  )
}

function DreamJobHeatmap({ contacts }) {
  const cells = useMemo(() => buildDreamJobHeatmap(contacts), [contacts])

  if (cells.length === 0) {
    return <p className="stats-empty">No dream jobs yet.</p>
  }

  return (
    <div className="heatmap-grid">
      {cells.map((cell) => (
        <div
          key={cell.id}
          className="heatmap-cell"
          style={{
            '--heat': String(0.12 + cell.intensity * 0.88),
          }}
          title={cell.examples.join(', ')}
        >
          <span className="heatmap-emoji" aria-hidden="true">
            {cell.emoji}
          </span>
          <span className="heatmap-label">{cell.label}</span>
          <span className="heatmap-count">
            {cell.count} {cell.count === 1 ? 'soul' : 'souls'}
          </span>
          {cell.examples.length > 0 && (
            <span className="heatmap-examples">{cell.examples.join(', ')}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function HometownMap({ contacts }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const pins = useMemo(() => buildHometownPins(contacts), [contacts])

  useEffect(() => {
    if (!containerRef.current || pins.length === 0) return undefined

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      worldCopyJump: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    const bounds = []

    for (const pin of pins) {
      const size = Math.min(18 + pin.people.length * 4, 36)
      const icon = L.divIcon({
        className: 'hometown-marker',
        html: `<span class="hometown-marker-dot" style="width:${size}px;height:${size}px">${pin.people.length}</span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map)
      marker.bindTooltip(
        `${pin.label}: ${pin.people.map((person) => person.shortName).join(', ')}`,
      )
      marker.on('click', () => setSelected(pin))
      bounds.push([pin.lat, pin.lng])
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 4)
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5 })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [pins])

  if (pins.length === 0) {
    return (
      <p className="stats-empty">
        No hometowns we could place on a map yet.
      </p>
    )
  }

  return (
    <div className="hometown-map-wrap">
      <div ref={containerRef} className="hometown-map" />
      <div className="hometown-map-side">
        <p className="stats-caption">
          {pins.length} pinned place{pins.length === 1 ? '' : 's'} · click a
          bubble
        </p>
        {selected ? (
          <div className="hometown-selected">
            <h3>{selected.label}</h3>
            <ul>
              {selected.people.map((person) => (
                <li key={person.name}>
                  <strong>{person.name}</strong>
                  <span>{person.hometown}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="hometown-list">
            {pins.map((pin) => (
              <li key={`${pin.lat}-${pin.lng}`}>
                <button
                  type="button"
                  className="hometown-list-button"
                  onClick={() => {
                    setSelected(pin)
                    mapRef.current?.flyTo([pin.lat, pin.lng], 5, {
                      duration: 0.6,
                    })
                  }}
                >
                  <span>{pin.label}</span>
                  <span>{pin.people.map((p) => p.shortName).join(', ')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatsPage({ contacts }) {
  const highlights = useMemo(() => buildFunnyHighlights(contacts), [contacts])
  const colleges = useMemo(() => buildCollegeBars(contacts), [contacts])
  const majors = useMemo(() => buildMajorBars(contacts), [contacts])
  const fruits = useMemo(() => buildFruitBars(contacts).slice(0, 10), [contacts])
  const missed = useMemo(() => buildMissedClassBars(contacts), [contacts])

  if (contacts.length === 0) {
    return (
      <section className="stats-page">
        <p className="stats-empty">
          No contacts loaded yet — stats will appear once the directory has
          people.
        </p>
      </section>
    )
  }

  return (
    <section className="stats-page">
      <div className="stats-highlights">
        {highlights.map((item) => (
          <article key={item.label} className="stats-highlight">
            <p className="stats-highlight-label">{item.label}</p>
            <p className="stats-highlight-value">{item.value}</p>
            <p className="stats-highlight-detail">{item.detail}</p>
          </article>
        ))}
      </div>

      <article className="stats-panel">
        <h2>AMP diaspora map</h2>
        <p className="stats-description">
          Hometowns pinned on a real map. Bigger bubbles = more AMP people from
          that place.
        </p>
        <HometownMap contacts={contacts} />
      </article>

      <article className="stats-panel">
        <h2>Dream job heat map</h2>
        <p className="stats-description">
          Where ambitions cluster — hotter cells mean more people chasing that
          vibe.
        </p>
        <DreamJobHeatmap contacts={contacts} />
      </article>

      <div className="stats-split">
        <article className="stats-panel">
          <h2>College census</h2>
          <p className="stats-description">Who&apos;s representing which campus.</p>
          <HorizontalBars items={colleges} ariaLabel="Colleges bar chart" />
        </article>

        <article className="stats-panel">
          <h2>Major chaos</h2>
          <p className="stats-description">
            Intended majors, sorted into slightly judgmental buckets.
          </p>
          <HorizontalBars items={majors} ariaLabel="Majors bar chart" />
        </article>
      </div>

      <article className="stats-panel">
        <h2>How late we stay up at AMP</h2>
        <p className="stats-description">
          Histogram + fitted bell curve of latest bedtime (all-nighters called
          out separately so they don&apos;t break the math).
        </p>
        <LatenessBellCurve contacts={contacts} />
      </article>

      <div className="stats-split">
        <article className="stats-panel">
          <h2>Days missed class</h2>
          <p className="stats-description">Attendance lore, ranked.</p>
          <HorizontalBars
            items={missed.map((item) => ({
              label: item.name,
              count: item.days,
              display: item.label,
            }))}
            ariaLabel="Days missed class"
            valueFormatter={(item) => item.display}
            showPercent={false}
          />
        </article>

        <article className="stats-panel">
          <h2>Fruit identity politics</h2>
          <p className="stats-description">If you were a fruit… democracy edition.</p>
          <HorizontalBars items={fruits} ariaLabel="Favorite fruits" />
        </article>
      </div>
    </section>
  )
}

export default StatsPage
