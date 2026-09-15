import CuratedContent from '../models/CuratedContent.js'

function extractYoutubeId(input) {
  if (!input) return ''
  const trimmed = input.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }
  return /^[\w-]{11}$/.test(trimmed) ? trimmed : ''
}

/**
 * GET /api/videos
 */
export async function getVideos(req, res, next) {
  try {
    const { status, search, tag } = req.query
    const filter = {}

    if (status) {
      filter.status = status
    }
    if (tag) {
      filter.tags = tag
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const videos = await CuratedContent.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ videos })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/videos/:id
 */
export async function getVideoById(req, res, next) {
  try {
    const video = await CuratedContent.findById(req.params.id).lean()
    if (!video) {
      return res.status(404).json({ error: 'Video not found' })
    }
    res.json({ video })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/videos (admin)
 */
export async function createVideo(req, res, next) {
  try {
    const {
      title,
      publisher,
      duration,
      youtubeUrl,
      videoUrl,
      description,
      thumbnail,
      tags,
      fieldMarks,
      status,
    } = req.body

    if (!title || !publisher || !duration) {
      return res.status(400).json({ error: 'Title, publisher, and duration are required' })
    }

    const rawUrl = youtubeUrl || videoUrl || ''
    const ytId = extractYoutubeId(rawUrl) || (rawUrl.length === 11 ? rawUrl : '')

    const generatedThumbnail =
      thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : '')

    const video = await CuratedContent.create({
      title: title.trim(),
      publisher: publisher.trim(),
      duration: duration.trim(),
      youtubeId: ytId || 'M7lc1UVf-VE',
      videoUrl: rawUrl.trim(),
      description: description ? description.trim() : '',
      thumbnail: generatedThumbnail,
      tags: Array.isArray(tags) ? tags.map((t) => t.trim()) : [],
      fieldMarks:
        Array.isArray(fieldMarks) && fieldMarks.length > 0
          ? fieldMarks
          : ['Computer Science'],
      status: status || 'Published',
    })

    res.status(201).json({ video })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/videos/:id (admin)
 */
export async function updateVideo(req, res, next) {
  try {
    const video = await CuratedContent.findById(req.params.id)
    if (!video) {
      return res.status(404).json({ error: 'Video not found' })
    }

    const {
      title,
      publisher,
      duration,
      youtubeUrl,
      videoUrl,
      description,
      thumbnail,
      tags,
      fieldMarks,
      status,
    } = req.body

    if (title !== undefined) video.title = title.trim()
    if (publisher !== undefined) video.publisher = publisher.trim()
    if (duration !== undefined) video.duration = duration.trim()
    if (description !== undefined) video.description = description.trim()
    if (status !== undefined) video.status = status
    if (tags !== undefined) video.tags = Array.isArray(tags) ? tags : []
    if (fieldMarks !== undefined && Array.isArray(fieldMarks) && fieldMarks.length > 0) {
      video.fieldMarks = fieldMarks
    }

    const rawUrl = youtubeUrl !== undefined ? youtubeUrl : videoUrl
    if (rawUrl !== undefined) {
      video.videoUrl = rawUrl.trim()
      const ytId = extractYoutubeId(rawUrl) || (rawUrl.trim().length === 11 ? rawUrl.trim() : '')
      if (ytId) {
        video.youtubeId = ytId
        if (!thumbnail) {
          video.thumbnail = `https://img.youtube.com/vi/${ytId}/default.jpg`
        }
      }
    }

    if (thumbnail !== undefined) {
      video.thumbnail = thumbnail.trim()
    }

    await video.save()
    res.json({ video })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/videos/:id (admin)
 */
export async function deleteVideo(req, res, next) {
  try {
    const video = await CuratedContent.findByIdAndDelete(req.params.id)
    if (!video) {
      return res.status(404).json({ error: 'Video not found' })
    }
    res.json({ message: 'Video deleted successfully' })
  } catch (err) {
    next(err)
  }
}
