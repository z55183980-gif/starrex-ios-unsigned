import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import enUS from './en-US'
import viVN from './vi-VN'
import thTH from './th-TH'
import jaJP from './ja-JP'
import koKR from './ko-KR'
import idID from './id-ID'
import msMY from './ms-MY'
import hiIN from './hi-IN'
import esES from './es-ES'
import ptBR from './pt-BR'

const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
  'vi-VN': viVN,
  'th-TH': thTH,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'id-ID': idID,
  'ms-MY': msMY,
  'hi-IN': hiIN,
  'es-ES': esES,
  'pt-BR': ptBR
}

// 首页、游戏大厅及会员中心共用文案。旧语言包缺少这些新页面键时，
// 在注册阶段补齐这些键，确保非中文语言不会因缺失翻译而夹杂简体中文。
const sharedPageMessages = {
  'zh-TW': {
    home: { hall: '遊戲大廳', languageSettings: '語言設定', categories: '遊戲分類', quickAccess: '快捷入口', freeRegister: '免費註冊', fastDeposit: '快速存款', promotionHall: '優惠大廳', appDownload: '下載 APP', platformShowcase: '全球頂級娛樂平台一應俱全', platformShowcaseSub: '全球頂級娛樂平台', qualityService: '優質服務 極致體驗', qualityServiceSub: '優質服務體驗', activityTasks: '優惠活動', swipeForMore: '滑動查看更多', gameCount: '{count} 款遊戲', sportIntro: '更多投注類型、精彩賽事、特別投注與豐富玩法一應俱全！', esportIntro: '即時掌握熱門電競資訊、賽事消息與比賽焦點。', liveIntro: '平台穩定、管理專業，提供直覺流暢的真人遊戲體驗。', cookieNotice: '繼續使用本網站即表示您同意我們使用必要的 Cookie 改善使用體驗。', copyright: '版權所有', platformDescription: '匯聚全球頂級遊戲平台，畫質高清、玩法豐富。', services: { speed: '極速體驗', speedDesc: '專屬網路優化', secure: '安全放心', secureDesc: '128 位元加密技術', freeFee: '免手續費', freeFeeDesc: '免除所有手續費', alwaysOn: '全天候服務', alwaysOnDesc: '全年 24 小時服務' } },
    game: { mini: '小遊戲', special: '特色遊戲', hall: '大廳', platformFilter: '平台篩選', gameFilter: '遊戲篩選', switchLoading: '切換中', scrollForMore: '向下捲動載入更多', noRelatedGames: '沒有符合的遊戲', enterGame: '進入遊戲', sportGame: '體育遊戲', lotteryGame: '彩票遊戲', esportGame: '電子競技', liveGame: '真人視訊', sportPlatform: '體育平台', livePlatform: '真人平台', esportPlatform: '電競平台', sportSuffix: '體育', lotterySuffix: '彩票', esportSuffix: '電競', moreGames: '更多遊戲', featuredPlatforms: '精選遊戲平台', gameNumber: '遊戲 {number}' },
    account: { withdraw: '提款', deposit: '存款', interest: '利息寶', recoverBalance: '找回餘額', myRecords: '我的紀錄', recordsSummary: '明細、投注、報表', withdrawManage: '提款管理', shareSlogan: '分享即可賺取更多', language: '選擇語言', faq: '常見問題', feedback: '有獎回饋', loginDevices: '登入裝置', safeLogout: '安全登出', languageChanged: '語言已切換', nextVipTip: '距離 VIP {level} 還需投注 {amount}', upgradeBet: '晉級再投注', loggingOut: '登出中...', selectImage: '請選擇圖片檔案', imageTooLarge: '圖片大小不可超過 2MB', uploading: '上傳中...', avatarUpdated: '頭像已更新', uploadFailed: '上傳失敗' }
  },
  'vi-VN': {
    home: { hall: 'Sảnh trò chơi', languageSettings: 'Ngôn ngữ', categories: 'Danh mục trò chơi', quickAccess: 'Truy cập nhanh', freeRegister: 'Đăng ký miễn phí', fastDeposit: 'Nạp tiền nhanh', promotionHall: 'Khuyến mãi', appDownload: 'Tải ứng dụng', platformShowcase: 'Nền tảng giải trí hàng đầu thế giới', platformShowcaseSub: 'Nền tảng giải trí hàng đầu', qualityService: 'Dịch vụ cao cấp, trải nghiệm tuyệt vời', qualityServiceSub: 'Trải nghiệm dịch vụ chất lượng', activityTasks: 'Khuyến mãi', swipeForMore: 'Vuốt để xem thêm', gameCount: '{count} trò chơi', sportIntro: 'Nhiều lựa chọn cược, sự kiện hấp dẫn và trải nghiệm thể thao trọn vẹn.', esportIntro: 'Cập nhật tin tức, giải đấu và điểm nhấn Esports mới nhất.', liveIntro: 'Nền tảng ổn định, quản lý chuyên nghiệp và trải nghiệm trực quan.', cookieNotice: 'Khi tiếp tục sử dụng trang web, bạn đồng ý cho phép dùng cookie thiết yếu để cải thiện trải nghiệm.', copyright: 'Đã đăng ký bản quyền', platformDescription: 'Trải nghiệm các nền tảng hàng đầu với hình ảnh chất lượng cao và nhiều trò chơi.', services: { speed: 'Siêu nhanh', speedDesc: 'Tối ưu mạng độc quyền', secure: 'An toàn', secureDesc: 'Mã hóa 128-bit', freeFee: 'Không phí', freeFeeDesc: 'Miễn mọi phí giao dịch', alwaysOn: 'Hỗ trợ 24/7', alwaysOnDesc: 'Phục vụ quanh năm' } },
    game: { mini: 'Trò chơi nhỏ', special: 'Trò chơi nổi bật', hall: 'Sảnh', platformFilter: 'Lọc nền tảng', gameFilter: 'Lọc trò chơi', switchLoading: 'Đang chuyển', scrollForMore: 'Cuộn xuống để tải thêm', noRelatedGames: 'Không tìm thấy trò chơi', enterGame: 'Vào trò chơi', sportGame: 'Thể thao', lotteryGame: 'Xổ số', esportGame: 'Esports', liveGame: 'Casino trực tiếp', sportPlatform: 'Nền tảng thể thao', livePlatform: 'Nền tảng casino', esportPlatform: 'Nền tảng Esports', sportSuffix: 'Thể thao', lotterySuffix: 'Xổ số', esportSuffix: 'Esports', moreGames: 'Thêm trò chơi', featuredPlatforms: 'Nền tảng nổi bật', gameNumber: 'Trò chơi {number}' },
    account: { withdraw: 'Rút tiền', deposit: 'Nạp tiền', interest: 'Lãi suất', recoverBalance: 'Khôi phục số dư', myRecords: 'Lịch sử của tôi', recordsSummary: 'Chi tiết, cược và báo cáo', withdrawManage: 'Quản lý rút tiền', shareSlogan: 'Chia sẻ để kiếm thêm', language: 'Ngôn ngữ', faq: 'Câu hỏi thường gặp', feedback: 'Phản hồi nhận thưởng', loginDevices: 'Thiết bị đăng nhập', safeLogout: 'Đăng xuất', languageChanged: 'Đã đổi ngôn ngữ', nextVipTip: 'Cược thêm {amount} để đạt VIP {level}', upgradeBet: 'Cược để nâng cấp', loggingOut: 'Đang đăng xuất...', selectImage: 'Vui lòng chọn tệp ảnh', imageTooLarge: 'Ảnh không được vượt quá 2MB', uploading: 'Đang tải lên...', avatarUpdated: 'Đã cập nhật ảnh đại diện', uploadFailed: 'Tải lên thất bại' }
  },
  'th-TH': {
    home: { hall: 'ล็อบบี้เกม', languageSettings: 'ภาษา', categories: 'หมวดหมู่เกม', quickAccess: 'เมนูลัด', freeRegister: 'สมัครฟรี', fastDeposit: 'ฝากด่วน', promotionHall: 'โปรโมชั่น', appDownload: 'ดาวน์โหลดแอป', platformShowcase: 'แพลตฟอร์มความบันเทิงชั้นนำระดับโลก', platformShowcaseSub: 'แพลตฟอร์มชั้นนำทั่วโลก', qualityService: 'บริการระดับพรีเมียม ประสบการณ์เหนือระดับ', qualityServiceSub: 'ประสบการณ์บริการคุณภาพ', activityTasks: 'โปรโมชั่น', swipeForMore: 'ปัดเพื่อดูเพิ่มเติม', gameCount: '{count} เกม', sportIntro: 'ตัวเลือกเดิมพันมากมาย อีเวนต์สุดมัน และประสบการณ์กีฬาครบวงจร', esportIntro: 'ติดตามข่าวสาร ทัวร์นาเมนต์ และไฮไลต์อีสปอร์ตล่าสุด', liveIntro: 'แพลตฟอร์มเสถียร บริหารอย่างมืออาชีพ และใช้งานง่าย', cookieNotice: 'เมื่อใช้งานเว็บไซต์ต่อ คุณยอมรับการใช้คุกกี้ที่จำเป็นเพื่อพัฒนาประสบการณ์', copyright: 'สงวนลิขสิทธิ์', platformDescription: 'สนุกกับแพลตฟอร์มชั้นนำ ภาพคุณภาพสูง และเกมหลากหลาย', services: { speed: 'รวดเร็วทันใจ', speedDesc: 'เทคโนโลยีปรับเครือข่าย', secure: 'ปลอดภัย', secureDesc: 'การเข้ารหัส 128 บิต', freeFee: 'ไม่มีค่าธรรมเนียม', freeFeeDesc: 'ยกเว้นค่าธรรมเนียมทั้งหมด', alwaysOn: 'บริการ 24/7', alwaysOnDesc: 'พร้อมบริการตลอดปี' } },
    game: { mini: 'มินิเกม', special: 'เกมแนะนำ', hall: 'ล็อบบี้', platformFilter: 'กรองแพลตฟอร์ม', gameFilter: 'กรองเกม', switchLoading: 'กำลังเปลี่ยน', scrollForMore: 'เลื่อนลงเพื่อโหลดเพิ่ม', noRelatedGames: 'ไม่พบเกมที่ตรงกัน', enterGame: 'เข้าเกม', sportGame: 'กีฬา', lotteryGame: 'ลอตเตอรี่', esportGame: 'อีสปอร์ต', liveGame: 'คาสิโนสด', sportPlatform: 'แพลตฟอร์มกีฬา', livePlatform: 'แพลตฟอร์มคาสิโนสด', esportPlatform: 'แพลตฟอร์มอีสปอร์ต', sportSuffix: 'กีฬา', lotterySuffix: 'ลอตเตอรี่', esportSuffix: 'อีสปอร์ต', moreGames: 'เกมเพิ่มเติม', featuredPlatforms: 'แพลตฟอร์มแนะนำ', gameNumber: 'เกม {number}' },
    account: { withdraw: 'ถอนเงิน', deposit: 'ฝากเงิน', interest: 'ดอกเบี้ย', recoverBalance: 'กู้คืนยอดเงิน', myRecords: 'ประวัติของฉัน', recordsSummary: 'รายละเอียด เดิมพัน และรายงาน', withdrawManage: 'จัดการถอนเงิน', shareSlogan: 'แชร์เพื่อรับรายได้เพิ่ม', language: 'ภาษา', faq: 'คำถามที่พบบ่อย', feedback: 'ข้อเสนอแนะรับรางวัล', loginDevices: 'อุปกรณ์เข้าสู่ระบบ', safeLogout: 'ออกจากระบบ', languageChanged: 'เปลี่ยนภาษาแล้ว', nextVipTip: 'เดิมพันเพิ่ม {amount} เพื่อถึง VIP {level}', upgradeBet: 'เดิมพันเพื่อเลื่อนระดับ', loggingOut: 'กำลังออกจากระบบ...', selectImage: 'โปรดเลือกไฟล์รูปภาพ', imageTooLarge: 'รูปภาพต้องไม่เกิน 2MB', uploading: 'กำลังอัปโหลด...', avatarUpdated: 'อัปเดตรูปโปรไฟล์แล้ว', uploadFailed: 'อัปโหลดไม่สำเร็จ' }
  },
  'ja-JP': {
    home: { hall: 'ゲームロビー', languageSettings: '言語', categories: 'ゲームカテゴリー', quickAccess: 'クイックアクセス', freeRegister: '無料登録', fastDeposit: 'クイック入金', promotionHall: 'キャンペーン', appDownload: 'アプリをダウンロード', platformShowcase: '世界トップクラスのエンタメプラットフォーム', platformShowcaseSub: '世界のトッププラットフォーム', qualityService: '上質なサービス、最高の体験', qualityServiceSub: '高品質なサービス体験', activityTasks: 'キャンペーン', swipeForMore: 'スワイプしてもっと見る', gameCount: '{count} ゲーム', sportIntro: '豊富なベット、注目イベント、特別オッズでスポーツを満喫。', esportIntro: '最新のeスポーツニュース、大会情報、試合ハイライトをチェック。', liveIntro: '安定した環境とプロの運営で快適なライブ体験を提供します。', cookieNotice: '本サイトを継続して利用すると、体験向上に必要なCookieの使用に同意したものとみなされます。', copyright: '無断転載を禁じます', platformDescription: '高画質で多彩なゲームを世界有数のプラットフォームでお楽しみください。', services: { speed: '高速体験', speedDesc: '独自のネットワーク最適化', secure: '安心・安全', secureDesc: '128ビット暗号化', freeFee: '手数料無料', freeFeeDesc: 'すべての手数料が無料', alwaysOn: '24時間対応', alwaysOnDesc: '年中無休のサポート' } },
    game: { mini: 'ミニゲーム', special: '注目ゲーム', hall: 'ロビー', platformFilter: 'プラットフォーム絞り込み', gameFilter: 'ゲーム絞り込み', switchLoading: '切り替え中', scrollForMore: '下にスクロールしてさらに読み込む', noRelatedGames: '該当するゲームがありません', enterGame: 'ゲームに入る', sportGame: 'スポーツ', lotteryGame: '宝くじ', esportGame: 'eスポーツ', liveGame: 'ライブカジノ', sportPlatform: 'スポーツプラットフォーム', livePlatform: 'ライブカジノプラットフォーム', esportPlatform: 'eスポーツプラットフォーム', sportSuffix: 'スポーツ', lotterySuffix: '宝くじ', esportSuffix: 'eスポーツ', moreGames: 'その他のゲーム', featuredPlatforms: 'おすすめプラットフォーム', gameNumber: 'ゲーム {number}' },
    account: { withdraw: '出金', deposit: '入金', interest: '利息', recoverBalance: '残高回収', myRecords: 'マイ履歴', recordsSummary: '明細・ベット・レポート', withdrawManage: '出金管理', shareSlogan: 'シェアしてさらに獲得', language: '言語', faq: 'よくある質問', feedback: '報酬付きフィードバック', loginDevices: 'ログイン端末', safeLogout: 'ログアウト', languageChanged: '言語を変更しました', nextVipTip: 'VIP {level} まであと {amount} のベット', upgradeBet: '昇格に必要なベット', loggingOut: 'ログアウト中...', selectImage: '画像ファイルを選択してください', imageTooLarge: '画像は2MB以下にしてください', uploading: 'アップロード中...', avatarUpdated: 'アバターを更新しました', uploadFailed: 'アップロードに失敗しました' }
  },
  'ko-KR': {
    home: { hall: '게임 로비', languageSettings: '언어', categories: '게임 카테고리', quickAccess: '빠른 메뉴', freeRegister: '무료 가입', fastDeposit: '빠른 입금', promotionHall: '프로모션', appDownload: '앱 다운로드', platformShowcase: '세계 최고의 엔터테인먼트 플랫폼', platformShowcaseSub: '글로벌 인기 플랫폼', qualityService: '프리미엄 서비스, 최고의 경험', qualityServiceSub: '고품질 서비스 경험', activityTasks: '프로모션', swipeForMore: '더 보려면 스와이프', gameCount: '게임 {count}개', sportIntro: '다양한 베팅 옵션과 흥미진진한 이벤트를 한곳에서 즐기세요.', esportIntro: '최신 e스포츠 뉴스, 대회 정보, 경기 하이라이트를 확인하세요.', liveIntro: '안정적인 플랫폼과 전문적인 운영으로 편리한 라이브 경험을 제공합니다.', cookieNotice: '사이트를 계속 이용하면 경험 개선에 필요한 쿠키 사용에 동의하는 것으로 간주됩니다.', copyright: '모든 권리 보유', platformDescription: '선도적인 플랫폼에서 고화질과 다양한 게임을 즐기세요.', services: { speed: '초고속', speedDesc: '전용 네트워크 최적화', secure: '안전하고 편리함', secureDesc: '128비트 암호화', freeFee: '수수료 없음', freeFeeDesc: '모든 수수료 면제', alwaysOn: '24시간 서비스', alwaysOnDesc: '연중무휴 지원' } },
    game: { mini: '미니 게임', special: '추천 게임', hall: '로비', platformFilter: '플랫폼 필터', gameFilter: '게임 필터', switchLoading: '전환 중', scrollForMore: '아래로 스크롤하여 더 보기', noRelatedGames: '일치하는 게임이 없습니다', enterGame: '게임 입장', sportGame: '스포츠', lotteryGame: '복권', esportGame: 'e스포츠', liveGame: '라이브 카지노', sportPlatform: '스포츠 플랫폼', livePlatform: '라이브 카지노 플랫폼', esportPlatform: 'e스포츠 플랫폼', sportSuffix: '스포츠', lotterySuffix: '복권', esportSuffix: 'e스포츠', moreGames: '더 많은 게임', featuredPlatforms: '추천 플랫폼', gameNumber: '게임 {number}' },
    account: { withdraw: '출금', deposit: '입금', interest: '이자', recoverBalance: '잔액 회수', myRecords: '내 기록', recordsSummary: '상세, 베팅 및 보고서', withdrawManage: '출금 관리', shareSlogan: '공유하고 더 벌기', language: '언어', faq: '자주 묻는 질문', feedback: '보상 피드백', loginDevices: '로그인 기기', safeLogout: '로그아웃', languageChanged: '언어가 변경되었습니다', nextVipTip: 'VIP {level}까지 {amount} 더 베팅', upgradeBet: '승급 베팅', loggingOut: '로그아웃 중...', selectImage: '이미지 파일을 선택하세요', imageTooLarge: '이미지는 2MB 이하여야 합니다', uploading: '업로드 중...', avatarUpdated: '프로필 이미지가 업데이트되었습니다', uploadFailed: '업로드 실패' }
  },
  'id-ID': {
    home: { hall: 'Lobi Game', languageSettings: 'Bahasa', categories: 'Kategori Game', quickAccess: 'Akses Cepat', freeRegister: 'Daftar Gratis', fastDeposit: 'Deposit Cepat', promotionHall: 'Promosi', appDownload: 'Unduh Aplikasi', platformShowcase: 'Platform Hiburan Terbaik Dunia', platformShowcaseSub: 'Platform hiburan terkemuka', qualityService: 'Layanan Premium, Pengalaman Terbaik', qualityServiceSub: 'Pengalaman layanan berkualitas', activityTasks: 'Promosi', swipeForMore: 'Geser untuk melihat lainnya', gameCount: '{count} game', sportIntro: 'Lebih banyak pilihan taruhan, acara menarik, dan pengalaman olahraga lengkap.', esportIntro: 'Ikuti berita, turnamen, dan sorotan pertandingan esports terbaru.', liveIntro: 'Platform stabil dengan pengelolaan profesional dan pengalaman intuitif.', cookieNotice: 'Dengan terus menggunakan situs ini, Anda menyetujui cookie penting untuk meningkatkan pengalaman.', copyright: 'Hak cipta dilindungi', platformDescription: 'Nikmati platform terkemuka, visual berkualitas tinggi, dan beragam game.', services: { speed: 'Sangat Cepat', speedDesc: 'Optimasi jaringan eksklusif', secure: 'Aman', secureDesc: 'Enkripsi 128-bit', freeFee: 'Tanpa Biaya', freeFeeDesc: 'Bebas semua biaya transaksi', alwaysOn: 'Layanan 24/7', alwaysOnDesc: 'Tersedia sepanjang tahun' } },
    game: { mini: 'Mini Game', special: 'Game Pilihan', hall: 'Lobi', platformFilter: 'Filter Platform', gameFilter: 'Filter Game', switchLoading: 'Beralih', scrollForMore: 'Gulir ke bawah untuk memuat lagi', noRelatedGames: 'Tidak ada game yang cocok', enterGame: 'Masuk Game', sportGame: 'Olahraga', lotteryGame: 'Lotere', esportGame: 'Esports', liveGame: 'Kasino Langsung', sportPlatform: 'Platform Olahraga', livePlatform: 'Platform Kasino Langsung', esportPlatform: 'Platform Esports', sportSuffix: 'Olahraga', lotterySuffix: 'Lotere', esportSuffix: 'Esports', moreGames: 'Game Lainnya', featuredPlatforms: 'Platform Pilihan', gameNumber: 'Game {number}' },
    account: { withdraw: 'Tarik', deposit: 'Deposit', interest: 'Bunga', recoverBalance: 'Pulihkan Saldo', myRecords: 'Riwayat Saya', recordsSummary: 'Detail, Taruhan & Laporan', withdrawManage: 'Kelola Penarikan', shareSlogan: 'Bagikan dan dapatkan lebih banyak', language: 'Bahasa', faq: 'Pertanyaan Umum', feedback: 'Masukan Berhadiah', loginDevices: 'Perangkat Login', safeLogout: 'Keluar', languageChanged: 'Bahasa diubah', nextVipTip: 'Taruhan {amount} lagi untuk mencapai VIP {level}', upgradeBet: 'Taruhan untuk naik level', loggingOut: 'Sedang keluar...', selectImage: 'Pilih file gambar', imageTooLarge: 'Ukuran gambar maksimal 2MB', uploading: 'Mengunggah...', avatarUpdated: 'Avatar diperbarui', uploadFailed: 'Gagal mengunggah' }
  },
  'ms-MY': {
    home: { hall: 'Lobi Permainan', languageSettings: 'Bahasa', categories: 'Kategori Permainan', quickAccess: 'Akses Pantas', freeRegister: 'Daftar Percuma', fastDeposit: 'Deposit Pantas', promotionHall: 'Promosi', appDownload: 'Muat Turun Aplikasi', platformShowcase: 'Platform Hiburan Terbaik Dunia', platformShowcaseSub: 'Platform hiburan terkemuka', qualityService: 'Perkhidmatan Premium, Pengalaman Terbaik', qualityServiceSub: 'Pengalaman perkhidmatan berkualiti', activityTasks: 'Promosi', swipeForMore: 'Leret untuk melihat lagi', gameCount: '{count} permainan', sportIntro: 'Lebih banyak pilihan pertaruhan, acara menarik dan pengalaman sukan lengkap.', esportIntro: 'Ikuti berita, kejohanan dan sorotan esports terkini.', liveIntro: 'Platform stabil dengan pengurusan profesional dan pengalaman intuitif.', cookieNotice: 'Dengan terus menggunakan laman ini, anda bersetuju dengan kuki penting untuk meningkatkan pengalaman.', copyright: 'Hak cipta terpelihara', platformDescription: 'Nikmati platform terkemuka, visual berkualiti tinggi dan pelbagai permainan.', services: { speed: 'Sangat Pantas', speedDesc: 'Pengoptimuman rangkaian eksklusif', secure: 'Selamat', secureDesc: 'Penyulitan 128-bit', freeFee: 'Tanpa Yuran', freeFeeDesc: 'Tiada yuran transaksi', alwaysOn: 'Khidmat 24/7', alwaysOnDesc: 'Tersedia sepanjang tahun' } },
    game: { mini: 'Permainan Mini', special: 'Permainan Pilihan', hall: 'Lobi', platformFilter: 'Tapis Platform', gameFilter: 'Tapis Permainan', switchLoading: 'Sedang beralih', scrollForMore: 'Tatal ke bawah untuk muat lagi', noRelatedGames: 'Tiada permainan sepadan', enterGame: 'Masuk Permainan', sportGame: 'Sukan', lotteryGame: 'Loteri', esportGame: 'Esports', liveGame: 'Kasino Langsung', sportPlatform: 'Platform Sukan', livePlatform: 'Platform Kasino Langsung', esportPlatform: 'Platform Esports', sportSuffix: 'Sukan', lotterySuffix: 'Loteri', esportSuffix: 'Esports', moreGames: 'Lebih Banyak Permainan', featuredPlatforms: 'Platform Pilihan', gameNumber: 'Permainan {number}' },
    account: { withdraw: 'Pengeluaran', deposit: 'Deposit', interest: 'Faedah', recoverBalance: 'Pulihkan Baki', myRecords: 'Rekod Saya', recordsSummary: 'Butiran, Pertaruhan & Laporan', withdrawManage: 'Urus Pengeluaran', shareSlogan: 'Kongsi dan jana lebih', language: 'Bahasa', faq: 'Soalan Lazim', feedback: 'Maklum Balas Berhadiah', loginDevices: 'Peranti Log Masuk', safeLogout: 'Log Keluar', languageChanged: 'Bahasa ditukar', nextVipTip: 'Taruh {amount} lagi untuk mencapai VIP {level}', upgradeBet: 'Taruhan untuk naik taraf', loggingOut: 'Sedang log keluar...', selectImage: 'Sila pilih fail imej', imageTooLarge: 'Imej mestilah tidak melebihi 2MB', uploading: 'Sedang memuat naik...', avatarUpdated: 'Avatar dikemas kini', uploadFailed: 'Muat naik gagal' }
  },
  'hi-IN': {
    home: { hall: 'गेम लॉबी', languageSettings: 'भाषा', categories: 'गेम श्रेणियाँ', quickAccess: 'त्वरित पहुँच', freeRegister: 'मुफ़्त पंजीकरण', fastDeposit: 'त्वरित जमा', promotionHall: 'प्रमोशन', appDownload: 'ऐप डाउनलोड करें', platformShowcase: 'दुनिया के सर्वश्रेष्ठ मनोरंजन प्लेटफ़ॉर्म', platformShowcaseSub: 'शीर्ष वैश्विक प्लेटफ़ॉर्म', qualityService: 'प्रीमियम सेवा, शानदार अनुभव', qualityServiceSub: 'गुणवत्तापूर्ण सेवा अनुभव', activityTasks: 'प्रमोशन', swipeForMore: 'और देखने के लिए स्वाइप करें', gameCount: '{count} गेम', sportIntro: 'अधिक बेटिंग विकल्प, रोमांचक इवेंट और संपूर्ण खेल अनुभव।', esportIntro: 'नवीनतम ईस्पोर्ट्स समाचार, टूर्नामेंट और मैच हाइलाइट देखें।', liveIntro: 'स्थिर प्लेटफ़ॉर्म, पेशेवर प्रबंधन और सहज लाइव अनुभव।', cookieNotice: 'इस साइट का उपयोग जारी रखकर आप बेहतर अनुभव के लिए आवश्यक कुकीज़ से सहमत होते हैं।', copyright: 'सर्वाधिकार सुरक्षित', platformDescription: 'अग्रणी प्लेटफ़ॉर्म, उच्च गुणवत्ता वाले दृश्य और अनेक गेम का आनंद लें।', services: { speed: 'बेहद तेज़', speedDesc: 'विशेष नेटवर्क अनुकूलन', secure: 'सुरक्षित', secureDesc: '128-बिट एन्क्रिप्शन', freeFee: 'कोई शुल्क नहीं', freeFeeDesc: 'सभी लेनदेन शुल्क मुक्त', alwaysOn: '24/7 सेवा', alwaysOnDesc: 'साल भर उपलब्ध' } },
    game: { mini: 'मिनी गेम', special: 'विशेष गेम', hall: 'लॉबी', platformFilter: 'प्लेटफ़ॉर्म फ़िल्टर', gameFilter: 'गेम फ़िल्टर', switchLoading: 'बदल रहा है', scrollForMore: 'और लोड करने के लिए नीचे स्क्रॉल करें', noRelatedGames: 'कोई मेल खाता गेम नहीं', enterGame: 'गेम में जाएँ', sportGame: 'खेल', lotteryGame: 'लॉटरी', esportGame: 'ईस्पोर्ट्स', liveGame: 'लाइव कैसीनो', sportPlatform: 'खेल प्लेटफ़ॉर्म', livePlatform: 'लाइव कैसीनो प्लेटफ़ॉर्म', esportPlatform: 'ईस्पोर्ट्स प्लेटफ़ॉर्म', sportSuffix: 'खेल', lotterySuffix: 'लॉटरी', esportSuffix: 'ईस्पोर्ट्स', moreGames: 'और गेम', featuredPlatforms: 'विशेष प्लेटफ़ॉर्म', gameNumber: 'गेम {number}' },
    account: { withdraw: 'निकासी', deposit: 'जमा', interest: 'ब्याज', recoverBalance: 'बैलेंस रिकवर करें', myRecords: 'मेरे रिकॉर्ड', recordsSummary: 'विवरण, बेट और रिपोर्ट', withdrawManage: 'निकासी प्रबंधन', shareSlogan: 'शेयर करें और अधिक कमाएँ', language: 'भाषा', faq: 'सामान्य प्रश्न', feedback: 'पुरस्कृत प्रतिक्रिया', loginDevices: 'लॉगिन डिवाइस', safeLogout: 'लॉग आउट', languageChanged: 'भाषा बदल दी गई', nextVipTip: 'VIP {level} तक पहुँचने के लिए {amount} और बेट करें', upgradeBet: 'अपग्रेड के लिए बेट', loggingOut: 'लॉग आउट हो रहा है...', selectImage: 'कृपया छवि फ़ाइल चुनें', imageTooLarge: 'छवि 2MB से बड़ी नहीं होनी चाहिए', uploading: 'अपलोड हो रहा है...', avatarUpdated: 'अवतार अपडेट किया गया', uploadFailed: 'अपलोड विफल' }
  },
  'es-ES': {
    home: { hall: 'Lobby de juegos', languageSettings: 'Idioma', categories: 'Categorías de juegos', quickAccess: 'Acceso rápido', freeRegister: 'Registro gratis', fastDeposit: 'Depósito rápido', promotionHall: 'Promociones', appDownload: 'Descargar app', platformShowcase: 'Las mejores plataformas de entretenimiento del mundo', platformShowcaseSub: 'Plataformas líderes mundiales', qualityService: 'Servicio prémium, experiencia excepcional', qualityServiceSub: 'Experiencia de servicio de calidad', activityTasks: 'Promociones', swipeForMore: 'Desliza para ver más', gameCount: '{count} juegos', sportIntro: 'Más opciones de apuesta, eventos emocionantes y una experiencia deportiva completa.', esportIntro: 'Sigue las últimas noticias, torneos y momentos destacados de esports.', liveIntro: 'Una plataforma estable con gestión profesional y una experiencia intuitiva.', cookieNotice: 'Al continuar usando este sitio, aceptas el uso de cookies esenciales para mejorar tu experiencia.', copyright: 'Todos los derechos reservados', platformDescription: 'Disfruta de plataformas líderes, gráficos de calidad y una amplia variedad de juegos.', services: { speed: 'Ultrarrápido', speedDesc: 'Optimización de red exclusiva', secure: 'Seguro', secureDesc: 'Cifrado de 128 bits', freeFee: 'Sin comisiones', freeFeeDesc: 'Sin gastos de transacción', alwaysOn: 'Servicio 24/7', alwaysOnDesc: 'Disponible todo el año' } },
    game: { mini: 'Minijuegos', special: 'Juegos destacados', hall: 'Lobby', platformFilter: 'Filtro de plataformas', gameFilter: 'Filtro de juegos', switchLoading: 'Cambiando', scrollForMore: 'Desplázate para cargar más', noRelatedGames: 'No hay juegos coincidentes', enterGame: 'Entrar al juego', sportGame: 'Deportes', lotteryGame: 'Lotería', esportGame: 'Esports', liveGame: 'Casino en vivo', sportPlatform: 'Plataformas deportivas', livePlatform: 'Plataformas de casino en vivo', esportPlatform: 'Plataformas de esports', sportSuffix: 'Deportes', lotterySuffix: 'Lotería', esportSuffix: 'Esports', moreGames: 'Más juegos', featuredPlatforms: 'Plataformas destacadas', gameNumber: 'Juego {number}' },
    account: { withdraw: 'Retirar', deposit: 'Depositar', interest: 'Intereses', recoverBalance: 'Recuperar saldo', myRecords: 'Mis registros', recordsSummary: 'Detalles, apuestas e informes', withdrawManage: 'Gestión de retiros', shareSlogan: 'Comparte y gana más', language: 'Idioma', faq: 'Preguntas frecuentes', feedback: 'Comentarios con recompensa', loginDevices: 'Dispositivos de inicio', safeLogout: 'Cerrar sesión', languageChanged: 'Idioma cambiado', nextVipTip: 'Apuesta {amount} más para llegar a VIP {level}', upgradeBet: 'Apuesta para subir de nivel', loggingOut: 'Cerrando sesión...', selectImage: 'Selecciona un archivo de imagen', imageTooLarge: 'La imagen no puede superar 2MB', uploading: 'Subiendo...', avatarUpdated: 'Avatar actualizado', uploadFailed: 'Error al subir' }
  },
  'pt-BR': {
    home: { hall: 'Lobby de jogos', languageSettings: 'Idioma', categories: 'Categorias de jogos', quickAccess: 'Acesso rápido', freeRegister: 'Cadastro grátis', fastDeposit: 'Depósito rápido', promotionHall: 'Promoções', appDownload: 'Baixar aplicativo', platformShowcase: 'As melhores plataformas de entretenimento do mundo', platformShowcaseSub: 'Principais plataformas globais', qualityService: 'Serviço premium, experiência excepcional', qualityServiceSub: 'Experiência de serviço de qualidade', activityTasks: 'Promoções', swipeForMore: 'Deslize para ver mais', gameCount: '{count} jogos', sportIntro: 'Mais opções de apostas, eventos emocionantes e uma experiência esportiva completa.', esportIntro: 'Acompanhe as últimas notícias, torneios e destaques de esports.', liveIntro: 'Uma plataforma estável com gestão profissional e experiência intuitiva.', cookieNotice: 'Ao continuar usando este site, você concorda com cookies essenciais para melhorar sua experiência.', copyright: 'Todos os direitos reservados', platformDescription: 'Aproveite plataformas líderes, visuais de alta qualidade e uma grande variedade de jogos.', services: { speed: 'Ultrarrápido', speedDesc: 'Otimização de rede exclusiva', secure: 'Seguro', secureDesc: 'Criptografia de 128 bits', freeFee: 'Sem taxas', freeFeeDesc: 'Sem taxas de transação', alwaysOn: 'Serviço 24/7', alwaysOnDesc: 'Disponível o ano todo' } },
    game: { mini: 'Minijogos', special: 'Jogos em destaque', hall: 'Lobby', platformFilter: 'Filtro de plataformas', gameFilter: 'Filtro de jogos', switchLoading: 'Alterando', scrollForMore: 'Role para carregar mais', noRelatedGames: 'Nenhum jogo correspondente', enterGame: 'Entrar no jogo', sportGame: 'Esportes', lotteryGame: 'Loteria', esportGame: 'Esports', liveGame: 'Cassino ao vivo', sportPlatform: 'Plataformas esportivas', livePlatform: 'Plataformas de cassino ao vivo', esportPlatform: 'Plataformas de esports', sportSuffix: 'Esportes', lotterySuffix: 'Loteria', esportSuffix: 'Esports', moreGames: 'Mais jogos', featuredPlatforms: 'Plataformas em destaque', gameNumber: 'Jogo {number}' },
    account: { withdraw: 'Sacar', deposit: 'Depositar', interest: 'Juros', recoverBalance: 'Recuperar saldo', myRecords: 'Meus registros', recordsSummary: 'Detalhes, apostas e relatórios', withdrawManage: 'Gestão de saques', shareSlogan: 'Compartilhe e ganhe mais', language: 'Idioma', faq: 'Perguntas frequentes', feedback: 'Feedback premiado', loginDevices: 'Dispositivos de login', safeLogout: 'Sair', languageChanged: 'Idioma alterado', nextVipTip: 'Aposte mais {amount} para chegar ao VIP {level}', upgradeBet: 'Aposte para subir de nível', loggingOut: 'Saindo...', selectImage: 'Selecione um arquivo de imagem', imageTooLarge: 'A imagem não pode exceder 2MB', uploading: 'Enviando...', avatarUpdated: 'Avatar atualizado', uploadFailed: 'Falha no envio' }
  }
}

function mergeLocaleMessages(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = target[key] && typeof target[key] === 'object' ? target[key] : {}
      mergeLocaleMessages(target[key], value)
    } else {
      target[key] = value
    }
  })
}

Object.entries(sharedPageMessages).forEach(([locale, additions]) => {
  if (messages[locale]) mergeLocaleMessages(messages[locale], additions)
})

export const allLocaleOptions = [
  { text: '简体中文', value: 'zh-CN' },
  { text: '繁體中文', value: 'zh-TW' },
  { text: 'English', value: 'en-US' },
  { text: 'Tiếng Việt', value: 'vi-VN' },
  { text: 'ภาษาไทย', value: 'th-TH' },
  { text: '日本語', value: 'ja-JP' },
  { text: '한국어', value: 'ko-KR' },
  { text: 'Bahasa Indonesia', value: 'id-ID' },
  { text: 'Bahasa Melayu', value: 'ms-MY' },
  { text: 'हिन्दी', value: 'hi-IN' },
  { text: 'Español', value: 'es-ES' },
  { text: 'Português', value: 'pt-BR' }
]

export const enabledLanguages = ref(null)
export const defaultLanguage = ref('zh-CN')
export const languageShortNames = ref({})

const LOCALE_ALIASES = {
  zh: 'zh-CN',
  cn: 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-cn': 'zh-CN',
  tw: 'zh-TW',
  'zh-hant': 'zh-TW',
  'zh-tw': 'zh-TW',
  en: 'en-US',
  'en-us': 'en-US',
  // 后台语言配置使用接口短代码，统一映射到前端 locale/message key。
  // 不补齐这些别名时，/v1/languages 返回 vi、th、ja 等代码会导致对应
  // 语言选项被过滤掉，并在刷新后被判定为未启用。
  vi: 'vi-VN',
  'vi-vn': 'vi-VN',
  th: 'th-TH',
  ti: 'th-TH',
  'th-th': 'th-TH',
  ja: 'ja-JP',
  jp: 'ja-JP',
  'ja-jp': 'ja-JP',
  ko: 'ko-KR',
  'ko-kr': 'ko-KR',
  id: 'id-ID',
  'id-id': 'id-ID',
  ms: 'ms-MY',
  'ms-my': 'ms-MY',
  hi: 'hi-IN',
  'hi-in': 'hi-IN',
  es: 'es-ES',
  'es-es': 'es-ES',
  pt: 'pt-BR',
  'pt-br': 'pt-BR'
}

