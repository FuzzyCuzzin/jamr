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

type Setlist = {
  id: string
  name: string
  song_count: number
}

export default function SetlistsScreen() {
  const router = useRouter()
  const { band } = useBand()
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!band) return
      setLoading(true)
      supabase
        .from('setlists')
        .select('id, name, setlist_songs(count)')
        .eq('band_id', band.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          const mapped = (data ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            song_count: s.setlist_songs?.[0]?.count ?? 0,
          }))
          setSetlists(mapped)
          setLoading(false)
        })
    }, [band?.id])
  )

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : setlists.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No setlists yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first setlist</Text>
        </View>
      ) : (
        <FlatList
          data={setlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(tabs)/setlists/${item.id}` as never)}
              activeOpacity={0.7}
            >
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.count}>
                  {item.song_count} {item.song_count === 1 ? 'song' : 'songs'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/setlists/new' as never)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  count: { fontSize: 13, color: '#6b7280', marginTop: 2 },
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
