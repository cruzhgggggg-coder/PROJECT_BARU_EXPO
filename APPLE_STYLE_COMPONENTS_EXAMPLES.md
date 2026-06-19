# TierLog Apple-Style Components: Ready-to-Use Examples
## Implementasi Konkret dengan Code Siap Copy-Paste

**Purpose:** Contoh production-ready components yang langsung bisa digunakan  
**Format:** TSX + Tailwind CSS (React Native)

---

## CONTOH 1: Apple-Style Button Component

**File:** `tierlog_web/src/components/ui/Button.tsx`

```tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { MotiView } from 'moti';
import { usePrefersReducedMotion } from '@/src/hooks/usePrefersReducedMotion';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function AppleButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const variantStyles = {
    primary:
      'bg-tier-accent-blue active:opacity-90 active:bg-opacity-90',
    secondary:
      'bg-tier-bg border border-tier-divider-light active:bg-tier-bg-secondary',
    danger: 'bg-tier-accent-danger active:opacity-90',
    success: 'bg-tier-accent-success active:opacity-90',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const textColor =
    variant === 'secondary'
      ? 'text-tier-text-primary'
      : 'text-white';

  const scale = isPressed ? 0.98 : isHovered ? 1.02 : 1;
  const opacity = disabled ? 0.5 : 1;

  return (
    <MotiView
      animate={{
        scale: prefersReduced ? 1 : scale,
        opacity,
      }}
      transition={{
        type: 'timing',
        duration: prefersReduced ? 0 : 150,
        easing: (t) => {
          // ease-out-cubic
          return 1 - Math.pow(1 - t, 3);
        },
      }}
      className={fullWidth ? 'w-full' : ''}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => !prefersReduced && setIsPressed(true)}
        onPressOut={() => !prefersReduced && setIsPressed(false)}
        onMouseEnter={() => !prefersReduced && setIsHovered(true)}
        onMouseLeave={() => !prefersReduced && setIsHovered(false)}
        className={`
          rounded-full items-center justify-center
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' ? '#1D1D1F' : '#FFFFFF'}
          />
        ) : (
          <Text
            className={`
              font-semibold
              ${textColor}
              ${size === 'sm' ? 'text-xs' : ''}
              ${size === 'md' ? 'text-sm' : ''}
              ${size === 'lg' ? 'text-base' : ''}
            `}
          >
            {children}
          </Text>
        )}
      </Pressable>
    </MotiView>
  );
}

// Usage:
// <AppleButton variant="primary" size="md" onPress={() => {}}>
//   Mulai Sekarang
// </AppleButton>
```

---

## CONTOH 2: Apple-Style Card Component

**File:** `tierlog_web/src/components/ui/Card.tsx`

```tsx
import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { MotiView } from 'moti';
import { usePrefersReducedMotion } from '@/src/hooks/usePrefersReducedMotion';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  hoverable?: boolean;
  onPress?: () => void;
  className?: string;
}

