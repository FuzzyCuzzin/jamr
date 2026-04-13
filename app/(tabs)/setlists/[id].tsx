import { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { supabase } from '@/lib/supabase'
import { useFocusEffect } from 'expo-router'

type SetlistSong = {
  id: string          // setlist_songs.id
  song_id: string
  title: string
  artist: string | null
  position: number
}

type Setlist = {
  id: string
  name: string
  notes: string | null
}

export default function SetlistDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [songs, setSongs] = useState<SetlistSong[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (!id) return
      setLoading(true)
      Promise.all([
        supabase.from('setlists').select('id, name, notes').eq('id', id).single(),
        supabase
          .from('setlist_songs')
          .select('id, song_id, position, songs(title, artist)')
          .eq('setlist_id', id)
          .order('position', { ascending: true }),
      ]).then(([{ data: sl }, { data: ss }]) => {
        if (sl) setSetlist(sl)
        const mapped = (ss ?? []).map((row: any) => ({
          id: row.id,
          song_id: row.song_id,
          title: row.songs?.title ?? '',
          artist: row.songs?.artist ?? null,
          position: row.position,
        }))
        setSongs(mapped)
        setLoading(false)
      })
    }, [id])
  )

  async function moveUp(index: number) {
    if (index === 0) return
    const updated = [...songs]
    const tmp = updated[index - 1]
    updated[index - 1] = { ...updated[index], position: index - 1 }
    updated[index] = { ...tmp, position: index }
    setSongs(updated)
    await Promise.all([
      supabase.from('setlist_songs').update({ position: index - 1 }).eq('id', updated[index - 1].id),
      supabase.from('setlist_songs').update({ position: index }).eq('id', updated[index].id),
    ])
  }

  async function moveDown(index: number) {
    if (index === songs.length - 1) return
    const updated = [...songs]
    const tmp = updated[index + 1]
    updated[index + 1] = { ...updated[index], position: index + 1 }
    updated[index] = { ...tmp, position: index }
    setSongs(updated)
    await Promise.all([
      supabase.from('setlist_songs').update({ position: index + 1 }).eq('id', updated[index + 1].id),
      supabase.from('setlist_songs').update({ position: index }).eq('id', updated[index].id),
    ])
  }

  async function removeSong(item: SetlistSong) {
    Alert.alert('Remove song', `Remove "${item.title}" from this setlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('setlist_songs').delete().eq('id', item.id)
          const remaining = songs
            .filter((s) => s.id !== item.id)
            .map((s, i) => ({ ...s, position: i }))
          setSongs(remaining)
          // Renumber positions in DB
          await Promise.all(
            remaining.map((s) =>
              supabase.from('setlist_songs').update({ position: s.position }).eq('id', s.id)
            )
          )
        },
      },
    ])
  }

  async function deleteSetlist() {
    Alert.alert('Delete setlist', `Delete "${setlist?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('setlists').delete().eq('id', id)
          router.back()
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: setlist?.name ?? 'Setlist',
          headerBackTitle: 'Setlists',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={deleteSetlist} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {setlist?.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{setlist.notes}</Text>
          </View>
        ) : null}

        {songs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No songs yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add songs from your catalog</Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <View style={styles.row}>
                <View style={styles.positionBox}>
                  <Text style={styles.positionText}>{index + 1}</Text>
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{item.title}</Text>
                  {item.artist ? (
                    <Text style={styles.songArtist}>{item.artist}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => moveUp(index)}
                    disabled={index === 0}
                    hitSlop={6}
                    style={styles.actionBtn}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={18}
                      color={index === 0 ? '#d1d5db' : '#6b7280'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveDown(index)}
                    disabled={index === songs.length - 1}
                    hitSlop={6}
                    style={styles.actionBtn}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={index === songs.length - 1 ? '#d1d5db' : '#6b7280'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeSong(item)}
                    hitSlop={6}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/(tabs)/setlists/add-songs?setlistId=${id}` as never)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  emptySubtitle: { fontSize: 14, color: '#6b7280' },
  notesBox: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  notesText: { fontSize: 14, color: '#6b7280' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  positionBox: {
    width: 28,
    alignItems: 'center',
  },
  positionText: { fontSize: 14, color: '#9ca3af', fontWeight: '600' },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  songArtist: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  actionBtn: { padding: 4 },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
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
