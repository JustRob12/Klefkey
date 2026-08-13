# 📱 App Design System Guide

> A complete style and architecture guide to ensure all future apps look and feel like they belong to the same family — minimal, clean, and premium.

---

## 🎯 Philosophy

- **Minimal first** — every element must earn its place on screen
- **One action per screen** — don't overwhelm the user
- **Colors do the talking** — use `colors.primary` to direct attention, not random accent colors
- **No borders unless needed** — rely on background differences, not outlines, to separate sections
- **Mobile-first** — design for thumbs, not cursors

---

## 🗂️ Project Structure

```
src/
├── context/
│   └── AppContext.tsx         # All state, all data, all methods — single source of truth
├── screens/
│   ├── HomeScreen.tsx
│   ├── AddXScreen.tsx         # Every "add" has its own screen
│   └── XScreen.tsx            # Every list/detail has its own screen
├── components/
│   ├── ActionSheet.tsx        # Bottom slide-up modal
│   ├── FeedbackModal.tsx      # Success / error toast overlay
│   ├── ConfirmModal.tsx       # Destructive confirmation dialog
│   ├── MainHeader.tsx         # App-wide top header
│   └── BottomTabNavigator.tsx # Main bottom navigation
├── navigation/
│   └── navigationUtils.ts    # navigationRef for use outside components
├── hooks/
│   └── useScrollHideTabBar.ts # Hides tab bar when scrolling down
└── theme/
    └── index.ts              # All colors, spacing, fonts, border radii
```


---

## 🔤 Typography

**Font Family:** `Inter` (Google Fonts, loaded via `@expo-google-fonts/inter`)

```typescript
theme.fonts.regular   // 'Inter_400Regular'  — body text, descriptions
theme.fonts.medium    // 'Inter_500Medium'   — labels, subtitles
theme.fonts.semiBold  // 'Inter_600SemiBold' — section headers, emphasized labels
theme.fonts.bold      // 'Inter_700Bold'     — screen titles, card amounts, CTAs
```

### Font Size Scale (Responsive)

Always use `rf()` for font sizes so they scale correctly on all screen sizes:

```typescript
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;
const rf = (size: number) => Math.round(size * scale);
```

| Usage                     | Size     |
|---------------------------|----------|
| Screen / page title       | `rf(20)` |
| Section header            | `rf(18)` |
| Card title / item name    | `rf(16)` |
| Body text                 | `rf(15)` |
| Labels, subtitles         | `rf(13)` |
| Badges, tiny text         | `rf(11)` |
| Small caps section labels | `rf(11)` with `letterSpacing: 0.8` |
| Large amounts / balance   | `rf(28–38)` |

### Text Rules

- **Amount displays**: `fontFamily: theme.fonts.bold, fontSize: rf(28+)`
- **Section labels (ALL CAPS)**: `fontFamily: theme.fonts.bold, letterSpacing: 0.8, fontSize: rf(11)`
- **Card primary text**: `fontFamily: theme.fonts.bold`
- **Supporting text**: `fontFamily: theme.fonts.medium`
- **Never use default system font** — always set `fontFamily`

---

## 📐 Spacing System

```typescript
theme.spacing.xs   // 4
theme.spacing.sm   // 8
theme.spacing.md   // 16
theme.spacing.lg   // 24
theme.spacing.xl   // 32
theme.spacing.xxl  // 48
```

**Common patterns:**
- Screen horizontal padding: `paddingHorizontal: 20`
- Between cards in a list: `gap: 12–16`
- Card internal padding: `padding: 16–20`
- Between label and input: `marginBottom: 8`
- Top margin for new form sections: `marginTop: 14`

---

## 🟦 Border Radius

```typescript
theme.borderRadius.sm    // 4
theme.borderRadius.md    // 8
theme.borderRadius.lg    // 12
theme.borderRadius.xl    // 16
theme.borderRadius.full  // 9999 (pill)
```

**In practice:**
- Cards: `borderRadius: 20–24`
- Buttons / CTAs: `borderRadius: 16–18`
- Chips / tags: `borderRadius: 12–14`
- Inputs: `borderRadius: 14–16`
- Icon boxes: `borderRadius: 12–16`
- Circular icons/avatars: `borderRadius: 9999`
- Bottom sheets: `borderTopLeftRadius: 32, borderTopRightRadius: 32`

---

## 🧩 Component Patterns

### 1. Screen Header (Back Button Pattern)