export function AppleCard({
  children,
  hoverable = false,
  onPress,
  className = '',
  ...props
}: CardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const cardContent = (
    <MotiView
      animate={{
        shadowOpacity: prefersReduced ? 0.05 : isHovered ? 0.12 : 0.05,
        scale: prefersReduced ? 1 : isHovered ? 1.02 : 1,
      }}
      transition={{
        type: 'timing',
        duration: prefersReduced ? 0 : 200,
      }}
    >
      <View
        className={`
          bg-tier-card rounded-base border border-tier-divider-light
          shadow-sm
          ${isHovered && hoverable ? 'bg-tier-bg-secondary' : ''}
          ${className}
        `}
        onMouseEnter={() => hoverable && setIsHovered(true)}
        onMouseLeave={() => hoverable && setIsHovered(false)}
        {...props}
      >
        {children}
      </View>
    </MotiView>
  );

  if (hoverable && onPress) {
    return (
      <Pressable onPress={onPress}>
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

// Usage:
// <AppleCard className="p-6" hoverable onPress={() => {}}>
//   <Text>Card content</Text>
// </AppleCard>
```

---

## CONTOH 3: Apple-Style Badge Component

**File:** `tierlog_web/src/components/ui/Badge.tsx`

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';

interface BadgeProps {
  label: string;
  severity?: 'major' | 'minor' | 'success' | 'caution';
  animated?: boolean;
  className?: string;
}

export function AppleBadge({
  label,
  severity = 'minor',
  animated = true,
  className = '',
}: BadgeProps) {
  const severityMap = {
    major: {
      bg: 'bg-tier-accent-danger',
      text: 'text-white',
      icon: '⚠️',
    },
    minor: {
      bg: 'bg-tier-text-secondary',
      text: 'text-white',
      icon: '📝',
    },
    success: {
      bg: 'bg-tier-accent-success',
      text: 'text-white',
      icon: '✓',
    },
    caution: {
      bg: 'bg-tier-accent-caution',
      text: 'text-white',
      icon: '⚠️',
    },
  };

  const styles = severityMap[severity];

  if (animated) {
    return (
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 300,
        }}
      >
        <View
          className={`
            ${styles.bg} px-3 py-1 rounded-sm
            flex-row items-center gap-1
            ${className}
          `}
        >
          <Text className={`${styles.text} text-xs font-semibold`}>
            {label}
          </Text>
        </View>
      </MotiView>
    );
  }

  return (
    <View
      className={`
        ${styles.bg} px-3 py-1 rounded-sm
        flex-row items-center gap-1
        ${className}
      `}
    >
      <Text className={`${styles.text} text-xs font-semibold`}>
        {label}
      </Text>
    </View>
  );
}

// Usage:
// <AppleBadge label="Major" severity="major" animated />
```

---

## CONTOH 4: Apple-Style Input Component

**File:** `tierlog_web/src/components/ui/Input.tsx`

```tsx
import React from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { MotiView } from 'moti';

interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function AppleInput({
  label,
  helper,
  error,
  icon,
  disabled = false,
  className = '',
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View className={`${className}`}>
      {label && (
        <Text className="text-tier-text-primary text-sm font-semibold mb-2">
          {label}
        </Text>
      )}

      <MotiView
        animate={{
          borderColor: isFocused
            ? '#007AFF'
            : error
              ? '#FF3B30'
              : '#E5E5E7',
        }}
        transition={{ type: 'timing', duration: 150 }}
      >
        <View
          className={`
            flex-row items-center
            bg-tier-bg rounded-base border-2
            px-4 py-3
            ${error ? 'border-tier-accent-danger' : 'border-tier-divider-light'}
            ${disabled ? 'opacity-50' : ''}
            ${isFocused ? 'border-tier-accent-blue' : ''}
          `}
        >
          {icon && <View className="mr-3">{icon}</View>}

          <TextInput
            {...props}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            className={`
              flex-1 text-tier-text-primary text-base font-normal
              ${disabled ? 'opacity-50' : ''}
            `}
            placeholderTextColor="#A1A1A6"
          />
        </View>
      </MotiView>

      {error && (
        <Text className="text-tier-accent-danger text-xs mt-1">
          {error}
        </Text>
      )}

      {helper && !error && (
        <Text className="text-tier-text-tertiary text-xs mt-1">
          {helper}
        </Text>
      )}
    </View>
  );
}

// Usage:
// <AppleInput
//   label="Email"
//   placeholder="user@example.com"
//   error={emailError}
//   helper="We'll never share your email"
// />
```

---

## CONTOH 5: Apple-Style Navbar Component

**File:** `tierlog_web/src/components/layout/Navbar.tsx`

```tsx
import React from 'react';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/src/lib/responsive';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

export function AppleNavbar({
  title,
  showBackButton = false,
  rightAction,
}: NavbarProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();

  return (
    <BlurView intensity={90} className="border-b border-tier-divider-light">
      <SafeAreaView>
        <View
          className={`
            flex-row items-center justify-between
            bg-white/80 border-b border-tier-divider-light
            ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}
          `}
        >
          {/* LEFT: Logo atau Back Button */}
          <View className="flex-1">
            {showBackButton ? (
              <Pressable
                onPress={() => router.back()}
                className="flex-row items-center"
              >
                <Text className="text-tier-accent-blue text-base font-semibold">
                  ← Kembali
                </Text>
              </Pressable>
            ) : (
              <Text className="text-tier-text-primary text-xl font-bold">
                TierLog
              </Text>
            )}
          </View>

          {/* CENTER: Title */}
          {title && (
            <Text
              className={`
                text-tier-text-primary font-semibold text-center flex-1
                ${isMobile ? 'text-sm' : 'text-base'}
              `}
            >
              {title}
            </Text>
          )}

          {/* RIGHT: Action atau Profile */}
          <View className="flex-1 items-end">
            {rightAction || (
              <Pressable className="rounded-full bg-tier-accent-blue px-4 py-2">
                <Text className="text-white font-semibold text-sm">
                  Sign In
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </BlurView>
  );
}

// Usage:
// <AppleNavbar title="Dashboard" showBackButton />
```

---

## CONTOH 6: Apple-Style Sidebar Component

**File:** `tierlog_web/src/components/layout/Sidebar.tsx`

```tsx
import React from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  SafeAreaView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useUIStore } from '@/src/lib/store/ui-store';
import { useResponsive } from '@/src/lib/responsive';
import { MotiView } from 'moti';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', path: '/(tabs)/dashboard', icon: '📊' },
  { label: 'Consultations', path: '/(tabs)/consultations', icon: '💬' },
  { label: 'Archive', path: '/(tabs)/archive', icon: '📁' },
  { label: 'Settings', path: '/(tabs)/settings/profile', icon: '⚙️' },
];

export function AppleSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { isMobile } = useResponsive();

  const sidebarWidth = isSidebarCollapsed ? 64 : 240;

  return (
    <MotiView
      animate={{ width: isMobile ? 0 : sidebarWidth }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <SafeAreaView className="h-full bg-tier-bg border-r border-tier-divider flex flex-col">
        {/* Header */}
        <View className="px-4 py-4 border-b border-tier-divider">
          {!isSidebarCollapsed && (
            <Text className="text-tier-text-primary font-bold text-lg">
              TierLog
            </Text>
          )}
        </View>

        {/* Menu Items */}
        <ScrollView className="flex-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname.includes(item.path);

            return (
              <Pressable
                key={item.path}
                onPress={() => router.push(item.path)}
                className={`
                  flex-row items-center gap-3
                  px-4 py-3 mx-2 mb-1 rounded-base
                  ${
                    isActive
                      ? 'bg-tier-accent-blue'
                      : 'bg-transparent hover:bg-tier-bg-secondary'
                  }
                `}
              >
                <Text className="text-xl">{item.icon}</Text>

                {!isSidebarCollapsed && (
                  <Text
                    className={`
                      text-sm font-semibold
                      ${
                        isActive
                          ? 'text-white'
                          : 'text-tier-text-primary'
                      }
                    `}
                  >
                    {item.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Toggle Button */}
        <View className="border-t border-tier-divider p-4">
          <Pressable
            onPress={toggleSidebarCollapse}
            className="items-center justify-center py-2"
          >
            <Text className="text-xl text-tier-text-secondary">
              {isSidebarCollapsed ? '→' : '←'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </MotiView>
  );
}

// Usage:
// <AppleSidebar />
```

---

## CONTOH 7: Apple-Style Animated Chat Message

**File:** `tierlog_web/src/components/sections/ChatMessage.tsx`

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { usePrefersReducedMotion } from '@/src/hooks/usePrefersReducedMotion';

interface ChatMessageProps {
  content: string;
  isFromAI: boolean;
  timestamp?: Date;
}

export function AppleChatMessage({
  content,
  isFromAI,
  timestamp,
}: ChatMessageProps) {
  const prefersReduced = usePrefersReducedMotion();

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <MotiView
      from={{
        opacity: prefersReduced ? 1 : 0,
        y: prefersReduced ? 0 : 20,
      }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'timing',
        duration: prefersReduced ? 0 : 350,
        easing: (t) => {
          // ease-out-back
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2 + 1;
        },
      }}
    >
      <View
        className={`
          flex-row gap-3 mb-3
          ${isFromAI ? 'justify-start' : 'justify-end'}
        `}
      >
        {/* Avatar (AI only) */}
        {isFromAI && (
          <View className="w-8 h-8 rounded-full bg-tier-accent-blue items-center justify-center">
            <Text>🤖</Text>
          </View>
        )}

        {/* Message Bubble */}
        <View
          className={`
            max-w-xs px-4 py-3 rounded-2xl
            ${
              isFromAI
                ? 'bg-tier-bg text-tier-text-primary rounded-tl-none'
                : 'bg-tier-accent-blue text-white rounded-tr-none'
            }
          `}
        >
          <Text
            className={`
              text-base leading-relaxed
              ${isFromAI ? 'text-tier-text-primary' : 'text-white'}
            `}
          >
            {content}
          </Text>

          {/* Timestamp */}
          {timestamp && (
            <Text
              className={`
                text-xs mt-1
                ${isFromAI ? 'text-tier-text-tertiary' : 'text-white/60'}
              `}
            >
              {formatTime(timestamp)}
            </Text>
          )}
        </View>
      </View>
    </MotiView>
  );
}

