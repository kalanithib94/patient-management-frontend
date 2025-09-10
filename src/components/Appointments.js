import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiPlus, 
  FiEdit2, 
  FiTrash2,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { appointmentsAPI, patientsAPI } from '../services/api';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    date: '',
    time: '',
    type: 'general',
    notes: '',
    status: 'scheduled',
    duration: 30
  });

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading appointments...');
      const response = await appointmentsAPI.getAll();
      console.log('🔍 Raw API response:', response);
      
      if (!response.data || !response.data.data) {
        console.error('🔍 Invalid response structure:', response);
        setAppointments([]);
        return;
      }
      
      // Transform the data to match the expected format
      const transformedAppointments = response.data.data.map((apt, index) => {
        console.log(`🔍 Processing appointment ${index}:`, apt);
        console.log(`🔍 Time field value:`, apt.appointmentTime, typeof apt.appointmentTime);
        console.log(`🔍 Time field (alt):`, apt.time, typeof apt.time);
        
        const transformed = {
          id: apt.id,
          patientId: apt.patientId,
          patientName: apt.patientName || 'Unknown Patient',
          date: apt.appointmentDate || apt.date,
          time: apt.appointmentTime || apt.time || '09:00', // Default fallback
          type: apt.type || 'general',
          notes: apt.notes || '',
          status: apt.status || 'scheduled',
          duration: apt.duration || 30
        };
        
        // Ultra-safe time validation
        if (!transformed.time || 
            transformed.time === 'undefined' || 
            transformed.time === 'null' || 
            transformed.time === '' ||
            transformed.time === null ||
            transformed.time === undefined) {
          transformed.time = '09:00';
        }
        
        // Ensure time is a string
        transformed.time = String(transformed.time || '09:00');
        
        console.log(`🔍 Transformed appointment ${index}:`, transformed);
        return transformed;
      });
      
      console.log('🔍 All transformed appointments:', transformedAppointments);
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('🔍 Error loading appointments:', error);
      toast.error('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientsAPI.getAll();
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    }
  };

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
      if (editingAppointment) {
        // Update existing appointment via API
        await appointmentsAPI.update(editingAppointment.id, {
          patientId: formData.patientId,
          appointmentDate: formData.date,
          appointmentTime: formData.time,
          type: formData.type,
          notes: formData.notes,
          status: formData.status,
          duration: formData.duration || 30
        });
        toast.success('Appointment updated successfully!');
      } else {
        // Add new appointment via API
        await appointmentsAPI.create({
          patientId: formData.patientId,
          appointmentDate: formData.date,
          appointmentTime: formData.time,
          type: formData.type,
          notes: formData.notes,
          status: formData.status,
          duration: formData.duration || 30
        });
        toast.success('Appointment scheduled successfully!');
      }
      
      // Reload appointments from API
      await loadAppointments();
      
      setShowModal(false);
      setEditingAppointment(null);
      setFormData({
        patientId: '',
        patientName: '',
        date: '',
        time: '',
        type: 'general',
        notes: '',
        status: 'scheduled',
        duration: 30
      });
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Failed to save appointment');
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      notes: appointment.notes,
      status: appointment.status,
      duration: appointment.duration || 30
    });
    setShowModal(true);
  };

  const handleDelete = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await appointmentsAPI.delete(appointmentId);
        toast.success('Appointment deleted successfully!');
        await loadAppointments(); // Reload appointments from API
      } catch (error) {
        console.error('Error deleting appointment:', error);
        toast.error('Failed to delete appointment');
      }
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, newStatus);
      toast.success(`Appointment marked as ${newStatus}!`);
      await loadAppointments(); // Reload appointments from API
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#f6ad55';
      case 'confirmed': return '#48bb78';
      case 'completed': return '#38b2ac';
      case 'cancelled': return '#f56565';
      case 'urgent': return '#e53e3e';
      default: return '#a0aec0';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'general': return '#667eea';
      case 'follow-up': return '#764ba2';
      case 'consultation': return '#48bb78';
      case 'emergency': return '#f56565';
      default: return '#a0aec0';
    }
  };

  const formatTime = (time) => {
    // Super simple time display - no split() needed!
    if (!time || time === 'undefined' || time === 'null' || time === '') {
      return 'No time set';
    }
    
    // Just return the time as-is, it's already in the right format
    return String(time).trim();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="appointments">
      <div className="appointments-header">
        <div>
          <h1 className="appointments-title">Appointments</h1>
          <p className="appointments-subtitle">Manage patient appointments and schedules</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <FiPlus size={16} />
          Schedule Appointment
        </button>
      </div>

      {/* Appointments List */}
      <div className="appointments-grid">
        {appointments && appointments.length > 0 ? appointments.map(appointment => {
          // Safety check for each appointment
          if (!appointment || typeof appointment !== 'object') {
            console.warn('Invalid appointment data:', appointment);
            return null;
          }
          
          return (
          <div key={appointment.id || Math.random()} className="appointment-card">
            <div className="appointment-header">
              <div className="appointment-time">
                <FiClock size={16} />
                <span>{formatTime(appointment?.time || appointment?.appointmentTime || '09:00')}</span>
              </div>
              <div className="appointment-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(appointment)}
                  title="Edit"
                >
                  <FiEdit2 size={14} />
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(appointment.id)}
                  title="Delete"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="appointment-content">
              <div className="appointment-patient">
                <FiUser size={16} />
                <span>{appointment?.patientName || 'Unknown Patient'}</span>
              </div>
              
              <div className="appointment-details">
                <div className="appointment-date">
                  <FiCalendar size={14} />
                  <span>{appointment?.date ? new Date(appointment.date).toLocaleDateString() : 'No date set'}</span>
                </div>
                
                <div className="appointment-type">
                  <span 
                    className="type-badge"
                    style={{ backgroundColor: getTypeColor(appointment?.type || 'general') }}
                  >
                    {(appointment?.type || 'general').replace('-', ' ')}
                  </span>
                </div>
              </div>
              
              {appointment?.notes && (
                <div className="appointment-notes">
                  <p>{appointment.notes}</p>
                </div>
              )}
            </div>
            
            <div className="appointment-footer">
              <div className="appointment-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(appointment?.status || 'scheduled') }}
                >
                  {appointment?.status || 'scheduled'}
                </span>
              </div>
              
              <div className="appointment-actions">
                {appointment.status === 'scheduled' && (
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                  >
                    <FiCheckCircle size={14} />
                    Confirm
                  </button>
                )}
                {appointment.status === 'confirmed' && (
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleStatusChange(appointment.id, 'completed')}
                  >
                    <FiCheckCircle size={14} />
                    Complete
                  </button>
                )}
                {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                  >
                    <FiXCircle size={14} />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        }) : (
          <div className="no-appointments">
            <p>No appointments found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingAppointment(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Patient</label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Appointment Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="general">General Checkup</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="consultation">Consultation</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="form-input"
                    min="15"
                    max="240"
                    step="15"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                  placeholder="Additional notes or special instructions..."
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAppointment(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
