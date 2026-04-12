import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // Check for an existing session when the app opens
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for sign-in and sign-out events going forward
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Don't navigate until we know the auth state
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      // Not signed in and not already on a login/signup screen → go to login
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Signed in but still on a login/signup screen → go to the app
      router.replace('/(tabs)/songs')
    }
  }, [session, loading, segments])

  // Show a blank screen while checking auth — prevents a flash of the wrong screen
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </>
  )
}
