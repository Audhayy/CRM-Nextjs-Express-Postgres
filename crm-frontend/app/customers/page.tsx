'use client'

import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const { customers, setCustomers } = useData();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filterData, setFilterData] = useState({
    company: '',
    tags: [] as string[],
    hasEmail: false,
    hasPhone: false
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    tags: [] as string[],
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.data.customers);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await api.post('/customers', formData);
      setCustomers([...customers, response.data.data.customer]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Customer created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create customer');
    }
  };

  const handleUpdate = async () => {
    if (!editingCustomer) return;
    
    try {
      const response = await api.put(`/customers/${editingCustomer.id}`, formData);
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? response.data.data.customer : c
      ));
      setEditingCustomer(null);
      resetForm();
      toast.success('Customer updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update customer');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(customers.filter(c => c.id !== id));
      toast.success('Customer deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete customer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      tags: [],
      notes: ''
    });
  };

  const resetFilters = () => {
    setFilterData({
      company: '',
      tags: [],
      hasEmail: false,
      hasPhone: false
    });
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const filteredCustomers = customers.filter(customer => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase());

    // Company filter
    const matchesCompany = !filterData.company || 
      customer.company?.toLowerCase().includes(filterData.company.toLowerCase());

    // Tags filter
    const matchesTags = filterData.tags.length === 0 || 
      filterData.tags.some(tag => customer.tags.includes(tag));

    // Email filter
    const matchesEmail = !filterData.hasEmail || customer.email;

    // Phone filter
    const matchesPhone = !filterData.hasPhone || customer.phone;

    return matchesSearch && matchesCompany && matchesTags && matchesEmail && matchesPhone;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer relationships</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilterModal(true)}
                className={filterData.company || filterData.tags.length > 0 || filterData.hasEmail || filterData.hasPhone ? 'border-blue-500 text-blue-600' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filterData.company || filterData.tags.length > 0 || filterData.hasEmail || filterData.hasPhone) && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    Active
                  </span>
                )}
              </Button>
            </div>
            
            {/* Filter Summary */}
            {(filterData.company || filterData.tags.length > 0 || filterData.hasEmail || filterData.hasPhone) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                    {filterData.company && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Company: {filterData.company}
                      </span>
                    )}
                    {filterData.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tag}
                      </span>
                    ))}
                    {filterData.hasEmail && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Has Email
                      </span>
                    )}
                    {filterData.hasPhone && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Has Phone
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Counter */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredCustomers.length} of {customers.length} customers
            {(filterData.company || filterData.tags.length > 0 || filterData.hasEmail || filterData.hasPhone) && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    {customer.company && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Building2 className="h-4 w-4 mr-1" />
                        {customer.company}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setFormData({
                          name: customer.name,
                          email: customer.email || '',
                          phone: customer.phone || '',
                          company: customer.company || '',
                          tags: customer.tags,
                          notes: customer.notes || ''
                        });
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {customer.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Created {formatDate(customer.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No customers found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCustomer) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <div className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCustomer(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingCustomer ? handleUpdate : handleCreate}
                disabled={!formData.name}
              >
                {editingCustomer ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Filter Customers</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={filterData.company}
                  onChange={(e) => setFilterData({ ...filterData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Filter by company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  {['Enterprise', 'Startup', 'Technology', 'Consulting', 'Innovation', 'Manufacturing'].map((tag) => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filterData.tags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterData({
                              ...filterData,
                              tags: [...filterData.tags, tag]
                            });
                          } else {
                            setFilterData({
                              ...filterData,
                              tags: filterData.tags.filter(t => t !== tag)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterData.hasEmail}
                    onChange={(e) => setFilterData({ ...filterData, hasEmail: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Email Address</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterData.hasPhone}
                    onChange={(e) => setFilterData({ ...filterData, hasPhone: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Has Phone Number</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={resetFilters}
              >
                Clear Filters
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 