// Usage:
// <AppleChatMessage
//   content="Silakan jelaskan metodologi penelitian Anda"
//   isFromAI={true}
//   timestamp={new Date()}
// />
```

---

## CONTOH 8: Apple-Style Responsive Hero Section

**File:** `tierlog_web/src/components/sections/HeroSection.tsx`

```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useResponsive } from '@/src/lib/responsive';
import { AppleButton } from '@/src/components/ui/Button';
import { MotiView } from 'moti';
import { usePrefersReducedMotion } from '@/src/hooks/usePrefersReducedMotion';

export function HeroSection() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const prefersReduced = usePrefersReducedMotion();

  return (
    <View
      className={`
        w-full bg-tier-bg items-center
        ${isMobile ? 'px-4 py-12' : ''}
        ${isTablet ? 'px-8 py-16' : ''}
        ${isDesktop ? 'px-12 py-24' : ''}
      `}
    >
      {/* Animated Title */}
      <MotiView
        from={{
          opacity: prefersReduced ? 1 : 0,
          y: prefersReduced ? 0 : -20,
        }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'timing',
          duration: prefersReduced ? 0 : 500,
          delay: 0,
        }}
      >
        <Text
          className={`
            font-bold text-center font-display text-tier-text-primary
            ${isMobile ? 'text-3xl' : ''}
            ${isTablet ? 'text-4xl' : ''}
            ${isDesktop ? 'text-5xl' : ''}
          `}
        >
          Bimbing Skripsi dengan AI
        </Text>
      </MotiView>

      {/* Animated Subtitle */}
      <MotiView
        from={{
          opacity: prefersReduced ? 1 : 0,
          y: prefersReduced ? 0 : -20,
        }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'timing',
          duration: prefersReduced ? 0 : 500,
          delay: prefersReduced ? 0 : 100,
        }}
      >
        <Text
          className={`
            text-tier-text-secondary text-center
            ${isMobile ? 'text-sm mt-4 max-w-xs' : ''}
            ${isTablet ? 'text-base mt-6 max-w-md' : ''}
            ${isDesktop ? 'text-lg mt-8 max-w-2xl' : ''}
          `}
        >
          TierLog mengintegrasikan transkripsi audio, OCR, dan AI untuk memberikan
          feedback revisi yang presisi dan real-time.
        </Text>
      </MotiView>

      {/* Animated CTA Button */}
      <MotiView
        from={{
          opacity: prefersReduced ? 1 : 0,
          scale: prefersReduced ? 1 : 0.9,
        }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: 'timing',
          duration: prefersReduced ? 0 : 500,
          delay: prefersReduced ? 0 : 200,
        }}
        className={isMobile ? 'mt-6' : isTablet ? 'mt-8' : 'mt-10'}
      >
        <AppleButton variant="primary" size="lg" onPress={() => {}}>
          Mulai Sekarang
        </AppleButton>
      </MotiView>
    </View>
  );
}

