import React, { useState } from 'react';
import { Users, Search, Filter, Mail, Plus, UserCheck, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

interface Contact {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Subscribed' | 'Unsubscribed';
  addedAt: string;
  campaignsCount: number;
}

const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex.johnson@enterprise.com', status: 'Active', addedAt: '2026-09-01', campaignsCount: 3 },
  { id: '2', name: 'Sarah Miller', email: 'sarah.m@growthlabs.io', status: 'Subscribed', addedAt: '2026-09-03', campaignsCount: 5 },
  { id: '3', name: 'Michael Chen', email: 'mchen@techscale.org', status: 'Active', addedAt: '2026-09-05', campaignsCount: 2 },
  { id: '4', name: 'Emily Davis', email: 'emily.d@partnerships.co', status: 'Subscribed', addedAt: '2026-09-07', campaignsCount: 4 },
  { id: '5', name: 'David Wilson', email: 'dwilson@ventures.net', status: 'Active', addedAt: '2026-09-08', campaignsCount: 1 },
];

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || c.status.toUpperCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Contacts Directory</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your saved contact directory and lead import history.
          </p>
        </div>
      </div>

      {/* Toolbar Search & Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search contacts by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUBSCRIBED">Subscribed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Contacts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Contact Name</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date Added</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-white text-sm">No contacts found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter.</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={contact.name} email={contact.email} size="sm" />
                        <span className="font-bold text-white">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">{contact.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{contact.addedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ContactsPage;
