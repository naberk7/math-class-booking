import React, { useState } from 'react';
import { Calendar, Clock, X, Check, User } from 'lucide-react';
import { supabase } from './supabaseClient';



const MathClassScheduler = () => {

  const weekdays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', 
    '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', 
    '20:00', '21:00', '22:00'
  ];

  const [viewMode, setViewMode] = useState('student'); // Öğrenci sekmesiyle başlasın
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
// Sayfa yüklenince veritabanından verileri çek
// Sayfa yüklenince veritabanından verileri çek ve hafta kontrolü yap
React.useEffect(() => {
  checkAndResetWeek();
}, []);

// Hafta değişti mi kontrol et ve gerekirse sıfırla
const checkAndResetWeek = async () => {
  const today = new Date();
  const lastResetDate = localStorage.getItem('lastResetDate');
  
  // Haftanın ilk günü (Pazartesi) hesapla
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  
  const mondayString = monday.toISOString().split('T')[0];
  
  // Eğer yeni bir hafta başladıysa ve daha sıfırlanmadıysa
  if (lastResetDate !== mondayString) {
    console.log('Yeni hafta başladı, slotlar sıfırlanıyor...');
    
    try {
      // Veritabanını temizle
      await supabase.from('bookings').delete().neq('id', 0);
      await supabase.from('slot_status').delete().neq('id', 0);
      
      // Son reset tarihini kaydet
      localStorage.setItem('lastResetDate', mondayString);
      
      console.log('Haftalık reset başarılı!');
    } catch (error) {
      console.error('Otomatik reset hatası:', error);
    }
  }
  
  // Normal yüklemeye devam et
  await loadScheduleFromDatabase();
};

  // Öğretmen şifresi
  const TEACHER_PASSWORD = '776110';

  // Haftanın tarih aralığını hesapla
  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
    
    // Pazartesi'yi haftanın ilk günü olarak hesapla
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Pazar'ı haftanın son günü olarak hesapla
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    const startDay = monday.getDate();
    const endDay = sunday.getDate();
    const startMonth = monthNames[monday.getMonth()];
    const endMonth = monthNames[sunday.getMonth()];
    const year = sunday.getFullYear();
    
    // Eğer ay değiştiysa
    if (startMonth !== endMonth) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    } else {
      return `${startDay}-${endDay} ${endMonth} ${year}`;
    }
  };

// Veritabanından schedule'ı yükle
const loadScheduleFromDatabase = async () => {
  try {
    // Rezervasyonları çek
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*');
    
    if (bookingsError) throw bookingsError;

    // Kapalı slotları çek
    const { data: slotStatuses, error: statusError } = await supabase
      .from('slot_status')
      .select('*');
    
    if (statusError) throw statusError;

    // Yeni schedule oluştur
    const newSchedule = {};
    weekdays.forEach(day => {
      newSchedule[day] = {};
      timeSlots.forEach(time => {
        newSchedule[day][time] = { status: 'available', studentName: '' };
      });
    });

    // Rezervasyonları ekle
    bookings?.forEach(booking => {
      if (newSchedule[booking.day] && newSchedule[booking.day][booking.time]) {
        newSchedule[booking.day][booking.time] = {
          status: 'booked',
          studentName: booking.student_name,
          studentEmail: booking.student_email,
          studentPhone: booking.student_phone,
          zoomLink: booking.zoom_link,
          meetingId: booking.meeting_id,
          meetingPassword: booking.meeting_password
        };
      }
    });

    // Kapalı slotları ekle
    slotStatuses?.forEach(slot => {
      if (newSchedule[slot.day] && newSchedule[slot.day][slot.time]) {
        if (newSchedule[slot.day][slot.time].status !== 'booked') {
          newSchedule[slot.day][slot.time].status = slot.status;
        }
      }
    });

    setSchedule(newSchedule);
  } catch (error) {
    console.error('Veritabanından yükleme hatası:', error);
  }
};

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

  const handleTeacherViewClick = () => {
    if (!isAuthenticated) {
      setShowPasswordModal(true);
    } else {
      setViewMode('admin');
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === TEACHER_PASSWORD) {
      setIsAuthenticated(true);
      setViewMode('admin');
      setShowPasswordModal(false);
      setPasswordInput('');
    } else {
      alert('Yanlış şifre! Lütfen tekrar deneyin.');
      setPasswordInput('');
    }
  };