```tsx
<SafeAreaView style={{ backgroundColor: colors.background }} edges={['top']}>
  <View style={{
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border
  }}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
      <ChevronLeft size={24} color={colors.text} />
    </TouchableOpacity>
    <Text style={{ fontFamily: theme.fonts.bold, fontSize: rf(18), color: colors.text }}>
      Screen Title
    </Text>
    <View style={{ width: 40 }} />{/* Spacer for visual balance */}
  </View>
```

### 2. Form Input Field

```tsx
<Text style={{ fontFamily: theme.fonts.semiBold, fontSize: rf(13), color: colors.text, marginBottom: 8, marginTop: 14 }}>
  Field Label
</Text>
<View style={{
  flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 16,
  borderWidth: 1, paddingHorizontal: 16, borderColor: colors.border,
  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'
}}>
  <IconName size={18} color={colors.primary} style={{ marginRight: 10 }} />
  <TextInput
    style={{ flex: 1, fontFamily: theme.fonts.medium, fontSize: rf(15), color: colors.text }}
    placeholder="Placeholder text"
    placeholderTextColor={colors.textMuted}
    value={value}
    onChangeText={setValue}
  />
</View>
```

### 3. Primary CTA Button

```tsx
<TouchableOpacity
  style={{
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: 18, backgroundColor: colors.primary,
    gap: 10, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
  }}
  onPress={handleSave}
  activeOpacity={0.85}
>
  <Check size={20} color="#ffffff" />
  <Text style={{ fontFamily: theme.fonts.bold, fontSize: rf(16), color: '#ffffff' }}>
    Save / Confirm
  </Text>
</TouchableOpacity>
```

### 4. Standard Card

```tsx
<View style={{
  backgroundColor: colors.card, borderRadius: 22, padding: 20,
  borderWidth: 1, borderColor: colors.border, marginBottom: 12,
}}>
  {/* Card content */}
</View>
```

### 5. Urgent / Alert Gradient Card (deadline within 3 days)

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#ef4444', '#dc2626', '#991b1b']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{
    borderRadius: 24, padding: 20, elevation: 6,
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12
  }}
>
  {/* White text only inside gradient cards */}
</LinearGradient>
```

### 6. Section Header with "See All"

```tsx
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
  <Text style={{ fontFamily: theme.fonts.bold, fontSize: rf(16), color: colors.text }}>
    Section Title
  </Text>
  <TouchableOpacity onPress={() => navigation.navigate('Screen')}>
    <Text style={{ fontFamily: theme.fonts.bold, fontSize: rf(12), color: colors.primary, letterSpacing: 0.5 }}>
      SEE ALL
    </Text>
  </TouchableOpacity>
</View>
```

### 7. Icon Box (small icon inside a rounded container)

```tsx
<View style={{
  width: 40, height: 40, borderRadius: 14,
  backgroundColor: colors.primary + '20', // ~12% opacity tint
  alignItems: 'center', justifyContent: 'center'
}}>
  <HomeIcon size={18} color={colors.primary} />
