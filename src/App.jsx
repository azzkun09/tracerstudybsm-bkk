import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, Briefcase, FileX, FileCheck, 
  Search, LogOut, Building, User, Edit, 
  BarChart3, Calendar, GraduationCap, ArrowLeft,
  LayoutDashboard, Users as UsersIcon, Settings, Bell, Plus, Upload, Download, Activity,
  Database, Save, FileJson, Image as ImageIcon, ChevronDown, Sun, Moon, AlertCircle, Info, CheckCircle2,
  UserPlus, Printer, FileSpreadsheet, Trash2
} from 'lucide-react';

// --- FIREBASE INTEGRATION ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

// Konfigurasi Firebase Asli Milik Bapak (tracer-study-bkk)
// Tidak lagi menggunakan database sementara Canvas.
const firebaseConfig = {
  apiKey: "AIzaSyDuiEVi3xOOVKLM3XOB59B1gfciKFVnp40",
  authDomain: "tracer-study-bkk.firebaseapp.com",
  projectId: "tracer-study-bkk",
  storageBucket: "tracer-study-bkk.firebasestorage.app",
  messagingSenderId: "151657275377",
  appId: "1:151657275377:web:f1ad41daead4f5e9bdae50"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'tracer-study-bkk'; // ID Statis Permanen

// --- INITIAL DEFAULT DATA ---
const initialSettings = {
  id: 'default',
  schoolName: 'SMK Bina Siswa Mandiri',
  principalName: 'Bapak/Ibu Kepala Sekolah',
  logo: null 
};

// --- CUSTOM CSS ANIMATIONS ---
const customAnimations = `
  @keyframes slideUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes zoomIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes slideInRight { 0% { opacity: 0; transform: translateX(50px); } 100% { opacity: 1; transform: translateX(0); } }
  @keyframes blinkCursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } } 
  
  .anim-slide-up { animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  .anim-fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
  .anim-zoom-in { animation: zoomIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  .anim-blink { animation: blinkCursor 0.8s step-end infinite; } 
  .toast-enter { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .delay-100 { animation-delay: 100ms; } .delay-200 { animation-delay: 200ms; } .delay-300 { animation-delay: 300ms; }
`;

function useTypewriter(text, speed = 80, startDelay = 600) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayedText(''); 
    let intervalId;
    
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(intervalId);
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);
  
  return displayedText;
}

function CustomToast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  return (
    <div className="fixed top-6 right-6 z-[100] toast-enter select-none pointer-events-none">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md ${bgColors[type] || bgColors.info}`}>
        {icons[type] || icons.info}
        <span className="font-semibold text-sm">{message}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('public'); 
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState('light'); 

  const [toast, setToast] = useState(null); 
  const [authError, setAuthError] = useState(''); // State khusus error Firebase Bapak

  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [appSettings, setAppSettings] = useState(initialSettings);
  const [admins, setAdmins] = useState([{ username: 'admin', password: 'admin' }]); 
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // 1. Firebase Authentication Initialization
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
        if (isMounted) {
          setAuthError("KONEKSI DITOLAK: Mohon aktifkan fitur 'Anonymous' di menu Authentication Firebase Console Anda agar data bisa disimpan.");
          setIsLoadingDB(false);
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isMounted) {
        setUser(currentUser);
        setIsLoadingDB(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 2. Real-time Listeners (Firestore)
  useEffect(() => {
    if (!user) return; // Jika gagal auth, tidak memanggil database

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubStudents = onSnapshot(studentsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setStudents(data);
    }, (err) => { 
      console.error(err); 
      setAuthError("IZIN DATABASE DITOLAK: Pastikan Rules Firestore Anda diset ke mode Publik (Test Mode).");
    });

    const activitiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'activities');
    const unsubActivities = onSnapshot(activitiesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      data.sort((a, b) => b.timestamp - a.timestamp); 
      setActivities(data);
    }, (err) => console.error(err));

    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'appSettings');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppSettings(docSnap.data());
      } else {
        setAppSettings(initialSettings);
      }
    }, (err) => console.error(err));

    const adminsRef = collection(db, 'artifacts', appId, 'public', 'data', 'admins');
    const unsubAdmins = onSnapshot(adminsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      if (data.length > 0) {
        setAdmins(data);
      } else {
        setAdmins([{ username: 'admin', password: 'admin' }]);
      }
    }, (err) => console.error(err));

    return () => {
      unsubStudents();
      unsubActivities();
      unsubSettings();
      unsubAdmins();
    };
  }, [user]);

  // --- DATABASE WRITERS ---
  const addActivityToDB = async (message, type) => {
    if (!user) return;
    const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'activities', id), {
        id, message, type, time: new Date().toLocaleString('id-ID'), timestamp: Date.now()
      });
    } catch (e) { console.error(e); }
  };

  const addStudentToDB = async (studentData) => {
    if (!user) {
      showToast("Koneksi terputus. Data gagal disimpan.", "error"); return;
    }
    // PROTEKSI: { merge: true } mencegah penimpaan data antar user
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', studentData.nisn), studentData, { merge: true });
  };

  const saveSettingsToDB = async (newSettings) => {
    if (!user) {
      showToast("Koneksi terputus. Data gagal disimpan.", "error"); return;
    }
    // PROTEKSI: { merge: true } mencegah penimpaan data antar user
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'appSettings'), newSettings, { merge: true });
  };

  const addAdminToDB = async (adminData) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', adminData.username), adminData, { merge: true });
  };

  const deleteAdminFromDB = async (username) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'admins', username));
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- APP LOGIC ---
  const handleLogin = (username, password, role) => {
    if (role === 'admin') {
      const validAdmin = admins.find(a => a.username === username && a.password === password);
      if (validAdmin) {
        setCurrentUser({ role: 'admin', name: validAdmin.username });
        setView('admin');
        showToast("Berhasil login sebagai Admin", "success");
        return true;
      }
      return false;
    } else {
      const student = students.find(s => s?.nisn === username && s?.password === password);
      if (student) {
        setCurrentUser({ role: 'student', ...student });
        setView('student');
        showToast(`Selamat datang, ${student.nama}`, "success");
        return true;
      }
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('public');
    showToast("Anda telah keluar", "info");
  };

  const updateStudentData = async (updatedData) => {
    try {
      const finalData = { ...updatedData, isFilled: true };
      await addStudentToDB(finalData); 
      
      if (currentUser?.role === 'student') {
        setCurrentUser({ role: 'student', ...finalData });
        await addActivityToDB(`${finalData.nama} (${finalData.jurusan}) memperbarui datanya.`, 'update');
        showToast("Data pekerjaan berhasil disimpan!", "success");
      } else {
        await addActivityToDB(`Admin mengubah data ${finalData.nama}.`, 'system');
        showToast("Data alumni berhasil diperbarui.", "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan ke database cloud.", "error");
    }
  };

  if (isLoadingDB) {
    return (
      <div className={`${theme} min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b1120] transition-colors select-none`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Menginisiasi Firebase Firestore...</p>
        </div>
      </div>
    );
  }

  const safeStudents = students || [];
  const safeActivities = activities || [];
  const safeSettings = appSettings || initialSettings;

  return (
    <div className={`${theme} antialiased`}>
      <style>{customAnimations}</style>
      
      {/* SPANDUK PERINGATAN JIKA FIREBASE ERROR */}
      {authError && (
        <div className="bg-red-600 text-white p-3 text-center text-sm font-bold shadow-md z-50 relative flex justify-center items-center gap-2">
          <AlertCircle className="w-5 h-5" /> <span>{authError}</span>
        </div>
      )}

      {toast && <CustomToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="min-h-screen bg-slate-100 dark:bg-[#0b1120] text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-500/30 transition-colors duration-500 overflow-x-hidden">
        {view === 'public' && (
          <PublicLanding students={safeStudents} appSettings={safeSettings} theme={theme} toggleTheme={toggleTheme} onGoToLogin={() => setView('login')} />
        )}
        {view === 'login' && (
          <LoginScreen appSettings={safeSettings} theme={theme} toggleTheme={toggleTheme} onLogin={handleLogin} onBack={() => setView('public')} />
        )}
        {view === 'admin' && (
          <AdminDashboard 
            students={safeStudents} 
            activities={safeActivities}
            appSettings={safeSettings}
            admins={admins}
            theme={theme} toggleTheme={toggleTheme}
            onLogout={handleLogout} 
            onUpdateStudent={updateStudentData}
            onAddStudentDB={addStudentToDB}
            onAddActivityDB={addActivityToDB}
            onSaveSettingsDB={saveSettingsToDB}
            onAddAdminDB={addAdminToDB}
            onDeleteAdminDB={deleteAdminFromDB}
            showToast={showToast}
          />
        )}
        {view === 'student' && (
          <StudentForm student={currentUser} appSettings={safeSettings} theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} onSave={updateStudentData} showToast={showToast} />
        )}
      </div>
    </div>
  );
}

// ================= KOMPONEN HALAMAN PUBLIK =================
function PublicLanding({ students, appSettings, theme, toggleTheme, onGoToLogin }) {
  const [selectedYear, setSelectedYear] = useState('Semua');
  
  const years = useMemo(() => {
    return ['Semua', ...Array.from(new Set(students.map(s => s?.tahunLulus).filter(Boolean))).sort((a, b) => b - a)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (selectedYear === 'Semua') return students;
    return students.filter(s => s?.tahunLulus === selectedYear);
  }, [students, selectedYear]);

  const totalLulusan = filteredStudents.length;
  const sudahMengisi = filteredStudents.filter(s => s?.isFilled).length;
  const jurusanStats = useMemo(() => {
    const stats = { TKJ: 0, TKR: 0, MP: 0 };
    filteredStudents.filter(s => s?.isFilled).forEach(s => {
      if (s?.jurusan && stats[s.jurusan] !== undefined) stats[s.jurusan]++;
    });
    return stats;
  }, [filteredStudents]);

  const typedHeading = useTypewriter("Pantau Rekam Jejak", 80, 600);

  return (
    <div className="min-h-screen flex flex-col relative anim-fade-in">
      <nav className="fixed w-full top-0 z-50 bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-lg border-b border-slate-200/70 dark:border-white/10 shadow-sm shadow-slate-200/20 dark:shadow-none transition-all select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4 group cursor-default">
              {appSettings?.logo ? (
                <div className="bg-white/10 p-1 rounded-xl shadow-sm"><img src={appSettings.logo} alt="Logo" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" /></div>
              ) : (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">BKK Tracer Study</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{appSettings?.schoolName || 'BKK SMK'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <button onClick={onGoToLogin} className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 focus:outline-none">
                Masuk Portal
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 lg:pt-32 lg:pb-20 overflow-hidden bg-slate-900 dark:bg-black transition-colors duration-500 select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px] animate-pulse"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[250px] w-[250px] rounded-full bg-indigo-500 opacity-20 blur-[80px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center anim-slide-up delay-100 mt-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 leading-tight min-h-[90px] md:min-h-[140px] flex flex-col items-center justify-center">
            <span>
              {typedHeading}
              <span className="anim-blink text-blue-400 font-light opacity-80">|</span>
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mt-2">Karir Lulusan</span>
          </h2>

          <div className="flex items-center justify-center gap-4 mb-10">
             <div className="h-px w-10 md:w-24 bg-gradient-to-r from-transparent to-blue-500/50"></div>
             <span className="text-xs md:text-sm font-extrabold tracking-[0.3em] text-blue-200/80 uppercase">
               {appSettings?.schoolName || 'SMK BINA SISWA MANDIRI'}
             </span>
             <div className="h-px w-10 md:w-24 bg-gradient-to-l from-transparent to-blue-500/50"></div>
          </div>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-10 leading-relaxed cursor-text">
            Transparansi tingkat keterserapan alumni di dunia industri. Data real-time untuk terus meningkatkan kualitas pendidikan kami.
          </p>
          
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-xl">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-slate-200 font-medium">Data Tahun:</span>
            <div className="relative">
              <select 
                className="appearance-none bg-slate-800/50 text-white text-sm font-bold border border-white/10 cursor-pointer pl-4 pr-10 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map(y => <option key={y} value={y}>{y === 'Semua' ? 'Semua Angkatan' : `Angkatan ${y}`}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-20 w-full flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none flex items-center gap-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 anim-slide-up delay-200">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/20 dark:to-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Lulusan {selectedYear !== 'Semua' ? `Tahun ${selectedYear}` : ''}</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{totalLulusan} <span className="text-base font-semibold text-slate-400 dark:text-slate-500">Alumni</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none flex items-center gap-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 anim-slide-up delay-200">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/20 dark:to-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Terserap Dunia Kerja</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{sudahMengisi} <span className="text-base font-semibold text-slate-400 dark:text-slate-500">Bekerja</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-slide-up delay-300">
          <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-500/5 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-8 text-center w-full">Rasio Keterserapan</h3>
            <div className="relative w-44 h-44 mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="76" fill="transparent" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} strokeWidth="16" className="transition-colors" />
                <circle 
                  cx="88" cy="88" r="76" fill="transparent" stroke="url(#gradient-green)" strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${totalLulusan === 0 ? 0 : (sudahMengisi / totalLulusan) * 477} 477`}
                  className="transition-all duration-1000 ease-out drop-shadow-md"
                />
                <defs>
                  <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {totalLulusan === 0 ? 0 : Math.round((sudahMengisi / totalLulusan) * 100)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-[200px] font-medium">Persentase alumni yang telah mengonfirmasi bekerja.</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none lg:col-span-2 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 dark:bg-indigo-500/5 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Sebaran Kerja Berdasarkan Jurusan</h3>
            <div className="h-60 relative w-full">
              <SimpleBarChart data={jurusanStats} categories={['TKJ', 'TKR', 'MP']} theme={theme} />
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-slate-100/50 dark:bg-[#0b1120]/50 border-t border-slate-200/50 dark:border-white/5 py-8 text-center transition-colors">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">© {new Date().getFullYear()} BKK {appSettings?.schoolName || 'SMK'}. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}

// ================= KOMPONEN LOGIN =================
function LoginScreen({ appSettings, theme, toggleTheme, onLogin, onBack }) {
  const [role, setRole] = useState('student'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!onLogin(username, password, role)) {
      setError('Kredensial tidak valid. Silakan periksa kembali.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-[#0b1120] p-4 relative overflow-hidden transition-colors duration-500 anim-fade-in select-none">
      <div className="absolute top-4 right-6 z-20"><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-full max-w-[420px] mb-6 relative z-10 anim-slide-up delay-100">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>

      <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-2xl shadow-blue-900/5 dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] w-full max-w-[420px] relative z-10 anim-zoom-in delay-200">
        <div className="text-center mb-8">
          {appSettings?.logo ? (
            <div className="bg-white/50 dark:bg-slate-700/50 p-2 rounded-2xl inline-block mb-4 shadow-sm"><img src={appSettings.logo} alt="Logo" className="w-16 h-16 object-contain mx-auto drop-shadow-sm" /></div>
          ) : (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center mx-auto mb-5">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Portal Akses</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{appSettings?.schoolName || 'BKK SMK'}</p>
        </div>
        
        <div className="flex bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-xl mb-8 border border-slate-200/50 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => { setRole('student'); setError(''); setUsername(''); setPassword(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${role === 'student' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'}`}
          >
            Alumni
          </button>
          <button
            type="button"
            onClick={() => { setRole('admin'); setError(''); setUsername(''); setPassword(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${role === 'admin' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'}`}
          >
            Admin BKK
          </button>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm mb-6 text-center font-medium anim-fade-in">{error}</div>}
        
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 cursor-default">
              {role === 'student' ? 'Nomor NISN' : 'Username'}
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
              placeholder={role === 'student' ? "Masukkan NISN Anda" : "Ketik username admin"}
              value={username} onChange={(e) => setUsername(e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 cursor-default">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-white font-medium placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95">
            Masuk sebagai {role === 'student' ? 'Alumni' : 'Admin'}
          </button>
        </form>

        <div className="mt-8 text-sm text-center text-slate-400 dark:text-slate-500 font-medium">
          {role === 'admin' ? <p>Gunakan kredensial admin sistem Anda.</p> : <p>Default kredensial menggunakan NISN.</p>}
        </div>
      </div>
    </div>
  );
}

// ================= KOMPONEN DASHBOARD ADMIN =================
function AdminDashboard({ students, activities, appSettings, admins, theme, toggleTheme, onLogout, onUpdateStudent, onAddStudentDB, onAddActivityDB, onSaveSettingsDB, onAddAdminDB, onDeleteAdminDB, showToast }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState('Semua');
  const [filterJurusan, setFilterJurusan] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ nisn: '', nama: '', jurusan: 'TKJ', tahunLulus: new Date().getFullYear().toString() });
  const fileInputRef = useRef(null);
  
  const restoreFileRef = useRef(null);
  const [pendingRestoreData, setPendingRestoreData] = useState(null);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState({ username: '', password: '' });

  const [editingStudent, setEditingStudent] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  
  const [tempSettings, setTempSettings] = useState({});
  useEffect(() => {
    setTempSettings(appSettings || {});
  }, [appSettings]);

  const years = useMemo(() => {
    return ['Semua', ...Array.from(new Set((students || []).map(s => s?.tahunLulus).filter(Boolean))).sort((a, b) => b - a)];
  }, [students]);

  const filteredStudentsDashboard = useMemo(() => {
    if (!students) return [];
    if (selectedYear === 'Semua') return students;
    return students.filter(s => s?.tahunLulus === selectedYear);
  }, [students, selectedYear]);

  const filteredStudentsTable = useMemo(() => {
    if (!students) return [];
    return students.filter(s => {
      const matchYear = selectedYear === 'Semua' || s?.tahunLulus === selectedYear;
      const matchJurusan = filterJurusan === 'Semua' || s?.jurusan === filterJurusan;
      const matchSearch = String(s?.nama || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) || String(s?.nisn || '').includes(searchQuery || '');
      return matchYear && matchJurusan && matchSearch;
    });
  }, [students, selectedYear, filterJurusan, searchQuery]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if((students || []).find(s => s?.nisn === newStudentData.nisn)) { 
      showToast("NISN sudah terdaftar!", "error"); 
      return; 
    }
    try {
      const newStudent = {
        id: Date.now(), ...newStudentData, password: newStudentData.nisn,
        isFilled: false, email: '', noHp: '', namaPerusahaan: '', alamatPerusahaan: '', bidangUsaha: '', kontakPerusahaan: '', jabatan: '', statusKerja: '', tanggalMulai: '', gaji: ''
      };
      await onAddStudentDB(newStudent);
      await onAddActivityDB(`Menambahkan alumni baru: ${newStudent.nama}.`, 'system');
      setIsAddModalOpen(false);
      setNewStudentData({ nisn: '', nama: '', jurusan: 'TKJ', tahunLulus: new Date().getFullYear().toString() });
      showToast("Siswa berhasil ditambahkan!", "success");
    } catch (err) {
      showToast("Gagal menambah siswa ke database.", "error");
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      const importedStudents = [];
      for(let i=1; i<lines.length; i++) {
        if(!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        if(cols.length >= 4) {
          const nisn = cols[0].trim();
          if(!(students || []).find(s => s?.nisn === nisn) && !importedStudents.find(s => s?.nisn === nisn)) {
            importedStudents.push({
              id: Date.now() + i, nisn, password: nisn, nama: cols[1].trim(), jurusan: cols[2].trim(), tahunLulus: cols[3].trim(),
              isFilled: false, email: '', noHp: '', namaPerusahaan: '', alamatPerusahaan: '', bidangUsaha: '', kontakPerusahaan: '', jabatan: '', statusKerja: '', tanggalMulai: '', gaji: ''
            });
          }
        }
      }
      if(importedStudents.length > 0) {
        try {
          await Promise.all(importedStudents.map(s => onAddStudentDB(s)));
          await onAddActivityDB(`Mengimpor ${importedStudents.length} data alumni dari CSV.`, 'system');
          showToast(`Berhasil mengimpor ${importedStudents.length} data.`, "success");
        } catch (err) {
          showToast("Beberapa data gagal disimpan ke cloud.", "error");
        }
      } else showToast("Tidak ada data valid yang baru.", "info");
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,nisn,nama_lengkap,jurusan,tahun_lulus\n12345678,Budi Santoso,TKJ,2024\n87654321,Ani Suryani,MP,2024\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "template_alumni.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault(); 
    try {
      await onSaveSettingsDB(tempSettings);
      await onAddActivityDB(`Pengaturan profil diperbarui.`, 'system');
      showToast("Pengaturan tersimpan ke Database Firestore!", "success");
    } catch (err) {
      showToast("Gagal menyimpan ke database.", "error");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { showToast("Maksimal gambar 1MB.", "error"); return; }
      const reader = new FileReader();
      reader.onload = (evt) => setTempSettings({...tempSettings, logo: evt.target.result});
      reader.readAsDataURL(file);
    }
  };

  const handleBackupData = () => {
    const dataToBackup = { version: 'Firestore-1.0', timestamp: new Date().toISOString(), appSettings, students, activities };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToBackup))}`;
    const link = document.createElement("a"); link.href = jsonString; link.download = `backup_firestore_bkk_${new Date().getTime()}.json`; link.click();
    showToast("File backup berhasil diunduh.", "success");
  };

  const handleFileSelectRestore = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data && data.students && data.appSettings) {
           setPendingRestoreData(data); // Tampilkan modal konfirmasi custom
        } else showToast("Format file cadangan tidak valid.", "error");
      } catch (err) { showToast("Gagal membaca file JSON.", "error"); }
    };
    reader.readAsText(file);
    if(restoreFileRef.current) restoreFileRef.current.value = "";
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "NISN,Nama Lengkap,Jurusan,Tahun Lulus,Status Pengisian,Nama Perusahaan,Bidang Usaha,Alamat Perusahaan,Kontak Perusahaan,Jabatan,Status Kerja,Tanggal Mulai,Gaji\n";

    const escapeCSV = (str) => '"' + (str ? String(str).replace(/"/g, '""') : '') + '"';

    filteredStudentsTable.forEach(row => {
      const arr = [
        escapeCSV(row.nisn), escapeCSV(row.nama), escapeCSV(row.jurusan), escapeCSV(row.tahunLulus), 
        escapeCSV(row.isFilled ? "Lengkap" : "Belum Isi"),
        escapeCSV(row.namaPerusahaan), escapeCSV(row.bidangUsaha), escapeCSV(row.alamatPerusahaan),
        escapeCSV(row.kontakPerusahaan), escapeCSV(row.jabatan), escapeCSV(row.statusKerja), escapeCSV(row.tanggalMulai), escapeCSV(row.gaji)
      ];
      csvContent += arr.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const fileName = `Laporan Keterserapan Lulusan ${appSettings?.schoolName || 'SMK'}.csv`;
    link.setAttribute("download", fileName);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Data berhasil diekspor ke Excel (CSV)", "success");
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    let html = `
      <html>
        <head>
          <title>Laporan Keterserapan Lulusan ${appSettings?.schoolName || 'SMK'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f5; font-weight: bold; color: #000; }
            h2 { text-align: center; margin-bottom: 5px; line-height: 1.3; }
            .subtitle { text-align: center; margin-bottom: 20px; color: #555; }
          </style>
        </head>
        <body>
          <h2>Laporan Keterserapan Lulusan<br/>${appSettings?.schoolName || 'SMK'}</h2>
          <div class="subtitle">
            <strong>Tahun Kelulusan:</strong> ${selectedYear === 'Semua' ? 'Semua Angkatan' : selectedYear} | 
            <strong>Jurusan:</strong> ${filterJurusan === 'Semua' ? 'Semua Jurusan' : filterJurusan}
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>Nama Lengkap</th>
                <th>Jurusan</th>
                <th>Tahun</th>
                <th>Status</th>
                <th>Tempat Kerja</th>
                <th>Jabatan</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    filteredStudentsTable.forEach((row, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${row.nisn}</td>
          <td>${row.nama}</td>
          <td>${row.jurusan}</td>
          <td>${row.tahunLulus}</td>
          <td>${row.isFilled ? "Bekerja" : "Belum"}</td>
          <td>${row.namaPerusahaan || '-'}</td>
          <td>${row.jabatan || '-'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const confirmRestore = async () => {
    if(!pendingRestoreData) return;
    try {
      await onSaveSettingsDB(pendingRestoreData.appSettings);
      await Promise.all((pendingRestoreData.students || []).map(s => onAddStudentDB(s)));
      await onAddActivityDB(`Sistem direstore dari file cadangan lokal.`, 'system');
      
      showToast("Data berhasil direstore ke Cloud!", "success");
      setPendingRestoreData(null);
    } catch(err) {
      showToast("Terjadi kesalahan saat restore ke Cloud.", "error");
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100/50 dark:bg-[#0b1120] transition-colors anim-fade-in">
      
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#080d1a] text-slate-400 flex flex-col fixed inset-y-0 z-30 border-r border-white/5 select-none">
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-black/20">
          {appSettings?.logo ? (
            <div className="bg-white/10 p-1 rounded-xl mr-3 shadow-sm"><img src={appSettings.logo} alt="Logo" className="w-8 h-8 object-contain" /></div>
          ) : (
            <div className="bg-blue-600 p-1.5 rounded-xl mr-3"><GraduationCap className="w-5 h-5 text-white" /></div>
          )}
          <div>
            <span className="text-white font-bold text-base leading-tight block">Workspace</span>
            <span className="text-xs text-slate-500 block truncate w-36">{appSettings?.schoolName || 'BKK SMK'}</span>
          </div>
        </div>
        
        <div className="p-4 flex-grow flex flex-col gap-1.5 mt-2">
          <SidebarBtn icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarBtn icon={<UsersIcon />} label="Data Alumni" active={activeTab === 'alumni'} onClick={() => setActiveTab('alumni')} />
          <SidebarBtn icon={<UserPlus />} label="Manajemen Admin" active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} />
          <SidebarBtn icon={<Settings />} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 transition-colors font-medium group">
            <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen relative">
        <header className="h-20 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/5 shadow-sm flex items-center justify-between px-8 sticky top-0 z-20 transition-colors anim-fade-in select-none">
          <h2 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight capitalize animate-in slide-in-from-left-4 duration-500">
            {activeTab === 'dashboard' ? 'Overview' : activeTab === 'alumni' ? 'Manajemen Alumni' : activeTab === 'admins' ? 'Akun Admin' : 'Pengaturan Sistem'}
          </h2>
          
          <div className="flex items-center gap-5">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            {activeTab === 'dashboard' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm anim-zoom-in">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y === 'Semua' ? 'Semua Tahun' : `Lulusan ${y}`}</option>)}
                </select>
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 ring-2 ring-white dark:ring-slate-800 cursor-pointer hover:scale-105 transition-transform">
              AD
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] w-full">
          {activeTab === 'dashboard' && (
            <div className="anim-slide-up delay-100">
              <AdminStatsCards filteredStudents={filteredStudentsDashboard} />
              <AdminCharts filteredStudents={filteredStudentsDashboard} totalLulusan={filteredStudentsDashboard.length} theme={theme} />
              
              <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl rounded-3xl border border-slate-200/70 dark:border-white/5 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none mt-8 overflow-hidden anim-slide-up delay-300">
                <div className="p-6 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200/60 dark:border-white/5"><Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Log Aktivitas Cloud</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-500/20">
                     <Database className="w-3 h-3 animate-pulse" /> Firebase Firestore Aktif
                  </div>
                </div>
                <div className="divide-y divide-slate-100/60 dark:divide-white/5 max-h-[400px] overflow-y-auto">
                  {(activities || []).map(act => (
                    <div key={act.id} className="p-5 px-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex gap-4 items-start group">
                      <div className={`p-2.5 rounded-2xl mt-0.5 ${act.type === 'system' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'} group-hover:scale-110 transition-transform`}>
                        {act.type === 'system' ? <Settings className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.message}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{act.time}</p>
                      </div>
                    </div>
                  ))}
                  {(!activities || activities.length === 0) && <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">Belum ada aktivitas di Cloud Database.</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alumni' && (
            <div className="anim-slide-up delay-100">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari Nama / NISN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2.5 w-full sm:w-72 bg-white dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none font-medium text-slate-800 dark:text-slate-200 transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto select-none">
                    <select className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none cursor-pointer shadow-sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                      {years.map(y => <option key={y} value={y}>{y === 'Semua' ? 'Sem. Tahun' : `Angkatan ${y}`}</option>)}
                    </select>
                    <select className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none cursor-pointer shadow-sm" value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)}>
                      <option value="Semua">Sem. Jurusan</option><option value="TKJ">TKJ</option><option value="TKR">TKR</option><option value="MP">MP</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full xl:w-auto select-none">
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
                  
                  {/* Export Buttons */}
                  <button onClick={exportToExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition shadow-sm">
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                  <button onClick={exportToPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition shadow-sm">
                    <Printer className="w-4 h-4" /> Cetak PDF
                  </button>

                  <div className="hidden sm:block w-px bg-slate-200 dark:bg-slate-700 mx-1 my-1"></div>

                  <button onClick={downloadTemplate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
                    <Download className="w-4 h-4" /> Template
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition shadow-sm">
                    <Upload className="w-4 h-4" /> Import CSV
                  </button>
                  <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-md hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Tambah Manual
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl rounded-3xl border border-slate-200/70 dark:border-white/5 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none overflow-hidden anim-slide-up delay-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5">
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px]">NISN</th>
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px]">Nama Lengkap</th>
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px]">Jurusan</th>
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px]">Status Data</th>
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px] text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {filteredStudentsTable.map((siswa) => (
                        <tr key={siswa.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">{siswa?.nisn}</td>
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{siswa?.nama}</td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-bold">{siswa?.jurusan}</span>
                          </td>
                          <td className="py-4 px-6">
                            {siswa?.isFilled ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Lengkap
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Belum Isi
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button onClick={() => setEditingStudent(siswa)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all" title="Edit Data">
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredStudentsTable.length === 0 && (
                        <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/50">Tidak ada data alumni ditemukan.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="anim-slide-up delay-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 select-none">
                <div>
                  <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white">Manajemen Akun Admin</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Kelola akun yang memiliki hak akses penuh ke sistem ini.</p>
                </div>
                <button onClick={() => { setAdminFormData({username:'', password:''}); setEditingAdmin(null); setIsAdminModalOpen(true); }} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <UserPlus className="w-4 h-4" /> Tambah Admin Baru
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl rounded-3xl border border-slate-200/70 dark:border-white/5 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 select-none">
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px]">Username</th>
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px]">Password</th>
                        <th className="py-4 px-6 font-bold uppercase tracking-wider text-[11px] text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {(admins || []).map((admin) => (
                        <tr key={admin.username} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{admin.username}</td>
                          <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400 tracking-widest">••••••••</td>
                          <td className="py-4 px-6 text-right select-none">
                            <button onClick={() => { setAdminFormData({username: admin.username, password: admin.password}); setEditingAdmin(admin.username); setIsAdminModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all mr-2" title="Edit Password">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={async () => {
                              if(admins.length <= 1) {
                                showToast("Tidak bisa menghapus akun admin terakhir!", "error");
                                return;
                              }
                              if(window.confirm(`Yakin ingin menghapus admin ${admin.username}?`)) {
                                await onDeleteAdminDB(admin.username);
                                onAddActivityDB(`Admin ${admin.username} telah dihapus.`, 'system');
                                showToast("Akun admin berhasil dihapus", "success");
                              }
                            }} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all" title="Hapus Admin">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl anim-slide-up delay-100">
              <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl rounded-3xl border border-slate-200/70 dark:border-white/5 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none mb-8 overflow-hidden">
                <div className="p-6 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 flex gap-3 items-center select-none">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200/60 dark:border-white/5"><Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Profil Instansi (Cloud Config)</h3>
                </div>
                <form onSubmit={handleSaveSettings} className="p-8 space-y-8">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Nama Sekolah / Instansi" name="schoolName" value={tempSettings?.schoolName || ''} onChange={e => setTempSettings({...tempSettings, schoolName: e.target.value})} required />
                    <FormInput label="Nama Kepala Sekolah" name="principalName" value={tempSettings?.principalName || ''} onChange={e => setTempSettings({...tempSettings, principalName: e.target.value})} required />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">Logo Sekolah</label>
                    <div className="flex items-center gap-6 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden relative group">
                        {tempSettings?.logo ? (
                          <img src={tempSettings.logo} alt="Preview Logo" className="w-full h-full object-contain p-2" />
                        ) : <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />}
                      </div>
                      <div>
                        <input type="file" accept="image/*" id="logo-upload" onChange={handleLogoChange} className="hidden" />
                        <label htmlFor="logo-upload" className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm inline-block transition-all hover:border-slate-300 select-none">
                          Pilih Gambar Baru
                        </label>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium select-none">Format: PNG transparan, maks 1MB.</p>
                        {tempSettings?.logo && <button type="button" onClick={() => setTempSettings({...tempSettings, logo: null})} className="text-xs text-red-500 dark:text-red-400 font-bold hover:underline mt-1.5 block select-none">Hapus Logo Saat Ini</button>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md hover:-translate-y-0.5 active:scale-95 select-none">
                      <Save className="w-4 h-4" /> Simpan & Sinkronisasi
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl rounded-3xl border border-slate-200/70 dark:border-white/5 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none overflow-hidden anim-slide-up delay-200">
                <div className="p-6 border-b border-slate-200/60 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 flex gap-3 items-center select-none">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200/60 dark:border-white/5"><Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Keamanan Data (Backup Lokal)</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 border border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4 text-blue-700 dark:text-blue-400 font-extrabold text-lg select-none">
                      <div className="bg-blue-50 dark:bg-blue-500/10 p-2 rounded-xl"><Download className="w-5 h-5" /></div> Export Data
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">Unduh seluruh profil, data alumni, dan riwayat sistem ke format aman JSON. Lakukan pencadangan secara berkala.</p>
                    <button onClick={handleBackupData} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition select-none">
                      <FileJson className="w-4 h-4" /> Unduh Cadangan JSON
                    </button>
                  </div>

                  <div className="p-6 border border-orange-100 dark:border-orange-500/20 rounded-2xl bg-orange-50/30 dark:bg-orange-500/5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4 text-orange-700 dark:text-orange-400 font-extrabold text-lg select-none">
                      <div className="bg-orange-100/50 dark:bg-orange-500/10 p-2 rounded-xl"><Upload className="w-5 h-5" /></div> Restore Data
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">Kembalikan data dari file cadangan. <span className="text-orange-600 dark:text-orange-400 font-bold">Peringatan:</span> Data cloud saat ini akan ditimpa.</p>
                    <input type="file" accept=".json" ref={restoreFileRef} onChange={handleFileSelectRestore} className="hidden" />
                    <button onClick={() => restoreFileRef.current?.click()} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-orange-600 dark:bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-700 transition shadow-md select-none">
                      <Upload className="w-4 h-4" /> Import Cadangan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Modals Admin */}
        
        {/* Modal Konfirmasi Restore */}
        {pendingRestoreData && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] anim-fade-in select-none">
             <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center anim-zoom-in border border-white/10">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Tindakan Berbahaya</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Anda akan menimpa seluruh data Database Cloud dengan file cadangan lokal ini. Tindakan ini tidak dapat dibatalkan. Lanjutkan?</p>
                <div className="flex gap-4">
                   <button onClick={() => setPendingRestoreData(null)} className="flex-1 px-6 py-3 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">Batal</button>
                   <button onClick={confirmRestore} className="flex-1 px-6 py-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md hover:shadow-lg">Ya, Timpa Data</button>
                </div>
             </div>
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 anim-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden anim-zoom-in">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center select-none">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Tambah Data Siswa</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="bg-white dark:bg-slate-800 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105">
                  <FileX className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-8 space-y-5">
                <FormInput label="Nomor NISN" name="nisn" value={newStudentData.nisn} onChange={e => setNewStudentData({...newStudentData, nisn: e.target.value})} required placeholder="Ex: 00456213" />
                <FormInput label="Nama Lengkap" name="nama" value={newStudentData.nama} onChange={e => setNewStudentData({...newStudentData, nama: e.target.value})} required />
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Jurusan</label>
                  <select name="jurusan" value={newStudentData.jurusan} onChange={e => setNewStudentData({...newStudentData, jurusan: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white shadow-sm">
                    <option value="TKJ">Teknik Komputer & Jaringan (TKJ)</option>
                    <option value="TKR">Teknik Kendaraan Ringan (TKR)</option>
                    <option value="MP">Manajemen Perkantoran (MP)</option>
                  </select>
                </div>
                <FormInput label="Tahun Kelulusan" type="number" name="tahunLulus" value={newStudentData.tahunLulus} onChange={e => setNewStudentData({...newStudentData, tahunLulus: e.target.value})} required />
                
                <div className="pt-6 mt-4 flex gap-3 justify-end select-none">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Batal</button>
                  <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95">Simpan Data</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Tambah/Edit Admin */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 anim-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden anim-zoom-in">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center select-none">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{editingAdmin ? 'Perbarui Password Admin' : 'Tambah Admin Baru'}</h2>
                <button onClick={() => setIsAdminModalOpen(false)} className="bg-white dark:bg-slate-800 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105">
                  <FileX className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await onAddAdminDB(adminFormData);
                  onAddActivityDB(editingAdmin ? `Password admin ${adminFormData.username} diperbarui.` : `Akun admin baru ${adminFormData.username} ditambahkan.`, 'system');
                  showToast(editingAdmin ? "Password berhasil diubah!" : "Admin berhasil ditambahkan!", "success");
                  setIsAdminModalOpen(false);
                } catch(err) {
                  showToast("Gagal menyimpan akun admin", "error");
                }
              }} className="p-8 space-y-5">
                <FormInput label="Username Admin" name="username" value={adminFormData.username} onChange={e => setAdminFormData({...adminFormData, username: e.target.value})} required disabled={!!editingAdmin} placeholder="Masukkan username unik" />
                <FormInput label="Password (Isikan teks saja)" name="password" value={adminFormData.password} onChange={e => setAdminFormData({...adminFormData, password: e.target.value})} required placeholder="Minimal 6 karakter" />
                
                <div className="pt-6 mt-4 flex gap-3 justify-end select-none">
                  <button type="button" onClick={() => setIsAdminModalOpen(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Batal</button>
                  <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95">Simpan Akun</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingStudent && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 anim-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 anim-zoom-in">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md z-10 select-none">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Perbarui Status Alumni</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Siswa: {editingStudent?.nama || '-'}</p>
                </div>
                <button onClick={() => setEditingStudent(null)} className="bg-white dark:bg-slate-800 p-2.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105">
                  <FileX className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8">
                 <StudentFormContent 
                    student={editingStudent} 
                    onSave={async (data) => {
                      await onUpdateStudent(data);
                      setEditingStudent(null);
                    }} 
                    onCancel={() => setEditingStudent(null)}
                 />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Sidebar Button Helper
function SidebarBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm select-none ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
      {React.cloneElement(icon, { className: 'w-5 h-5' })} {label}
    </button>
  );
}

// Theme Toggle Button Widget
function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button 
      onClick={toggleTheme} 
      className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-amber-400 transition-all hover:scale-110 select-none"
      title="Ubah Tema Warna"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}

// Stats Cards Admin
function AdminStatsCards({ filteredStudents }) {
  const t = (filteredStudents || []).length;
  const s = (filteredStudents || []).filter(st => st?.isFilled).length;
  const b = t - s;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 anim-slide-up delay-100">
      <StatCard icon={<Users />} title="Total Lulusan" value={t} color="blue" />
      <StatCard icon={<FileCheck />} title="Telah Mengisi" value={s} color="green" />
      <StatCard icon={<FileX />} title="Belum Merespon" value={b} color="orange" />
      <StatCard icon={<Briefcase />} title="Terserap Industri" value={s} color="indigo" />
    </div>
  );
}

function AdminCharts({ filteredStudents, totalLulusan, theme }) {
  const sudahMengisi = (filteredStudents || []).filter(s => s?.isFilled).length;
  const jurusanStats = useMemo(() => {
    const stats = { TKJ: 0, TKR: 0, MP: 0 };
    (filteredStudents || []).filter(s => s?.isFilled).forEach(s => {
      if (s?.jurusan && stats[s.jurusan] !== undefined) stats[s.jurusan]++;
    });
    return stats;
  }, [filteredStudents]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-slide-up delay-200">
      <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none lg:col-span-1">
        <h3 className="font-extrabold text-slate-900 dark:text-white mb-8 text-center">Partisipasi Tracer</h3>
        <div className="flex justify-center items-center h-44">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="64" fill="transparent" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} strokeWidth="14" className="transition-colors" />
              <circle 
                cx="72" cy="72" r="64" fill="transparent" stroke="#3b82f6" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${totalLulusan === 0 ? 0 : (sudahMengisi / totalLulusan) * 402} 402`}
                className="transition-all duration-1000 ease-out drop-shadow-sm"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{totalLulusan === 0 ? 0 : Math.round((sudahMengisi / totalLulusan) * 100)}%</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-8 text-sm font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Selesai</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600"></div> Pending</div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-8 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none lg:col-span-2">
        <h3 className="font-extrabold text-slate-900 dark:text-white mb-4">Serapan Industri Berdasarkan Jurusan</h3>
        <div className="h-52 relative w-full">
          <SimpleBarChart data={jurusanStats} categories={['TKJ', 'TKR', 'MP']} theme={theme} />
        </div>
      </div>
    </div>
  );
}

// ================= KOMPONEN FORM SISWA =================
function StudentForm({ student, appSettings, theme, toggleTheme, onLogout, onSave, showToast }) {
  return (
    <div className="min-h-screen bg-slate-100/50 dark:bg-[#0b1120] flex flex-col transition-colors duration-500 anim-fade-in">
      <nav className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/5 shadow-sm sticky top-0 z-50 transition-colors select-none">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              {appSettings?.logo ? (
                <div className="bg-white/50 dark:bg-slate-800 p-1 rounded-xl shadow-sm"><img src={appSettings.logo} alt="Logo" className="w-8 h-8 object-contain drop-shadow-sm" /></div>
              ) : (
                <div className="bg-blue-600 p-2 rounded-xl"><GraduationCap className="text-white w-6 h-6" /></div>
              )}
              <span className="font-extrabold text-lg text-slate-900 dark:text-white hidden sm:block">Alumni Workspace</span>
            </div>
            <div className="flex items-center gap-5">
               <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
               <span className="text-sm font-bold text-slate-600 dark:text-slate-300 hidden sm:block bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full">{student?.nama || 'Siswa'}</span>
               <button onClick={onLogout} className="text-sm text-red-500 font-bold hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2 rounded-full transition-colors">Keluar Sistem</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full anim-slide-up delay-100">
        {!student?.isFilled ? (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 p-5 rounded-2xl mb-8 flex gap-4 items-start shadow-sm">
            <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-full mt-0.5"><FileX className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
            <div>
              <h4 className="font-extrabold text-lg text-amber-900 dark:text-amber-300">Pembaruan Data Diperlukan</h4>
              <p className="text-sm mt-1 font-medium leading-relaxed opacity-90">Mohon luangkan waktu 2 menit untuk melengkapi data karir Anda saat ini. Data ini membantu BKK {appSettings?.schoolName || 'SMK'} dalam sinkronisasi database cloud kami.</p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-5 rounded-2xl mb-8 flex gap-4 items-start shadow-sm">
            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-full mt-0.5"><FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <h4 className="font-extrabold text-lg text-emerald-900 dark:text-emerald-300">Profil Tersimpan di Cloud</h4>
              <p className="text-sm mt-1 font-medium leading-relaxed opacity-90">Terima kasih telah berpartisipasi. Anda dapat terus memperbarui form ini jika terdapat perubahan status atau tempat kerja di masa depan.</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none border border-slate-200/70 dark:border-white/5 p-8 sm:p-12">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Formulir Tracer Study</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Pastikan data diisi sesuai dengan kondisi nyata saat ini.</p>
          </div>
          <StudentFormContent student={student} onSave={onSave} />
        </div>
      </div>
    </div>
  );
}

function StudentFormContent({ student, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...(student || {}) });

  // PERBAIKAN BUG CACHE (Data Siswa): Sync ulang data jika prop 'student' berubah dari luar
  useEffect(() => {
    setFormData({ ...(student || {}) });
  }, [student]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* 1: Biodata */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
        <div className="flex items-center gap-3 mb-6 text-blue-600 dark:text-blue-400 select-none">
          <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-xl"><User className="w-5 h-5" /></div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Identitas Diri</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput label="Nama Lengkap" name="nama" value={formData?.nama || ''} onChange={handleChange} required />
          <FormInput label="Nomor NISN" name="nisn" value={formData?.nisn || ''} disabled={true} bg="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold" />
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 select-none">Jurusan</label>
            <select name="jurusan" value={formData?.jurusan || 'TKJ'} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white shadow-sm">
              <option value="TKJ">Teknik Komputer & Jaringan (TKJ)</option>
              <option value="TKR">Teknik Kendaraan Ringan (TKR)</option>
              <option value="MP">Manajemen Perkantoran (MP)</option>
            </select>
          </div>
          <FormInput label="Tahun Kelulusan" name="tahunLulus" value={formData?.tahunLulus || ''} onChange={handleChange} type="number" required />
          <FormInput label="No. Handphone / WhatsApp" name="noHp" value={formData?.noHp || ''} onChange={handleChange} required />
          <FormInput label="Alamat Email Pribadi" name="email" value={formData?.email || ''} onChange={handleChange} type="email" />
        </div>
      </div>

      {/* 2: Tempat Kerja */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
        <div className="flex items-center gap-3 mb-6 text-indigo-600 dark:text-indigo-400 select-none">
          <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-xl"><Building className="w-5 h-5" /></div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Data Tempat Kerja</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput label="Nama Perusahaan / Instansi" name="namaPerusahaan" value={formData?.namaPerusahaan || ''} onChange={handleChange} required />
          <FormInput label="Sektor / Bidang Usaha (Ex: Retail, IT)" name="bidangUsaha" value={formData?.bidangUsaha || ''} onChange={handleChange} required />
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 select-none">Alamat Lengkap Perusahaan</label>
            <textarea name="alamatPerusahaan" value={formData?.alamatPerusahaan || ''} onChange={handleChange} rows="2" className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white shadow-sm resize-none" required></textarea>
          </div>
          <FormInput label="Kontak Perusahaan (HRD/No.Telp)" name="kontakPerusahaan" value={formData?.kontakPerusahaan || ''} onChange={handleChange} />
        </div>
      </div>

      {/* 3: Pekerjaan */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
        <div className="flex items-center gap-3 mb-6 text-emerald-600 dark:text-emerald-400 select-none">
          <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-xl"><Briefcase className="w-5 h-5" /></div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Spesifikasi Jabatan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput label="Posisi / Jabatan Anda" name="jabatan" value={formData?.jabatan || ''} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 select-none">Status Karyawan</label>
            <select name="statusKerja" value={formData?.statusKerja || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white shadow-sm" required>
              <option value="" disabled hidden>-- Pilih Status --</option>
              <option value="Tetap">Karyawan Tetap (PKWTT)</option><option value="Kontrak">Karyawan Kontrak (PKWT)</option>
              <option value="Freelance">Freelance / Harian</option><option value="Magang">Magang / Praktikan</option>
            </select>
          </div>
          <FormInput label="Tanggal Mulai Bekerja" name="tanggalMulai" value={formData?.tanggalMulai || ''} onChange={handleChange} type="date" required />
          <FormInput label="Estimasi Gaji Bulanan (Opsional)" name="gaji" value={formData?.gaji || ''} onChange={handleChange} type="number" placeholder="Ex: 4500000" />
        </div>
      </div>

      <div className="pt-6 flex gap-4 justify-end select-none">
        {onCancel && <button type="button" onClick={onCancel} className="px-8 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal Edit</button>}
        <button type="submit" className="px-10 py-3.5 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 active:scale-95">Simpan Data Karir</button>
      </div>
    </form>
  );
}

// ================= KUMPULAN UI COMPONENT KECIL =================
function StatCard({ icon, title, value, color }) {
  const c = {
    blue: 'from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
    green: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    orange: 'from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
    indigo: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-500/10 dark:to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-7 rounded-3xl border border-slate-200/70 dark:border-white/10 shadow-[0_10px_40px_rgb(0,0,0,0.08)] dark:shadow-none hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group select-none">
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl bg-gradient-to-br border ${c[color]} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
        <div>
          <p className="text-sm font-bold text-slate-400 mb-0.5 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, name, value, onChange, type = "text", required = false, disabled = false, bg = "bg-white dark:bg-slate-900/50", placeholder="" }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 select-none">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type} name={name} value={value || ''} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder}
        className={`w-full px-4 py-3 border border-slate-300/60 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 dark:text-white shadow-sm placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 ${bg} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      />
    </div>
  );
}

function SimpleBarChart({ data, categories, theme }) {
  const maxVal = Math.max(...categories.map(c => data[c]), 1);
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500'];

  return (
    <div className="flex items-end h-full gap-6 sm:gap-16 px-4 sm:px-12 relative w-full pt-8 pb-4 select-none">
      <div className="absolute inset-0 flex flex-col justify-between pb-10 z-0">
        {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-b border-slate-200/80 dark:border-slate-700/50 border-dashed transition-colors"></div>)}
      </div>

      {categories.map((cat, idx) => {
        const count = data[cat] || 0;
        const height = `${(count / maxVal) * 100}%`;

        return (
          <div key={cat} className="flex flex-col items-center flex-1 h-full justify-end group z-10">
            <div className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 mb-3 text-xs sm:text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap relative">
              {count} Siswa
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45"></div>
            </div>
            <div 
              style={{ height: height === '0%' ? '6px' : height }} 
              className={`w-full max-w-[70px] sm:max-w-[90px] ${colors[idx % colors.length]} rounded-t-2xl transition-all duration-1000 ease-out shadow-lg hover:brightness-110 cursor-pointer`}
            ></div>
            <span className="text-sm font-extrabold mt-4 text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-700/50 px-3 py-1 rounded-lg transition-colors">{cat}</span>
          </div>
        );
      })}
    </div>
  );
}