import { useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useBand } from '@/lib/BandContext'
import MetricCard from '@/components/MetricCard'
import EventCard from '@/components/EventCard'
import MemberAvatar from '@/components/MemberAvatar'

type Member = {
  user_id: string
  display_name: string
}

type Task = {
  id: string
  description: string
  completed: boolean
}

type EventRow = {
  id: string
  title: string
  date: string
  location: string | null
}

type Metrics = {
  earnings: number
  songsLearned: number
  learnedDelta: number
  repertoire: number
  gigsPlayed: number
}

export default function DashboardScreen() {
  const { band } = useBand()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [nextGig, setNextGig] = useState<EventRow | null>(null)
  const [nextRehearsal, setNextRehearsal] = useState<EventRow | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [addingTask, setAddingTask] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!band) return
      loadDashboard()
    }, [band?.id])
  )

  async function loadDashboard() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id ?? null
    setUserId(uid)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const nowISO = now.toISOString()

    const [
      songsRes,
      gigsRes,
      earningsRes,
      nextGigRes,
      nextRehearsalRes,
      membersRes,
      tasksRes,
    ] = await Promise.all([
      supabase.from('songs').select('status, status_changed_at').eq('band_id', band!.id),
      supabase.from('events').select('id').eq('band_id', band!.id).eq('type', 'gig').eq('status', 'completed'),
      supabase.from('events').select('revenue').eq('band_id', band!.id).eq('type', 'gig').eq('status', 'completed').gte('date', startOfMonth).lt('date', startOfNextMonth),
      supabase.from('events').select('id, title, date, location').eq('band_id', band!.id).eq('type', 'gig').eq('status', 'scheduled').gte('date', nowISO).order('date').limit(1).maybeSingle(),
      supabase.from('events').select('id, title, date, location').eq('band_id', band!.id).eq('type', 'rehearsal').eq('status', 'scheduled').gte('date', nowISO).order('date').limit(1).maybeSingle(),
      supabase.from('band_members').select('user_id, profiles(display_name)').eq('band_id', band!.id),
      supabase.from('practice_tasks').select('id, description, completed').eq('band_id', band!.id).or(uid ? `assigned_to.eq.${uid},assigned_to.is.null` : 'assigned_to.is.null').order('completed').order('created_at'),
    ])

    const allSongs = songsRes.data ?? []
    const learned = allSongs.filter(s => ['ready', 'performance_ready'].includes(s.status))
    const learnedThisWeek = learned.filter(s => s.status_changed_at && s.status_changed_at >= sevenDaysAgo)
    const totalEarnings = (earningsRes.data ?? []).reduce((sum: number, e: any) => sum + (e.revenue ?? 0), 0)

    setMetrics({
      earnings: totalEarnings,
      songsLearned: learned.length,
      learnedDelta: learnedThisWeek.length,
      repertoire: allSongs.length,
      gigsPlayed: gigsRes.data?.length ?? 0,
    })

    setNextGig(nextGigRes.data ?? null)
    setNextRehearsal(nextRehearsalRes.data ?? null)

    setMembers(
      (membersRes.data ?? []).map((m: any) => ({
        user_id: m.user_id,
        display_name: m.profiles?.display_name ?? '?',
      }))
    )

    setTasks(tasksRes.data ?? [])
    setLoading(false)
  }

  async function toggleTask(task: Task) {
    const updated = !task.completed
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updated } : t))
    await supabase.from('practice_tasks').update({ completed: updated }).eq('id', task.id)
  }

  async function addTask() {
    if (!newTask.trim() || !band) return
    setAddingTask(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('practice_tasks').insert({
      band_id: band.id,
      description: newTask.trim(),
      assigned_to: user?.id ?? null,
      created_by: user?.id ?? null,
      completed: false,
    }).select('id, description, completed').single()

    if (!error && data) {
      setTasks(prev => [...prev, data])
      setNewTask('')
    }
    setAddingTask(false)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Band Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.bandName}>{band?.name}</Text>
      </View>

      {/* Metrics Grid */}
      {metrics && (
        <View style={styles.section}>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Earnings"
              value={`$${metrics.earnings.toFixed(0)}`}
              delta="this month"
              accent="#16a34a"
            />
            <MetricCard
              label="Songs Learned"
              value={metrics.songsLearned}
              delta={metrics.learnedDelta > 0 ? `+${metrics.learnedDelta} this week` : undefined}
              accent="#2563eb"
            />
          </View>
          <View style={[styles.metricsGrid, { marginTop: 10 }]}>
            <MetricCard
              label="Repertoire"
              value={metrics.repertoire}
              delta="total songs"
              accent="#7c3aed"
            />
            <MetricCard
              label="Gigs Played"
              value={metrics.gigsPlayed}
              accent="#0891b2"
            />
          </View>
        </View>
      )}

      {/* Band Members */}
      {members.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Band Members</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersRow}>
            {members.map(m => (
              <View key={m.user_id} style={styles.memberItem}>
                <MemberAvatar displayName={m.display_name} />
                <Text style={styles.memberName} numberOfLines={1}>{m.display_name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Next Gig */}
      {nextGig && (
        <View style={styles.section}>
          <EventCard
            type="gig"
            title={nextGig.title}
            date={nextGig.date}
            location={nextGig.location}
          />
        </View>
      )}

      {/* Next Rehearsal */}
      {nextRehearsal && (
        <View style={styles.section}>
          <EventCard
            type="rehearsal"
            title={nextRehearsal.title}
            date={nextRehearsal.date}
            location={nextRehearsal.location}
          />
        </View>
      )}

      {!nextGig && !nextRehearsal && (
        <View style={styles.section}>
          <View style={styles.noEventsBox}>
            <Text style={styles.noEventsText}>No upcoming events scheduled</Text>
          </View>
        </View>
      )}

      {/* Practice Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Practice Checklist</Text>

        {tasks.length === 0 && (
          <Text style={styles.emptyText}>No tasks yet — add one below</Text>
        )}

        {tasks.map(task => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskRow}
            onPress={() => toggleTask(task)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.taskText, task.completed && styles.taskTextDone]}>
              {task.description}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.addTaskRow}>
          <TextInput
            style={styles.addTaskInput}
            value={newTask}
            onChangeText={setNewTask}
            placeholder="Add a task…"
            placeholderTextColor="#9ca3af"
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addTaskBtn, (!newTask.trim() || addingTask) && styles.addTaskBtnDisabled]}
            onPress={addTask}
            disabled={!newTask.trim() || addingTask}
            activeOpacity={0.8}
          >
            {addingTask ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addTaskBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  welcomeText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  bandName: { fontSize: 26, fontWeight: '800', color: '#111827', marginTop: 2 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  metricsGrid: { flexDirection: 'row', gap: 10 },
  membersRow: { gap: 16, paddingVertical: 4 },
  memberItem: { alignItems: 'center', gap: 6, width: 56 },
  memberName: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
  noEventsBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  noEventsText: { fontSize: 14, color: '#9ca3af' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  taskText: { flex: 1, fontSize: 15, color: '#111827' },
  taskTextDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  emptyText: { fontSize: 14, color: '#9ca3af', marginBottom: 12 },
  addTaskRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  addTaskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  addTaskBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskBtnDisabled: { backgroundColor: '#93c5fd' },
  addTaskBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
