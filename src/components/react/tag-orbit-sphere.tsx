import { useEffect, useMemo, useRef, useState } from 'react'

interface TagOrbitItem {
  tag: string
  count: number
}

interface TagRelation {
  source: string
  target: string
  weight: number
}

interface TagOrbitSphereProps {
  tags: TagOrbitItem[]
  relations?: TagRelation[]
  maxNodes?: number
}

type SortMode = 'heat' | 'alphabet'

interface BaseNode extends TagOrbitItem {
  href: string
  weight: number
  x: number
  y: number
  z: number
}

interface ProjectedNode extends BaseNode {
  index: number
  sx: number
  sy: number
  radius: number
  depth: number
  rx: number
  ry: number
  rz: number
}

interface HoveredTag {
  tag: string
  count: number
  href: string
}

const THEME_CHANGE_EVENT = 'bx-theme-change'
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function parseRgbChannels(input: string): [number, number, number] | null {
  const matched = input.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
  if (!matched) {
    return null
  }
  return [Number(matched[1]), Number(matched[2]), Number(matched[3])]
}

function withAlpha(rgb: [number, number, number] | null, alpha: number, fallback: string): string {
  if (!rgb) {
    return fallback
  }
  const safeAlpha = clamp(alpha, 0, 1)
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${safeAlpha})`
}

function sortByTagName(a: TagOrbitItem, b: TagOrbitItem): number {
  return a.tag.localeCompare(b.tag, 'zh-Hans-CN', { sensitivity: 'base' })
}

export default function TagOrbitSphere({ tags, relations = [], maxNodes = 72 }: TagOrbitSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  const [hoveredTag, setHoveredTag] = useState<HoveredTag | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [sortMode, setSortMode] = useState<SortMode>('heat')
  const [relationMode, setRelationMode] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const hotSortedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : sortByTagName(a, b)
    })
  }, [tags])

  const normalizedTags = useMemo(() => {
    const source =
      sortMode === 'heat' ? hotSortedTags : [...hotSortedTags].sort((a, b) => sortByTagName(a, b))
    const scoped = source.slice(0, maxNodes)

    const maxCount = scoped.reduce((max, item) => Math.max(max, item.count), 1)
    const minCount = scoped.reduce((min, item) => Math.min(min, item.count), maxCount)
    const span = Math.max(maxCount - minCount, 1)

    return scoped.map((item, index) => {
      const y = scoped.length === 1 ? 0 : 1 - (index / (scoped.length - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = GOLDEN_ANGLE * index
      const weight = (item.count - minCount) / span

      return {
        ...item,
        href: `/tags/${encodeURIComponent(item.tag)}/`,
        weight,
        x: Math.cos(theta) * r,
        y,
        z: Math.sin(theta) * r,
      } satisfies BaseNode
    })
  }, [hotSortedTags, maxNodes, sortMode])

  const quickTags = useMemo(() => {
    return hotSortedTags.slice(0, 8)
  }, [hotSortedTags])

  const visibleTagSet = useMemo(() => {
    return new Set(normalizedTags.map((item) => item.tag))
  }, [normalizedTags])

  const relationLookup = useMemo(() => {
    const lookup = new Map<string, Map<string, number>>()

    for (const relation of relations) {
      if (relation.source === relation.target) {
        continue
      }
      if (!visibleTagSet.has(relation.source) || !visibleTagSet.has(relation.target)) {
        continue
      }

      if (!lookup.has(relation.source)) {
        lookup.set(relation.source, new Map())
      }
      if (!lookup.has(relation.target)) {
        lookup.set(relation.target, new Map())
      }

      lookup.get(relation.source)?.set(relation.target, relation.weight)
      lookup.get(relation.target)?.set(relation.source, relation.weight)
    }

    return lookup
  }, [relations, visibleTagSet])

  const selectedRelatedCount = useMemo(() => {
    if (!selectedTag) {
      return 0
    }
    return relationLookup.get(selectedTag)?.size || 0
  }, [relationLookup, selectedTag])

  useEffect(() => {
    if (selectedTag && !visibleTagSet.has(selectedTag)) {
      setSelectedTag(null)
    }
  }, [selectedTag, visibleTagSet])

  useEffect(() => {
    const canvas = canvasRef.current
    const shell = shellRef.current
    if (!canvas || !shell || normalizedTags.length === 0) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const probe = document.createElement('span')
    probe.style.position = 'absolute'
    probe.style.visibility = 'hidden'
    probe.style.pointerEvents = 'none'
    shell.appendChild(probe)

    const pointer = {
      x: 0,
      y: 0,
      inside: false,
    }

    const motion = {
      rotX: -0.24,
      rotY: 0.38,
      velX: 0,
      velY: 0,
      dragging: false,
      moved: false,
      lastX: 0,
      lastY: 0,
    }

    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let radius = 0
    let hoverIndex = -1
    let animationFrame = 0
    let projectedNodes: ProjectedNode[] = []

    const getThemePalette = () => {
      probe.style.color = 'var(--accent)'
      const accent = parseRgbChannels(getComputedStyle(probe).color)
      probe.style.color = 'var(--foreground)'
      const foreground = parseRgbChannels(getComputedStyle(probe).color)
      return {
        accent,
        foreground,
      }
    }

    let palette = getThemePalette()

    const updateCanvasMetrics = () => {
      const rect = shell.getBoundingClientRect()
      width = rect.width
      height = rect.height
      radius = Math.min(width, height) * 0.35
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.imageSmoothingEnabled = true
    }

    const detectHoveredNode = (x: number, y: number) => {
      const frontToBack = [...projectedNodes].sort((a, b) => b.depth - a.depth)
      for (const node of frontToBack) {
        const dx = x - node.sx
        const dy = y - node.sy
        if (Math.hypot(dx, dy) <= node.radius + 6) {
          return node.index
        }
      }
      return -1
    }

    const refreshHoverState = (index: number) => {
      if (index === hoverIndex) {
        return
      }

      hoverIndex = index
      if (hoverIndex >= 0) {
        const node = normalizedTags[hoverIndex]
        setHoveredTag({ tag: node.tag, count: node.count, href: node.href })
      } else {
        setHoveredTag(null)
      }
    }

    const draw = () => {
      const cx = width / 2
      const cy = height / 2

      if (!reducedMotion) {
        motion.rotY += 0.0016
        motion.rotX += 0.00035
      }

      motion.rotX += motion.velY
      motion.rotY += motion.velX
      motion.velX *= 0.94
      motion.velY *= 0.94

      context.clearRect(0, 0, width, height)

      const backdrop = context.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.35)
      backdrop.addColorStop(0, withAlpha(palette.accent, 0.08, 'rgba(87, 201, 126, 0.08)'))
      backdrop.addColorStop(1, withAlpha(palette.accent, 0, 'rgba(87, 201, 126, 0)'))
      context.fillStyle = backdrop
      context.fillRect(0, 0, width, height)

      const sinX = Math.sin(motion.rotX)
      const cosX = Math.cos(motion.rotX)
      const sinY = Math.sin(motion.rotY)
      const cosY = Math.cos(motion.rotY)
      const cameraDistance = 2.8

      projectedNodes = normalizedTags.map((node, index) => {
        const y1 = node.y * cosX - node.z * sinX
        const z1 = node.y * sinX + node.z * cosX
        const x2 = node.x * cosY + z1 * sinY
        const z2 = -node.x * sinY + z1 * cosY

        const perspective = cameraDistance / (cameraDistance - z2)
        const sx = cx + x2 * radius * perspective
        const sy = cy + y1 * radius * perspective
        const depth = (z2 + 1) / 2
        const pointRadius = (1.8 + node.weight * 2.6) * perspective

        return {
          index,
          ...node,
          sx,
          sy,
          depth,
          radius: pointRadius,
          rx: x2,
          ry: y1,
          rz: z2,
        }
      })

      const activeRelationMap = selectedTag ? relationLookup.get(selectedTag) : undefined
      const selectedNode = selectedTag
        ? projectedNodes.find((node) => node.tag === selectedTag) || null
        : null
      const relationFocus = relationMode && Boolean(selectedNode)

      if (relationFocus && selectedNode && activeRelationMap && activeRelationMap.size > 0) {
        let maxWeight = 1
        for (const weight of activeRelationMap.values()) {
          maxWeight = Math.max(maxWeight, weight)
        }

        for (const node of projectedNodes) {
          if (node.tag === selectedNode.tag) {
            continue
          }

          const relationWeight = activeRelationMap.get(node.tag)
          if (!relationWeight) {
            continue
          }

          const averageDepth = (node.depth + selectedNode.depth) / 2
          const normalizedWeight = relationWeight / maxWeight
          const alpha = (0.16 + normalizedWeight * 0.56) * (0.35 + averageDepth * 0.65)

          context.strokeStyle = withAlpha(palette.accent, alpha, 'rgba(87, 201, 126, 0.42)')
          context.lineWidth = 0.8 + normalizedWeight * 2.2 + averageDepth * 0.5
          context.beginPath()
          context.moveTo(selectedNode.sx, selectedNode.sy)
          context.lineTo(node.sx, node.sy)
          context.stroke()
        }
      } else {
        for (let i = 0; i < projectedNodes.length; i += 1) {
          for (let j = i + 1; j < projectedNodes.length; j += 1) {
            const a = projectedNodes[i]
            const b = projectedNodes[j]
            const distance = Math.hypot(a.rx - b.rx, a.ry - b.ry, a.rz - b.rz)

            if (distance > 0.92) {
              continue
            }

            const averageDepth = (a.depth + b.depth) / 2
            const alpha = (1 - distance / 0.92) * (0.08 + averageDepth * 0.26)

            context.strokeStyle = withAlpha(palette.accent, alpha, 'rgba(87, 201, 126, 0.2)')
            context.lineWidth = 0.5 + averageDepth * 1.2
            context.beginPath()
            context.moveTo(a.sx, a.sy)
            context.lineTo(b.sx, b.sy)
            context.stroke()
          }
        }
      }

      const drawOrder = [...projectedNodes].sort((a, b) => a.depth - b.depth)
      for (const node of drawOrder) {
        const isHovered = node.index === hoverIndex
        const isSelected = selectedTag === node.tag
        const relationWeight = activeRelationMap?.get(node.tag) || 0
        const isRelated = relationWeight > 0
        const isDimmed = relationFocus && !isSelected && !isRelated

        const glowAlpha = isSelected
          ? 0.65
          : isRelated
            ? 0.42
            : isDimmed
              ? 0.06
              : isHovered
                ? 0.4
                : 0.18 + node.depth * 0.18
        const fillAlpha = isSelected
          ? 1
          : isRelated
            ? 0.92
            : isDimmed
              ? 0.14
              : isHovered
                ? 0.95
                : 0.45 + node.depth * 0.45
        const radiusScale = isSelected ? 1.95 : isRelated ? 1.52 : isHovered ? 1.4 : 1.25

        context.beginPath()
        context.arc(node.sx, node.sy, node.radius * radiusScale, 0, Math.PI * 2)
        context.fillStyle = withAlpha(palette.accent, glowAlpha, 'rgba(87, 201, 126, 0.32)')
        context.fill()

        context.beginPath()
        context.arc(node.sx, node.sy, node.radius * (isSelected ? 1.18 : 1), 0, Math.PI * 2)
        context.fillStyle = withAlpha(palette.accent, fillAlpha, 'rgba(87, 201, 126, 0.8)')
        context.fill()
      }

      let labelNodes: ProjectedNode[]
      if (relationFocus && selectedNode) {
        const preferred = projectedNodes
          .filter((node) => node.tag === selectedNode.tag || Boolean(activeRelationMap?.get(node.tag)))
          .sort((a, b) => {
            if (a.tag === selectedNode.tag) return -1
            if (b.tag === selectedNode.tag) return 1
            const weightA = activeRelationMap?.get(a.tag) || 0
            const weightB = activeRelationMap?.get(b.tag) || 0
            if (weightA !== weightB) return weightB - weightA
            return b.depth - a.depth
          })
        labelNodes = preferred.slice(0, 16)
      } else {
        labelNodes = [...projectedNodes].sort((a, b) => b.depth - a.depth).slice(0, Math.min(18, projectedNodes.length))
      }

      for (const node of labelNodes) {
        const relationWeight = activeRelationMap?.get(node.tag) || 0
        const isSelected = selectedTag === node.tag
        const isDimmed = relationFocus && !isSelected && relationWeight === 0

        context.font = `500 ${10 + node.depth * 3}px "Geist Mono", "Consolas", monospace`
        context.fillStyle = withAlpha(
          palette.foreground,
          isSelected ? 0.98 : isDimmed ? 0.16 : 0.26 + node.depth * 0.52,
          'rgba(220, 231, 220, 0.78)'
        )
        context.fillText(`#${node.tag}`, node.sx + node.radius + 4, node.sy + 3)
      }

      if (pointer.inside && !motion.dragging) {
        refreshHoverState(detectHoveredNode(pointer.x, pointer.y))
        canvas.style.cursor = hoverIndex >= 0 ? (relationMode ? 'cell' : 'pointer') : 'grab'
      }

      animationFrame = window.requestAnimationFrame(draw)
    }

    const onPointerDown = (event: PointerEvent) => {
      motion.dragging = true
      motion.moved = false
      motion.lastX = event.clientX
      motion.lastY = event.clientY
      canvas.style.cursor = 'grabbing'
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.inside = true
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      setTooltipPos({ x: pointer.x, y: pointer.y })

      if (!motion.dragging) {
        return
      }

      const dx = event.clientX - motion.lastX
      const dy = event.clientY - motion.lastY

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        motion.moved = true
      }

      motion.rotY += dx * 0.0056
      motion.rotX += dy * 0.0056
      motion.velX = dx * 0.00045
      motion.velY = dy * 0.00045
      motion.lastX = event.clientX
      motion.lastY = event.clientY
    }

    const onPointerUp = (event: PointerEvent) => {
      if (motion.dragging && !motion.moved && hoverIndex >= 0) {
        const target = normalizedTags[hoverIndex]
        if (relationMode) {
          setSelectedTag((prev) => (prev === target.tag ? null : target.tag))
        } else {
          window.location.href = target.href
        }
      }

      motion.dragging = false
      canvas.style.cursor = hoverIndex >= 0 ? (relationMode ? 'cell' : 'pointer') : 'grab'
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
    }

    const onPointerLeave = () => {
      pointer.inside = false
      if (!motion.dragging) {
        refreshHoverState(-1)
        canvas.style.cursor = 'default'
      }
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = () => {
      reducedMotion = mediaQuery.matches
    }

    const onThemeChange = () => {
      palette = getThemePalette()
    }

    const onWindowResize = () => {
      updateCanvasMetrics()
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            updateCanvasMetrics()
          })
        : null

    updateCanvasMetrics()
    palette = getThemePalette()
    animationFrame = window.requestAnimationFrame(draw)

    if (resizeObserver) {
      resizeObserver.observe(shell)
    } else {
      window.addEventListener('resize', onWindowResize)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onMotionChange)
    } else {
      const legacyAddListener = Reflect.get(mediaQuery, 'addListener')
      if (typeof legacyAddListener === 'function') {
        legacyAddListener.call(mediaQuery, onMotionChange)
      }
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener('resize', onWindowResize)
      }
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', onMotionChange)
      } else {
        const legacyRemoveListener = Reflect.get(mediaQuery, 'removeListener')
        if (typeof legacyRemoveListener === 'function') {
          legacyRemoveListener.call(mediaQuery, onMotionChange)
        }
      }
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange)
      probe.remove()
    }
  }, [normalizedTags, relationLookup, relationMode, selectedTag])

  const canUseRelationMode = relationLookup.size > 0

  return (
    <section className="tag-orbit-panel">
      <div className="tag-orbit-head">
        <h2>Tag Orbit</h2>
        <p>拖拽旋转球体，点击节点进入标签页面。节点越大，代表该标签文章越多。</p>
      </div>

      <div className="tag-orbit-controls">
        <div className="tag-orbit-sort-switch" role="group" aria-label="标签排序模式">
          <button
            type="button"
            className={sortMode === 'heat' ? 'active' : ''}
            onClick={() => setSortMode('heat')}
          >
            按热度
          </button>
          <button
            type="button"
            className={sortMode === 'alphabet' ? 'active' : ''}
            onClick={() => setSortMode('alphabet')}
          >
            按字母
          </button>
        </div>

        <button
          type="button"
          className={`relation-toggle ${relationMode ? 'active' : ''}`}
          disabled={!canUseRelationMode}
          onClick={() => {
            setRelationMode((prev) => {
              const next = !prev
              if (!next) {
                setSelectedTag(null)
              }
              return next
            })
          }}
        >
          {relationMode ? '关闭关联高亮' : '开启关联高亮'}
        </button>
      </div>

      <p className="tag-orbit-status">
        {relationMode
          ? selectedTag
            ? `已选中 #${selectedTag}，共 ${selectedRelatedCount} 个关联标签。`
            : '关联模式已开启，点击任意节点查看关联标签。'
          : '普通模式下点击节点可直接进入对应标签页。'}
      </p>

      <div className="tag-orbit-shell" ref={shellRef}>
        <canvas ref={canvasRef} aria-label="标签关系球形图" />
        {hoveredTag && (
          <a
            className="tag-orbit-tooltip"
            href={hoveredTag.href}
            style={{ left: tooltipPos.x + 14, top: tooltipPos.y + 14 }}
          >
            <span>#{hoveredTag.tag}</span>
            <span>{hoveredTag.count} 篇</span>
          </a>
        )}
      </div>

      <div className="tag-orbit-quick-links">
        {quickTags.map((item) => (
          <a key={item.tag} href={`/tags/${encodeURIComponent(item.tag)}/`}>
            #{item.tag}
            <small>{item.count}</small>
          </a>
        ))}
      </div>

      <style>{`
        .tag-orbit-panel {
          margin-top: 56px;
          border: 1px dashed color-mix(in srgb, var(--accent) 55%, transparent);
          background: color-mix(in srgb, var(--accent) 7%, transparent);
          padding: 18px;
        }

        .tag-orbit-head h2 {
          margin: 0;
          color: var(--accent);
          font-size: calc(var(--font-size) * 1.15);
        }

        .tag-orbit-head p {
          margin: 8px 0 0;
          color: color-mix(in srgb, var(--foreground) 72%, transparent);
          line-height: 1.55;
        }

        .tag-orbit-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
        }

        .tag-orbit-sort-switch {
          display: inline-flex;
          gap: 8px;
        }

        .tag-orbit-sort-switch button,
        .relation-toggle {
          border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
          background: color-mix(in srgb, var(--background) 92%, transparent);
          color: color-mix(in srgb, var(--foreground) 75%, transparent);
          padding: 5px 10px;
          font: inherit;
          cursor: pointer;
          transition: all 0.15s linear;
        }

        .tag-orbit-sort-switch button.active,
        .relation-toggle.active {
          border-color: color-mix(in srgb, var(--accent) 85%, transparent);
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 18%, transparent);
        }

        .relation-toggle:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .tag-orbit-status {
          margin: 10px 0 0;
          color: color-mix(in srgb, var(--foreground) 68%, transparent);
          line-height: 1.5;
        }

        .tag-orbit-shell {
          margin-top: 14px;
          position: relative;
          height: clamp(320px, 48vw, 520px);
          border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
          background: radial-gradient(
            circle at 50% 45%,
            color-mix(in srgb, var(--accent) 10%, transparent) 0%,
            color-mix(in srgb, var(--background) 96%, transparent) 72%
          );
          overflow: hidden;
        }

        .tag-orbit-shell canvas {
          width: 100%;
          height: 100%;
          display: block;
          touch-action: none;
          cursor: grab;
        }

        .tag-orbit-tooltip {
          position: absolute;
          transform: translateZ(0);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border: 1px solid color-mix(in srgb, var(--accent) 70%, transparent);
          background: color-mix(in srgb, var(--background) 92%, var(--accent));
          color: var(--foreground);
          text-decoration: none;
          white-space: nowrap;
          pointer-events: auto;
          z-index: 4;
        }

        .tag-orbit-tooltip span:first-child {
          color: var(--accent);
          font-weight: 700;
        }

        .tag-orbit-tooltip span:last-child {
          color: color-mix(in srgb, var(--foreground) 70%, transparent);
          font-size: calc(var(--font-size) * 0.85);
        }

        .tag-orbit-quick-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .tag-orbit-quick-links a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
          padding: 5px 10px;
          text-decoration: none;
          color: var(--accent);
          transition: all 0.15s linear;
        }

        .tag-orbit-quick-links a:hover {
          background: color-mix(in srgb, var(--accent) 18%, transparent);
          color: var(--foreground);
        }

        .tag-orbit-quick-links a small {
          color: color-mix(in srgb, var(--foreground) 68%, transparent);
          font-size: calc(var(--font-size) * 0.78);
          line-height: 1;
        }

        @media (max-width: 720px) {
          .tag-orbit-panel {
            padding: 14px;
          }

          .tag-orbit-head p,
          .tag-orbit-status {
            font-size: calc(var(--font-size) * 0.92);
          }

          .tag-orbit-tooltip {
            padding: 5px 8px;
            gap: 6px;
          }
        }
      `}</style>
    </section>
  )
}
