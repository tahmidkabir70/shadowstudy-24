import React from 'react';
import { AppData, AppSettings } from '../../types';
import { Volume2, VolumeX, Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../../utils/storage';

interface Props {
  data: AppData;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetData: () => void;
  onImportData: (data: AppData) => void;
}

export const SettingsScreen: React.FC<Props> = ({ data, onUpdateSettings, onResetData, onImportData }) => {
  const { settings } = data;

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importBackup(content);
      if (imported) {
        onImportData(imported);
        alert('Backup successfully imported!');
      } else {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="pro-card p-6">
        <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">SYSTEM CONFIGURATION</div>
        <h1 className="text-2xl font-bold text-white mt-1">Settings & Preferences</h1>
      </div>

      <div className="pro-card p-6 space-y-6 text-xs">
        {/* Language */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="text-white font-bold text-sm">LANGUAGE / ভাষা</div>
            <div className="text-slate-400">Choose interface language</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
              className={`px-4 py-2 rounded-lg border font-semibold cursor-pointer ${settings.language === 'en' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            >
              English
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, language: 'bn' })}
              className={`px-4 py-2 rounded-lg border font-semibold cursor-pointer ${settings.language === 'bn' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            >
              বাংলা
            </button>
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="text-white font-bold text-sm">SYSTEM AUDIO</div>
            <div className="text-slate-400">Enable Web Audio sound effects</div>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
            className={`px-4 py-2 rounded-lg border font-semibold flex items-center gap-2 cursor-pointer ${settings.soundEnabled ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {settings.soundEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Backup & Restore */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-white font-bold text-sm">DATA BACKUP & RESTORE</div>
            <div className="text-slate-400">Export or import your offline JSON backup</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportBackup(data)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Backup
            </button>
            <label className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Import Backup
              <input type="file" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Reset Data */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-red-400 font-bold text-sm">RESET SYSTEM DATA</div>
            <div className="text-red-400/70">Permanently clear all data and restart</div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                onResetData();
              }
            }}
            className="bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900 font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="pro-card p-6 text-center text-xs text-slate-400">
        Fan-inspired educational project. Not affiliated with Solo Leveling or its creators.
      </div>
    </div>
  );
};