// Usage:
// <HeroSection />
```

---

## CONTOH 9: Apple-Style Features Grid (Bento Layout)

**File:** `tierlog_web/src/components/sections/FeaturesGrid.tsx`

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useResponsive } from '@/src/lib/responsive';
import { AppleCard } from '@/src/components/ui/Card';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: '🎙️',
    title: 'Transkripsi Audio',
    description: 'Groq Whisper mengkonversi rekaman bimbingan menjadi teks otomatis',
  },
  {
    icon: '🤖',
    title: 'AI Oracle',
    description: 'Asisten AI yang hanya menjawab berdasarkan feedback resmi dosen',
  },
  {
    icon: '📸',
    title: 'Annotation OCR',
    description: 'Gemini Vision membaca catatan tangan dan track changes dokumen',
  },
];

export function FeaturesGrid() {
  const { isMobile, isTablet } = useResponsive();

  return (
    <View
      className={`
        w-full
        ${isMobile ? 'px-4 py-8' : ''}
        ${isTablet ? 'px-8 py-12' : ''}
        ${!isTablet ? 'px-12 py-16' : ''}
      `}
    >
      {/* Grid */}
      <View
        className={`
          flex-row flex-wrap gap-4
          ${isMobile ? 'flex-col' : ''}
          ${isTablet ? 'flex-row' : ''}
          ${!isTablet ? 'flex-row' : ''}
        `}
      >
        {FEATURES.map((feature, index) => (
          <AppleCard
            key={index}
            hoverable
            className={`
              p-6
              ${isMobile ? 'w-full' : ''}
              ${isTablet ? 'flex-1' : ''}
              ${!isTablet ? 'flex-1' : ''}
            `}
          >
            {/* Icon */}
            <Text className="text-5xl mb-4">{feature.icon}</Text>

            {/* Title */}
            <Text className="font-bold text-tier-text-primary text-lg mb-2 font-display">
              {feature.title}
            </Text>

            {/* Description */}
            <Text className="text-tier-text-secondary text-sm leading-relaxed">
              {feature.description}
            </Text>
          </AppleCard>
        ))}
      </View>
    </View>
  );
}

// Usage:
// <FeaturesGrid />
```

