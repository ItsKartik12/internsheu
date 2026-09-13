import Course from '../models/Course.js'

/**
 * GET /api/courses
 */
export async function getCourses(req, res, next) {
  try {
    const { search, category, level, educatorId } = req.query
    const filter = { isActive: true }

    if (educatorId) {
      filter.educatorId = educatorId
    }
    if (category && category !== 'All') {
      filter.category = category
    }
    if (level && level !== 'All') {
      filter.level = level
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    const courses = await Course.find(filter)
      .populate('educatorId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ courses })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/courses/:id
 */
export async function getCourseById(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
      .populate('educatorId', 'name email')
      .lean()

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    res.json({ course })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/courses (educator, admin)
 */
export async function createCourse(req, res, next) {
  try {
    const { title, description, category, level, duration, tags, lessons, thumbnail } = req.body

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' })
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      level: level || 'Beginner',
      duration: duration || '4 Weeks',
      tags: Array.isArray(tags) ? tags : [],
      lessons: Array.isArray(lessons) ? lessons : [],
      thumbnail: thumbnail || '',
      educatorId: req.user._id,
      educatorName: req.user.name,
    })

    res.status(201).json({ course })
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/courses/:id (owner educator, admin)
 */
export async function updateCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Authorization: only owner or admin can update
    if (req.user.role !== 'admin' && course.educatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to edit this course' })
    }

    const updatableFields = ['title', 'description', 'category', 'level', 'duration', 'tags', 'lessons', 'thumbnail', 'isActive']
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field]
      }
    }

    await course.save()
    res.json({ course })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/courses/:id (owner educator, admin)
 */
export async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (req.user.role !== 'admin' && course.educatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this course' })
    }

    await Course.findByIdAndDelete(req.params.id)
    res.json({ message: 'Course deleted successfully' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/courses/:id/enroll (students)
 */
export async function enrollCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    course.enrolledCount = (course.enrolledCount || 0) + 1
    await course.save()

    res.json({ message: 'Enrolled successfully', enrolledCount: course.enrolledCount })
  } catch (err) {
    next(err)
  }
}
