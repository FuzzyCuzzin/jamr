import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { BandProvider, useBand } from '@/lib/BandContext'

function RootLayoutContent() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { band, setBand, clearBand } = useBand()
  const segments = useSegments()
  const router = useRouter()

  async function loadBand(userId: string) {
    const { data: membership } = await supabase
      .from('band_members')
      .select('band_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (!membership) return

    const { data: bandData } = await supabase
      .from('bands')
      .select('id, name')
      .eq('id', membership.band_id)
      .single()

    if (bandData) {
      setBand({ id: bandData.id, name: bandData.name })
    }
  }

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        await loadBand(session.user.id)
      }

      setSession(session)
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Show loading while we re-check band membership
      setLoading(true)

      if (session) {
        await loadBand(session.user.id)
      } else {
        clearBand()
      }

      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const seg = segments[0] as string
    const inAuthGroup = seg === '(auth)'
    const inBandGroup = seg === 'band'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
    } else if (!band) {
      if (!inBandGroup) router.replace('/band/new' as never)
    } else {
      if (inAuthGroup || inBandGroup) router.replace('/(tabs)/dashboard')
    }
  }, [session, band, loading, segments])

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="band" />
      </Stack>
      <StatusBar style="dark" />
    </>
  )
}

export default function RootLayout() {
  return (
    <BandProvider>
      <RootLayoutContent />
    </BandProvider>
  )
}
