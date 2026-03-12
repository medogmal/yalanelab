"use client";
import React from "react";
import { Settings, Server, Globe, Shield, CreditCard, Mail, UploadCloud, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GeneralSettings() {
  const router = useRouter();
  const [config, setConfig] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/config")
      .then(res => res.json())
      .then(setConfig);
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
        await fetch("/api/admin/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(config),
        });
        alert("تم حفظ الإعدادات بنجاح");
        router.refresh(); // Refresh to update layout
    } catch (e) {
        alert("حدث خطأ أثناء الحفظ");
    } finally {
        setLoading(false);
    }
  }

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("folder", "branding");
      
      try {
          const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (data.success) {
            setConfig({ ...config, branding: { ...config.branding, logoUrl: data.path } });
          } else {
              alert("فشل رفع الشعار");
          }
      } catch (e) {
          alert("خطأ في الاتصال");
      } finally {
          setUploading(false);
      }
    }
  }

  if (!config) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Settings className="text-zinc-400" size={32} />
            الإعدادات العامة
          </h2>
          <p className="text-zinc-400 mt-1">تخصيص المنصة وإعدادات النظام</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-bold disabled:opacity-50"
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Info */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-white font-bold">
            <Globe className="text-blue-500" />
            الهوية البصرية
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">اسم المنصة</label>
              <input 
                type="text" 
                value={config.branding.siteName} 
                onChange={e => setConfig({...config, branding: {...config.branding, siteName: e.target.value}})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">وصف المنصة</label>
              <textarea 
                value={config.branding.description}
                onChange={e => setConfig({...config, branding: {...config.branding, description: e.target.value}})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 h-24" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">شعار المنصة (Logo)</label>
              <div className="flex flex-col gap-4">
                {config.branding.logoUrl && (
                  <div className="relative w-fit group">
                      <img src={config.branding.logoUrl} alt="Logo" className="h-16 w-auto bg-zinc-800 rounded-lg p-2 border border-zinc-700" />
                      <button 
                        onClick={() => setConfig({...config, branding: {...config.branding, logoUrl: null}})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="حذف الشعار"
                      >
                          <span className="sr-only">Delete</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                  </div>
                )}
                
                <div className="relative">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleUploadLogo} 
                        className="hidden" 
                        id="logo-upload"
                        disabled={uploading}
                    />
                    <label 
                        htmlFor="logo-upload"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-all cursor-pointer ${
                            uploading 
                            ? "bg-zinc-900 border-zinc-700 text-zinc-500 cursor-wait" 
                            : "bg-zinc-950 border-zinc-800 hover:border-blue-500 hover:bg-blue-500/5 text-zinc-400 hover:text-blue-400"
                        }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span className="text-sm">جاري الرفع...</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud size={20} />
                                <span className="text-sm">اختر ملف صورة (PNG, JPG)</span>
                            </>
                        )}
                    </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server & Maintenance */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-white font-bold">
            <Server className="text-emerald-500" />
            حالة السيرفر
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <div className="text-white font-bold text-sm">وضع الصيانة</div>
                <div className="text-xs text-zinc-500">إيقاف جميع الألعاب مؤقتاً</div>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={config.features.maintenanceMode}
                  onChange={e => setConfig({...config, features: {...config.features, maintenanceMode: e.target.checked}})}
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div>
                <div className="text-white font-bold text-sm">التسجيل الجديد</div>
                <div className="text-xs text-zinc-500">السماح بتسجيل مستخدمين جدد</div>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={config.features.allowRegistration}
                  onChange={e => setConfig({...config, features: {...config.features, allowRegistration: e.target.checked}})}
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-white font-bold">
            <Shield className="text-red-500" />
            الأمان والحماية
          </div>
          <div className="space-y-4">
             {/* Security Settings Placeholder */}
             <div className="p-4 text-center text-zinc-500 text-sm bg-zinc-950 rounded-xl border border-zinc-800 border-dashed">
               إعدادات الحماية المتقدمة (قريباً)
             </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 text-white font-bold">
            <CreditCard className="text-amber-500" />
            بوابات الدفع
          </div>
          <div className="space-y-4">
             {/* Payment Settings Placeholder */}
             <div className="p-4 text-center text-zinc-500 text-sm bg-zinc-950 rounded-xl border border-zinc-800 border-dashed">
               إعدادات الدفع (Stripe / PayPal)
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
