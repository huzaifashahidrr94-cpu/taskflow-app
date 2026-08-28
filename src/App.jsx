import { useState, useEffect } from 'react'
import TeamChat from './components/TeamChat';
import CompanyTasks from './components/CompanyTasks';
import DealsKanban from './components/DealsKanban';
import ContactsDirectory from './components/ContactsDirectory';
import ClientPortal from './components/ClientPortal';
import TeamRoles from './components/TeamRoles';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import WorkflowAutomation from './components/WorkflowAutomation';
import HRManagement from './components/HRManagement';
import DocsWiki from './components/DocsWiki';
import InvoicingBilling from './components/InvoicingBilling';
import TimeTracking from './components/TimeTracking';
import HelpdeskTickets from './components/HelpdeskTickets';
import FormsBuilder from './components/FormsBuilder';
import OKRsGoals from './components/OKRsGoals';
import AICopilot from './components/AICopilot';
import UnifiedInbox from './components/UnifiedInbox';
import Sidebar from './components/Sidebar';
import { supabase } from './lib/supabase';
import {
  CheckCircle2,
  AlertCircle,
  LogOut,
  Building,
  User,
  X,
  Loader2,
  ShieldCheck,
  UserPlus,
  Copy,
  Check
} from 'lucide-react'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return session ? <Dashboard session={session} /> : <AuthView />
}

