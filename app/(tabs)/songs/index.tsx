import { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { supabase } from '@/lib/supabase'
import { useBand } from '@/lib/BandContext'

type Song = {
  id: string
  title: string
  artist: string | null
  status: 'learning' | 'ready' | 'performance_ready'
}

type FilterKey = 'all' | 'learning' | 'ready' | 'performance_ready'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'learning', label: 'Learning' },
  { key: 'ready', label: 'Ready' },
  { key: 'performance_ready', label: 'Perf. Ready' },
]

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  learning:          { bg: '#fef3c7', text: '#d97706', label: 'Learning' },
  ready:             { bg: '#dbeafe', text: '#2563eb', label: 'Ready' },
  performance_ready: { bg: '#d1fae5', text: '#059669', label: 'Perf. Ready' },
}

export default function SongsScreen() {
  const router = useRouter()
  const { band } = useBand()
  const [songs, setSongs] = useState<Song[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!band) return
      setLoading(true)
      supabase
        .from('songs')
        .select('id, title, artist, status')
        .eq('band_id', band.id)
        .order('title')
        .then(({ data }) => {
          setSongs((data as Song[]) ?? [])
          setLoading(false)
        })
    }, [band?.id])
  )

  const visible = filter === 'all' ? songs : songs.filter((s) => s.status === filter)

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.songCount}>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</Text>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {filter === 'all' ? 'No songs yet' : `No ${STATUS_STYLE[filter]?.label ?? filter} songs`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all' ? 'Tap + to add your first song' : 'Try a different filter'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          style={styles.flex}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.learning
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/(tabs)/songs/${item.id}` as never)}
                activeOpacity={0.7}
              >
                <View style={styles.rowText}>
                  <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                  {item.artist ? (
                    <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                  ) : null}
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                </View>
              </TouchableOpacity>
            )
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/songs/new' as never)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  songCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  flex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowText: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  artist: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  emptySubtitle: { fontSize: 14, color: '#6b7280' },
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
