const [schedule, setSchedule] = useState(() => {
    const createEmptySchedule = () => {
      const initial = {};
      weekdays.forEach(day => {
        initial[day] = {};
        timeSlots.forEach(time => {
          initial[day][time] = { status: 'available', studentName: '' };
        });
      });
      return initial;
    };
    
    const loadSchedule = async () => {
      try {
        // Mevcut hafta bilgisini al
        const currentWeekInfo = getWeekInfo();
        
        // Kayıtlı hafta numarasını kontrol et
        const weekResult = await window.storage.get('current-week', true);
        const savedWeek = weekResult ? weekResult.value : null;
        
        // Eğer yeni hafta başladıysa, schedule'ı sıfırla
        if (savedWeek !== currentWeekInfo.weekNumber) {
          console.log('Yeni hafta başladı, schedule sıfırlanıyor...');
          const emptySchedule = createEmptySchedule();
          
          // Yeni hafta numarasını ve boş schedule'ı kaydet
          await window.storage.set('current-week', currentWeekInfo.weekNumber, true);
          await window.storage.set('math-schedule', JSON.stringify(emptySchedule), true);
          
          return emptySchedule;
        }
        
        // Aynı haftadaysak, kayıtlı schedule'ı yükle
        const result = await window.storage.get('math-schedule', true);
        if (result && result.value) {
          return JSON.parse(result.value);
        }
      } catch (error) {
        console.log('Schedule yüklenirken hata:', error);
      }
      
      return createEmptySchedule();
    };
    
    // İlk başta boş schedule döndür
    const initial = createEmptySchedule();
    
    // Storage'dan asenkron olarak yükle
    loadSchedule().then(loaded => {
      if (loaded && JSON.stringify(loaded) !== JSON.stringify(initial)) {
        setSchedule(loaded);
      }
    });
    
    return initial;
  });