function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')

  const searchParams = new URLSearchParams(window.location.search)
  const inviteOrgId = searchParams.get('invite')

  useEffect(() => {
    if (inviteOrgId) {
      setIsSignUp(true)
    }
  }, [inviteOrgId])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (authError) throw authError
        if (!authData.user) throw new Error("No user returned")

        const userId = authData.user.id

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: userId, full_name: fullName })
        if (profileError) console.warn('Profile insert note:', profileError.message)

        if (inviteOrgId) {
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
              user_id: userId,
              organization_id: inviteOrgId,
              role: 'employee'
            })
          if (memberError) throw memberError
        } else {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: companyName || 'My Workspace' })
            .select()
            .single()
          if (orgError) throw orgError

          const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
              user_id: userId,
              organization_id: orgData.id,
              role: 'admin'
            })
          if (memberError) throw memberError
        }

      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white mb-4 shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">TaskFlow</h1>
          <p className="text-slate-500 text-sm mt-1">
            {inviteOrgId
              ? "You have been invited! Create your account to join."
              : isSignUp
                ? "Create a new workspace"
                : "Welcome back to your workspace"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {!inviteOrgId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Company Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-slate-900/10 disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {inviteOrgId ? "Join Workspace" : isSignUp ? "Create Workspace" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ session }) {
  const [organizations, setOrganizations] = useState([])
  const [activeOrgId, setActiveOrgId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

  const activeOrg = organizations.find(o => o.id === activeOrgId)
  const userRole = activeOrg?.role || 'admin'
  const userEmail = session?.user?.email?.split('@')[0] || 'User'

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (activeOrgId) {
      fetchTasks()
      fetchTeamMembers()
    } else {
      setLoading(false)
    }
  }, [activeOrgId])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name
          )
        `)
        .eq('user_id', session.user.id)

      if (error) throw error

      let orgs = (data || []).map(d => ({
        id: d.organizations?.id,
        name: d.organizations?.name,
        role: d.role
      })).filter(o => o.id)

      // Self-Healing: Auto-create workspace if current user has no org link
      if (orgs.length === 0) {
        const { data: newOrg, error: orgErr } = await supabase
          .from('organizations')
          .insert({ name: 'My Organization' })
          .select()
          .single()

        if (!orgErr && newOrg) {
          await supabase
            .from('organization_members')
            .insert({
              user_id: session.user.id,
              organization_id: newOrg.id,
              role: 'admin'
            })

          orgs = [{ id: newOrg.id, name: newOrg.name, role: 'admin' }]
        }
      }

      setOrganizations(orgs)
      if (orgs.length > 0) {
        setActiveOrgId(orgs[0].id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error("Error fetching organizations", err)
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      console.error("Error fetching tasks", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          profiles (
            full_name
          )
        `)
        .eq('organization_id', activeOrgId)

      if (error) throw error
      setTeamMembers(data || [])
    } catch (err) {
      console.error("Error fetching team members", err)
    }
  }

  const updateTaskField = async (taskId, field, value) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t))
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ [field]: value })
        .eq('id', taskId)

      if (error) throw error
    } catch (err) {
      console.error(`Error updating task ${field}`, err)
      fetchTasks()
    }
  }

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
    } catch (err) {
      console.error("Error deleting task", err)
      fetchTasks()
    }
  }

  const updateMemberRole = async (userId, newRole) => {
    setTeamMembers(prev =>
      prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m)
    )

    if (userId === session?.user?.id) {
      setOrganizations(prev =>
        prev.map(o => o.id === activeOrgId ? { ...o, role: newRole } : o)
      )
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('organization_id', activeOrgId)
        .eq('user_id', userId)

      if (error) console.error("Database error:", error.message)
    } catch (err) {
      console.error("Error updating role", err)
    }
  }

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workspaceId={activeOrgId}
        userRole={userRole}
        currentUser={{
          id: session?.user?.id,
          name: userEmail,
          fullName: (teamMembers || []).find(m => m?.user_id === session?.user?.id)?.profiles?.full_name || userEmail
        }}
        onSignOut={handleSignOut}
        onOpenInvite={() => setIsInviteModalOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 bg-white/60 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="text-xs">
            <span className="text-slate-400 font-medium">Active Workspace: </span>
            <span className="font-semibold text-slate-800">{activeOrg?.name || 'My Organization'}</span>
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'admin' && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-medium text-[14px] px-4 py-2 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" /> Invite Member
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/60 text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-500 font-medium">Portal View:</span>
              <select
                value={userRole || 'admin'}
                onChange={(e) => updateMemberRole(session?.user?.id, e.target.value)}
                className="bg-transparent text-indigo-600 font-bold outline-none cursor-pointer"
              >
                <option value="admin">Admin (Employer)</option>
                <option value="hr">HR Manager</option>
                <option value="employee">Employee</option>
                <option value="sales">Sales Team</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>
        </header>

        {activeTab === 'inbox' && userRole !== 'client' && (
          <UnifiedInbox workspaceId={activeOrgId} currentUser={{ name: userEmail }} />
        )}

        {activeTab === 'tasks' && userRole !== 'client' && (
          <CompanyTasks
            tasks={tasks}
            teamMembers={teamMembers}
            loading={loading}
            userRole={userRole}
            currentUser={{
              id: session?.user?.id,
              name: userEmail,
              fullName: teamMembers.find(m => m.user_id === session?.user?.id)?.profiles?.full_name || userEmail
            }}
            onUpdateField={updateTaskField}
            onDeleteTask={deleteTask}
            onOpenModal={() => setIsModalOpen(true)}
          />
        )}

        {activeTab === 'copilot' && userRole !== 'client' && (
          <AICopilot
            workspaceId={activeOrgId}
            currentUser={{ name: userEmail }}
            userRole={userRole}
          />
        )}

        {activeTab === 'matrix' && userRole !== 'client' && (
          <EisenhowerMatrix workspaceId={activeOrgId} />
        )}

        {activeTab === 'okrs' && userRole !== 'client' && (
          <OKRsGoals workspaceId={activeOrgId} currentUser={{ name: userEmail }} />
        )}

        {activeTab === 'forms' && userRole !== 'client' && (
          <FormsBuilder workspaceId={activeOrgId} currentUser={{ name: userEmail }} />
        )}

        {activeTab === 'helpdesk' && userRole !== 'client' && (
          <HelpdeskTickets workspaceId={activeOrgId} currentUser={{ name: userEmail }} />
        )}

        {activeTab === 'timetracking' && userRole !== 'client' && (
          <TimeTracking workspaceId={activeOrgId} currentUser={{ name: userEmail }} />
        )}

        {activeTab === 'invoicing' && userRole !== 'client' && (
          <InvoicingBilling workspaceId={activeOrgId} currentUser={{ name: userEmail }} />
        )}

        {activeTab === 'docs' && userRole !== 'client' && (
          <DocsWiki
            workspaceId={activeOrgId}
            currentUser={{
              id: session?.user?.id,
              name: userEmail,
              fullName: teamMembers.find(m => m.user_id === session?.user?.id)?.profiles?.full_name || userEmail
            }}
          />
        )}

        {activeTab === 'hr' && userRole !== 'client' && (
          <HRManagement
            workspaceId={activeOrgId}
            userRole={userRole}
            currentUser={{
              id: session?.user?.id,
              name: userEmail,
              fullName: teamMembers.find(m => m.user_id === session?.user?.id)?.profiles?.full_name || userEmail
            }}
          />
        )}

        {activeTab === 'analytics' && userRole !== 'client' && (
          <AnalyticsDashboard workspaceId={activeOrgId} />
        )}

        {activeTab === 'automations' && userRole !== 'client' && (
          <WorkflowAutomation workspaceId={activeOrgId} />
        )}

        {(activeTab === 'sales' || activeTab === 'deals') && (userRole === 'admin' || userRole === 'sales') && (
          <div className="p-8">
            <DealsKanban workspaceId={activeOrgId} />
          </div>
        )}

        {activeTab === 'contacts' && userRole !== 'client' && (
          <ContactsDirectory workspaceId={activeOrgId} />
        )}

        {activeTab === 'chat' && userRole !== 'client' && (
          <div className="p-8">
            <TeamChat
              workspaceId={activeOrgId}
              currentUser={{
                id: session?.user?.id,
                name: userEmail,
                role: userRole
              }}
            />
          </div>
        )}

        {activeTab === 'team' && userRole !== 'client' && (
          <TeamRoles
            workspaceId={activeOrgId}
            currentUser={{
              id: session?.user?.id,
              name: userEmail,
              role: userRole
            }}
          />
        )}

        {userRole === 'client' && (
          <ClientPortal workspaceName={activeOrg?.name} tasks={tasks} />
        )}
      </main>

      {isModalOpen && (
        <NewTaskModal
          onClose={() => setIsModalOpen(false)}
          orgId={activeOrgId}
          teamMembers={teamMembers}
          onSuccess={() => {
            setIsModalOpen(false)
            fetchTasks()
          }}
        />
      )}

      {isInviteModalOpen && (
        <InviteModal
          onClose={() => setIsInviteModalOpen(false)}
          orgId={activeOrgId}
          onSuccess={() => {
            setIsInviteModalOpen(false)
            fetchTeamMembers()
          }}
        />
      )}
    </div>
  )
}

