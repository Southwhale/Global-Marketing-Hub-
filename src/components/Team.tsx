import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Filter, MoreHorizontal, 
  MessageSquare, Clock, Shield, Edit2, Trash2, ChevronRight, X, Mail, ShieldCheck, Copy, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { TeamMember, Invitation } from '../types';

export const Team: React.FC = () => {
  const { 
    teamMembers, 
    inviteTeamMember, 
    removeTeamMember, 
    updateTeamMemberRole, 
    user,
    teamComments,
    addTeamComment,
    updateTeamComment,
    deleteTeamComment,
    invitations,
    currentProjectId
  } = useStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [editRole, setEditRole] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const projectInvitations = invitations.filter(inv => inv.projectId === currentProjectId && inv.status === 'pending');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    await inviteTeamMember(inviteEmail, inviteRole);
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/?invite=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !editRole) return;
    await updateTeamMemberRole(selectedMember.id, editRole);
    setIsEditModalOpen(false);
    setSelectedMember(null);
  };

  const handleRemove = async (uid: string) => {
    await removeTeamMember(uid);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addTeamComment(newComment);
    setNewComment('');
  };

  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommentId || !editingCommentText.trim()) return;
    await updateTeamComment(editingCommentId, editingCommentText);
    setEditingCommentId(null);
  };

  const handleDeleteComment = async (id: string) => {
    await deleteTeamComment(id);
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team Management & Collaboration</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900 font-medium">Team</span>
            </div>
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </button>
        </div>

        {/* Pending Invitations */}
        {projectInvitations && projectInvitations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Pending Invitations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectInvitations.map((inv) => (
                <div key={inv.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{inv.email}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase">{inv.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => inv.token && copyInviteLink(inv.token)}
                    className={cn(
                      "p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold",
                      copiedToken === inv.token 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {copiedToken === inv.token ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Active</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                        <span className="font-bold text-slate-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm text-slate-600">{member.role}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm text-slate-500">{member.lastActive}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          member.status === 'active' ? "bg-emerald-500" : 
                          member.status === 'away' ? "bg-amber-500" : "bg-slate-300"
                        )} />
                        <span className="text-sm capitalize text-slate-600">{member.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedMember(member);
                            setEditRole(member.role);
                            setIsEditModalOpen(true);
                          }}
                          className="text-emerald-600 hover:underline text-sm font-bold"
                        >
                          Edit
                        </button>
                        {user?.uid !== member.id && (
                          <button 
                            onClick={() => handleRemove(member.id)}
                            className="text-rose-600 hover:underline text-sm font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Comments */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Recent Comments
            </h3>
          </div>
          <div className="p-8 space-y-8">
            {(!teamComments || teamComments.length === 0) ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No comments yet. Start the conversation!</p>
              </div>
            ) : (
              teamComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comment) => (
                <div key={comment.id} className="flex gap-4 group">
                  <img src={comment.userAvatar} alt={comment.userName} className="w-12 h-12 rounded-full border-2 border-white shadow-md shrink-0" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{comment.userName}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{comment.userRole}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleString()}</span>
                        {user?.uid === comment.userId && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.text);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <form onSubmit={handleUpdateComment} className="mt-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="text-emerald-600 font-medium">{comment.userHandle}</span> {comment.text}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <form onSubmit={handleAddComment} className="relative">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..." 
                className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-emerald-600" />
                Invite Team Member
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-6 h-6 text-emerald-600" />
                Edit Member Role
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateRole} className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <img src={selectedMember.avatar} alt={selectedMember.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedMember.name}</p>
                  <p className="text-sm text-slate-500">{selectedMember.role}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95">
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
