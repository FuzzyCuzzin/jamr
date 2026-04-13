import { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { supabase } from '@/lib/supabase'
import { useBand } from '@/lib/BandContext'

type Song = {
  id: string
  title: string
  artist: string | null
  status: string
}

const STATUS_COLOR: Record<string, string> = {
  learning: '#f59e0b',
  ready: '#2563eb',
  performance_ready: '#16a34a',
}

const STATUS_LABEL: Record<string, string> = {
  learning: 'Learning',
  ready: 'Ready',
  performance_ready: 'Perf. Ready',
}

export default function AddSongsScreen() {
  const router = useRouter()
  const { band } = useBand()
  const { setlistId } = useLocalSearchParams<{ setlistId: string }>()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!band || !setlistId) return
      setLoading(true)

      // Fetch all band songs, then exclude ones already in the setlist
      Promise.all([
        supabase
          .from('songs')
          .select('id, title, artist, status')
          .eq('band_id', band.id)
          .order('title', { ascending: true }),
        supabase
          .from('setlist_songs')
          .select('song_id')
          .eq('setlist_id', setlistId),
      ]).then(([{ data: allSongs }, { data: existing }]) => {
        const existingIds = new Set((existing ?? []).map((e: any) => e.song_id))
        const available = (allSongs ?? []).filter((s: any) => !existingIds.has(s.id))
        setSongs(available)
        setLoading(false)
      })
    }, [band?.id, setlistId])
  )

  async function addSong(song: Song) {
    if (!setlistId) return
    setAdding(song.id)

    // Determine next position
    const { data: existing } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPosition = existing ? existing.position + 1 : 0

    const { error } = await supabase.from('setlist_songs').insert({
      setlist_id: setlistId,
      song_id: song.id,
      position: nextPosition,
    })

    setAdding(null)

    if (!error) {
      setSongs((prev) => prev.filter((s) => s.id !== song.id))
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Add Songs',
          headerBackTitle: 'Setlist',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No songs to add</Text>
            <Text style={styles.emptySubtitle}>All catalog songs are already in this setlist</Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.title}</Text>
                  <View style={styles.meta}>
                    {item.artist ? (
                      <Text style={styles.songArtist}>{item.artist}</Text>
                    ) : null}
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: (STATUS_COLOR[item.status] ?? '#6b7280') + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: STATUS_COLOR[item.status] ?? '#6b7280' },
                        ]}
                      >
                        {STATUS_LABEL[item.status] ?? item.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addSong(item)}
                  disabled={adding === item.id}
                  activeOpacity={0.7}
                >
                  {adding === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="add" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  songArtist: { fontSize: 13, color: '#6b7280' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
})
