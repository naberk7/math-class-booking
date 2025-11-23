import React, { useState } from 'react';
import { Calendar, Clock, X, Check, User } from 'lucide-react';

const MathClassScheduler = () => {
  const weekdays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', 
    '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', 
    '20:00', '21:00', '22:00'
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
    console.log('Onay e-postası gönderiliyor:', bookingData.studentEmail);
    console.log('Rezervasyon detayları:', bookingData);
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
        return <Check className="w-3 h-3 text-green-600" />;
      case 'blocked':
        return <X className="w-3 h-3 text-gray-600" />;
      case 'booked':
        return <Calendar className="w-3 h-3 text-blue-600" />;
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
          className={`p-1 border rounded transition-all flex flex-col items-center justify-center h-8 text-xs ${getSlotColor(slot.status)}`}
        >
          {getSlotIcon(slot.status)}
        </button>
      );
    } else {
      const selected = isSlotSelected(day, time);
      if (slot.status === 'available') {
        return (
          <button
            onClick={() => handleBookSlot(day, time)}
            className={`p-1 border rounded transition-all flex items-center justify-center h-8 ${getSlotColor(slot.status, selected)} font-semibold text-xs`}
          >
            {selected ? (
              <Check className="w-3 h-3 text-indigo-700" />
            ) : (
              <Check className="w-3 h-3 text-green-600" />
            )}
          </button>
        );
      } else {
        return (
          <div className={`p-1 border rounded flex items-center justify-center h-8 text-xs ${getSlotColor(slot.status)}`}>
            {slot.status === 'blocked' ? (
              <X className="w-3 h-3 text-gray-600" />
            ) : (
              <Calendar className="w-3 h-3 text-blue-600" />
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-3 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-400" />
            Matematik Dersi Rezervasyon
          </h1>
          
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setViewMode('admin')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all text-sm ${
                viewMode === 'admin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              👨‍🏫 Öğretmen
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all text-sm ${
                viewMode === 'student'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              👨‍🎓 Öğrenci
            </button>
          </div>

          <p className="text-gray-400 mb-3 text-sm">
            {viewMode === 'admin' 
              ? 'Müsait/dolu slotları değiştirmek için tıklayın. Rezerve edilmiş slotlara tıklayarak öğrenci bilgilerini görün.' 
              : 'Birden fazla saat seçmek için müsait slotlara tıklayın, ardından rezervasyon yapın.'}
          </p>
          
          <div className="flex gap-4 items-center flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-300">Müsait</span>
            </div>
            {viewMode === 'admin' && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                <span className="text-gray-300">Kapalı</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-gray-300">
                {viewMode === 'admin' ? 'Rezerve' : 'Dolu'}
              </span>
            </div>
            {viewMode === 'student' && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-indigo-200 border border-indigo-400 rounded"></div>
                <span className="text-gray-300">Seçili</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg p-3 overflow-x-auto border border-gray-700">
          <div className="min-w-max">
            <div className="grid grid-cols-8 gap-0.5 mb-0.5">
              <div className="font-semibold text-gray-300 p-1 text-xs">Saat</div>
              {weekdays.map(day => (
                <div key={day} className="font-semibold text-gray-300 p-1 text-center text-xs">
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-8 gap-0.5 mb-0.5">
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
          <div className="mt-3 bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {selectedSlots.length} saat seçildi
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedSlots.map((slot, idx) => (
                    <span key={slot.key}>
                      {slot.day} {slot.time}
                      {idx < selectedSlots.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSlots([])}
                  className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition-all text-sm"
                >
                  Temizle
                </button>
                <button
                  onClick={proceedToBooking}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm"
                >
                  Rezervasyon Yap
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-2">Ders Detayları</h2>
          <div className="text-gray-300 space-y-1 text-sm">
            <p>• Ders Süresi: <strong>45 dakika</strong></p>
            <p>• Dersler Arası Mola: <strong>15 dakika</strong></p>
            <p>• Toplam Slot Süresi: <strong>1 saat</strong></p>
            <p>• Çalışma Saatleri: <strong>08:00 - 22:00</strong></p>
          </div>
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Ders Rezervasyonu
            </h2>
            <div className="bg-indigo-50 rounded-lg p-3 mb-3">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Seçilen Saatler:</h3>
              <div className="space-y-1 text-sm text-gray-700">
                {selectedSlots.map((slot, idx) => (
                  <p key={slot.key} className="text-xs">
                    {idx + 1}. <strong>{slot.day}</strong> saat <strong>{slot.time}</strong>
                  </p>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Adınız Soyadınız"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg mb-2 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg mb-2 focus:outline-none focus:border-indigo-500 text-sm"
              required
            />
            <input
              type="tel"
              placeholder="Telefon numaranız (opsiyonel)"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmBooking}
                disabled={!studentName.trim() || !studentEmail.trim()}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
              >
                Onayla
              </button>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setStudentName('');
                  setStudentEmail('');
                  setStudentPhone('');
                  setSelectedSlots([]);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && lastBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Rezervasyon Onaylandı!</h2>
              <p className="text-gray-600 text-sm">Dersleriniz başarıyla rezerve edildi.</p>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-3 mb-3">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Rezervasyon Detayları:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="text-xs"><strong>Toplam Ders:</strong> {lastBooking.slots.length}</p>
                {lastBooking.slots.map((slot, idx) => (
                  <div key={slot.key} className="ml-2 p-2 bg-white rounded border border-indigo-200">
                    <p className="font-semibold text-indigo-700 mb-1 text-xs">
                      Ders {idx + 1}: {slot.day} saat {slot.time}
                    </p>
                    <div className="text-xs space-y-0.5">
                      <p><strong>Zoom Linki:</strong></p>
                      <a 
                        href={slot.zoomInfo.joinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all block"
                      >
                        {slot.zoomInfo.joinUrl}
                      </a>
                      <p><strong>Toplantı ID:</strong> {slot.zoomInfo.meetingId}</p>
                      <p><strong>Şifre:</strong> {slot.zoomInfo.password}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-indigo-200 text-xs">
                  <p><strong>Ders Süresi:</strong> 45 dakika</p>
                  <p><strong>İsim:</strong> {lastBooking.studentName}</p>
                  <p><strong>E-posta:</strong> {lastBooking.studentEmail}</p>
                  {lastBooking.studentPhone && (
                    <p><strong>Telefon:</strong> {lastBooking.studentPhone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-2 mb-3">
              <p className="text-xs text-blue-800">
                📧 <strong>{lastBooking.studentEmail}</strong> adresine tüm Zoom linkleri ve ders detayları içeren onay e-postası gönderildi.
              </p>
            </div>
            
            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {showStudentInfo && selectedStudentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Öğrenci Bilgileri
            </h2>
            
            <div className="bg-indigo-50 rounded-lg p-3 mb-3">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Ders Detayları:</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="font-semibold w-20 text-xs">Gün:</span>
                  <span className="text-xs">{selectedStudentInfo.day}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold w-20 text-xs">Saat:</span>
                  <span className="text-xs">{selectedStudentInfo.time}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold w-20 text-xs">Süre:</span>
                  <span className="text-xs">45 dakika</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Öğrenci Detayları:</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="font-semibold w-20 text-xs">İsim:</span>
                  <span className="text-xs">{selectedStudentInfo.studentName}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold w-20 text-xs">E-posta:</span>
                  <span className="break-all text-xs">{selectedStudentInfo.studentEmail}</span>
                </div>
                {selectedStudentInfo.studentPhone && (
                  <div className="flex items-start">
                    <span className="font-semibold w-20 text-xs">Telefon:</span>
                    <span className="text-xs">{selectedStudentInfo.studentPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedStudentInfo.zoomLink && (
              <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-green-600" />
                  Zoom Toplantı Detayları:
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-xs">Katılım Linki:</span>
                    <a 
                      href={selectedStudentInfo.zoomLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:text-blue-800 underline break-all mt-1 text-xs"
                    >
                      {selectedStudentInfo.zoomLink}
                    </a>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-24 text-xs">Toplantı ID:</span>
                    <span className="text-xs">{selectedStudentInfo.meetingId}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold w-24 text-xs">Şifre:</span>
                    <span className="text-xs">{selectedStudentInfo.meetingPassword}</span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowStudentInfo(false)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathClassScheduler;