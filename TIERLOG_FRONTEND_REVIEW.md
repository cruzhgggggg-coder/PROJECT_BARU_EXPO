# TierLog Frontend UI/UX Review
## Panduan Remake Styling macOS untuk React Native + Expo

**Tanggal Review:** June 18, 2026  
**Proyek:** TierLog — AI-Powered Thesis Supervision System  
**Scope:** Frontend Architecture (React Native + Expo Router)  
**Status:** Review Teknis & Desain (Netral)

---

## Executive Summary

PRD Anda mendefinisikan visi desain yang **clear dan focused** — minimalist Apple-inspired interface dengan perhatian khusus pada aksesibilitas untuk pengguna dosen senior. Struktur layout yang direkomendasikan (terutama sistem 3-kolom pada lecturer dashboard) adalah pendekatan yang **solid dan well-reasoned**. Berikut adalah observasi teknis dan saran implementasi untuk memperkuat eksekusi.

---

## ✓ Hal-Hal yang Sudah Tepat Arah

### 1. **Definisi Palet Warna Spesifik & Aksesibilitas**
- **Positive:** Anda menetapkan palet dengan nilai hex yang presisi (#F5F5F7, #007AFF, dll) dan **explicitly mendokumentasikan reasoning di balik setiap warna** (kontras tinggi untuk dosen senior, avoidance tema gelap).
- **Execution Note:** WCAG AA compliance untuk contrast ratio (text #1D1D1F over #FFFFFF) sudah memenuhi standar (21:1). Ini adalah keputusan yang tepat.

### 2. **Desain Responsive dengan Sidebar Collapse**
- **Positive:** Strategy untuk mengotomasi sidebar (fixed 240px di desktop, collapse ke ikon di mobile) adalah **pattern yang proven** dan tidak reinventing the wheel. Ini reduce kompleksitas state management.
- **Implementation Opportunity:** Zustand store untuk tracking `sidebarCollapsed` state sudah well-positioned untuk handling ini.

### 3. **Pembagian Halaman Jelas dengan Sub-routing**
- **Positive:** Settings dibagi menjadi `/settings/profile`, `/settings/security`, `/settings/ai-gateway` — ini leverage Expo Router nested routing dengan baik dan membuat codebase lebih maintainable.
- **Consistency:** Folder structure ini sejalan dengan dokumentasi backend yang modular.

### 4. **Three-Column Layout untuk Lecturer Dashboard**
- **Positive:** Sistem 3-kolom (left: student list, center: consultation log, right: feedback panel) adalah **solid information architecture** yang mengurangi konteks switching.
- **Justification:** Tepat bahwa Anda menekankan "semua elemen penting tetap berada di tempatnya" — ini mengatasi pain point UX dari dashboard single-page yang overcrowded.

---

## ⚠ Aspek-Aspek yang Perlu Klarifikasi & Operasionalisasi

### 1. **Responsive Behavior untuk Desktop vs Mobile**
**Observasi:**
- PRD fokus pada desktop laptop (terutama untuk lecturer dashboard dengan 3-kolom).
- Mobile handling untuk 3-kolom layout tidak dijelaskan detail.

**Pertanyaan Teknis:**
- Untuk mobile lecturer dashboard: apakah Anda akan menggunakan swipe/tab navigation untuk toggle kolom?
- Atau apakah lecturer dashboard hanya di-optimize untuk iPad+ width (768px+)?

**Rekomendasi:**
```
Definisikan breakpoint eksplisit:
- Mobile (<640px): stack vertical atau single-kolom dengan tab switcher
- Tablet (640px-1024px): 2-kolom atau hamburger menu
- Desktop (>1024px): full 3-kolom sesuai PRD

Dokumentasikan di file: tierlog_web/src/lib/breakpoints.ts
```

### 2. **Font Scaling Feature di Zustand Store**
**Observasi:**
- Anda menyebutkan "Font Scaling pada Zustand Store yang bisa menaikkan ukuran teks dasar dari 16 piksel ke 20 piksel".
- Tidak ada detail tentang **scope perubahan** (apakah ini global, atau per-component-group?).

**Implementasi Approach:**
```typescript
// tierlog_web/src/lib/store/ui-store.ts (Zustand)
interface UIStore {
  fontSize: 'normal' | 'large'; // 16px vs 20px
  setFontSize: (size: 'normal' | 'large') => void;
}

// CSS implementation (NativeWind + Tailwind)
// Root layout: apply text-base atau text-lg based on store
```

**Pertanyaan:**
- Apakah line-height juga akan scale proportionally (16px → 20px basis, line-height 1.5 tetap 1.5)?
- Apakah ada intermediate size (18px) atau hanya binary?

**Rekomendasi:** Dokumentasikan scaling formula sehingga konsisten di semua komponen.

---

### 3. **macOS Aesthetic: Glassmorphism vs Flat**
**Observasi:**
- PRD menyebutkan "transparan menggunakan efek buram NativeWind" untuk navbar.
- Modern Apple design (2023+) menggunakan **blur effect (glassmorphism)**, bukan pure flat.

**Technical Reality:**
- NativeWind + React Native support blur melalui `blurView` komponen (dari `expo-blur` package).
- Expo sudah support ini: `expo-blur` adalah maintained official module.

**Rekomendasi:**
```
Implementasi navbar dengan effect buram:
- Gunakan <BlurView intensity={90}> dari expo-blur
- Background color: rgba(255, 255, 255, 0.8) untuk transparency effect
- Ini akan give visual depth sesuai Apple HIG (Human Interface Guidelines) 2024+
- Dokumentasikan di: tierlog_web/src/components/Navbar.tsx
```

**Catatan Kompatibilitas:** Pastikan expo-blur di-include di package.json dan tested di iOS/Android/Web.

---

### 4. **Color Variable System dalam NativeWind**
**Observasi:**
- PRD define palet dengan hex value (#F5F5F7, #007AFF, etc).
- **Best practice:** Gunakan Tailwind CSS variables/tokens daripada inline hex.

**Current Status Repository:**
- `tailwind.config.js` sudah ada di tierlog_web/, tapi detail tidak terlihat.

**Rekomendasi Struktur:**
```javascript
// tierlog_web/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'tier-background': '#F5F5F7',
        'tier-card': '#FFFFFF',
        'tier-text-primary': '#1D1D1F',
        'tier-text-secondary': '#86868B',
        'tier-accent-blue': '#007AFF',
        'tier-success': '#248A3D',
        'tier-danger': '#FF3B30',
      },
    },
  },
};
```

**Usage:**
```tsx
<View className="bg-tier-background p-4">
  <Text className="text-tier-text-primary text-lg">Content</Text>
</View>
```

**Keuntungan:**
- Maintainability: jika ada perubahan brand color di kemudian hari, hanya perlu update satu file.
- Consistency: semua komponen otomatis inherit dari token system.
- DX: autocomplete support di editor untuk color names.

---

### 5. **Component Hierarchy & Naming Convention**
**Observasi:**
- PRD describe UI element secara detail (kartu, tombol, modul) tapi tidak explicit tentang component structure.
- Tidak ada clear separation antara "presentational components" vs "page components" vs "hooks".

**Current Repository Structure:**
- `tierlog_web/src/components/` ada, tapi detail files tidak visible.

**Rekomendasi Struktur:**
```
tierlog_web/src/
├── components/
│   ├── ui/                    # Presentational (dumb components)
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Sidebar.tsx
│   ├── layout/                # Layout containers
│   │   ├── Navbar.tsx
│   │   ├── LecturerDashboardLayout.tsx
│   │   └── StudentDashboardLayout.tsx
│   └── sections/              # Feature-specific (smart components)
│       ├── ConsultationPanel.tsx
│       ├── StudentList.tsx
│       └── FeedbackPanel.tsx
├── hooks/                     # Custom React hooks
│   ├── useConsultation.ts
│   └── useFontSize.ts
└── lib/                       # Utilities & store
    ├── store/
    │   ├── ui-store.ts       # Zustand UI store
    │   └── auth-store.ts
    └── colors.ts             # Color palette constants
```

**Keuntungan:**
- Clear separation of concerns.
- Easier testing (UI components can be snapshot-tested independently).
- Easier refactoring (if design changes, touch ui/ folder only).

---

### 6. **WebSocket Integration untuk Real-time Status**
**Observasi:**
- Backend sudah support WebSocket (Gorilla WebSocket, documented di `realtime/hub.go`).
- Frontend PRD tidak mention bagaimana UI akan **visually reflect** real-time updates (e.g., feedback status change, AI response streaming).

**Pertanyaan Teknis:**
- Apakah AI Oracle response akan di-stream character-by-character (seperti ChatGPT UI), atau batch update?
- Apakah feedback status change akan animated (e.g., fade-in badge "Validasi Selesai")?
- Apakah ada visual indicator untuk "connection status" ke WebSocket?

**Rekomendasi:**
```typescript
// tierlog_web/src/hooks/useRealtimeConsultation.ts
export function useRealtimeConsultation(consultationId: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const socket = new WebSocket(`${API_URL}/ws?token=${token}`);
    socket.onopen = () => {
      socket.send(JSON.stringify({
        action: 'subscribe',
        room: `consultation.${consultationId}`,
      }));
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'feedback.status-updated') {
        // Update state, trigger animation
      }
    };
    
    return () => socket.close();
  }, [consultationId]);
}
```

---

### 7. **Dark Mode Handling**
**Observasi:**
- PRD explicitly menyatakan: "Nonaktifkan tema gelap otomatis. Dosen senior membutuhkan kontras tinggi dari teks gelap di atas latar belakang terang."
- Ini keputusan yang **valid** berdasarkan accessibility concern.

**Implementasi:**
```typescript
// tierlog_web/app/_layout.tsx
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Force light mode: ignore system colorScheme setting
  
  return (
    <ThemeProvider theme="light">
      {/* app content */}
    </ThemeProvider>
  );
}
```

**Dokumentasi Penting:**
- Buatkan comment di _layout.tsx menjelaskan **why** dark mode is disabled (accessibility + dosen senior eyesight).
- Ini penting untuk future maintainers agar tidak accidentally re-enable dark mode.

---

## 🔧 Implementasi Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Update `tailwind.config.js` dengan color token system (section 5)
- [ ] Define font scaling mechanism di Zustand (section 2)
- [ ] Create base UI components: `Button`, `Card`, `Input` dengan color tokens
- [ ] Configure `app/_layout.tsx` untuk force light mode (section 7)
- [ ] Document breakpoint strategy di `src/lib/breakpoints.ts` (section 1)

### Phase 2: Layout Components (Week 2-3)
- [ ] Implement `Navbar.tsx` dengan blur effect (section 3)
- [ ] Implement `Sidebar.tsx` dengan collapse behavior
- [ ] Implement `StudentDashboardLayout.tsx`
- [ ] Implement `LecturerDashboardLayout.tsx` (3-kolom desktop, responsive mobile)

### Phase 3: Page Integration (Week 3-4)
- [ ] Integrate layouts ke dalam page routes (`app/(tabs)/dashboard.tsx`, dll)
- [ ] Implement WebSocket hook untuk real-time updates (section 6)
- [ ] Visual testing di berbagai breakpoints (mobile 375px, tablet 768px, desktop 1280px+)

### Phase 4: Polish & Testing (Week 4+)
- [ ] Font scaling testing (16px → 20px di semua pages)
- [ ] Accessibility audit (WCAG AA compliance, keyboard navigation)
- [ ] WebSocket connection indicator & reconnection logic
- [ ] Performance testing (especially 3-kolom layout on lower-end devices)

---

## 📝 Dokumentasi yang Direkomendasikan

Tambahkan ke repository:

### 1. `tierlog_web/DESIGN_SYSTEM.md`
```markdown
# TierLog Design System

## Color Palette
- Background: #F5F5F7 (tier-background)
- Card: #FFFFFF (tier-card)
- Text Primary: #1D1D1F (tier-text-primary)
- Text Secondary: #86868B (tier-text-secondary)
- Accent: #007AFF (tier-accent-blue)
- Success: #248A3D (tier-success)
- Danger: #FF3B30 (tier-danger)

## Typography
- Display: 48px (Landing page hero)
- Heading: 28px (Page titles)
- Subheading: 18px (Section titles)
- Body: 16px → 20px (scalable for accessibility)
- Caption: 12px

## Spacing
- Gap unit: 4px
- Standard padding: 16px (4 units)
- Large padding: 24px (6 units)

## Border Radius
- Small: 8px (inputs, badges)
- Medium: 12px (cards)
- Large: 16px (major containers)

## Accessibility
- Dark mode: Disabled (see _layout.tsx)
- Font scaling: Zustand store controls 16px → 20px
- Contrast: WCAG AA compliant for all text
```

### 2. `tierlog_web/IMPLEMENTATION_NOTES.md`
- Dokumentasi keputusan teknis (kenapa blur effect, kenapa 3-kolom, dll)
- Trade-off yang dipertimbangkan
- Known limitations & future improvements

### 3. Update `README.md` di root
- Add section: "UI/UX Design System" dengan link ke DESIGN_SYSTEM.md
- Add note tentang accessibility features

---

## 🎯 Rekomendasi Prioritas

### Must-Have (sebelum deployment)
1. **Color token system di Tailwind** → consistency & maintainability
2. **Responsive layout testing** → ensure usable di mobile/tablet (tidak hanya desktop)
3. **WebSocket integration** → core feature untuk real-time feedback
4. **Accessibility testing** → WCAG AA compliance untuk dosen senior

### Nice-to-Have (dapat di-roadmap kemudian)
1. **Advanced animation** (scroll-trigger reveal, page transitions)
2. **Gesture support** (swipe untuk navigate di mobile)
3. **Offline support** (mention di backend, tapi frontend caching strategy tidak detail)
4. **Performance optimization** (lazy-load untuk konsultasi list besar)

---

## 💭 Catatan Akhir

**Overall Assessment:**

PRD Anda menunjukkan **pemahaman yang solid** tentang kebutuhan user (dosen senior dengan eyesight concern) dan membuat **deliberate design choices** (light mode only, high contrast, font scaling). Ini bukan template design — ini design yang thoughtful.

Poin-poin di review ini adalah untuk **memperkuat eksekusi** dan **memastikan consistency** saat implementasi dimulai. Tidak ada "wrong" di sini, hanya **clarifications dan operational details** yang akan mempermudah development phase.

**Key Strengths:**
- Clear design intent (Apple minimalism, accessibility-first)
- Specific color values & reasoning
- Smart information architecture (3-kolom layout)
- Responsive thinking (desktop ↔ mobile)

**Action Items:**
1. Prioritaskan color token system (day 1)
2. Create design system documentation (day 2-3)
3. Validate breakpoint strategy dengan tim (day 3)
4. Start component library build (week 1)

---

**Review oleh:** Claude (Anthropic)  
**Next Step:** Approve implementation checklist atau request additional clarifications?

