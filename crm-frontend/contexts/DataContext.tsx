'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import api from '@/lib/api'

interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  company?: string
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

interface Lead {
  id: number
  title: string
  description?: string
  stage: 'lead' | 'qualified' | 'proposal' | 'closed'
  value?: number
  customerId: number
  assignedTo?: number
  customer?: Customer
  assignedUser?: {
    id: number
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface Task {
  id: number
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  assignedTo?: number
  customerId?: number
  customer?: Customer
  assignedUser?: {
    id: number
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface DataContextType {
  customers: Customer[]
  leads: Lead[]
  tasks: Task[]
  setCustomers: (customers: Customer[]) => void
  setLeads: (leads: Lead[]) => void
  setTasks: (tasks: Task[]) => void
  fetchCustomers: () => Promise<void>
  updateCustomer: (updatedCustomer: Customer) => void
  addCustomer: (newCustomer: Customer) => void
  updateLead: (updatedLead: Lead) => void
  addLead: (newLead: Lead) => void
  updateTask: (updatedTask: Task) => void
  addTask: (newTask: Task) => void
  updateLeadStage: (leadId: number, oldStage: string, newStage: string, lead: Lead) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers')
      if (response.data.success) {
        setCustomers(response.data.data.customers)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    )
  }

  const addCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer])
  }

  const updateLead = (updatedLead: Lead) => {
    setLeads(prev => 
      prev.map(l => l.id === updatedLead.id ? updatedLead : l)
    )
  }

  const addLead = (newLead: Lead) => {
    setLeads(prev => [...prev, newLead])
  }

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => 
      prev.map(t => t.id === updatedTask.id ? updatedTask : t)
    )
  }

  const addTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask])
  }

  const updateLeadStage = (leadId: number, oldStage: string, newStage: string, lead: Lead) => {
    setLeads(prev => {
      const filtered = prev.filter(l => !(l.id === leadId && l.stage === oldStage))
      return [...filtered, lead]
    })
  }

  const value = {
    customers,
    leads,
    tasks,
    setCustomers,
    setLeads,
    setTasks,
    fetchCustomers,
    updateCustomer,
    addCustomer,
    updateLead,
    addLead,
    updateTask,
    addTask,
    updateLeadStage
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
} 