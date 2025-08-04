'use client'

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  DollarSign, 
  User, 
  Building2,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Lead {
  id: number;
  title: string;
  description?: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'closed';
  value?: number;
  customerId: number;
  assignedTo?: number;
  customer?: {
    id: number;
    name: string;
    email?: string;
    company?: string;
  };
  assignedUser?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const stages = [
  { key: 'lead', name: 'Leads', color: 'bg-blue-100 text-blue-800' },
  { key: 'qualified', name: 'Qualified', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'proposal', name: 'Proposal', color: 'bg-purple-100 text-purple-800' },
  { key: 'closed', name: 'Closed', color: 'bg-green-100 text-green-800' }
];

export default function PipelinePage() {
  const { leads, setLeads, customers } = useData();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: 'lead' as 'lead' | 'qualified' | 'proposal' | 'closed',
    value: '',
    customerId: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(response.data.data.leads);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.stage === newStage) return;

    try {
      const response = await api.put(`/leads/${draggedLead.id}/stage`, {
        stage: newStage
      });
      
      setLeads(leads.map(lead => 
        lead.id === draggedLead.id ? response.data.data.lead : lead
      ));
      setDraggedLead(null);
      toast.success('Lead stage updated successfully');
    } catch (error) {
      toast.error('Failed to update lead stage');
    }
  };

  const handleCreate = async () => {
    try {
      const leadData: any = {
        title: formData.title,
        description: formData.description,
        stage: formData.stage,
        value: formData.value ? parseFloat(formData.value) : undefined,
        assignedTo: user?.id || null
      };

      // Only add customerId if it's not empty
      if (formData.customerId && formData.customerId !== '') {
        leadData.customerId = parseInt(formData.customerId);
      }

      const response = await api.post('/leads', leadData);
      
      setLeads([response.data.data.lead, ...leads]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Lead created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create lead');
    }
  };

  const handleEdit = async () => {
    if (!editingLead) return;
    
    try {
      const leadData: any = {
        title: formData.title,
        description: formData.description,
        stage: formData.stage,
        value: formData.value ? parseFloat(formData.value) : undefined,
        assignedTo: user?.id || null
      };

      // Only add customerId if it's not empty
      if (formData.customerId && formData.customerId !== '') {
        leadData.customerId = parseInt(formData.customerId);
      }

      const response = await api.put(`/leads/${editingLead.id}`, leadData);
      
      setLeads(leads.map(lead => 
        lead.id === editingLead.id ? response.data.data.lead : lead
      ));
      setShowEditModal(false);
      setEditingLead(null);
      resetForm();
      toast.success('Lead updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update lead');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await api.delete(`/leads/${id}`);
      setLeads(leads.filter(lead => lead.id !== id));
      toast.success('Lead deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete lead');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      stage: 'lead',
      value: '',
      customerId: ''
    });
  };

  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const getStageStats = (stage: string) => {
    const stageLeads = getLeadsByStage(stage);
    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    return {
      count: stageLeads.length,
      value: totalValue
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pipeline...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="text-gray-600">Manage your sales leads and opportunities</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stats = getStageStats(stage.key);
            return (
              <Card key={stage.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stage.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(stats.value)}</p>
                    </div>
                    <div className={`p-2 rounded-full ${stage.color}`}>
                      {stage.key === 'lead' && <Target className="h-5 w-5" />}
                      {stage.key === 'qualified' && <CheckCircle className="h-5 w-5" />}
                      {stage.key === 'proposal' && <Clock className="h-5 w-5" />}
                      {stage.key === 'closed' && <AlertCircle className="h-5 w-5" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage) => (
            <div key={stage.key} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                <span className="text-sm text-gray-500">{getStageStats(stage.key).count}</span>
              </div>
              
              <div
                className="min-h-[500px] bg-gray-50 rounded-lg p-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <div className="space-y-3">
                  {getLeadsByStage(stage.key).map((lead) => (
                    <Card
                      key={lead.id}
                      className="cursor-move hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900">{lead.title}</h4>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLead(lead);
                                  setFormData({
                                    title: lead.title,
                                    description: lead.description || '',
                                    stage: lead.stage,
                                    value: lead.value?.toString() || '',
                                    customerId: lead.customerId?.toString() || ''
                                  });
                                  setShowEditModal(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(lead.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {lead.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {lead.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-600">
                              <Building2 className="h-4 w-4 mr-1" />
                              {lead.customer?.company || lead.customer?.name}
                            </div>
                            {lead.value && (
                              <div className="flex items-center font-medium text-green-600">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatCurrency(lead.value)}
                              </div>
                            )}
                          </div>
                          
                          {lead.assignedUser && (
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-4 w-4 mr-1" />
                              {lead.assignedUser.name}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400">
                            {formatDate(lead.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {getLeadsByStage(stage.key).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No leads in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Lead</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value ($)
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer (optional)
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.company && `(${customer.company})`}
                    </option>
                  ))}
                </select>
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
                disabled={!formData.title}
              >
                Create Lead
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Lead</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value ($)
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer (optional)
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.company && `(${customer.company})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLead(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!formData.title}
              >
                Update Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 