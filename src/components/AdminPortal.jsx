import React, { useState } from 'react';
import { MapPin, Shield, Building2, Globe } from 'lucide-react';
import { SiteManagement } from './SiteManagement';

const TABS = [
  { key: 'sites', icon: MapPin },
  { key: 'overview', icon: Globe }
];

export const UnitAdminPortal = ({ t, isRtl, lang }) => {
  const [activeTab, setActiveTab] = useState('sites');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-green-600" />
          {t.unitAdmin}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t.siteManagement}</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.key === 'sites' ? t.sites : tab.key === 'overview' ? t.analytics : tab.key}
            </button>
          );
        })}
      </div>

      {activeTab === 'sites' && <SiteManagement t={t} isRtl={isRtl} />}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Globe className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">{t.siteManagement}</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {t.noSitesYet}
          </p>
        </div>
      )}
    </div>
  );
};

export const SystemAdminPortal = ({ t, isRtl, lang }) => {
  const [activeTab, setActiveTab] = useState('sites');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-7 h-7 text-indigo-600" />
          {t.systemAdmin}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t.siteManagement}</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.key === 'sites' ? t.sites : tab.key === 'overview' ? t.analytics : tab.key}
            </button>
          );
        })}
      </div>

      {activeTab === 'sites' && <SiteManagement t={t} isRtl={isRtl} />}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Globe className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">{t.siteManagement}</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {t.noSitesYet}
          </p>
        </div>
      )}
    </div>
  );
};
