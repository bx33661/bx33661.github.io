import satori from 'satori'
import { html } from 'satori-html'
import { Resvg } from '@resvg/resvg-js'
import { SITE } from '@/config.ts'
import { getAllNoteSlugs, getAllPostSlugs } from '@/lib/data-utils'
import type { APIContext } from 'astro'
import fs from 'fs'
import path from 'path'

const MontserratRegular = fs.readFileSync(
  path.resolve('./public/fonts/_montserrat_regular.ttf'),
)
const MontserratBold = fs.readFileSync(
  path.resolve('./public/fonts/_montserrat_bold.ttf'),
)

const dimensions = {
  width: 1200,
  height: 630,
}

interface Props {
  title: string
  date: Date
  description: string
  tags: string[]
  contentType?: string
}

const MAX_TITLE_LENGTH = 78
const MAX_DESCRIPTION_LENGTH = 160
const MAX_TAGS = 5

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value

const formatDate = (input: Date) => {
  const parsedDate = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })
  }

  return parsedDate.toLocaleDateString('en-US', { dateStyle: 'long' })
}

export async function GET(context: APIContext) {
  const { title, date, description, tags, contentType = 'Article' } = context.props as Props

  const safeTitle = escapeHtml(truncate(title || SITE.title, MAX_TITLE_LENGTH))
  const safeDescription = escapeHtml(
    truncate(description || SITE.desc, MAX_DESCRIPTION_LENGTH),
  )
  const safeContentType = escapeHtml(contentType)
  const safeSiteName = escapeHtml(SITE.title)
  const formattedDate = formatDate(date)

  const tagElements = tags
    .slice(0, MAX_TAGS)
    .map(
      (tag) => `<div
        style="display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.18); border-radius: 999px; padding: 8px 16px; margin-right: 12px; margin-bottom: 10px; color: #e6ecff; font-size: 19px; font-weight: 500; background: rgba(22, 29, 49, 0.56);"
      >#${escapeHtml(tag)}</div>`,
    )
    .join('')

  const markup = html(
    `<div style="display: flex; width: 1200px; height: 630px; position: relative; overflow: hidden; background: linear-gradient(140deg, #0a1020 0%, #132248 44%, #3d1832 100%);">
      <div style="display: flex; position: absolute; width: 760px; height: 760px; top: -260px; left: -220px; border-radius: 999px; background: radial-gradient(circle, rgba(80, 155, 255, 0.34) 0%, rgba(80, 155, 255, 0.03) 72%, transparent 100%);"></div>
      <div style="display: flex; position: absolute; width: 540px; height: 540px; bottom: -220px; right: -150px; border-radius: 999px; background: radial-gradient(circle, rgba(255, 100, 180, 0.24) 0%, rgba(255, 100, 180, 0.03) 68%, transparent 100%);"></div>

      <div style="display: flex; flex-direction: column; width: 100%; margin: 28px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.15); background: linear-gradient(180deg, rgba(8, 11, 20, 0.70) 0%, rgba(9, 12, 26, 0.86) 100%); padding: 40px 48px;">
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 20px; color: #afc2f6; letter-spacing: 0.03em;">
          <div style="display: flex; align-items: center; border-radius: 999px; padding: 8px 16px; color: #e2ebff; font-weight: 700; border: 1px solid rgba(147, 197, 253, 0.35); background: rgba(59, 130, 246, 0.22);">
            ${safeContentType}
          </div>
          <div style="display: flex; color: #b8c3e4; font-weight: 500;">${formattedDate}</div>
        </div>

        <div style="display: flex; margin-top: 28px; color: #ffffff; font-size: 72px; font-weight: 700; line-height: 1.08; letter-spacing: -0.02em;">
          ${safeTitle}
        </div>

        <div style="display: flex; margin-top: 20px; width: 126px; height: 4px; border-radius: 999px; background: linear-gradient(90deg, #60a5fa 0%, #f9a8d4 100%);"></div>

        <div style="display: flex; margin-top: 22px; width: 90%; color: #d8e0f8; font-size: 28px; line-height: 1.4;">
          ${safeDescription}
        </div>

        <div style="display: flex; flex-wrap: wrap; margin-top: 30px; min-height: 56px;">
          ${tagElements}
        </div>

        <div style="display: flex; margin-top: auto; padding-top: 28px; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.14);">
          <div style="display: flex; flex-direction: column;">
            <div style="display: flex; color: #ffffff; font-size: 32px; font-weight: 700;">${safeSiteName}</div>
            <div style="display: flex; margin-top: 6px; color: #aab9e0; font-size: 20px;">${escapeHtml(new URL(SITE.website).hostname)}</div>
          </div>
          <div style="display: flex; align-items: center; color: #dde7ff; font-size: 22px; border-radius: 14px; padding: 12px 18px; border: 1px solid rgba(167, 189, 255, 0.30); background: rgba(20, 30, 52, 0.66);">
            Open Graph Card
          </div>
        </div>
      </div>
    </div>`,
  ) as unknown as any

  const svg = await satori(markup, {
    fonts: [
      {
        name: 'Montserrat',
        data: MontserratRegular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Montserrat',
        data: MontserratBold,
        weight: 700,
        style: 'normal',
      },
    ],
    height: dimensions.height,
    width: dimensions.width,
    debug: false
  })

  const image = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: dimensions.width,
    },
    font: {
      fontFiles: [
        MontserratRegular.toString('base64'),
        MontserratBold.toString('base64'),
      ],
      loadSystemFonts: true,
      defaultFontFamily: 'Montserrat',
    },
    logLevel: 'error',
    background: 'transparent',
    imageRendering: 1,
    shapeRendering: 2,
    textRendering: 1,
    dpi: 144
  }).render()

  const pngData = image.asPng()

  return new Response(new Uint8Array(pngData), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="social-card.png"',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': pngData.length.toString(),
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

export async function getStaticPaths() {
  const postSlugs = await getAllPostSlugs()
  const noteSlugs = await getAllNoteSlugs()

  const postPaths = postSlugs.map(({ slug, post }) => ({
    params: {
      id: slug,
    },
    props: {
      title: post.data.title,
      date: post.data.pubDatetime,
      description: post.data.description,
      tags: post.data.tags || [],
      contentType: 'Blog Post'
    },
  }))

  const notePaths = noteSlugs.map(({ slug, note }) => ({
    params: {
      id: slug,
    },
    props: {
      title: note.data.title,
      date: note.data.date,
      description: note.data.description,
      tags: note.data.tags || [],
      contentType: 'Note'
    },
  }))

  return [...postPaths, ...notePaths]
}
