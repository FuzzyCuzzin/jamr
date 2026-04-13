import { useState, useCallback } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { supabase } from '@/lib/supabase'
import { useBand } from '@/lib/BandContext'

type Event = {
  id: string
  title: string
  type: 'rehearsal' | 'gig'
  status: string
  date: string
  location: string | null
}

const TYPE_LABEL: Record<string, string> = {
  rehearsal: 'Rehearsal',
  gig: 'Gig',
}

const TYPE_COLOR: Record<string, string> = {
  rehearsal: '#7c3aed',
  gig: '#0891b2',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function EventsScreen() {
  const router = useRouter()
  const { band } = useBand()
  const [upcoming, setUpcoming] = useState<Event[]>([])
  const [past, setPast] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!band) return
      setLoading(true)
      const now = new Date().toISOString()
      supabase
        .from('events')
        .select('id, title, type, status, date, location')
        .eq('band_id', band.id)
        .order('date', { ascending: true })
        .then(({ data }) => {
          const all = (data ?? []) as Event[]
          setUpcoming(all.filter((e) => e.status === 'scheduled' && e.date >= now))
          setPast(all.filter((e) => e.status !== 'scheduled' || e.date < now))
          setLoading(false)
        })
    }, [band?.id])
  )

  const sections = [
    { title: 'Upcoming', data: upcoming },
    { title: 'Past', data: past },
  ].filter((s) => s.data.length > 0)

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to add a rehearsal or gig</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(tabs)/events/${item.id}` as never)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: (TYPE_COLOR[item.type] ?? '#6b7280') + '18' },
                  ]}
                >
                  <Text style={[styles.typeText, { color: TYPE_COLOR[item.type] ?? '#6b7280' }]}>
                    {TYPE_LABEL[item.type] ?? item.type}
                  </Text>
                </View>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
                {item.location ? (
                  <Text style={styles.eventLocation}>{item.location}</Text>
                ) : null}
                {item.status === 'completed' ? (
                  <Text style={styles.completedBadge}>Completed</Text>
                ) : item.status === 'canceled' ? (
                  <Text style={styles.canceledBadge}>Canceled</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/events/new' as never)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  emptySubtitle: { fontSize: 14, color: '#6b7280' },
  list: { paddingBottom: 100 },
  sectionHeader: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 3 },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 2,
  },
  typeText: { fontSize: 11, fontWeight: '700' },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  eventDate: { fontSize: 13, color: '#6b7280' },
  eventLocation: { fontSize: 13, color: '#9ca3af' },
  completedBadge: { fontSize: 11, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  canceledBadge: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})
