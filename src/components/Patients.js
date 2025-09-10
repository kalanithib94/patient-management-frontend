import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiFilter, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiPhone,
  FiMail,
  FiMapPin
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { usePaginatedApi, useFormSubmit } from '../hooks/useApi';
import { patientsAPI } from '../services/api';
import './Patients.css';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    medications: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  // Debounce search term - only search after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPatients = async () => {
    setLoading(true);
    console.log('🔄 Loading patients...');
    try {
      console.log('📡 Making API call to patients endpoint...');
      const response = await patientsAPI.getAll({
        search: debouncedSearchTerm,
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      console.log('✅ API response received:', response);
      console.log('📊 Patients data:', response.data.data);
      setPatients(response.data.data || []);
      console.log('✅ Patients loaded successfully');
    } catch (error) {
      console.error('❌ Error loading patients:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to load patients: ' + error.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload patients when debounced search term or filter changes
  useEffect(() => {
    loadPatients();
  }, [debouncedSearchTerm, filterStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPatient) {
        // Update existing patient
        await patientsAPI.update(editingPatient.id, formData);
        toast.success('Patient updated successfully!');
      } else {
        // Add new patient
        await patientsAPI.create(formData);
        toast.success('Patient added successfully!');
      }
      
      // Reload patients from API
      await loadPatients();
      
      setShowModal(false);
      setEditingPatient(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
        medicalHistory: '',
        allergies: '',
        medications: ''
      });
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Failed to save patient');
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.first_name || '',
      lastName: patient.last_name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      dateOfBirth: patient.date_of_birth || '',
      address: patient.address || '',
      emergencyContact: patient.emergency_contact || '',
      medicalHistory: patient.medical_history || '',
      allergies: patient.allergies || '',
      medications: patient.medications || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientsAPI.delete(patientId);
        toast.success('Patient deleted successfully!');
        await loadPatients(); // Reload patients from API
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error('Failed to delete patient');
      }
    }
  };

  const getAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="patients">
      <div className="patients-header">
        <div>
          <h1 className="patients-title">Patients</h1>
          <p className="patients-subtitle">Manage your patient records</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <FiPlus size={16} />
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <FiSearch className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm !== debouncedSearchTerm && (
            <div className="search-loading">Searching...</div>
          )}
        </div>
        
        <div className="filter-group">
          <FiFilter size={16} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="patients-table-container">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Contact</th>
              <th>Age</th>
              <th>Status</th>
              <th>Last Visit</th>
              <th>Next Appointment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>
                  <div className="patient-cell">
                    <div className="patient-avatar">
                      {patient.first_name ? patient.first_name.charAt(0).toUpperCase() : '?'}{patient.last_name ? patient.last_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className="patient-name">
                        {patient.first_name || 'Unknown'} {patient.last_name || 'Patient'}
                      </div>
                      <div className="patient-id">ID: {patient.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-cell">
                    <div className="contact-item">
                      <FiPhone size={14} />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="contact-item">
                      <FiMail size={14} />
                      <span>{patient.email}</span>
                    </div>
                  </div>
                </td>
                <td>{patient.date_of_birth ? getAge(patient.date_of_birth) : 'Unknown'} years</td>
                <td>
                  <span className={`status-badge ${
                    patient.status === 'active' ? 'status-active' : 'status-pending'
                  }`}>
                    {patient.status}
                  </span>
                </td>
                <td>{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'Never'}</td>
                <td>
                  {patient.next_appointment 
                    ? new Date(patient.next_appointment).toLocaleDateString()
                    : 'Not scheduled'
                  }
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(patient)}
                      title="Edit"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(patient.id)}
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingPatient(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Allergies</label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Medications</label>
                  <input
                    type="text"
                    name="medications"
                    value={formData.medications}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPatient(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPatient ? 'Update Patient' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
