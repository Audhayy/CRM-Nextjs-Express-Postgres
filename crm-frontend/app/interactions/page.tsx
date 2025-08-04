'use client'

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar,
  User,
  Building2,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Interaction {
  id: number;
  customerId: number;
  type: 'call' | 'email' | 'meeting' | 'note';
  notes?: string;
  date: string;
  createdBy?: number;
  customer?: {
    id: number;
    name: string;
    company?: string;
  };
  createdByUser?: {
    id: number;
    name: string;
    email: string;
  };
}

const interactionIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare
};

const interactionColors = {
  call: 'bg-green-100 text-green-800',
  email: 'bg-blue-100 text-blue-800',
  meeting: 'bg-purple-100 text-purple-800',
  note: 'bg-gray-100 text-gray-800'
};

export default function InteractionsPage() {
  const { customers, fetchCustomers } = useData();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    type: 'call' as 'call' | 'email' | 'meeting' | 'note',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchInteractions();
    fetchCustomers();
  }, []);

  const fetchInteractions = async () => {
    try {
      const response = await api.get('/interactions');
      setInteractions(response.data.data.interactions);
    } catch (error) {
      toast.error('Failed to fetch interactions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await api.post('/interactions', formData);
      setInteractions([response.data.data.interaction, ...interactions]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Interaction logged successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to log interaction');
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      type: 'call',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const filteredInteractions = interactions.filter(interaction => {
    if (filterType !== 'all' && interaction.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading interactions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interactions</h1>
            <p className="text-gray-600">Track all customer interactions and communications</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Interaction
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="call">Calls</option>
                <option value="email">Emails</option>
                <option value="meeting">Meetings</option>
                <option value="note">Notes</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Interactions List */}
        <div className="space-y-4">
          {filteredInteractions.map((interaction) => {
            const Icon = interactionIcons[interaction.type];
            return (
              <Card key={interaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${interactionColors[interaction.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {interaction.type}
                          </span>
                          {interaction.customer && (
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-1" />
                              {interaction.customer.name}
                              {interaction.customer.company && (
                                <>
                                  <span className="mx-1">•</span>
                                  <Building2 className="h-4 w-4 mr-1" />
                                  {interaction.customer.company}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(interaction.date)}
                        </span>
                      </div>
                      
                      {interaction.notes && (
                        <p className="text-gray-700 mb-2">{interaction.notes}</p>
                      )}
                      
                      {interaction.createdByUser && (
                        <div className="text-sm text-gray-500">
                          Logged by {interaction.createdByUser.name}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredInteractions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No interactions found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Log Interaction</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.company && `(${customer.company})`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.customerId}
              >
                Log Interaction
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 