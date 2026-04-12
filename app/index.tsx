import { Redirect } from 'expo-router'

// Root path (/) has no content. Send everyone to login first.
// _layout.tsx will immediately forward signed-in users to /(tabs)/songs.
export default function Index() {
  return <Redirect href="/(auth)/login" />
}
