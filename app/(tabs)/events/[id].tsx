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

type EventType = 'rehearsal' | 'gig'
type EventStatus = 'scheduled' | 'completed' | 'canceled'

function toDateInput(iso: string) {
  // Convert ISO string → "YYYY-MM-DD HH:MM" for display in the text field
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseDate(input: string): Date | null {
  const d = new Date(input.trim())
  return isNaN(d.getTime()) ? null : d
}

export default function EditEventScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('rehearsal')
  const [status, setStatus] = useState<EventStatus>('scheduled')
  const [dateInput, setDateInput] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [revenue, setRevenue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setFetchError('Event not found.')
        } else {
          setTitle(data.title)
          setType(data.type)
          setStatus(data.status)
          setDateInput(toDateInput(data.date))
          setLocation(data.location ?? '')
          setNotes(data.notes ?? '')
          setRevenue(data.revenue != null ? String(data.revenue) : '')
        }
        setLoading(false)
      })
  }, [id])

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!dateInput.trim()) { setError('Date is required'); return }
    const parsedDate = parseDate(dateInput)
    if (!parsedDate) {
      setError('Invalid date. Use format: YYYY-MM-DD or YYYY-MM-DD HH:MM')
      return
    }

    setError(null)
    setSaving(true)

    const { error: updateError } = await supabase.from('events').update({
      title: title.trim(),
      type,
      status,
      date: parsedDate.toISOString(),
      location: location.trim() || null,
      notes: notes.trim() || null,
      revenue: revenue.trim() ? parseFloat(revenue) : null,
    }).eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.back()
  }

  function handleMarkCompleted() {
    Alert.alert(
      'Mark as completed',
      type === 'gig'
        ? 'This will mark the gig as completed. Enter revenue above before confirming.'
        : 'This will mark the rehearsal as completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark completed',
          onPress: () => {
            setStatus('completed')
          },
        },
      ]
    )
  }

  async function handleDelete() {
    Alert.alert('Delete event', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('events').delete().eq('id', id)
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

  if (fetchError) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: '#6b7280' }}>{fetchError}</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: title || 'Edit Event',
          headerBackTitle: 'Events',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {status !== 'scheduled' && (
            <View style={[styles.statusBanner, status === 'completed' ? styles.bannerGreen : styles.bannerRed]}>
              <Text style={styles.statusBannerText}>
                {status === 'completed' ? 'Completed' : 'Canceled'}
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {(['rehearsal', 'gig'] as EventType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, type === t && styles.chipActive]}
                  onPress={() => setType(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                    {t === 'rehearsal' ? 'Rehearsal' : 'Gig'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Venue or address"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          {type === 'gig' && (
            <View style={styles.field}>
              <Text style={styles.label}>Revenue ($)</Text>
              <TextInput
                style={styles.input}
                value={revenue}
                onChangeText={setRevenue}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Load-in time, set length, contacts…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </TouchableOpacity>

          {status === 'scheduled' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleMarkCompleted}
              activeOpacity={0.8}
            >
              <Text style={styles.completeButtonText}>Mark as completed</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>Delete event</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingBottom: 48 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#dc2626', fontSize: 14 },
  statusBanner: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  bannerGreen: { backgroundColor: '#dcfce7' },
  bannerRed: { backgroundColor: '#fee2e2' },
  statusBannerText: { fontWeight: '600', fontSize: 14, color: '#111827' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
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
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  completeButton: {
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  completeButtonText: { color: '#16a34a', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
})
