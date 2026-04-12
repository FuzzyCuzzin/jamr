import { Stack } from 'expo-router'

// Plain stack navigator for auth screens — no tab bar, no header
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
