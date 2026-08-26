'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/session'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/login')
    } else if (session.role === 'admin') {
      router.replace('/admin/auction')
    } else {
      router.replace('/team/dashboard')
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="loader" style={{ width: '40px', height: '40px' }} />
    </div>
  )
}
