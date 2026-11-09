/* me/i18n.js — ভাষা ইঞ্জিন (১১টা ভাষা)
   ব্যবহার:  MOII18N.t('settings')   → বর্তমান ভাষার লেখা
             MOII18N.set('bn')         → ভাষা বদলে সেভ করে (localStorage: moi_lang)
             MOII18N.lang              → বর্তমান ভাষার কোড
   নতুন লেখা যোগ করতে: নিচের KEYS তালিকায় নাম বসান, তারপর প্রতিটা ভাষার তালিকায় ঠিক একই জায়গায় অনুবাদ বসান।
   ⚠️ এখন শুধু সেটিংস পেজের লেখা অনুবাদ করা আছে; বাকি পেজ চাইলে একইভাবে যোগ করা যাবে। */
(function(){
    'use strict';
    const LANGS = [
        { code: 'en', name: 'English' },
        { code: 'ar', name: 'اللغة العربية', rtl: true },
        { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'th', name: 'ภาษาไทย' },
        { code: 'vi', name: 'Tiếng việt' },
        { code: 'tr', name: 'Türkçe' },
        { code: 'pt', name: 'Português' },
        { code: 'bn', name: 'বাংলা' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'ru', name: 'Русский' },
        { code: 'es', name: 'Español' }
    ];
    const KEYS = ['settings', 'blacklist', 'language', 'clearChat', 'clearCache', 'deleteAccount', 'about', 'privacy', 'switching', 'signOut', 'theme',
        'save', 'cancel', 'confirm', 'unblock', 'noBlocked', 'confirmClearChat', 'chatCleared', 'cacheCleared', 'switchTitle', 'currentUse', 'addAccount',
        'cancelInfo', 'nickname', 'riskBtn', 'confirmDelete', 'version', 'saved', 'unblocked', 'themeLight', 'themeBlack', 'themePink'];
    const D = {
        en: ['Settings', 'Blacklist', 'Language', 'Clear Chat History', 'Clear Cache', 'Delete Account', 'About', 'Privacy Policy', 'Account Switching', 'Sign Out', 'Theme',
            'Save', 'Cancel', 'Confirm', 'Unblock', 'No blocked users', 'Clear all chat history? This cannot be undone.', 'Chat history cleared', 'Cache cleared', 'Tap the profile picture to switch accounts', 'Current Use', 'Add Account',
            'Cancel Account Information', 'Nickname', 'The risks are clear, apply for cancellation', 'Delete your account permanently?', 'Version', 'Language saved', 'Unblocked', 'White', 'Black', 'Pink'],
        ar: ['الإعدادات', 'القائمة السوداء', 'اللغة', 'مسح سجل الدردشة', 'مسح ذاكرة التخزين المؤقت', 'حذف الحساب', 'حول', 'سياسة الخصوصية', 'تبديل الحساب', 'تسجيل الخروج', 'المظهر',
            'حفظ', 'إلغاء', 'تأكيد', 'إلغاء الحظر', 'لا يوجد مستخدمون محظورون', 'هل تريد مسح كل سجل الدردشة؟ لا يمكن التراجع عن هذا.', 'تم مسح سجل الدردشة', 'تم مسح ذاكرة التخزين المؤقت', 'اضغط على الصورة الشخصية لتبديل الحساب', 'قيد الاستخدام', 'إضافة حساب',
            'معلومات إلغاء الحساب', 'الاسم المستعار', 'المخاطر واضحة، تقديم طلب الإلغاء', 'هل تريد حذف حسابك نهائيًا؟', 'الإصدار', 'تم حفظ اللغة', 'تم إلغاء الحظر', 'أبيض', 'أسود', 'وردي'],
        id: ['Pengaturan', 'Daftar Blokir', 'Bahasa', 'Hapus Riwayat Obrolan', 'Hapus Cache', 'Hapus Akun', 'Tentang', 'Kebijakan Privasi', 'Ganti Akun', 'Keluar', 'Tema',
            'Simpan', 'Batal', 'Konfirmasi', 'Buka Blokir', 'Tidak ada pengguna yang diblokir', 'Hapus semua riwayat obrolan? Tindakan ini tidak dapat dibatalkan.', 'Riwayat obrolan dihapus', 'Cache dihapus', 'Ketuk foto profil untuk ganti akun', 'Sedang Digunakan', 'Tambah Akun',
            'Informasi Pembatalan Akun', 'Nama Panggilan', 'Saya paham risikonya, ajukan pembatalan', 'Hapus akun Anda secara permanen?', 'Versi', 'Bahasa disimpan', 'Blokir dibuka', 'Putih', 'Hitam', 'Merah Muda'],
        th: ['การตั้งค่า', 'รายการบล็อก', 'ภาษา', 'ล้างประวัติแชท', 'ล้างแคช', 'ลบบัญชี', 'เกี่ยวกับ', 'นโยบายความเป็นส่วนตัว', 'สลับบัญชี', 'ออกจากระบบ', 'ธีม',
            'บันทึก', 'ยกเลิก', 'ยืนยัน', 'เลิกบล็อก', 'ไม่มีผู้ใช้ที่ถูกบล็อก', 'ล้างประวัติแชททั้งหมดหรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้', 'ล้างประวัติแชทแล้ว', 'ล้างแคชแล้ว', 'แตะรูปโปรไฟล์เพื่อสลับบัญชี', 'กำลังใช้งาน', 'เพิ่มบัญชี',
            'ข้อมูลการยกเลิกบัญชี', 'ชื่อเล่น', 'เข้าใจความเสี่ยงแล้ว ขอยกเลิกบัญชี', 'ลบบัญชีของคุณถาวรหรือไม่?', 'เวอร์ชัน', 'บันทึกภาษาแล้ว', 'เลิกบล็อกแล้ว', 'ขาว', 'ดำ', 'ชมพู'],
        vi: ['Cài đặt', 'Danh sách chặn', 'Ngôn ngữ', 'Xóa lịch sử trò chuyện', 'Xóa bộ nhớ đệm', 'Xóa tài khoản', 'Giới thiệu', 'Chính sách quyền riêng tư', 'Chuyển tài khoản', 'Đăng xuất', 'Giao diện',
            'Lưu', 'Hủy', 'Xác nhận', 'Bỏ chặn', 'Không có người dùng bị chặn', 'Xóa toàn bộ lịch sử trò chuyện? Không thể hoàn tác.', 'Đã xóa lịch sử trò chuyện', 'Đã xóa bộ nhớ đệm', 'Chạm vào ảnh đại diện để chuyển tài khoản', 'Đang dùng', 'Thêm tài khoản',
            'Thông tin hủy tài khoản', 'Biệt danh', 'Tôi đã hiểu rủi ro, yêu cầu hủy tài khoản', 'Xóa vĩnh viễn tài khoản của bạn?', 'Phiên bản', 'Đã lưu ngôn ngữ', 'Đã bỏ chặn', 'Trắng', 'Đen', 'Hồng'],
        tr: ['Ayarlar', 'Engellenenler', 'Dil', 'Sohbet Geçmişini Temizle', 'Önbelleği Temizle', 'Hesabı Sil', 'Hakkında', 'Gizlilik Politikası', 'Hesap Değiştir', 'Çıkış Yap', 'Tema',
            'Kaydet', 'İptal', 'Onayla', 'Engeli Kaldır', 'Engellenen kullanıcı yok', 'Tüm sohbet geçmişi silinsin mi? Bu işlem geri alınamaz.', 'Sohbet geçmişi temizlendi', 'Önbellek temizlendi', 'Hesap değiştirmek için profil resmine dokunun', 'Kullanımda', 'Hesap Ekle',
            'Hesap İptali Bilgileri', 'Takma Ad', 'Riskleri anladım, iptal talebinde bulun', 'Hesabınız kalıcı olarak silinsin mi?', 'Sürüm', 'Dil kaydedildi', 'Engel kaldırıldı', 'Beyaz', 'Siyah', 'Pembe'],
        pt: ['Configurações', 'Lista de bloqueio', 'Idioma', 'Limpar histórico de conversas', 'Limpar cache', 'Excluir conta', 'Sobre', 'Política de privacidade', 'Trocar de conta', 'Sair', 'Tema',
            'Salvar', 'Cancelar', 'Confirmar', 'Desbloquear', 'Nenhum usuário bloqueado', 'Limpar todo o histórico de conversas? Isso não pode ser desfeito.', 'Histórico de conversas limpo', 'Cache limpo', 'Toque na foto de perfil para trocar de conta', 'Em uso', 'Adicionar conta',
            'Informações de cancelamento da conta', 'Apelido', 'Entendi os riscos, solicitar cancelamento', 'Excluir sua conta permanentemente?', 'Versão', 'Idioma salvo', 'Desbloqueado', 'Branco', 'Preto', 'Rosa'],
        bn: ['সেটিংস', 'ব্লকলিস্ট', 'ভাষা', 'চ্যাট হিস্টরি মুছুন', 'ক্যাশ মুছুন', 'অ্যাকাউন্ট ডিলিট', 'সম্পর্কে', 'গোপনীয়তা নীতি', 'অ্যাকাউন্ট পরিবর্তন', 'সাইন আউট', 'থিম',
            'সেভ', 'বাতিল', 'নিশ্চিত করুন', 'আনব্লক', 'কোনো ব্লক করা ইউজার নেই', 'সব চ্যাট হিস্টরি মুছবেন? এটা আর ফেরানো যাবে না।', 'চ্যাট হিস্টরি মোছা হয়েছে', 'ক্যাশ মোছা হয়েছে', 'অ্যাকাউন্ট বদলাতে প্রোফাইল ছবিতে টিপ দিন', 'বর্তমানে ব্যবহার হচ্ছে', 'অ্যাকাউন্ট যোগ করুন',
            'অ্যাকাউন্ট বাতিলের তথ্য', 'ডাকনাম', 'ঝুঁকি বুঝেছি, বাতিলের আবেদন করুন', 'আপনার অ্যাকাউন্ট চিরতরে ডিলিট করবেন?', 'ভার্সন', 'ভাষা সেভ হয়েছে', 'আনব্লক করা হয়েছে', 'সাদা', 'কালো', 'গোলাপি'],
        hi: ['सेटिंग्स', 'ब्लॉकलिस्ट', 'भाषा', 'चैट हिस्ट्री साफ़ करें', 'कैश साफ़ करें', 'अकाउंट हटाएं', 'ऐप के बारे में', 'गोपनीयता नीति', 'अकाउंट बदलें', 'साइन आउट', 'थीम',
            'सहेजें', 'रद्द करें', 'पुष्टि करें', 'अनब्लॉक', 'कोई ब्लॉक किया गया यूज़र नहीं', 'सारी चैट हिस्ट्री साफ़ करें? इसे वापस नहीं किया जा सकता।', 'चैट हिस्ट्री साफ़ हो गई', 'कैश साफ़ हो गया', 'अकाउंट बदलने के लिए प्रोफ़ाइल फ़ोटो पर टैप करें', 'उपयोग में', 'अकाउंट जोड़ें',
            'अकाउंट रद्द करने की जानकारी', 'उपनाम', 'जोखिम समझ गया, रद्द करने का आवेदन करें', 'अपना अकाउंट हमेशा के लिए हटाएं?', 'वर्शन', 'भाषा सहेजी गई', 'अनब्लॉक किया गया', 'सफ़ेद', 'काला', 'गुलाबी'],
        ru: ['Настройки', 'Чёрный список', 'Язык', 'Очистить историю чатов', 'Очистить кэш', 'Удалить аккаунт', 'О приложении', 'Политика конфиденциальности', 'Смена аккаунта', 'Выйти', 'Тема',
            'Сохранить', 'Отмена', 'Подтвердить', 'Разблокировать', 'Нет заблокированных пользователей', 'Очистить всю историю чатов? Это действие нельзя отменить.', 'История чатов очищена', 'Кэш очищен', 'Нажмите на фото профиля, чтобы сменить аккаунт', 'Используется', 'Добавить аккаунт',
            'Информация об отмене аккаунта', 'Никнейм', 'Я осознаю риски, подать заявку на отмену', 'Удалить аккаунт навсегда?', 'Версия', 'Язык сохранён', 'Разблокировано', 'Белая', 'Чёрная', 'Розовая'],
        es: ['Ajustes', 'Lista de bloqueados', 'Idioma', 'Borrar historial de chat', 'Borrar caché', 'Eliminar cuenta', 'Acerca de', 'Política de privacidad', 'Cambiar de cuenta', 'Cerrar sesión', 'Tema',
            'Guardar', 'Cancelar', 'Confirmar', 'Desbloquear', 'No hay usuarios bloqueados', '¿Borrar todo el historial de chat? No se puede deshacer.', 'Historial de chat borrado', 'Caché borrada', 'Toca la foto de perfil para cambiar de cuenta', 'En uso', 'Añadir cuenta',
            'Información de cancelación de cuenta', 'Apodo', 'Entiendo los riesgos, solicitar la cancelación', '¿Eliminar tu cuenta de forma permanente?', 'Versión', 'Idioma guardado', 'Desbloqueado', 'Blanco', 'Negro', 'Rosa']
    };

    const get = () => { try { const l = localStorage.getItem('moi_lang'); if (l && D[l]) return l; } catch(e){} return 'en'; };
    const I18N = {
        LANGS, KEYS,
        get lang(){ return get(); },
        isRtl(){ const x = LANGS.find(l => l.code === get()); return !!(x && x.rtl); },
        nameOf(code){ const x = LANGS.find(l => l.code === (code || get())); return x ? x.name : 'English'; },
        t(key){
            const i = KEYS.indexOf(key); if (i < 0) return key;
            const L = D[get()] || D.en;
            return L[i] || D.en[i] || key;
        },
        set(code){
            if (!D[code]) return false;
            try { localStorage.setItem('moi_lang', code); } catch(e){}
            document.documentElement.setAttribute('lang', code);
            window.dispatchEvent(new CustomEvent('moi:lang', { detail: { lang: code } }));
            return true;
        }
    };
    document.documentElement.setAttribute('lang', get());
    window.MOII18N = I18N;
})();