const toggleSlotAvailability = async (day, time) => {
  const currentStatus = schedule[day][time].status;
  let newStatus;
  
  // 2 durum döngüsü: available ↔ blocked
  if (currentStatus === 'available') {
    newStatus = 'blocked';
  } else if (currentStatus === 'blocked') {
    newStatus = 'available';
  } else {
    // booked ise değiştirme
    return;
  }
  
  // Veritabanını güncelle
  try {
    if (newStatus === 'blocked') {
      // Veritabanına ekle
      const { error } = await supabase
        .from('slot_status')
        .upsert({ day, time, status: 'blocked' }, { onConflict: 'day,time' });
      
      if (error) throw error;
    } else {
      // Veritabanından sil (müsait yap)
      const { error } = await supabase
        .from('slot_status')
        .delete()
        .match({ day, time });
      
      if (error) throw error;
    }
    
    // Yerel state'i güncelle
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: {
          ...prev[day][time],
          status: newStatus
        }
      }
    }));
  } catch (error) {
    console.error('Slot durumu güncellenemedi:', error);
    alert('Slot durumu güncellenemedi. Lütfen tekrar deneyin.');
  }
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

  const handleResetSchedule = async () => {
  try {
    // Tüm rezervasyonları sil
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .neq('id', 0); // Tüm satırları sil
    
    if (bookingsError) throw bookingsError;

    // Tüm slot durumlarını sil
    const { error: statusError } = await supabase
      .from('slot_status')
      .delete()
      .neq('id', 0); // Tüm satırları sil
    
    if (statusError) throw statusError;

    // Yerel state'i sıfırla
    const initial = {};
    weekdays.forEach(day => {
      initial[day] = {};
      timeSlots.forEach(time => {
        initial[day][time] = { status: 'available', studentName: '' };
      });
    });
    setSchedule(initial);
    setShowResetModal(false);
    
    alert('Tüm haftalık veriler başarıyla sıfırlandı!');
  } catch (error) {
    console.error('Reset hatası:', error);
    alert('Reset işlemi başarısız oldu. Lütfen tekrar deneyin.');
  }
};

  const handleBookSlot = (day, time) => {
    if (isPastSlot(day, time)) return;
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
  console.log('Onaylandı!'); // ← EKLE
  console.log('selectedSlots:', selectedSlots); // ← EKLE
  console.log('studentName:', studentName); // ← EKLE
  console.log('studentEmail:', studentEmail); // ← EKLE
  
  if (selectedSlots.length > 0 && studentName.trim() && studentEmail.trim()) {
    setIsBooking(true);
    console.log('IF içine girdi!'); // ← EKLE
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
    
    // Veritabanına kaydet
    try {
      for (const slot of slotsWithMeetings) {
        const { error } = await supabase
          .from('bookings')
          .insert({
            student_name: bookingData.studentName,
            student_email: bookingData.studentEmail,
            student_phone: bookingData.studentPhone,
            day: slot.day,
            time: slot.time,
            zoom_link: slot.zoomInfo.joinUrl,
            meeting_id: slot.zoomInfo.meetingId,
            meeting_password: slot.zoomInfo.password
          });
        
        if (error) throw error;
      }
      
      // Yerel state'i güncelle
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
    } catch (error) {
      console.error('Rezervasyon kaydedilemedi:', error);
      alert('Rezervasyon kaydedilemedi. Lütfen tekrar deneyin.');
    }finally {
      setIsBooking(false);}
  }
};

  const sendConfirmationEmail = async (bookingData) => {
  try {
    const bookings = bookingData.slots.map(slot => ({
      day: slot.day,
      time: slot.time,
      zoomLink: slot.zoomInfo.joinUrl,
      meetingId: slot.zoomInfo.meetingId,
      password: slot.zoomInfo.password
    }));

    const emailResponse = await fetch('https://edxnltxzalqudizbxocf.supabase.co/functions/v1/send-booking-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: bookingData.studentEmail,
        studentName: bookingData.studentName,
        bookings: bookings
      })
    });

    if (!emailResponse.ok) {
      console.error('E-posta gönderilemedi');
    } else {
      console.log('E-posta başarıyla gönderildi!');
    }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
  }
};

// Geçmiş bir slot mu kontrol et
const isPastSlot = (day, time) => {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Pazar, 1=Pazartesi, ...
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const weekdays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const dayIndex = weekdays.indexOf(day);
  
  // Pazar=0, Pazartesi=1 formatına çevir
  const slotDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
  
  // Eğer slot günü bugünden önceyse, geçmiştir
  if (slotDayIndex < currentDay) return true;
  
  // Eğer aynı günse, saate bak
  if (slotDayIndex === currentDay) {
    const [slotHour, slotMinute] = time.split(':').map(Number);
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const slotTimeInMinutes = slotHour * 60 + slotMinute;
    
    return slotTimeInMinutes <= currentTimeInMinutes;
  }
  
  return false;
};

// Zoom için tarih/saat formatını oluştur
const getZoomDateTime = (day, time) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekdays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const targetDayIndex = weekdays.indexOf(day);
  const daysUntilTarget = (targetDayIndex + 1 - dayOfWeek + 7) % 7 || 7;
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  
  const [hours, minutes] = time.split(':');
  targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return targetDate.toISOString();
};

