import { View, Text, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

type Props = {
  type: 'gig' | 'rehearsal'
  title: string
  date: string
  location?: string | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const TYPE_CONFIG = {
  gig: { color: '#0891b2', icon: 'mic-outline' as const, label: 'Next Gig' },
  rehearsal: { color: '#7c3aed', icon: 'musical-notes-outline' as const, label: 'Next Rehearsal' },
}

export default function EventCard({ type, title, date, location }: Props) {
  const config = TYPE_CONFIG[type]

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{formatDate(date)}</Text>
      {location ? <Text style={styles.location}>{location}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
  },
  location: {
    fontSize: 13,
    color: '#9ca3af',
  },
})
