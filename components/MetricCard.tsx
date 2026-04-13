import { View, Text, StyleSheet } from 'react-native'

type Props = {
  label: string
  value: string | number
  delta?: string
  accent?: string
}

export default function MetricCard({ label, value, delta, accent = '#2563eb' }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {delta ? <Text style={styles.delta}>{delta}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  delta: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
    marginTop: 2,
  },
})
