import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(name: IoniconName, focusedName: IoniconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={24} color={color} />
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen
        name="songs"
        options={{
          title: 'Songs',
          tabBarIcon: tabIcon('musical-notes-outline', 'musical-notes'),
        }}
      />
      <Tabs.Screen
        name="setlists"
        options={{
          title: 'Setlists',
          tabBarIcon: tabIcon('list-outline', 'list'),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: tabIcon('calendar-outline', 'calendar'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </Tabs>
  )
}
