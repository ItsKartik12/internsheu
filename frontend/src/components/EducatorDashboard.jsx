import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Users,
  Star,
  Clock,
  CheckCircle2,
  Layers,
  GraduationCap,
  X,
  PlayCircle,
} from 'lucide-react'
import { fetchCourses, createCourseApi, updateCourseApi, deleteCourseApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function EducatorDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [modalMode, setModalMode] = useState(null) // null | 'add' | { mode: 'edit', course }
  const [form, setForm] = useState({
    title: '',
    category: 'Web Development',
    level: 'Beginner',
    duration: '6 Weeks',
    tags: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadMyCourses()
  }, [])

  async function loadMyCourses() {
    setLoading(true)
    const data = await fetchCourses({ educatorId: user?._id })
    setCourses(data?.courses || [])
    setLoading(false)
  }

  function openAddModal() {
    setForm({
      title: '',
      category: 'Web Development',
      level: 'Beginner',
      duration: '6 Weeks',
      tags: '',
      description: '',
    })
    setModalMode('add')
  }

  function openEditModal(course) {
    setForm({
      title: course.title,
      category: course.category,
      level: course.level,
      duration: course.duration,
      tags: (course.tags || []).join(', '),
      description: course.description,
    })
    setModalMode({ mode: 'edit', course })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        level: form.level,
        duration: form.duration,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        description: form.description.trim(),
      }

      if (modalMode === 'add') {
        payload.lessons = [
          { title: 'Foundational Concepts & Setup', duration: '30 mins' },
          { title: 'Core Principles & Architecture', duration: '45 mins' },
          { title: 'Hands-on Lab Exercise', duration: '60 mins' },
        ]
        await createCourseApi(payload)
        setMessage('Course created and published!')
      } else if (modalMode?.mode === 'edit') {
        await updateCourseApi(modalMode.course._id, payload)
        setMessage('Course updated successfully!')
      }

      setModalMode(null)
      loadMyCourses()
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      alert(err.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(courseId) {
    if (!window.confirm('Are you sure you want to remove this course?')) return
    try {
      await deleteCourseApi(courseId)
      setCourses((prev) => prev.filter((c) => c._id !== courseId))
      setMessage('Course deleted.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message || 'Failed to delete course')
    }
  }

  const totalEnrolled = courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Overview Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-600">
              <GraduationCap size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Faculty Portal</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              Educator Course Management
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Manage curricula, publish learning tracks, and monitor student enrollment metrics.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-teal-500"
          >
            <Plus size={16} />
            Create Course
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Active Courses</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{courses.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Total Students Enrolled</span>
            <p className="mt-1 text-2xl font-bold text-teal-600">{totalEnrolled.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <span className="text-xs text-slate-500">Avg Course Rating</span>
            <p className="mt-1 text-2xl font-bold text-amber-600">4.9 ★</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm">
          <CheckCircle2 size={18} className="text-teal-600" />
          {message}
        </div>
      )}

      {/* Courses List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Your Published Courses</h2>
          <span className="text-xs text-slate-400">{courses.length} courses</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading courses…</div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen size={36} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No courses created yet</p>
            <p className="text-xs text-slate-400">Click "Create Course" to publish your first curriculum.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {courses.map((course) => (
              <div key={course._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      {course.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{course.level}</span>
                    <span className="text-[11px] text-slate-400">• {course.duration}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {course.enrolledCount || 0} students
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                      <Star size={12} fill="currentColor" />
                      {course.rating || '4.8'}
                    </span>
                    <span>{(course.lessons || []).length} lessons</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(course)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(course._id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setModalMode(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {modalMode === 'add' ? 'Create New Course' : 'Edit Course'}
              </h2>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Course Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Advanced System Design"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-teal-500"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Core CS">Core CS</option>
                    <option value="Programming">Programming</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-teal-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 6 Weeks"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="Docker, Redis, K8s"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Outline topics and student expectations..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
