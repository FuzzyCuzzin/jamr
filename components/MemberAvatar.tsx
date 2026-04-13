import { View, Text, StyleSheet } from 'react-native'

const COLORS = [
  '#2563eb', '#7c3aed', '#0891b2', '#16a34a',
  '#d97706', '#dc2626', '#db2777', '#059669',
]

function colorFromName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

type Props = {
  displayName: string
  size?: number
}

export default function MemberAvatar({ displayName, size = 44 }: Props) {
  const initial = (displayName ?? '?')[0].toUpperCase()
  const bg = colorFromName(displayName)

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
  },
})
