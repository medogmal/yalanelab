
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "platform-config.json");

// Default Configuration
export const DEFAULT_CONFIG = {
  branding: {
    siteName: "Yalla Nelab",
    description: "منصة الألعاب الجماعية الأولى في العالم العربي",
    logoUrl: null, // If null, show text
    faviconUrl: null,
    primaryColor: "#f59e0b", // Amber-500
  },
  content: {
    heroTitle: "شارك الآن في البطولات المباشرة",
    heroSubtitle: "مرحباً بكم في منصة yalla nelab",
    footerText: "© 2026 yalla nelab",
    loginTitle: "تسجيل الدخول",
    signupTitle: "إنشاء حساب جديد",
  },
  features: {
    maintenanceMode: false,
    allowRegistration: true,
    enableTournaments: true,
  }
};

export type PlatformConfig = typeof DEFAULT_CONFIG;

export function getPlatformConfig(): PlatformConfig {
  if (!existsSync(CONFIG_FILE)) {
    if (!existsSync(DATA_DIR)) {
        try {
            mkdirSync(DATA_DIR, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }
    }
    try {
        writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
    } catch (e) {
        console.error("Failed to write default config", e);
    }
    return DEFAULT_CONFIG;
  }
  try {
    const data = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function savePlatformConfig(newConfig: PlatformConfig) {
    try {
        writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to save config", e);
        return false;
    }
}