</View>
```

### 8. Toggle / Segmented Selector (e.g. PHP/USD)

```tsx
<View style={{ flexDirection: 'row', gap: 12 }}>
  {['PHP', 'USD'].map((option) => (
    <TouchableOpacity
      key={option}
      style={{
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 46, borderRadius: 14, borderWidth: 1,
        backgroundColor: selected === option ? colors.primary : 'transparent',
        borderColor: selected === option ? colors.primary : colors.border,
        gap: 8,
      }}
      onPress={() => setSelected(option)}
    >
      <Text style={{ fontFamily: theme.fonts.bold, fontSize: rf(13), color: selected === option ? '#fff' : colors.text }}>
        {option}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

### 9. Horizontal Chip List (wallet/tag selection)

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
  {items.map((item) => (
    <TouchableOpacity
      key={item.id}
      style={{
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1,
        backgroundColor: selected === item.id ? colors.primary : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
        borderColor: selected === item.id ? colors.primary : colors.border,
      }}
      onPress={() => setSelected(item.id)}
    >
      <Text style={{ fontFamily: theme.fonts.semiBold, fontSize: rf(13), color: selected === item.id ? '#fff' : colors.text }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

---

## 🪟 Modals & Overlays

### ActionSheet (Bottom Sheet)

Use the shared `ActionSheet` component — never build your own from scratch.

```tsx
import ActionSheet from '../components/ActionSheet';

<ActionSheet visible={modalVisible} onClose={() => setModalVisible(false)} title="Add Something">
  {/* Form fields go here */}
</ActionSheet>
```

**Key specs:**
- `borderTopLeftRadius: 32, borderTopRightRadius: 32`
- Slides up with spring animation (`tension: 65, friction: 11`)
- Max height: 85% of screen
- Background: `colors.background` (not `colors.card`)
- Always includes a `Cancel` button top-right

### Inline Full-Screen Modal

For flows that need a centered dialog (date pickers, confirmations):

```tsx
<Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <View style={{ width: '100%', borderRadius: 24, padding: 24, backgroundColor: colors.card }}>
      {/* Content */}
    </View>
  </View>
</Modal>
```

> ⚠️ **Always use `animationType="none"`** for inline modals. `"slide"` causes a black background flash on open that looks broken.

### Feedback Toast (Success / Error)

Use the shared `FeedbackModal` via context — never build custom toasts.

```typescript
const { showFeedback } = useAppContext();

showFeedback('success', 'Saved Successfully');
showFeedback('error', 'Something went wrong');
showFeedback('delete', 'Item Removed');
```

### Confirm Dialog (Destructive Actions)

```typescript
const { showConfirm } = useAppContext();

showConfirm(
  'Delete Item',
  'Are you sure you want to remove this?',
  () => deleteItem(id)
);
```

---

## 🏗️ AppContext Architecture

**All state and all operations live in `AppContext.tsx`.** Screens are presentational — they call context methods and never manage their own persistence or business logic.

### Context Provider Pattern

```typescript
// Every entity follows this identical pattern:
const [items, setItems] = useState<ItemType[]>([]);

// 1. Load from AsyncStorage on app mount
const storedItems = await AsyncStorage.getItem('@items');
if (storedItems) setItems(JSON.parse(storedItems));

// 2. CRUD methods save to AsyncStorage on every change
const addItem = async (data) => {
  const newItem: ItemType = {
    ...data,
    id: Date.now().toString(),
    date: new Date().toISOString()
  };
  const updated = [newItem, ...items];
  setItems(updated);
  await AsyncStorage.setItem('@items', JSON.stringify(updated));
  showFeedback('success', 'Item Added');
};

const deleteItem = async (id: string) => {
  const updated = items.filter(i => i.id !== id);
  setItems(updated);
  await AsyncStorage.setItem('@items', JSON.stringify(updated));
  showFeedback('delete', 'Item Removed');
};
```

### Storage Key Convention

```
@wallets          @transactions     @goals
@groceryLists     @installments     @rents
@withdrawPresets  @subscriptions    @recursions
@travels          @appPin           @isDarkMode
@treeType         @usdToPhpRate
```

Always prefix with `@` for all AsyncStorage keys.

### Exporting Helpers from Context

Pure utility functions used across multiple screens should be exported from `AppContext.tsx`:

```typescript
// Export non-hook utility functions
export const getWalletTotalBalanceInPhp = (wallet, usdToPhpRate) => { ... };
export const calculateNextDueDate = (startDateStr, paidMonths) => { ... };

// Import in screens:
import { useAppContext, getWalletTotalBalanceInPhp } from '../context/AppContext';
```

---

## 🧭 Navigation Architecture

Uses `@react-navigation/native-stack`.

### Stack Structure

```
Stack.Navigator (headerShown: false)
├── Onboarding              (new user flow — only shown once)
├── Main → BottomTabNavigator
│   ├── Home
│   ├── Wallets
│   ├── Goals
│   └── History
├── GoalDetail / AddGoal
├── Installment / AddInstallment
├── Rent / AddRent
├── GroceryDetail
├── Subscription / AddSubscription
├── Travel / AddTravel
├── Deposit / Withdraw / Transfer
├── CurrencyConverter
├── Settings / DataTransfer / Security
└── ... (every feature gets its own registered screen)
```

### Navigation Rules

```typescript
// In any screen:
const navigation = useNavigation<any>();
navigation.navigate('ScreenName', { param: value });
navigation.goBack();

// Always register in App.tsx:
import NewScreen from './src/screens/NewScreen';
// ...
<Stack.Screen name="NewScreen" component={NewScreen} />
```

---

## ✅ Do's and Don'ts

### ✅ Do

- Use `getStyles(colors, isDarkMode)` factory pattern — define styles inside a function call, per file
- Use `SafeAreaView` with `edges={['top']}` on all screens that have their own header
- Use `adjustsFontSizeToFit={true} minimumFontScale={0.5} numberOfLines={1}` on any currency/amount text
- Use `expo-linear-gradient` for urgency / deadline cards (red gradient)
- Use `lucide-react-native` for all icons — consistent weight, consistent style throughout
- Set `showsVerticalScrollIndicator={false}` on all ScrollViews
- Add `paddingBottom: 110` on scroll content so the last card is not hidden behind the bottom tab bar
- Auto-select first wallet when navigating to an expense/income screen (`useEffect`)
- Export shared pure functions from `AppContext.tsx` so screens can use them without prop drilling

### ❌ Don't

- Don't hardcode `#10b981` or any brand color — always use `colors.primary`
- Don't use inline random colors (e.g. `color="#22c55e"`) for anything theme-related
- Don't use `Alert.alert()` — use `showConfirm()` or `showFeedback()` from context
- Don't use `animationType="slide"` on `<Modal>` — causes black background flash
- Don't use `position: absolute` for layout — use flexbox
- Don't forget `KeyboardAvoidingView` inside any modal with text inputs
- Don't put business logic or AsyncStorage calls directly in screen files
- Don't navigate inside `useEffect` without checking `navigationRef.isReady()`
- Don't forget `numberOfLines={1}` on names/titles that could wrap
- Don't use hardcoded pixel widths — use `flex`, `%`, or `Dimensions` + `rf()` scaling

---

## 📦 Required Dependencies

```json
{
  "expo": "~54.x",
  "react-native": "0.81.x",
  "@react-navigation/native": "^7.x",
  "@react-navigation/native-stack": "^7.x",
  "@react-navigation/bottom-tabs": "^7.x",
  "expo-linear-gradient": "^14.x",
  "expo-notifications": "^0.31.x",
  "lucide-react-native": "^0.475.x",
  "react-native-safe-area-context": "^5.x",
  "react-native-svg": "^15.x",
  "@expo-google-fonts/inter": "^0.2.x",
  "@react-native-async-storage/async-storage": "^2.x"
}
```

---

## 🌟 Premium UI Touches (That Matter)

These small details are what make the app feel expensive and polished — not optional:

| Touch | Implementation |
|-------|----------------|
| Spring-animated modals | `tension: 65, friction: 11` (not `timing`) |
| Button shadow | `shadowColor: '#000', shadowOpacity: 0.2, elevation: 4` |
| Gradient urgency cards | Red `expo-linear-gradient` when deadline ≤ 3 days |
| Icon container tint | `colors.primary + '20'` (12% alpha) for icon backgrounds |
| Responsive amounts | `adjustsFontSizeToFit + minimumFontScale={0.5}` |
| Step progress dots | Animated dot row for multi-step form flows |
| Balance hide toggle | Eye/EyeOff icon to mask sensitive data |
| Auto-dismiss feedback | Feedback toast disappears after ~1.5 seconds |
| ALL CAPS section labels | `letterSpacing: 0.8` + `fontSize: rf(11)` + bold |
| `activeOpacity={0.85}` | On all primary buttons — subtle press feedback |

---

## 🔔 Notifications Pattern

Use `expo-notifications` for local scheduled alerts:

```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Payment Due Soon',
    body: `${itemName} is due in 3 days`,
    data: { screen: 'Installment' },
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: threeDaysBeforeDue,
  },
});
```

Tap on notification should navigate to the relevant screen using `Notifications.addNotificationResponseReceivedListener`.

---

## 📋 New Screen Checklist

When building a new screen, verify:

- [ ] `import { useAppContext } from '../context/AppContext'` — get `colors`, `isDarkMode`
- [ ] `SafeAreaView` with `edges={['top']}`
- [ ] `const styles = getStyles(colors, isDarkMode)` pattern used
- [ ] All font sizes use `rf()` helper
- [ ] All `fontFamily` use `theme.fonts.*`
- [ ] All colors use `colors.*` — no raw hex (except gradients / red alerts)
- [ ] All ScrollViews have `showsVerticalScrollIndicator={false}`
- [ ] Scroll content has `paddingBottom: 110`
- [ ] Screen registered in `App.tsx` `Stack.Navigator`
- [ ] Import added at top of `App.tsx`
- [ ] Works in both light mode and dark mode
- [ ] Long text / large numbers don't overflow card containers
- [ ] All destructive actions use `showConfirm()`, not `Alert.alert()`
- [ ] Success / error states use `showFeedback()`, not custom toasts

---

*Generated from Leafy — Personal Finance Tracker*
*Use this as your foundation for any future app you build.*
*Consistent design language = apps that feel like a product family.*