function NewTaskModal({ onClose, orgId, teamMembers = [], onSuccess }) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [revenueAtRisk, setRevenueAtRisk] = useState('')
  const [isClientVisible, setIsClientVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          organization_id: orgId,
          title,
          status,
          priority,
          assignee: assignee || null,
          due_date: dueDate || null,
          revenue_at_risk: Number(revenueAtRisk) || 0,
          is_client_visible: isClientVisible
        })

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Create New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Task Title *</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g., Update landing page copy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Assignee</label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => {
                  const name = m.profiles?.full_name || m.user_id;
                  return <option key={m.user_id} value={name}>{name}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Revenue Risk ($)</label>
              <input
                type="number"
                placeholder="0"
                value={revenueAtRisk}
                onChange={e => setRevenueAtRisk(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isClientVisible}
              onChange={e => setIsClientVisible(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-700">Make visible in Client Portal</span>
          </label>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm flex justify-center items-center gap-2 transition cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function InviteModal({ onClose, orgId, onSuccess }) {
  const [copied, setCopied] = useState(false)
  const inviteLink = `${window.location.origin}?invite=${orgId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Invite Teammate to Workspace
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-xs text-slate-500 leading-relaxed">
            Copy your workspace's direct invite link below and send it to your teammate via email, WhatsApp, or Slack.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Shareable Invite Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Link!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App