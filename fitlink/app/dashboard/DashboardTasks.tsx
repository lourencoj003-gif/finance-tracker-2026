'use client'

import { useState } from 'react'
import Link from 'next/link'

type Task = { id: string; title: string; status: string; xpReward?: number }

export default function DashboardTasks({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [completing, setCompleting] = useState<string | null>(null)
  const [xpFlash, setXpFlash]       = useState<{ id: string; awarded: number } | null>(null)

  async function complete(id: string) {
    if (completing) return
    setCompleting(id)
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      const d = await res.json()
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t))
        if (d.xpResult?.awarded) {
          setXpFlash({ id, awarded: d.xpResult.awarded })
          setTimeout(() => setXpFlash(null), 2500)
        }
      }
    } finally {
      setCompleting(null)
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-[#888] text-sm">No active tasks.</p>
        <Link href="/dashboard/tasks" className="text-primary text-xs font-medium mt-2 hover:underline">
          Add a task →
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {tasks.map(task => {
        const isDone = task.status === 'COMPLETED'
        const flash  = xpFlash?.id === task.id
        return (
          <li key={task.id} className="flex items-center gap-3 py-2 border-b border-white/4 last:border-0">
            <button
              onClick={() => !isDone && complete(task.id)}
              disabled={isDone || completing === task.id}
              className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                isDone
                  ? 'border-primary bg-primary/20'
                  : completing === task.id
                  ? 'border-white/30 animate-pulse'
                  : 'border-white/20 hover:border-primary/60'
              }`}
            >
              {isDone && <span className="text-[9px] font-black text-primary">✓</span>}
            </button>
            <span className={`text-sm flex-1 ${isDone ? 'line-through text-[#555]' : 'text-[#ccc]'}`}>
              {task.title}
            </span>
            {flash ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold animate-pulse">
                +{xpFlash.awarded} XP
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#666] uppercase tracking-wider">
                {task.status.toLowerCase().replace('_', ' ')}
              </span>
            )}
          </li>
        )
      })}
      <li className="pt-1">
        <Link href="/dashboard/tasks" className="text-[10px] text-primary font-medium hover:underline">
          View all tasks →
        </Link>
      </li>
    </ul>
  )
}
