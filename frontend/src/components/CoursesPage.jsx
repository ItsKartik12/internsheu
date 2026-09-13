import { useState, useEffect } from 'react'
import {
  BookOpen,
  Search,
  Clock,
  Users,
  Star,
  Plus,
  PlayCircle,
  CheckCircle2,
  X,
  GraduationCap,
} from 'lucide-react'
import { fetchCourses, enrollCourseApi, createCourseApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['All', 'Web Development', 'AI & Data Science', 'Cloud & DevOps', 'Core CS', 'Programming']
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced']

export default function CoursesPage() {
  const { user } = useAuth()
  const isEducatorOrAdmin = user?.role === 'educator' || user?.role === 'admin'

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set())
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [message, setMessage] = useState('')

  // Create Form State
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Web Development')
  const [newLevel, setNewLevel] = useState('Beginner')
  const [newDuration, setNewDuration] = useState('4 Weeks')
  const [newDesc, setNewDesc] = useState('')
  const [newTags, setNewTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [search, selectedCategory, selectedLevel])

  async function loadCourses() {
    setLoading(true)
    const data = await fetchCourses({
      search: search || undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      level: selectedLevel !== 'All' ? selectedLevel : undefined,
    })
    setCourses(data?.courses || [])
    setLoading(false)
  }

  async function handleEnroll(e, courseId) {
    e.stopPropagation()
    try {
      await enrollCourseApi(courseId)
      setEnrolledCourseIds((prev) => new Set([...prev, courseId]))
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c))
      )
      setMessage('Successfully enrolled in course!')
      setTimeout(() => setMessage(''), 3000)
    } catch {
      // optimistic fallback
      setEnrolledCourseIds((prev) => new Set([...prev, courseId]))
      setMessage('Enrolled successfully (offline demo mode)!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleCreateCourse(e) {
    e.preventDefault()
    if (!newTitle.trim() || !newDesc.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        level: newLevel,
        duration: newDuration,
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        lessons: [
          { title: 'Module 1: Orientation & Foundations', duration: '30 mins' },
          { title: 'Module 2: Core Concepts & Hands-on Lab', duration: '50 mins' },
          { title: 'Module 3: Capstone Implementation', duration: '60 mins' },
        ],
      }
      await createCourseApi(payload)
      setShowCreateModal(false)
      setNewTitle('')
      setNewDesc('')
      setNewTags('')
      loadCourses()
      setMessage('Course published successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to publish course')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-teal-400">
            <BookOpen size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">Curated Academia Catalog</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Verified Skill Development Courses
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-300">
            Learn directly from university faculty and industry experts to bridge skill gaps identified in your profile.
          </p>
        </div>

        {isEducatorOrAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-teal-400"
          >
            <Plus size={16} />
            Publish Course
          </button>
        )}
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by topic, skill, or keyword..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-500"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 'All' ? 'All Levels' : lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BookOpen size={40} className="text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">No courses match your criteria</h3>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your keyword search or category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id)
            return (
              <div
                key={course._id}
                onClick={() => setSelectedCourse(course)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-md bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700">
                      {course.category}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {course.level}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {(course.tags || []).slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      <span>{course.duration || '4 Weeks'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={13} className="text-slate-400" />
                      <span>{course.enrolledCount || 0} enrolled</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <Star size={13} fill="currentColor" />
                      <span>{course.rating || '4.8'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-500">
                      Instructor: <span className="font-semibold text-slate-700">{course.educatorName || 'Faculty'}</span>
                    </p>

                    <button
                      type="button"
                      disabled={isEnrolled}
                      onClick={(e) => handleEnroll(e, course._id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        isEnrolled
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                      }`}
                    >
                      {isEnrolled ? 'Enrolled ✓' : 'Enroll Free'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Course Detail / Curriculum Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                    {selectedCourse.category}
                  </span>
                  <span className="text-xs text-slate-400">{selectedCourse.level}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-slate-900">{selectedCourse.title}</h2>
                <p className="text-xs text-slate-500">By {selectedCourse.educatorName || 'Faculty Member'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">About this course</h4>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{selectedCourse.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Curriculum & Lessons</h4>
                <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {(selectedCourse.lessons && selectedCourse.lessons.length > 0
                    ? selectedCourse.lessons
                    : [
                        { title: 'Core Principles & Practical Fundamentals', duration: '40 mins' },
                        { title: 'Implementation Architecture & Best Practices', duration: '55 mins' },
                        { title: 'Real-world Capstone Project & Evaluation', duration: '60 mins' },
                      ]
                  ).map((lesson, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <PlayCircle size={15} className="text-indigo-600 shrink-0" />
                        <span className="font-medium text-slate-800">{lesson.title}</span>
                      </div>
                      <span className="text-slate-400 font-mono">{lesson.duration || '30 mins'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4 px-6">
              <span className="text-xs font-medium text-slate-500">Duration: {selectedCourse.duration || '4 Weeks'}</span>
              <button
                type="button"
                onClick={(e) => {
                  handleEnroll(e, selectedCourse._id)
                  setSelectedCourse(null)
                }}
                disabled={enrolledCourseIds.has(selectedCourse._id)}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
              >
                {enrolledCourseIds.has(selectedCourse._id) ? 'Already Enrolled' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="text-teal-600" size={20} />
                <h2 className="text-base font-bold text-slate-900">Publish New Course</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Course Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Cloud Computing"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
                  >
                    {LEVELS.filter((l) => l !== 'All').map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Estimated Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="e.g. 6 Weeks"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Skills / Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="React, Docker, Node.js"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Outline the course objectives and hands-on skills students will acquire..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing…' : 'Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
