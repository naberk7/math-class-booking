import React, { useState } from 'react';
import { Calendar, Clock, X, Check, User } from 'lucide-react';

const MathClassScheduler = () => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', 
    '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', 
    '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  const [viewMode, setViewMode] = useState('admin');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [lastBooking, setLastBooking] = useState(null);

  const [schedule, setSchedule] = useState(() => {
    const initial = {};
    weekdays.forEach(day => {
      initial[day] = {};
      timeSlots.forEach(time => {
        initial[day][time] = { status: 'available', studentName: '' };
      });
    });
    return initial;
  });

  const toggleSlotAvailability = (day, time) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: {
          ...prev[day][time],
          status: prev[day][time].status === 'available' ? 'blocked' : 'available'
        }
      }
    }));
  };

  const viewStudentInfo = (day, time) => {
    const slot = schedule[day][time];
    if (slot.status === 'booked') {
      setSelectedStudentInfo({
        day,
        time,
        ...slot
      });
      setShowStudentInfo(true);
    }
  };

  const handleBookSlot = (day, time) => {
    const slotKey = `${day}-${time}`;
    const isSelected = selectedSlots.some(slot => slot.key === slotKey);
    
    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(slot => slot.key !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, { day, time, key: slotKey }]);
    }
  };

  const proceedToBooking = () => {
    if (selectedSlots.length > 0) {
      setShowBookingForm(true);
    }
  };

  const isSlotSelected = (day, time) => {
    return selectedSlots.some(slot => slot.key === `${day}-${time}`);
  };

  const confirmBooking = async () => {
    if (selectedSlots.length > 0 && studentName.trim() && studentEmail.trim()) {
      const slotsWithMeetings = await Promise.all(
        selectedSlots.map(async ({ day, time, key }) => {
          const zoomInfo = await generateZoomMeeting(day, time, studentName.trim());
          return { day, time, key, zoomInfo };
        })
      );

      const bookingData = {
        slots: slotsWithMeetings,
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim(),
        studentPhone: studentPhone.trim()
      };
      
      setSchedule(prev => {
        const newSchedule = { ...prev };
        slotsWithMeetings.forEach(({ day, time, zoomInfo }) => {
          newSchedule[day] = {
            ...newSchedule[day],
            [time]: {
              status: 'booked',
              studentName: studentName.trim(),
              studentEmail: studentEmail.trim(),
              studentPhone: studentPhone.trim(),
              zoomLink: zoomInfo.joinUrl,
              meetingId: zoomInfo.meetingId,
              meetingPassword: zoomInfo.password
            }
          };
        });
        return newSchedule;
      });
      
      setLastBooking(bookingData);
      sendConfirmationEmail(bookingData);
      
      setShowBookingForm(false);
      setShowConfirmation(true);
      setStudentName('');
      setStudentEmail('');
      setStudentPhone('');
      setSelectedSlots([]);
    }
  };

  const sendConfirmationEmail = (bookingData) => {
    console.log('Sending confirmation email to:', bookingData.studentEmail);
    console.log('Booking details:', bookingData);
  };

  const generateZoomMeeting = async (day, time, studentName) => {
    const meetingId = Math.floor(100000000 + Math.random() * 900000000);
    const password = Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      joinUrl: `https://zoom.us/j/${meetingId}?pwd=${password}`,
      meetingId: meetingId.toString(),
      password: password
    };
  };

  const getSlotColor = (status, isSelected = false) => {
    if (isSelected) {
      return 'bg-indigo-200 border-indigo-400 cursor-pointer ring-2 ring-indigo-500';
    }
    switch(status) {
      case 'available':
        return viewMode === 'admin' 
          ? 'bg-green-100 hover:bg-green-200 border-green-300 cursor-pointer'
          : 'bg-green-100 hover:bg-green-300 border-green-400 cursor-pointer';
      case 'blocked':
        return 'bg-gray-200 border-gray-300 cursor-not-allowed';
      case 'booked':
        return 'bg-blue-100 border-blue-300 cursor-not-allowed';
      default:
        return 'bg-gray-100';
    }
  };

  const getSlotIcon = (status) => {
    switch(status) {
      case 'available':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'blocked':
        return <X className="w-4 h-4 text-gray-600" />;
      case 'booked':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const renderSlot = (day, time) => {
    const slot = schedule[day][time];
    
    if (viewMode === 'admin') {
      return (
        <button
          onClick={() => slot.status === 'booked' ? viewStudentInfo(day, time) : toggleSlotAvailability(day, time)}
          className={`p-2 border-2 rounded transition-all flex flex-col items-center justify-center min-h-12 text-xs ${getSlotColor(slot.status)}`}
        >
          {getSlotIcon(slot.status)}
          {slot.status === 'booked' && (
            <span className="text-xs mt-0.5 text-blue-700 font-medium truncate w-full text-center">
              {slot.studentName}
            </span>
          )}
        </button>
      );
    } else {
      const selected = isSlotSelected(day, time);
      if (slot.status === 'available') {
        return (
          <button
            onClick={() => handleBookSlot(day, time)}
            className={`p-2 border-2 rounded transition-all flex flex-col items-center justify-center min-h-12 ${getSlotColor(slot.status, selected)} font-semibold text-xs`}
          >
            {selected ? (
              <>
                <Check className="w-4 h-4 text-indigo-700 mb-0.5" />
                <span className="text-xs text-indigo-700">Selected</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-green-600 mb-0.5" />
                <span className="text-xs text-green-700">Available</span>
              </>
            )}
          </button>
        );
      } else {
        return (
          <div className={`p-2 border-2 rounded flex flex-col items-center justify-center min-h-12 text-xs ${getSlotColor(slot.status)}`}>
            {slot.status === 'blocked' ? (
              <span className="text-xs text-gray-600">Unavailable</span>
            ) : (
              <>
                <Calendar className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-700 mt-0.5">Reserved</span>
              </>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-8 h-8 text-indigo-400" />
            Math Class Schedule
          </h1>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setViewMode('admin')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'admin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              👨‍🏫 Instructor View
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'student'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              👨‍🎓 Student Booking View
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            {viewMode === 'admin' 
              ? 'Click on available/blocked slots to toggle availability. Click booked slots to view student information.' 
              : 'Click on available slots to select multiple time slots, then proceed to booking.'}
          </p>
          
          <div className="flex gap-6 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm text-gray-300">Available</span>
            </div>
            {viewMode === 'admin' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-300">Blocked (Instructor Busy)</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span className="text-sm text-gray-300">
                {viewMode === 'admin' ? 'Booked' : 'Reserved'}
              </span>
            </div>
            {viewMode === 'student' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-200 border-2 border-indigo-400 rounded"></div>
                <span className="text-sm text-gray-300">Selected</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-4 overflow-x-auto border border-gray-700">
          <div className="min-w-max">
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div className="font-semibold text-gray-300 p-1 text-xs">Time</div>
              {weekdays.map(day => (
                <div key={day} className="font-semibold text-gray-300 p-1 text-center text-xs">
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                <div className="font-medium text-gray-400 p-1 flex items-center text-xs">
                  {time}
                </div>
                {weekdays.map(day => (
                  <div key={`${day}-${time}`}>
                    {renderSlot(day, time)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {viewMode === 'student' && selectedSlots.length > 0 && (
          <div className="mt-4 bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">
                  {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedSlots.map((slot, idx) => (
                    <span key={slot.key}>
                      {slot.day} at {slot.time}
                      {idx < selectedSlots.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSlots([])}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Clear
                </button>
                <button
                  onClick={proceedToBooking}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all"
                >
                  Proceed to Booking
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-2">Class Details</h2>
          <div className="text-gray-300 space-y-1">
            <p>• Class Duration: <strong>45 minutes</strong></p>
            <p>• Break Between Classes: <strong>15 minutes</strong></p>
            <p>• Total Slot Duration: <strong>1 hour</strong></p>
            <p>• Operating Hours: <strong>8:00 AM - 10:00 PM</strong></p>
          </div>
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-600" />
              Book Your Classes
            </h2>
            <div className="bg-indigo-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Selected Time Slots:</h3>
              <div className="space-y-1 text-sm text-gray-700">
                {selectedSlots.map((slot, idx) => (
                  <p key={slot.key}>
                    {idx + 1}. <strong>{slot.day}</strong> at <strong>{slot.time}</strong>
                  </p>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="email"
              placeholder="Enter your email address"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-indigo-500"
              required
            />
            <input
              type="tel"
              placeholder="Enter your phone number (optional)"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmBooking}
                disabled={!studentName.trim() || !studentEmail.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setStudentName('');
                  setStudentEmail('');
                  setStudentPhone('');
                  setSelectedSlots([]);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && lastBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600">Your math class has been successfully booked.</p>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Booking Details:</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p><strong>Classes Booked:</strong> {lastBooking.slots.length}</p>
                {lastBooking.slots.map((slot, idx) => (
                  <div key={slot.key} className="ml-4 p-3 bg-white rounded border border-indigo-200">
                    <p className="font-semibold text-indigo-700 mb-1">
                      Class {idx + 1}: {slot.day} at {slot.time}
                    </p>
                    <div className="text-xs space-y-1">
                      <p><strong>Zoom Link:</strong></p>
                      <a 
                        href={slot.zoomInfo.joinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {slot.zoomInfo.joinUrl}
                      </a>
                      <p><strong>Meeting ID:</strong> {slot.zoomInfo.meetingId}</p>
                      <p><strong>Password:</strong> {slot.zoomInfo.password}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-indigo-200">
                  <p><strong>Duration per class:</strong> 45 minutes</p>
                  <p><strong>Name:</strong> {lastBooking.studentName}</p>
                  <p><strong>Email:</strong> {lastBooking.studentEmail}</p>
                  {lastBooking.studentPhone && (
                    <p><strong>Phone:</strong> {lastBooking.studentPhone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
              <p className="text-sm text-blue-800">
                📧 A confirmation email has been sent to <strong>{lastBooking.studentEmail}</strong> with all Zoom meeting links and class details.
              </p>
            </div>
            
            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showStudentInfo && selectedStudentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-indigo-600" />
              Student Information
            </h2>
            
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Class Details:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="font-semibold w-24">Day:</span>
                  <span>{selectedStudentInfo.day}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold w-24">Time:</span>
                  <span>{selectedStudentInfo.time}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold w-24">Duration:</span>
                  <span>45 minutes</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Student Details:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="font-semibold w-24">Name:</span>
                  <span>{selectedStudentInfo.studentName}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold w-24">Email:</span>
                  <span className="break-all">{selectedStudentInfo.studentEmail}</span>
                </div>
                {selectedStudentInfo.studentPhone && (
                  <div className="flex items-start">
                    <span className="font-semibold w-24">Phone:</span>
                    <span>{selectedStudentInfo.studentPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedStudentInfo.zoomLink && (
              <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Zoom Meeting Details:
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">Join URL:</span>
                    <a 
                      href={selectedStudentInfo.zoomLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:text-blue-800 underline break-all mt-1"
                    >
                      {selectedStudentInfo.zoomLink}
                    </a>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-28">Meeting ID:</span>
                    <span>{selectedStudentInfo.meetingId}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-28">Password:</span>
                    <span>{selectedStudentInfo.meetingPassword}</span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowStudentInfo(false)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathClassScheduler;