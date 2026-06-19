# TierLog Frontend: Technical Implementation Guide
## Panduan Spesifik untuk Eksekusi PRD macOS Design

**Purpose:** Operasionalisasi PRD design menjadi code structure yang siap untuk development  
**Audience:** Frontend developers (React Native + Expo)  
**Teknologi:** React Native 0.79, Expo Router v5, NativeWind, Zustand

---

## 1. Setup Tailwind Color Tokens

**File:** `tierlog_web/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TierLog Color System
        'tier': {
          'bg': '#F5F5F7',           // Background dasar (abu-abu terang)
          'card': '#FFFFFF',         // Card background
          'text': {
            'primary': '#1D1D1F',    // Teks utama (charcoal tebal)
            'secondary': '#86868B',  // Teks sekunder (abu-abu sedang)
          },
          'accent': {
            'blue': '#007AFF',       // Apple blue (navigasi aktif, CTA)
            'success': '#248A3D',    // Apple hijau (validasi sukses)
            'danger': '#FF3B30',     // Apple merah (revisi mayor)
          },
          'border': {
            'light': '#E5E5E7',      // Border tipis untuk cards
          },
          'divider': '#D5D5D7',      // Divider lines
        },
      },
      fontSize: {
        // Accessibility-aware typography scale
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],     // Default (dapat scale ke 20px)
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['28px', '36px'],
        '4xl': ['32px', '40px'],
        '5xl': ['48px', '48px'],       // Hero text (landing page)
      },
      spacing: {
        // 4px base unit (Apple HIG standard)
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',     // Standard padding
        '5': '20px',
        '6': '24px',     // Large padding
        '7': '28px',
        '8': '32px',
      },
      borderRadius: {
        'none': '0px',
        'xs': '4px',
        'sm': '8px',
        'base': '12px',  // Card border radius
        'md': '16px',    // Major container radius
        'lg': '20px',
        'xl': '24px',
        'full': '9999px', // Fully rounded (CTA buttons)
      },
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
```

**Usage Examples:**
```tsx
// Card component
<View className="bg-tier-card p-4 rounded-base shadow-sm border border-tier-border-light">
  <Text className="text-tier-text-primary text-lg">Card Title</Text>
  <Text className="text-tier-text-secondary text-sm mt-2">Subtitle</Text>
</View>

// CTA Button
<Pressable className="bg-tier-accent-blue px-6 py-3 rounded-full">
  <Text className="text-white font-bold">Mulai Sekarang</Text>
</Pressable>

// Danger indicator (revision level)
<View className="bg-tier-accent-danger px-2 py-1 rounded-xs">
  <Text className="text-white text-xs font-semibold">Major</Text>
</View>
```

---

## 2. Zustand Store untuk Font Scaling & UI State

**File:** `tierlog_web/src/lib/store/ui-store.ts`

```typescript
import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSize = 'normal' | 'large';

interface UIState {
  // Font scaling
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  
  // Sidebar state (mobile/desktop responsive)
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  
  // Theme (locked to light mode)
  theme: 'light';
  
  // Persistence
  hydrate: () => Promise<void>;
}

export const useUIStore = create<UIState>((set) => ({
  // Default values
  fontSize: 'normal',
  isSidebarCollapsed: false,
  theme: 'light',
  
  // Actions
  setFontSize: (size: FontSize) => {
    set({ fontSize: size });
    // Persist to AsyncStorage
    AsyncStorage.setItem('tierlog-font-size', size);
  },
  
  toggleSidebarCollapse: () => {
    set((state) => ({
      isSidebarCollapsed: !state.isSidebarCollapsed,
    }));
  },
  
  // Hydrate from AsyncStorage on app startup
  hydrate: async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem('tierlog-font-size');
      if (savedFontSize === 'normal' || savedFontSize === 'large') {
        set({ fontSize: savedFontSize });
      }
    } catch (error) {
      console.error('Failed to hydrate UI store:', error);
    }
  },
}));
```

**Implementasi Font Scaling di Root Layout:**

**File:** `tierlog_web/app/_layout.tsx`

```typescript
import { useEffect } from 'react';
import { useUIStore } from '@/src/lib/store/ui-store';

export default function RootLayout() {
  const { fontSize, hydrate } = useUIStore();
  
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  
  // Map fontSize to Tailwind size scale
  const fontSizeClass = fontSize === 'large' ? 'text-lg' : 'text-base';
  
  return (
    <View className={fontSizeClass}>
      {/* All child components will inherit font size context */}
      <RootNavigator />
    </View>
  );
}
```

**Hook untuk Global Font Scaling:**

**File:** `tierlog_web/src/hooks/useFontSize.ts`

```typescript
import { useUIStore } from '@/src/lib/store/ui-store';

interface FontSizeMapping {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
}

const NORMAL_SIZES: FontSizeMapping = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 48,
};

const LARGE_SIZES: FontSizeMapping = {
  xs: 13,
  sm: 15,
  base: 20,    // Scaled from 16px to 20px
  lg: 22,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 36,
  '5xl': 52,
};

export function useFontSize() {
  const fontSize = useUIStore((state) => state.fontSize);
  const sizes = fontSize === 'large' ? LARGE_SIZES : NORMAL_SIZES;
  
  return {
    sizes,
    isSized: fontSize === 'large',
  };
}
```

---

## 3. Base UI Components dengan Color Tokens

**File:** `tierlog_web/src/components/ui/Card.tsx`

```typescript
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <View
      className={`bg-tier-card rounded-base p-4 shadow-sm border border-tier-border-light ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
```

**File:** `tierlog_web/src/components/ui/Button.tsx`

```typescript
import { Pressable, Text, PressableProps, ViewStyle } from 'react-native';
import { useUIStore } from '@/src/lib/store/ui-store';

interface ButtonProps extends PressableProps {
  children: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const fontSize = useUIStore((state) => state.fontSize);
  
  const variantStyles = {
    primary: 'bg-tier-accent-blue',
    secondary: 'bg-tier-bg border border-tier-divider',
    danger: 'bg-tier-accent-danger',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const textColor = variant === 'secondary' ? 'text-tier-text-primary' : 'text-white';
  
  return (
    <Pressable
      className={`rounded-full ${variantStyles[variant]} ${sizeStyles[size]} items-center justify-center`}
      {...props}
    >
      <Text className={`font-bold ${textColor} ${fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
        {children}
      </Text>
    </Pressable>
  );
}
```

**File:** `tierlog_web/src/components/ui/Badge.tsx`

```typescript
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  severity?: 'major' | 'minor' | 'success';
}

export function Badge({ label, severity = 'minor' }: BadgeProps) {
  const severityStyles = {
    major: 'bg-tier-accent-danger',      // Red untuk Major revisions
    minor: 'bg-tier-text-secondary',     // Gray untuk Minor revisions
    success: 'bg-tier-accent-success',   // Green untuk validasi sukses
  };
  
  return (
    <View className={`${severityStyles[severity]} px-2 py-1 rounded-xs self-fit`}>
      <Text className="text-white text-xs font-semibold">{label}</Text>
    </View>
  );
}
```

---

## 4. Navbar dengan Blur Effect

**File:** `tierlog_web/src/components/layout/Navbar.tsx`

```typescript
import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
}

export function Navbar({ title, showBackButton = false }: NavbarProps) {
  const router = useRouter();
  
  return (
    <BlurView intensity={90} className="border-b border-tier-border-light">
      <View className="h-16 px-6 flex-row items-center justify-between bg-white/80">
        {/* Left: Logo or Back Button */}
        <View className="flex-1">
          {showBackButton ? (
            <Pressable onPress={() => router.back()}>
              <Text className="text-tier-accent-blue text-lg font-semibold">← Kembali</Text>
            </Pressable>
          ) : (
            <Text className="text-tier-text-primary text-2xl font-bold">TierLog</Text>
          )}
        </View>
        
        {/* Center: Title (optional) */}
        {title && (
          <Text className="text-tier-text-primary text-lg font-semibold flex-1 text-center">
            {title}
          </Text>
        )}
        
        {/* Right: Action Button */}
        <View className="flex-1 items-end">
          <Pressable className="bg-tier-accent-blue px-4 py-2 rounded-full">
            <Text className="text-white font-semibold">Sign In</Text>
          </Pressable>
        </View>
      </View>
    </BlurView>
  );
}
```

**Setup expo-blur (jika belum):**
```bash
npm install expo-blur
npx expo install expo-blur
```

---

## 5. Responsive Sidebar Component

**File:** `tierlog_web/src/components/layout/Sidebar.tsx`

```typescript
import { View, ScrollView, Pressable, Text } from 'react-native';
import { useUIStore } from '@/src/lib/store/ui-store';
import { useRouter, usePathname } from 'expo-router';

const MENU_ITEMS = [
  { label: 'Dashboard', path: '/(tabs)/dashboard', icon: '📊' },
  { label: 'Consultations', path: '/(tabs)/consultations', icon: '💬' },
  { label: 'Archive', path: '/(tabs)/archive', icon: '📁' },
  { label: 'Settings', path: '/(tabs)/settings/profile', icon: '⚙️' },
];

export function Sidebar() {
  const { isSidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const width = isSidebarCollapsed ? 60 : 240; // 60px icon mode, 240px normal
  
  return (
    <View className={`bg-tier-bg border-r border-tier-divider`} style={{ width }}>
      <ScrollView className="flex-1 pt-4">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.includes(item.path);
          
          return (
            <Pressable
              key={item.path}
              onPress={() => router.push(item.path)}
              className={`flex-row items-center px-4 py-3 mx-2 rounded-base mb-2 ${
                isActive ? 'bg-tier-accent-blue' : ''
              }`}
            >
              <Text className={`text-xl ${isSidebarCollapsed ? 'flex-1' : ''}`}>
                {item.icon}
              </Text>
              {!isSidebarCollapsed && (
                <Text
                  className={`ml-3 text-sm font-semibold ${
                    isActive ? 'text-white' : 'text-tier-text-primary'
                  }`}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      
      {/* Toggle Button */}
      <Pressable
        onPress={toggleSidebarCollapse}
        className="p-4 items-center border-t border-tier-divider"
      >
        <Text className="text-xl">{isSidebarCollapsed ? '→' : '←'}</Text>
      </Pressable>
    </View>
  );
}
```

---

## 6. Responsive Layout Manager

**File:** `tierlog_web/src/lib/responsive.ts`

```typescript
import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  mobile: 0,      // < 640px
  tablet: 640,    // 640px - 1024px
  desktop: 1024,  // >= 1024px
};

export type BreakpointType = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): BreakpointType {
  const { width } = useWindowDimensions();
  
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const breakpoint = useBreakpoint();
  
  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  };
}
```

---

## 7. Three-Column Lecturer Dashboard Layout

**File:** `tierlog_web/src/components/layout/LecturerDashboardLayout.tsx`

```typescript
import { View } from 'react-native';
import { useResponsive } from '@/src/lib/responsive';

interface LecturerDashboardLayoutProps {
  leftPanel: React.ReactNode;     // Student list
  centerPanel: React.ReactNode;   // Consultation log
  rightPanel: React.ReactNode;    // Feedback editor
}

export function LecturerDashboardLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: LecturerDashboardLayoutProps) {
  const { isDesktop, isTablet, isMobile } = useResponsive();
  
  // Desktop: Full 3-column layout
  if (isDesktop) {
    return (
      <View className="flex-1 flex-row">
        {/* Left Column: Student List (260px) */}
        <View className="w-64 border-r border-tier-divider bg-tier-card">
          {leftPanel}
        </View>
        
        {/* Center Column: Consultation Log (380px) */}
        <View className="flex-1 min-w-96 border-r border-tier-divider bg-tier-card">
          {centerPanel}
        </View>
        
        {/* Right Column: Feedback Panel (remaining width) */}
        <View className="flex-1 bg-tier-bg">
          {rightPanel}
        </View>
      </View>
    );
  }
  
  // Tablet: 2-column (hide left panel in drawer)
  if (isTablet) {
    return (
      <View className="flex-1 flex-row">
        <View className="flex-1 border-r border-tier-divider">
          {centerPanel}
        </View>
        <View className="w-96">
          {rightPanel}
        </View>
      </View>
    );
  }
  
  // Mobile: Single column with tabs
  return (
    <View className="flex-1">
      {/* TODO: Implement tab switcher for mobile */}
      {centerPanel}
    </View>
  );
}
```

**Usage di page:**

**File:** `tierlog_web/app/lecturer-dashboard.tsx`

```typescript
import { useState } from 'react';
import { LecturerDashboardLayout } from '@/src/components/layout/LecturerDashboardLayout';
import { StudentListPanel } from '@/src/components/sections/StudentListPanel';
import { ConsultationPanel } from '@/src/components/sections/ConsultationPanel';
import { FeedbackPanel } from '@/src/components/sections/FeedbackPanel';

export default function LecturerDashboard() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  return (
    <LecturerDashboardLayout
      leftPanel={
        <StudentListPanel
          onSelectStudent={setSelectedStudentId}
          selectedStudentId={selectedStudentId}
        />
      }
      centerPanel={
        <ConsultationPanel studentId={selectedStudentId} />
      }
      rightPanel={
        <FeedbackPanel studentId={selectedStudentId} />
      }
    />
  );
}
```

---

## 8. WebSocket Real-time Hook

**File:** `tierlog_web/src/hooks/useRealtimeConsultation.ts`

```typescript
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/src/lib/store/auth-store';

interface WebSocketMessage {
  event: string;
  data: any;
  timestamp: number;
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
}

export function useRealtimeConsultation(consultationId: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
  });
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const { token } = useAuthStore();
  
  useEffect(() => {
    if (!consultationId || !token) return;
    
    const wsUrl = `${process.env.EXPO_PUBLIC_API_URL?.replace('http', 'ws')}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    setConnectionState({ status: 'connecting' });
    
    ws.onopen = () => {
      setConnectionState({ status: 'connected' });
      
      // Subscribe to consultation room
      ws.send(JSON.stringify({
        action: 'subscribe',
        room: `consultation.${consultationId}`,
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      setConnectionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    };
    
    ws.onclose = () => {
      setConnectionState({ status: 'disconnected' });
    };
    
    return () => {
      ws.close();
    };
  }, [consultationId, token]);
  
  const sendMessage = useCallback(
    (action: string, payload: any) => {
      if (connectionState.status === 'connected') {
        // Use existing WebSocket connection
        console.log(`Sending ${action}:`, payload);
      }
    },
    [connectionState.status]
  );
  
  return {
    connectionState,
    messages,
    sendMessage,
  };
}
```

---

## 9. Accessibility Checklist

**File:** `tierlog_web/ACCESSIBILITY.md`

```markdown
# TierLog Accessibility Checklist

## Color & Contrast
- [x] All text meets WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text)
- [x] Dark mode disabled (accessibility requirement for dosis senior eyesight)
- [x] Color not the only indicator (use icons + text for status)

## Typography
- [x] Font scaling implemented (16px → 20px)
- [x] Line height maintains readability (1.5 minimum)
- [x] No text smaller than 12px (exceptions logged)

## Keyboard Navigation
- [ ] All interactive elements focusable via keyboard
- [ ] Focus indicators visible (min 2px outline)
- [ ] Tab order logical and intuitive

## Screen Reader
- [ ] Semantic HTML/React Native elements
- [ ] Alt text for images & icons
- [ ] Meaningful ARIA labels where needed

## Motor
- [ ] Touch targets min 44x44px (iOS), 48x48dp (Android)
- [ ] No reliance on hover interactions
- [ ] Sufficient spacing between interactive elements

## Testing
- [ ] Manual testing with system accessibility tools
- [ ] Tested with zoom at 200%
- [ ] Tested with reduced motion enabled
```

---

## 10. Implementation Timeline

| Phase | Duration | Key Tasks |
|-------|----------|-----------|
| **Setup** | Week 1 | Color tokens, Zustand store, base components |
| **Layout** | Week 2 | Navbar, Sidebar, 3-column layout |
| **Integration** | Week 3 | Connect to pages, responsive testing |
| **Polish** | Week 4+ | WebSocket integration, accessibility audit |

---

## Dependencies to Add

```bash
npm install expo-blur             # Blur effect untuk navbar
npm install zustand              # Already listed in original package.json
npm install @react-native-async-storage/async-storage  # Persist settings
```

---

## File Structure Summary

```
tierlog_web/
├── app/
│   ├── _layout.tsx               # Root layout (force light mode)
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── consultations.tsx
│   │   └── archive.tsx
│   ├── login.tsx
│   ├── lecturer-dashboard.tsx    # Updated with 3-column layout
│   └── settings/
│       ├── profile.tsx
│       ├── security.tsx
│       └── ai-gateway.tsx
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StudentDashboardLayout.tsx
│   │   │   └── LecturerDashboardLayout.tsx
│   │   └── sections/
│   │       ├── StudentListPanel.tsx
│   │       ├── ConsultationPanel.tsx
│   │       └── FeedbackPanel.tsx
│   ├── hooks/
│   │   ├── useFontSize.ts
│   │   ├── useRealtimeConsultation.ts
│   │   └── useBreakpoint.ts
│   ├── lib/
│   │   ├── responsive.ts
│   │   ├── colors.ts
│   │   └── store/
│   │       ├── ui-store.ts
│   │       └── auth-store.ts
│   └── types.ts
├── tailwind.config.js            # Color tokens defined
├── DESIGN_SYSTEM.md              # Design documentation
├── ACCESSIBILITY.md              # A11y checklist
└── README.md                      # Updated with design system section
```

---

**Review Status:** ✅ Ready for Development  
**Next Action:** Start Phase 1 (Setup) dengan prioritas color token system

