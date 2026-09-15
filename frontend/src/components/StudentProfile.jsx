import { useEffect, useState, useRef } from 'react'
import {
  User, Target, GraduationCap, Code2, FolderGit2, Briefcase,
  Trophy, Award, Medal, Globe, Users, Save, ChevronDown, ChevronUp,
  Plus, Trash2, X, Check, AlertCircle, Loader2, ExternalLink,
} from 'lucide-react'
import { fetchProfile, updateProfileApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

// ── Predefined Options ──

const TARGET_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Software Developer / SDE', 'AI/ML Engineer', 'Data Analyst',
  'Data Scientist', 'DevOps / Cloud Engineer', 'Cybersecurity',
  'Mobile App Developer', 'UI/UX', 'Other',
]

const INDUSTRIES = [
  'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS',
  'Gaming', 'AI', 'Government', 'Startup', 'Other',
]

const WORK_PREFERENCES = ['Remote', 'Hybrid', 'On-site']

const COURSEWORK_OPTIONS = [
  'Data Structures & Algorithms', 'DBMS', 'Operating Systems',
  'Computer Networks', 'OOP', 'Software Engineering',
  'Computer Architecture', 'Web Development', 'Other',
]

const SKILL_CATEGORIES = {
  programmingLanguages: {
    label: 'Programming Languages',
    options: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go'],
  },
  frontend: {
    label: 'Frontend',
    options: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS'],
  },
  backend: {
    label: 'Backend',
    options: ['Node.js', 'Express.js', 'FastAPI', 'Spring Boot', 'REST APIs', 'GraphQL'],
  },
  database: {
    label: 'Database',
    options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase'],
  },
  tools: {
    label: 'Tools',
    options: ['Git', 'GitHub', 'Docker', 'Postman', 'VS Code', 'Linux'],
  },
  cloudDevOps: {
    label: 'Cloud / DevOps',
    options: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD'],
  },
  aiMl: {
    label: 'AI / ML',
    options: ['Machine Learning', 'Deep Learning', 'NLP', 'LLMs', 'RAG', 'OpenAI API', 'LangChain', 'TensorFlow', 'PyTorch'],
  },
}

const CODING_PLATFORMS = ['LeetCode', 'CodeChef', 'Codeforces', 'GeeksforGeeks', 'HackerRank', 'GitHub']

// ── Reusable Sub-components ──

function SectionCard({ id, icon: Icon, title, children, isOpen, onToggle }) {
  return (
    <div id={id} className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon size={18} />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {isOpen && <div className="border-t border-slate-100 px-5 py-5">{children}</div>}
    </div>
  )
}

function FieldInput({ label, value, onChange, type = 'text', placeholder = '', required = false, error = '' }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function FieldTextarea({ label, value, onChange, placeholder = '', rows = 3 }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  )
}

function FieldSelect({ label, value, onChange, options, placeholder = 'Select...', required = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function MultiSelect({ label, selected = [], options, onChange }) {
  const [customInput, setCustomInput] = useState('')

  function toggle(item) {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item))
    } else {
      onChange([...selected, item])
    }
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed])
    }
    setCustomInput('')
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              selected.includes(opt)
                ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {opt}
          </button>
        ))}
        {/* Show custom items not in predefined options */}
        {selected.filter((s) => !options.includes(s)).map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-300">
            {item}
            <button type="button" onClick={() => toggle(item)} className="hover:text-teal-900"><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add custom..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
        />
        <button type="button" onClick={addCustom} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}