/** 后台 code 可能与前端 messages 键不一致（zh_CN / zh-Hans 等） */
export function normalizeLocaleCode(code) {
  if (!code) return ''
  const raw = String(code).trim().replace(/_/g, '-')
  const lower = raw.toLowerCase()
  if (LOCALE_ALIASES[lower]) return LOCALE_ALIASES[lower]
  if (messages[raw]) return raw
  const matched = Object.keys(messages).find((k) => k.toLowerCase() === lower)
  return matched || raw
}

function ensureCoreLocales(codes) {
  const set = new Set(codes || [])
  ;['zh-CN', 'en-US'].forEach((c) => set.add(c))
  return [...set]
}

export async function loadEnabledLanguages() {
  try {
    const { default: request } = await import('@/api/request')
    const res = await request.get('/v1/languages')
    if (res.code === 0 && res.data) {
      const normalized = res.data.map((lang) => {
        const code = normalizeLocaleCode(lang.code)
        return { ...lang, code }
      })
      enabledLanguages.value = ensureCoreLocales(normalized.map((lang) => lang.code))
      const shortNames = Object.fromEntries(allLocaleOptions.map((option) => [option.value, option.text]))
      normalized.forEach((lang) => {
        shortNames[lang.code] = lang.short_name || lang.code.split('-')[0].toUpperCase()
      })
      languageShortNames.value = shortNames
      const defaultLang = normalized.find((lang) => lang.is_default === 1)
      if (defaultLang) {
        defaultLanguage.value = normalizeLocaleCode(defaultLang.code)
      }
    }
  } catch (e) {
    enabledLanguages.value = null
  }
}