const generateZoomMeeting = async (day, time, studentName) => {
  try {
    const zoomResponse = await fetch('https://edxnltxzalqudizbxocf.supabase.co/functions/v1/create-zoom-meeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: `Matematik Dersi - ${studentName}`,
        start_time: getZoomDateTime(day, time),
        duration: 45,
        timezone: 'Europe/Istanbul'
      })
    });

    if (!zoomResponse.ok) {
      throw new Error('Zoom toplantısı oluşturulamadı');
    }

    const zoomData = await zoomResponse.json();
    
    return {
      joinUrl: zoomData.join_url,
      meetingId: zoomData.id.toString(),
      password: zoomData.password
    };
  } catch (error) {
    console.error('Zoom meeting oluşturma hatası:', error);
    throw error;
  }
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
        return 'bg-gray-200 border-gray-300 cursor-pointer hover:bg-gray-300';
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
    return (
      <div className="w-full p-1.5 border rounded flex items-center justify-center h-10 text-xs bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed">
        <Clock className="w-4 h-4 text-gray-400" />
      </div>
    );
  
    if (viewMode === 'admin') {
      return (
        <button
          onClick={() => {
            if (slot.status === 'booked') {
              viewStudentInfo(day, time);
            } else {
              toggleSlotAvailability(day, time);
            }
          }}
          className={`w-full p-1.5 border rounded transition-all flex flex-col items-center justify-center h-10 text-xs ${getSlotColor(slot.status)}`}
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
            className={`w-full p-1.5 border rounded transition-all flex items-center justify-center h-10 ${getSlotColor(slot.status, selected)} font-semibold text-xs`}
          >
            {selected ? (
              <Check className="w-4 h-4 text-indigo-700" />
            ) : (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </button>
        );
      } else {
        // Öğrenciler için blocked ve booked farklı görünsün
        return (
          <div className={`w-full p-1.5 border rounded flex items-center justify-center h-10 text-xs ${getSlotColor(slot.status)}`}>
            {slot.status === 'blocked' ? (
              <X className="w-4 h-4 text-gray-600" />
            ) : (
              <Calendar className="w-4 h-4 text-blue-600" />
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
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-400" />
              Matematik Soru Çözüm Rezervasyon
            </h1>
            <div className="text-right">
              <p className="text-xs text-gray-400">Bu Hafta</p>
              <p className="text-sm font-semibold text-indigo-400">{getWeekRange()}</p>
            </div>
          </div>
          
          <div className="flex gap-3 mb-3">
            <button
              onClick={handleTeacherViewClick}
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
	    
  	    <button
  		onClick={() => setViewMode('info')}
  		className={`px-4 py-1.5 rounded-lg font-semibold transition-all text-sm ${
    			viewMode === 'info'
      			? 'bg-indigo-600 text-white'
      			: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
 		 }`}
	   >
  		ℹ️ Nasıl Çalışır?
	    </button>
            
            {viewMode === 'admin' && (
              <button
                onClick={() => setShowResetModal(true)}
                className="ml-auto px-4 py-1.5 rounded-lg font-semibold transition-all text-sm bg-red-600 text-white hover:bg-red-700"
              >
                🔄 Haftalık Reset
              </button>
            )}
          </div>

          <p className="text-gray-400 mb-3 text-sm">
  {viewMode === 'admin' 
    ? 'Slotlara tıklayarak müsait/kapalı durumlarını değiştirin. Rezerve edilmiş slotlara tıklayarak öğrenci bilgilerini görün.' 
    : viewMode === 'student'
    ? 'Birden fazla saat seçmek için müsait slotlara tıklayın, ardından rezervasyon yapın.'
    : 'Matematik soru çözümü hizmeti hakkında bilgiler ve rezervasyon süreci.'}
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

        {viewMode === 'student' && selectedSlots.length > 0 && (
          <div className="mb-3 bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-700">
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
	{viewMode !== 'info' && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-3 overflow-x-auto border border-gray-700">
          <div className="min-w-max">
            <div className="grid grid-cols-8 mb-0.5" style={{gap: '3px'}}>
              <div className="font-semibold text-gray-300 p-1 text-xs w-12">Saat</div>
              {weekdays.map(day => (
                <div key={day} className="font-semibold text-gray-300 p-1 text-center text-xs flex-1">
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-8 mb-0.5" style={{gap: '3px'}}>
                <div className="font-medium text-gray-400 p-1 flex items-center text-xs w-12">
                  {time}
                </div>
                {weekdays.map(day => (
                  <div key={`${day}-${time}`} className="flex-1">
                    {renderSlot(day, time)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
)} 

	{viewMode !== 'info' && (
        <div className="mt-3 bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-2">Ders Detayları</h2>
          <div className="text-gray-300 space-y-1 text-sm">
            <p>• Ders Süresi: <strong>45 dakika</strong></p>
            <p>• Dersler Arası Mola: <strong>15 dakika</strong></p>
            <p>• Toplam Slot Süresi: <strong>1 saat</strong></p>
            <p>• Çalışma Saatleri: <strong>08:00 - 22:00</strong></p>
          </div>
        </div>
        )}
      </div>


{/* Nasıl Çalışır Sayfası */}
{viewMode === 'info' && (
  /* Süreç Akış Şeması */
  <div className="space-y-4 max-w-7xl mx-auto">
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-indigo-400" />
        Rezervasyon Süreci
      </h2>
      <div className="bg-gray-700 rounded-lg p-4">
        <img 
          src="/process-chart.png" 
          alt="Rezervasyon Süreci Akış Şeması" 
          className="w-full rounded-lg"
        />
      </div>
    </div>
    {/* Hakkımda Bölümü */}
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <User className="w-6 h-6 text-indigo-400" />
        Hakkımda
      </h2>
      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <p className="text-gray-300 text-sm leading-relaxed mb-3">
          Merhaba! Ben Berkay Ediş, İstanbul Teknik Üniversitesi Endüstri Mühendisliği mezunuyum. Şu anda İstanbul Teknik Üniversitesi'nde Ses Mühendisliği yüksek lisans programında ve ayrıca İstanbul Bilgi Üniversitesi'nde Dijital Oyun Tasarımı bölümünde öğrenim görmeye devam ediyorum. Matematiği çok severim, soru çözmeye bayılırım ve özellikle soruyu kodlarına ayırmak, soruya nasıl yaklaşılacağını saptamak, doğru okumak ve ne sorulduğunu anlamak, farklı çözüm yolları bulmak bana keyif veriyor ve bu konuda kötü olmadığımı düşünüyorum. 2014 yılında üniversite hayatım başladığından beri bazen kısa bazen uzun aralıklarla da olsa hep öğrencilerim oldu. Hala da devam ediyor, başka bir işim olsa bile matematik çözmek ve öğretmek bana onur veriyor. Bu yüzden de böyle bir sistem kurmak istedim.   
          Öğrencilere birebir online soru çözümü ve matematik desteği sağlıyorum.
	  Bu site yardımı ile haftalık uygun slotlara randevu oluşturduğunuzda benim onayıma düşüyor, ben onaylayınca ise görüşme için Zoom linkleri otomatik olarak iki tarafla da paylaşılıyor. Gün ve saat geldiğinde ise Zoom'da buluşuyoruz. 
	 Bu noktada öğrencinin soracağı soruları bir PDF dosyasında toplamış olması çok önemli.
	 Çünkü bana ulaştırdığı PDF dosyası ile, hemen tabletten ekran paylaşarak soruları çözmeye başlıyorum. Bu sayede hiç zaman kaybetmeden soru çözmeye başlıyoruz, seansın başladığı ilk 10 dakikada öğrenci ücreti gönderiyor ve seans 45 dakika olacak şekilde sürüyor.	
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          • CV'me sayfanın üstündeki linkten ulaşabilirsiniz.<br/>
          • Güven esastır, bu yüzden ödeme seans başladıktan bir süre sonra alınacaktır.<br/>
          • Seans başlamadan PDF'in hazırlanmış olması zorunludur.<br/>
          • Her seans 45 dakikadır ve ücreti 500 TLdir.<br/>
          • Ödemeler banka havalesi veya EFT ile yapılabilir.<br/>
          • Ödeme seans başladıktan sonraki ilk 10 dakika içinde tahsil edilmezse, maalesef ki sonlandırılacaktır.

        </p>
      </div>
    </div>
  </div>
        
)}

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
              disabled={!studentName.trim() || !studentEmail.trim() || isBooking}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
>
              {isBooking ? (
                <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Rezervasyon Yapılıyor...
              </span>
              ) : (
                'Onayla'
              )}
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

      {/* Şifre Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              🔒 Öğretmen Girişi
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Öğretmen paneline erişmek için lütfen şifrenizi girin.
            </p>
            <input
              type="password"
              placeholder="Şifre"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Onay Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              ⚠️ Haftalık Reset
            </h2>
            <p className="text-gray-700 text-sm mb-2">
              Tüm slotları sıfırlamak üzeresiniz. Bu işlem:
            </p>
            <ul className="text-gray-600 text-sm mb-4 list-disc ml-5 space-y-1">
              <li>Tüm kapalı slotları müsait yapacak</li>
              <li><strong className="text-red-600">Gerçek rezervasyonları da silecek!</strong></li>
            </ul>
            <p className="text-red-600 font-semibold text-sm mb-4">
              Bu işlem geri alınamaz. Emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResetSchedule}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-all text-sm"
              >
                Evet, Sıfırla
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathClassScheduler;