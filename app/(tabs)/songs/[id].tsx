import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'

type Status = 'learning' | 'ready' | 'performance_ready'

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'learning', label: 'Learning' },
  { value: 'ready', label: 'Ready' },
  { value: 'performance_ready', label: 'Performance Ready' },
]

export default function EditSongScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [key, setKey] = useState('')
  const [bpm, setBpm] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Status>('learning')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase
      .from('songs')
      .select('title, artist, key, bpm, notes, status')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Song not found')
        } else {
          setTitle(data.title ?? '')
          setArtist(data.artist ?? '')
          setKey(data.key ?? '')
          setBpm(data.bpm?.toString() ?? '')
          setNotes(data.notes ?? '')
          setStatus((data.status as Status) ?? 'learning')
        }
        setLoading(false)
      })
  }, [id])

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setError(null)
    setSaving(true)

    const { error: updateError } = await supabase
      .from('songs')
      .update({
        title: title.trim(),
        artist: artist.trim() || null,
        key: key.trim() || null,
        bpm: bpm ? parseInt(bpm, 10) : null,
        notes: notes.trim() || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.back()
  }

  function confirmDelete() {
    Alert.alert(
      'Delete song',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    )
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('songs').delete().eq('id', id)
    router.back()
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
          headerTitle: title || 'Edit Song',
          headerBackTitle: 'Songs',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Song title"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Artist</Text>
            <TextInput
              style={styles.input}
              value={artist}
              onChangeText={setArtist}
              placeholder="Original artist"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Key</Text>
              <TextInput
                style={styles.input}
                value={key}
                onChangeText={setKey}
                placeholder="e.g. Am"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>BPM</Text>
              <TextInput
                style={styles.input}
                value={bpm}
                onChangeText={setBpm}
                placeholder="120"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusChip, status === opt.value && styles.statusChipActive]}
                  onPress={() => setStatus(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusChipText, status === opt.value && styles.statusChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Arrangement notes, cues, anything useful…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving || deleting}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.buttonDisabled]}
            onPress={confirmDelete}
            disabled={saving || deleting}
            activeOpacity={0.8}
          >
            {deleting ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <Text style={styles.deleteText}>Delete song</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#dc2626', fontSize: 14 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputMultiline: { height: 100, paddingTop: 12 },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  statusChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  statusChipText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  statusChipTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fef2f2',
  },
  deleteText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
})