function DynamicArraySection({ items, emptyItem, renderForm, itemLabel, onUpdate }) {
  function addItem() {
    onUpdate([...items, { ...emptyItem }])
  }

  function removeItem(index) {
    onUpdate(items.filter((_, i) => i !== index))
  }

  function updateItem(index, field, value) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onUpdate(updated)
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-200 py-8 text-center">
          <p className="text-sm text-slate-400">No {itemLabel} added yet</p>
        </div>
      )}
      {items.map((item, index) => (
        <div key={index} className="relative rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title={`Remove ${itemLabel}`}
          >
            <Trash2 size={14} />
          </button>
          <p className="mb-3 text-xs font-semibold text-slate-500">{itemLabel} #{index + 1}</p>
          {renderForm(item, index, updateItem)}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
      >
        <Plus size={14} /> Add {itemLabel}
      </button>
    </div>
  )
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all ${
      type === 'success' ? 'bg-teal-600' : 'bg-red-600'
    }`}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      {message}
      <button type="button" onClick={onClose} className="ml-2 rounded p-0.5 hover:bg-white/20"><X size={14} /></button>
    </div>
  )
}

// ── Section Configs for Navigation ──

const SECTIONS = [
  { id: 'basic-info', label: 'Basic Information', icon: User },
  { id: 'career-target', label: 'Career Target', icon: Target },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Technical Skills', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'internships', label: 'Internships', icon: Briefcase },
  { id: 'hackathons', label: 'Hackathons', icon: Trophy },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'certifications', label: 'Certifications', icon: Medal },
  { id: 'coding-profiles', label: 'Coding Profiles', icon: Globe },
  { id: 'open-source', label: 'Open Source', icon: ExternalLink },
  { id: 'leadership', label: 'Leadership', icon: Users },
]

function getDefaultProfile(user) {
  return {
    userId: user?._id || user?.id || '',
    basicInfo: {
      fullName: user?.name || '',
      professionalEmail: user?.email || '',
      phone: '',
      city: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
    },
    careerTarget: {
      targetJobRole: '',
      preferredIndustry: '',
      preferredLocation: '',
      workPreference: '',
      internshipDuration: '',
      availability: '',
    },
    education: [],
    skills: {
      programmingLanguages: [],
      frontend: [],
      backend: [],
      database: [],
      tools: [],
      cloudDevOps: [],
      aiMl: [],
    },
    projects: [],
    internships: [],
    hackathons: [],
    achievements: [],
    certifications: [],
    codingProfiles: [],
    openSource: [],
    leadership: [],
  }
}

// ── Main Component ──

export default function StudentProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(() => getDefaultProfile(user))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [openSections, setOpenSections] = useState(new Set(['basic-info']))
  const formRef = useRef(null)

  // Fetch profile on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const res = await fetchProfile()
        if (cancelled) return
        if (res?.profile) {
          setProfile(res.profile)
        } else {
          setProfile((prev) => prev || getDefaultProfile(user))
        }
      } catch {
        if (!cancelled) {
          setProfile((prev) => prev || getDefaultProfile(user))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  function toggleSection(id) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function scrollToSection(id) {
    if (!openSections.has(id)) {
      setOpenSections((prev) => new Set(prev).add(id))
    }
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Profile updaters
  function updateBasicInfo(field, value) {
    setProfile((p) => ({ ...p, basicInfo: { ...p.basicInfo, [field]: value } }))
  }

  function updateCareerTarget(field, value) {
    setProfile((p) => ({ ...p, careerTarget: { ...p.careerTarget, [field]: value } }))
  }

  function updateSkills(category, value) {
    setProfile((p) => ({ ...p, skills: { ...p.skills, [category]: value } }))
  }

  async function handleSave() {
    if (!profile) return

    // Basic frontend validation
    if (!profile.basicInfo?.fullName?.trim()) {
      setToast({ message: 'Full Name is required', type: 'error' })
      scrollToSection('basic-info')
      return
    }
    if (profile.basicInfo?.professionalEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profile.basicInfo.professionalEmail)) {
        setToast({ message: 'Please enter a valid email address', type: 'error' })
        scrollToSection('basic-info')
        return
      }
    }

    setIsSaving(true)
    try {
      const res = await updateProfileApi(profile)
      if (res?.profile) {
        setProfile(res.profile)
      }
      setToast({ message: res?.message || 'Profile saved successfully', type: 'success' })
    } catch (err) {
      const details = err?.data?.details
      setToast({
        message: details ? details.join(', ') : (err?.message || 'Failed to save profile'),
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading your profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl" ref={formRef}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Header with Save button */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Student Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete your profile to unlock personalized career recommendations
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Section Navigation Sidebar (desktop only) */}
        <nav className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-6 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                  openSections.has(id)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Form Sections */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* A. Basic Information */}
          <SectionCard id="basic-info" icon={User} title="Basic Information" isOpen={openSections.has('basic-info')} onToggle={() => toggleSection('basic-info')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldInput label="Full Name" value={profile.basicInfo?.fullName} onChange={(v) => updateBasicInfo('fullName', v)} required placeholder="e.g. Rachit Arora" />
              <FieldInput label="Professional Email" value={profile.basicInfo?.professionalEmail} onChange={(v) => updateBasicInfo('professionalEmail', v)} type="email" placeholder="e.g. rachit@example.com" />
              <FieldInput label="Phone Number" value={profile.basicInfo?.phone} onChange={(v) => updateBasicInfo('phone', v)} type="tel" placeholder="+91 XXXXX XXXXX" />
              <FieldInput label="City" value={profile.basicInfo?.city} onChange={(v) => updateBasicInfo('city', v)} placeholder="e.g. New Delhi" />
              <FieldInput label="LinkedIn URL" value={profile.basicInfo?.linkedinUrl} onChange={(v) => updateBasicInfo('linkedinUrl', v)} type="url" placeholder="https://linkedin.com/in/..." />
              <FieldInput label="GitHub URL" value={profile.basicInfo?.githubUrl} onChange={(v) => updateBasicInfo('githubUrl', v)} type="url" placeholder="https://github.com/..." />
              <FieldInput label="Portfolio URL" value={profile.basicInfo?.portfolioUrl} onChange={(v) => updateBasicInfo('portfolioUrl', v)} type="url" placeholder="https://yourportfolio.com" />
            </div>
          </SectionCard>

          {/* B. Career Target */}
          <SectionCard id="career-target" icon={Target} title="Career Target" isOpen={openSections.has('career-target')} onToggle={() => toggleSection('career-target')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSelect label="Target Job Role" value={profile.careerTarget?.targetJobRole} onChange={(v) => updateCareerTarget('targetJobRole', v)} options={TARGET_ROLES} required />
              <FieldSelect label="Preferred Industry" value={profile.careerTarget?.preferredIndustry} onChange={(v) => updateCareerTarget('preferredIndustry', v)} options={INDUSTRIES} />
              <FieldInput label="Preferred Location" value={profile.careerTarget?.preferredLocation} onChange={(v) => updateCareerTarget('preferredLocation', v)} placeholder="e.g. Bengaluru, Remote" />
              <FieldSelect label="Work Preference" value={profile.careerTarget?.workPreference} onChange={(v) => updateCareerTarget('workPreference', v)} options={WORK_PREFERENCES} />
              <FieldInput label="Internship Duration" value={profile.careerTarget?.internshipDuration} onChange={(v) => updateCareerTarget('internshipDuration', v)} placeholder="e.g. 3-6 months" />
              <FieldInput label="Availability" value={profile.careerTarget?.availability} onChange={(v) => updateCareerTarget('availability', v)} placeholder="e.g. Immediate, Jan 2027" />
            </div>
          </SectionCard>

          {/* C. Education */}
          <SectionCard id="education" icon={GraduationCap} title="Education" isOpen={openSections.has('education')} onToggle={() => toggleSection('education')}>
            <DynamicArraySection
              items={profile.education || []}
              emptyItem={{ degree: '', branch: '', college: '', cgpa: '', graduationYear: '', class12Percentage: '', class10Percentage: '', relevantCoursework: [] }}
              itemLabel="Education"
              onUpdate={(items) => setProfile((p) => ({ ...p, education: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldInput label="Degree" value={item.degree} onChange={(v) => updateItem(index, 'degree', v)} placeholder="e.g. B.Tech" />
                    <FieldInput label="Branch / Specialization" value={item.branch} onChange={(v) => updateItem(index, 'branch', v)} placeholder="e.g. Computer Science" />
                    <FieldInput label="College / University" value={item.college} onChange={(v) => updateItem(index, 'college', v)} placeholder="Full college name" />
                    <FieldInput label="CGPA" value={item.cgpa} onChange={(v) => updateItem(index, 'cgpa', v)} type="number" placeholder="0 - 10" />
                    <FieldInput label="Graduation Year" value={item.graduationYear} onChange={(v) => updateItem(index, 'graduationYear', v)} type="number" placeholder="e.g. 2026" />
                    <FieldInput label="Class 12 %" value={item.class12Percentage} onChange={(v) => updateItem(index, 'class12Percentage', v)} type="number" placeholder="0 - 100" />
                    <FieldInput label="Class 10 %" value={item.class10Percentage} onChange={(v) => updateItem(index, 'class10Percentage', v)} type="number" placeholder="0 - 100" />
                  </div>
                  <MultiSelect
                    label="Relevant Coursework"
                    selected={item.relevantCoursework || []}
                    options={COURSEWORK_OPTIONS}
                    onChange={(v) => updateItem(index, 'relevantCoursework', v)}
                  />
                </div>
              )}
            />
          </SectionCard>

          {/* D. Technical Skills */}
          <SectionCard id="skills" icon={Code2} title="Technical Skills" isOpen={openSections.has('skills')} onToggle={() => toggleSection('skills')}>
            <div className="space-y-5">
              {Object.entries(SKILL_CATEGORIES).map(([key, { label, options }]) => (
                <MultiSelect
                  key={key}
                  label={label}
                  selected={profile.skills?.[key] || []}
                  options={options}
                  onChange={(v) => updateSkills(key, v)}
                />
              ))}
            </div>
          </SectionCard>

          {/* E. Projects */}
          <SectionCard id="projects" icon={FolderGit2} title="Projects" isOpen={openSections.has('projects')} onToggle={() => toggleSection('projects')}>
            <DynamicArraySection
              items={profile.projects || []}
              emptyItem={{ name: '', description: '', problemSolved: '', role: '', technologiesUsed: [], githubUrl: '', liveDemoUrl: '', startDate: '', endDate: '', teamSize: '', contribution: '', numberOfUsers: '', numberOfRecords: '', accuracy: '', performanceImprovement: '', responseTime: '', numberOfFeatures: '', numberOfApis: '', deploymentDetails: '' }}
              itemLabel="Project"
              onUpdate={(items) => setProfile((p) => ({ ...p, projects: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldInput label="Project Name" value={item.name} onChange={(v) => updateItem(index, 'name', v)} placeholder="e.g. EveryPaw_v7" />
                    <FieldInput label="Your Role" value={item.role} onChange={(v) => updateItem(index, 'role', v)} placeholder="e.g. Full Stack Developer" />
                    <FieldInput label="GitHub URL" value={item.githubUrl} onChange={(v) => updateItem(index, 'githubUrl', v)} type="url" placeholder="https://github.com/..." />
                    <FieldInput label="Live Demo URL" value={item.liveDemoUrl} onChange={(v) => updateItem(index, 'liveDemoUrl', v)} type="url" placeholder="https://..." />
                    <FieldInput label="Start Date" value={item.startDate} onChange={(v) => updateItem(index, 'startDate', v)} type="date" />
                    <FieldInput label="End Date" value={item.endDate} onChange={(v) => updateItem(index, 'endDate', v)} type="date" />
                    <FieldInput label="Team Size" value={item.teamSize} onChange={(v) => updateItem(index, 'teamSize', v)} type="number" placeholder="e.g. 4" />
                  </div>
                  <FieldTextarea label="Description" value={item.description} onChange={(v) => updateItem(index, 'description', v)} placeholder="Brief description of the project" />
                  <FieldTextarea label="Problem Solved" value={item.problemSolved} onChange={(v) => updateItem(index, 'problemSolved', v)} placeholder="What problem does this project solve?" rows={2} />
                  <FieldTextarea label="Your Contribution" value={item.contribution} onChange={(v) => updateItem(index, 'contribution', v)} placeholder="What did you specifically build or contribute?" rows={2} />
                  <MultiSelect
                    label="Technologies Used"
                    selected={item.technologiesUsed || []}
                    options={['React', 'Node.js', 'Express', 'MongoDB', 'Python', 'FastAPI', 'Docker', 'AWS']}
                    onChange={(v) => updateItem(index, 'technologiesUsed', v)}
                  />
                  <p className="text-xs font-medium text-slate-500">Measurable Outcomes (optional)</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <FieldInput label="Users" value={item.numberOfUsers} onChange={(v) => updateItem(index, 'numberOfUsers', v)} placeholder="e.g. 500+" />
                    <FieldInput label="Records" value={item.numberOfRecords} onChange={(v) => updateItem(index, 'numberOfRecords', v)} placeholder="e.g. 10K+" />
                    <FieldInput label="Accuracy" value={item.accuracy} onChange={(v) => updateItem(index, 'accuracy', v)} placeholder="e.g. 94%" />
                    <FieldInput label="Performance Improvement" value={item.performanceImprovement} onChange={(v) => updateItem(index, 'performanceImprovement', v)} placeholder="e.g. 40% faster" />
                    <FieldInput label="Response Time" value={item.responseTime} onChange={(v) => updateItem(index, 'responseTime', v)} placeholder="e.g. <200ms" />
                    <FieldInput label="Features" value={item.numberOfFeatures} onChange={(v) => updateItem(index, 'numberOfFeatures', v)} placeholder="e.g. 12" />
                    <FieldInput label="APIs" value={item.numberOfApis} onChange={(v) => updateItem(index, 'numberOfApis', v)} placeholder="e.g. 8" />
                    <FieldInput label="Deployment" value={item.deploymentDetails} onChange={(v) => updateItem(index, 'deploymentDetails', v)} placeholder="e.g. Vercel + Render" />
                  </div>
                </div>
              )}
            />
          </SectionCard>

          {/* F. Internships / Experience */}
          <SectionCard id="internships" icon={Briefcase} title="Internships / Experience" isOpen={openSections.has('internships')} onToggle={() => toggleSection('internships')}>
            <DynamicArraySection
              items={profile.internships || []}
              emptyItem={{ companyName: '', role: '', startDate: '', endDate: '', employmentType: '', location: '', technologiesUsed: [], responsibilities: '', projectsWorkedOn: '', achievements: '', contribution: '' }}
              itemLabel="Experience"
              onUpdate={(items) => setProfile((p) => ({ ...p, internships: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldInput label="Company Name" value={item.companyName} onChange={(v) => updateItem(index, 'companyName', v)} placeholder="e.g. Google" />
                    <FieldInput label="Role" value={item.role} onChange={(v) => updateItem(index, 'role', v)} placeholder="e.g. SDE Intern" />
                    <FieldInput label="Start Date" value={item.startDate} onChange={(v) => updateItem(index, 'startDate', v)} type="date" />
                    <FieldInput label="End Date" value={item.endDate} onChange={(v) => updateItem(index, 'endDate', v)} type="date" />
                    <FieldSelect label="Employment Type" value={item.employmentType} onChange={(v) => updateItem(index, 'employmentType', v)} options={['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract']} />
                    <FieldInput label="Location" value={item.location} onChange={(v) => updateItem(index, 'location', v)} placeholder="e.g. Bengaluru / Remote" />
                  </div>
                  <MultiSelect label="Technologies Used" selected={item.technologiesUsed || []} options={['React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL']} onChange={(v) => updateItem(index, 'technologiesUsed', v)} />
                  <FieldTextarea label="Responsibilities" value={item.responsibilities} onChange={(v) => updateItem(index, 'responsibilities', v)} placeholder="Key responsibilities" />
                  <FieldTextarea label="Projects Worked On" value={item.projectsWorkedOn} onChange={(v) => updateItem(index, 'projectsWorkedOn', v)} placeholder="Projects and features" rows={2} />
                  <FieldTextarea label="Achievements" value={item.achievements} onChange={(v) => updateItem(index, 'achievements', v)} placeholder="Notable achievements" rows={2} />
                  <FieldTextarea label="Your Contribution" value={item.contribution} onChange={(v) => updateItem(index, 'contribution', v)} placeholder="Specific contributions" rows={2} />
                </div>
              )}
            />
          </SectionCard>

          {/* G. Hackathons */}
          <SectionCard id="hackathons" icon={Trophy} title="Hackathons" isOpen={openSections.has('hackathons')} onToggle={() => toggleSection('hackathons')}>
            <DynamicArraySection
              items={profile.hackathons || []}
              emptyItem={{ name: '', position: '', year: '', teamSize: '', problemStatement: '', solution: '', technologiesUsed: [], contribution: '', githubUrl: '', demoUrl: '' }}
              itemLabel="Hackathon"
              onUpdate={(items) => setProfile((p) => ({ ...p, hackathons: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldInput label="Hackathon Name" value={item.name} onChange={(v) => updateItem(index, 'name', v)} placeholder="e.g. SIH 2026" />
                    <FieldInput label="Position / Rank" value={item.position} onChange={(v) => updateItem(index, 'position', v)} placeholder="e.g. Winner, Top 10" />
                    <FieldInput label="Year" value={item.year} onChange={(v) => updateItem(index, 'year', v)} type="number" placeholder="e.g. 2026" />
                    <FieldInput label="Team Size" value={item.teamSize} onChange={(v) => updateItem(index, 'teamSize', v)} type="number" placeholder="e.g. 4" />
                    <FieldInput label="GitHub URL" value={item.githubUrl} onChange={(v) => updateItem(index, 'githubUrl', v)} type="url" placeholder="https://github.com/..." />
                    <FieldInput label="Demo URL" value={item.demoUrl} onChange={(v) => updateItem(index, 'demoUrl', v)} type="url" placeholder="https://..." />
                  </div>
                  <FieldTextarea label="Problem Statement" value={item.problemStatement} onChange={(v) => updateItem(index, 'problemStatement', v)} placeholder="What problem did you tackle?" rows={2} />
                  <FieldTextarea label="Solution" value={item.solution} onChange={(v) => updateItem(index, 'solution', v)} placeholder="Your approach and solution" rows={2} />
                  <FieldTextarea label="Your Contribution" value={item.contribution} onChange={(v) => updateItem(index, 'contribution', v)} placeholder="What you specifically built" rows={2} />
                  <MultiSelect label="Technologies Used" selected={item.technologiesUsed || []} options={['React', 'Node.js', 'Python', 'Flask', 'TensorFlow', 'MongoDB', 'Firebase']} onChange={(v) => updateItem(index, 'technologiesUsed', v)} />
                </div>
              )}
            />
          </SectionCard>

          {/* H. Achievements */}
          <SectionCard id="achievements" icon={Award} title="Achievements" isOpen={openSections.has('achievements')} onToggle={() => toggleSection('achievements')}>
            <DynamicArraySection
              items={profile.achievements || []}
              emptyItem={{ title: '', description: '', organization: '', dateOrYear: '', credentialUrl: '' }}
              itemLabel="Achievement"
              onUpdate={(items) => setProfile((p) => ({ ...p, achievements: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FieldInput label="Title" value={item.title} onChange={(v) => updateItem(index, 'title', v)} placeholder="e.g. ICPC Regionalist" />
                  <FieldInput label="Organization" value={item.organization} onChange={(v) => updateItem(index, 'organization', v)} placeholder="e.g. ACM, Google" />
                  <FieldInput label="Date / Year" value={item.dateOrYear} onChange={(v) => updateItem(index, 'dateOrYear', v)} placeholder="e.g. 2026" />
                  <FieldInput label="Credential URL" value={item.credentialUrl} onChange={(v) => updateItem(index, 'credentialUrl', v)} type="url" placeholder="https://..." />
                  <div className="sm:col-span-2">
                    <FieldTextarea label="Description" value={item.description} onChange={(v) => updateItem(index, 'description', v)} placeholder="Brief description of the achievement" rows={2} />
                  </div>
                </div>
              )}
            />
          </SectionCard>

          {/* I. Certifications */}
          <SectionCard id="certifications" icon={Medal} title="Certifications" isOpen={openSections.has('certifications')} onToggle={() => toggleSection('certifications')}>
            <DynamicArraySection
              items={profile.certifications || []}
              emptyItem={{ name: '', issuingOrganization: '', date: '', credentialId: '', credentialUrl: '', skillsCovered: [] }}
              itemLabel="Certification"
              onUpdate={(items) => setProfile((p) => ({ ...p, certifications: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldInput label="Certification Name" value={item.name} onChange={(v) => updateItem(index, 'name', v)} placeholder="e.g. AWS Cloud Practitioner" />
                    <FieldInput label="Issuing Organization" value={item.issuingOrganization} onChange={(v) => updateItem(index, 'issuingOrganization', v)} placeholder="e.g. Amazon Web Services" />
                    <FieldInput label="Date" value={item.date} onChange={(v) => updateItem(index, 'date', v)} type="date" />
                    <FieldInput label="Credential ID" value={item.credentialId} onChange={(v) => updateItem(index, 'credentialId', v)} placeholder="e.g. ABC-12345" />
                    <FieldInput label="Credential URL" value={item.credentialUrl} onChange={(v) => updateItem(index, 'credentialUrl', v)} type="url" placeholder="https://..." />
                  </div>
                  <MultiSelect label="Skills Covered" selected={item.skillsCovered || []} options={['AWS', 'Python', 'React', 'Docker', 'ML', 'Cybersecurity', 'SQL']} onChange={(v) => updateItem(index, 'skillsCovered', v)} />
                </div>
              )}
            />
          </SectionCard>

          {/* J. Coding Profiles */}
          <SectionCard id="coding-profiles" icon={Globe} title="Coding Profiles" isOpen={openSections.has('coding-profiles')} onToggle={() => toggleSection('coding-profiles')}>
            <DynamicArraySection
              items={profile.codingProfiles || []}
              emptyItem={{ platform: '', username: '', profileUrl: '', problemsSolved: '', rating: '', contestRating: '' }}
              itemLabel="Coding Profile"
              onUpdate={(items) => setProfile((p) => ({ ...p, codingProfiles: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FieldSelect label="Platform" value={item.platform} onChange={(v) => updateItem(index, 'platform', v)} options={CODING_PLATFORMS} />
                  <FieldInput label="Username" value={item.username} onChange={(v) => updateItem(index, 'username', v)} placeholder="e.g. rachit_codes" />
                  <FieldInput label="Profile URL" value={item.profileUrl} onChange={(v) => updateItem(index, 'profileUrl', v)} type="url" placeholder="https://leetcode.com/..." />
                  <FieldInput label="Problems Solved" value={item.problemsSolved} onChange={(v) => updateItem(index, 'problemsSolved', v)} placeholder="e.g. 350" />
                  <FieldInput label="Rating" value={item.rating} onChange={(v) => updateItem(index, 'rating', v)} placeholder="e.g. 1800" />
                  <FieldInput label="Contest Rating" value={item.contestRating} onChange={(v) => updateItem(index, 'contestRating', v)} placeholder="e.g. 1950" />
                </div>
              )}
            />
          </SectionCard>

          {/* K. Open Source */}
          <SectionCard id="open-source" icon={ExternalLink} title="Open Source Contributions" isOpen={openSections.has('open-source')} onToggle={() => toggleSection('open-source')}>
            <DynamicArraySection
              items={profile.openSource || []}
              emptyItem={{ projectName: '', repositoryUrl: '', contributionDescription: '', pullRequests: '', issuesSolved: '', majorContributions: '' }}
              itemLabel="Contribution"
              onUpdate={(items) => setProfile((p) => ({ ...p, openSource: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldInput label="Project Name" value={item.projectName} onChange={(v) => updateItem(index, 'projectName', v)} placeholder="e.g. React" />
                    <FieldInput label="Repository URL" value={item.repositoryUrl} onChange={(v) => updateItem(index, 'repositoryUrl', v)} type="url" placeholder="https://github.com/..." />
                    <FieldInput label="Pull Requests" value={item.pullRequests} onChange={(v) => updateItem(index, 'pullRequests', v)} placeholder="e.g. 5 merged" />
                    <FieldInput label="Issues Solved" value={item.issuesSolved} onChange={(v) => updateItem(index, 'issuesSolved', v)} placeholder="e.g. 8" />
                  </div>
                  <FieldTextarea label="Contribution Description" value={item.contributionDescription} onChange={(v) => updateItem(index, 'contributionDescription', v)} placeholder="What you contributed" rows={2} />
                  <FieldTextarea label="Major Contributions" value={item.majorContributions} onChange={(v) => updateItem(index, 'majorContributions', v)} placeholder="Highlight significant work" rows={2} />
                </div>
              )}
            />
          </SectionCard>

          {/* L. Leadership */}
          <SectionCard id="leadership" icon={Users} title="Leadership & Positions" isOpen={openSections.has('leadership')} onToggle={() => toggleSection('leadership')}>
            <DynamicArraySection
              items={profile.leadership || []}
              emptyItem={{ position: '', organization: '', duration: '', responsibilities: '', achievements: '' }}
              itemLabel="Position"
              onUpdate={(items) => setProfile((p) => ({ ...p, leadership: items }))}
              renderForm={(item, index, updateItem) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldInput label="Position" value={item.position} onChange={(v) => updateItem(index, 'position', v)} placeholder="e.g. Technical Lead" />
                    <FieldInput label="Organization" value={item.organization} onChange={(v) => updateItem(index, 'organization', v)} placeholder="e.g. Coding Club BPIT" />
                    <FieldInput label="Duration" value={item.duration} onChange={(v) => updateItem(index, 'duration', v)} placeholder="e.g. Aug 2025 - Present" />
                  </div>
                  <FieldTextarea label="Responsibilities" value={item.responsibilities} onChange={(v) => updateItem(index, 'responsibilities', v)} placeholder="Key responsibilities" rows={2} />
                  <FieldTextarea label="Achievements" value={item.achievements} onChange={(v) => updateItem(index, 'achievements', v)} placeholder="Notable achievements in this role" rows={2} />
                </div>
              )}
            />
          </SectionCard>

          {/* Bottom Save Button */}
          <div className="flex justify-end pb-8 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