function getDefaultLocale() {
  const saved = normalizeLocaleCode(localStorage.getItem('locale'))
  if (saved && messages[saved]) {
    if (enabledLanguages.value && !enabledLanguages.value.includes(saved)) {
      localStorage.removeItem('locale')
    } else {
      return saved
    }
  }
  
  if (enabledLanguages.value) {
    const browserLang = navigator.language
    for (const code of enabledLanguages.value) {
      if (browserLang.startsWith(code.split('-')[0])) {
        return code
      }
    }
    return defaultLanguage.value
  }
  
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('TW') || browserLang.includes('HK')) {
      return 'zh-TW'
    }
    return 'zh-CN'
  }
  if (browserLang.startsWith('vi')) return 'vi-VN'
  if (browserLang.startsWith('th')) return 'th-TH'
  if (browserLang.startsWith('ja')) return 'ja-JP'
  if (browserLang.startsWith('ko')) return 'ko-KR'
  if (browserLang.startsWith('id')) return 'id-ID'
  if (browserLang.startsWith('ms')) return 'ms-MY'
  if (browserLang.startsWith('hi')) return 'hi-IN'
  if (browserLang.startsWith('es')) return 'es-ES'
  if (browserLang.startsWith('pt')) return 'pt-BR'
  return 'en-US'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  // 非中文语言缺词时统一退回英语，避免再次显示硬编码式中文。
  fallbackLocale: {
    'zh-TW': ['zh-CN'],
    default: ['en-US']
  },
  messages
})

export default i18n

export function setLocale(locale) {
  const code = normalizeLocaleCode(locale)
  if (!messages[code]) return
  i18n.global.locale.value = code
  localStorage.setItem('locale', code)
  document.querySelector('html')?.setAttribute('lang', code)
}

export function getLocale() {
  return i18n.global.locale.value
}

export function getLocaleOptions() {
  return allLocaleOptions
}

export function updateLocaleAfterLoad() {
  const current = normalizeLocaleCode(i18n.global.locale.value)
  if (messages[current]) {
    i18n.global.locale.value = current
  }
  const saved = normalizeLocaleCode(localStorage.getItem('locale'))
  if (saved && messages[saved]) {
    i18n.global.locale.value = saved
    document.querySelector('html')?.setAttribute('lang', saved)
    return
  }
}
