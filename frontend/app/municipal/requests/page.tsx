'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

type DatasetRequest = {
  id: string;
  citizenName: string;
  citizenEmail: string;
  datasetType: string;
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type CorrectionRequest = {
  id: string;
  citizenName: string;
  citizenEmail: string;
  dataType: string;
  city: string;
  issueDescription: string;
  suggestedCorrection?: string;
  supportingEvidence?: string;
  status: string;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export default function CitizenRequestsPage() {
  const [activeTab, setActiveTab] = useState<'dataset' | 'correction'>('dataset');
  const [datasetRequests, setDatasetRequests] = useState<DatasetRequest[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DatasetRequest | CorrectionRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadRequests();
  }, [activeTab, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dataset') {
        const response = await api.getDatasetRequests(statusFilter === 'all' ? undefined : statusFilter);
        setDatasetRequests(response || []);
      } else {
        const response = await api.getCorrectionRequests(statusFilter === 'all' ? undefined : statusFilter);
        setCorrectionRequests(response || []);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string, notes: string) => {
    try {
      if (activeTab === 'dataset') {
        await api.updateDatasetRequest(requestId, { status: newStatus as 'pending' | 'approved' | 'rejected', adminNotes: notes });
        showToast('Dataset request updated successfully', 'success');
      } else {
        // Correction requests have different statuses: pending, investigating, resolved, rejected
        const correctionStatus = newStatus === 'approved' ? 'resolved' : newStatus;
        await api.updateCorrectionRequest(requestId, { status: correctionStatus as 'pending' | 'investigating' | 'resolved' | 'rejected', adminResponse: notes });
        showToast('Correction request updated successfully', 'success');
      }
      setShowModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Failed to update request:', error);
      showToast('Failed to update request', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
      approved: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
      rejected: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
      investigating: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
      resolved: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const RequestModal = () => {
    if (!selectedRequest || !showModal) return null;

    const [newStatus, setNewStatus] = useState(selectedRequest.status);
    const [notes, setNotes] = useState(selectedRequest.adminNotes || '');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'dataset' ? 'Dataset Request' : 'Data Correction Request'}
              </h2>
              <button onClick={() => { setShowModal(false); setSelectedRequest(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Citizen Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Citizen Information</h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Name:</span> <span className="text-gray-900 dark:text-white">{selectedRequest.citizenName}</span></p>
                <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Email:</span> <span className="text-gray-900 dark:text-white">{selectedRequest.citizenEmail}</span></p>
                <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Submitted:</span> <span className="text-gray-900 dark:text-white">{getRelativeTime(selectedRequest.createdAt)}</span></p>
              </div>
            </div>

            {/* Request Details */}
            {activeTab === 'dataset' ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Request Details</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Dataset Type:</span> <span className="text-gray-900 dark:text-white capitalize">{(selectedRequest as DatasetRequest).datasetType}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Reason:</span> <span className="text-gray-900 dark:text-white capitalize">{(selectedRequest as DatasetRequest).reason}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Description:</span></p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{(selectedRequest as DatasetRequest).description}</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Issue Details</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Data Type:</span> <span className="text-gray-900 dark:text-white capitalize">{(selectedRequest as CorrectionRequest).dataType}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">City:</span> <span className="text-gray-900 dark:text-white">{(selectedRequest as CorrectionRequest).city}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-600 dark:text-gray-400">Issue Description:</span></p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{(selectedRequest as CorrectionRequest).issueDescription}</p>
                  {(selectedRequest as CorrectionRequest).suggestedCorrection && (
                    <>
                      <p className="text-sm mt-3"><span className="font-medium text-gray-600 dark:text-gray-400">Suggested Correction:</span></p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{(selectedRequest as CorrectionRequest).suggestedCorrection}</p>
                    </>
                  )}
                  {(selectedRequest as CorrectionRequest).supportingEvidence && (
                    <>
                      <p className="text-sm mt-3"><span className="font-medium text-gray-600 dark:text-gray-400">Supporting Evidence:</span></p>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{(selectedRequest as CorrectionRequest).supportingEvidence}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Status Update */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Update Status</h3>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
              >
                <option value="pending">Pending</option>
                {activeTab === 'dataset' ? (
                  <>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </>
                ) : (
                  <>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
              </select>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Admin notes (optional)"
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={() => { setShowModal(false); setSelectedRequest(null); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdateStatus(selectedRequest.id, newStatus, notes)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Header />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Citizen Requests</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage dataset requests and data correction reports from citizens
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dataset')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dataset'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Dataset Requests
                {datasetRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs">
                    {datasetRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('correction')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'correction'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Data Corrections
                {correctionRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs">
                    {correctionRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  {activeTab === 'dataset' ? (
                    <>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  ) : (
                    <>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  )}
                </select>
              </div>

              <button
                onClick={loadRequests}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="grid gap-4">
              {(activeTab === 'dataset' ? datasetRequests : correctionRequests).length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">No requests found</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">No {activeTab === 'dataset' ? 'dataset' : 'correction'} requests to display</p>
                </div>
              ) : (
                (activeTab === 'dataset' ? datasetRequests : correctionRequests).map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => { setSelectedRequest(request); setShowModal(true); }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{request.citizenName}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{request.citizenEmail}</p>
                        
                        {activeTab === 'dataset' ? (
                          <div className="space-y-1">
                            <p className="text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Dataset:</span> <span className="text-gray-900 dark:text-white capitalize">{(request as DatasetRequest).datasetType}</span></p>
                            <p className="text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span> <span className="text-gray-900 dark:text-white capitalize">{(request as DatasetRequest).reason}</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{(request as DatasetRequest).description}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Type:</span> <span className="text-gray-900 dark:text-white capitalize">{(request as CorrectionRequest).dataType}</span></p>
                            <p className="text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">City:</span> <span className="text-gray-900 dark:text-white">{(request as CorrectionRequest).city}</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{(request as CorrectionRequest).issueDescription}</p>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getRelativeTime(request.createdAt)}</p>
                        <svg className="w-5 h-5 text-gray-400 mt-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <RequestModal />
    </ProtectedRoute>
  );
}
