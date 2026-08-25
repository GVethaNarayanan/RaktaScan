import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Settings() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('raktascan-lang', lang)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{t('settings.title')}</h1>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-4">
        {/* Language */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            {t('settings.language')}
          </h3>
          <div className="space-y-2">
            {[
              { code: 'en', name: 'English', native: 'English' },
              { code: 'hi', name: 'Hindi', native: 'हिंदी' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-rakta-600/10 border border-rakta-500/30 text-rakta-300'
                    : 'bg-gray-800/50 border border-gray-800 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.code === 'en' ? '🇬🇧' : '🇮🇳'}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium">{lang.native}</p>
                    <p className="text-xs text-gray-500">{lang.name}</p>
                  </div>
                </div>
                {i18n.language === lang.code && (
                  <svg className="w-5 h-5 text-rakta-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            {t('settings.about')}
          </h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>{t('settings.version')}</span>
              <span className="font-mono text-gray-500">0.1.0-prototype</span>
            </div>
            <div className="flex justify-between">
              <span>Model</span>
              <span className="font-mono text-gray-500">MobileNetV3</span>
            </div>
            <div className="flex justify-between">
              <span>Inference</span>
              <span className="font-mono text-gray-500">ONNX Runtime Web</span>
            </div>
            <hr className="border-gray-800" />
            <div>
              <p className="font-medium text-gray-300 mb-1">Team Duo Tech</p>
              <p className="text-xs text-gray-500">Vetha Narayanan G · Akshaya I</p>
            </div>
          </div>
        </div>

        {/* Responsible AI */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Responsible AI
          </h3>
          <ul className="space-y-2 text-xs text-gray-400 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-medical-400 mt-0.5">•</span>
              RaktaScan is a screening/triage aid, NOT a diagnostic device
            </li>
            <li className="flex items-start gap-2">
              <span className="text-medical-400 mt-0.5">•</span>
              Screening results should not replace clinical hemoglobin testing
            </li>
            <li className="flex items-start gap-2">
              <span className="text-medical-400 mt-0.5">•</span>
              All image processing happens on-device for privacy
            </li>
            <li className="flex items-start gap-2">
              <span className="text-medical-400 mt-0.5">•</span>
              No personal health data is transmitted without consent
            </li>
            <li className="flex items-start gap-2">
              <span className="text-medical-400 mt-0.5">•</span>
              No fabricated model performance metrics are presented
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