---

## CONTOH 10: Complete Landing Page Integration

**File:** `tierlog_web/app/index.tsx`

```tsx
import { ScrollView, View } from 'react-native';
import { AppleNavbar } from '@/src/components/layout/Navbar';
import { HeroSection } from '@/src/components/sections/HeroSection';
import { FeaturesGrid } from '@/src/components/sections/FeaturesGrid';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingPage() {
  return (
    <SafeAreaView className="flex-1 bg-tier-bg">
      <AppleNavbar />
      
      <ScrollView className="flex-1">
        {/* Hero */}
        <HeroSection />
        
        {/* Features */}
        <FeaturesGrid />
        
        {/* Footer */}
        <View className="bg-tier-bg border-t border-tier-divider px-6 py-8">
          <View className="items-center gap-4">
            <View className="flex-row gap-8">
              <Text className="text-tier-text-secondary text-xs">
                © 2024 TierLog
              </Text>
              <Text className="text-tier-text-secondary text-xs">
                Privacy
              </Text>
              <Text className="text-tier-text-secondary text-xs">
                Terms
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Package.json Dependencies

```json
{
  "dependencies": {
    "react-native": "^0.79.0",
    "expo": "^53.0.0",
    "expo-router": "^5.0.0",
    "nativewind": "^4.0.0",
    "zustand": "^4.5.0",
    "moti": "^0.30.0",
    "expo-blur": "^13.0.0",
    "expo-constants": "^16.0.0",
    "react-native-safe-area-context": "^4.10.0"
  }
}
```

---

## Install Commands

```bash
npm install expo-blur moti zustand
npx expo install expo-blur
npm install -D nativewind tailwindcss
```

---

**Status:** ✅ All components ready for copy-paste and customization

