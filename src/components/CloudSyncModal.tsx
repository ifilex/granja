import React, { useState } from 'react';
import { FarmState } from '../types/game';
import { exportEncryptedBackup, importEncryptedBackup } from '../utils/storage';
import { soundManager } from '../utils/audio';
import { Cloud, ShieldCheck, Copy, Download, Upload, Check, RefreshCw, Key } from 'lucide-react';

interface CloudSyncModalProps {
  state: FarmState;
  onClose: () => void;
  onRestoreState: (restoredState: FarmState) => void;
  isOnline: boolean;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  state,
  onClose,
  onRestoreState,
  isOnline,
}) => {
  const [backupCode, setBackupCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleGenerateBackup = () => {
    soundManager.playClick();
    const code = exportEncryptedBackup(state);
    setBackupCode(code);
  };

  const handleCopy = () => {
    if (!backupCode) return;
    navigator.clipboard.writeText(backupCode);
    setCopied(true);
    soundManager.playCoin();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const code = backupCode || exportEncryptedBackup(state);
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `granja_valle_dorado_backup_${Date.now()}.vdcloud`;
    link.click();
    URL.revokeObjectURL(url);
    soundManager.playCoin();
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(false);
    if (!importInput.trim()) {
      setImportError('Por favor pega el código de respaldo.');
      return;
    }
    const restored = importEncryptedBackup(importInput.trim());
    if (restored) {
      soundManager.playLevelUp();
      setImportSuccess(true);
      setTimeout(() => {
        onRestoreState(restored);
        onClose();
      }, 1000);
    } else {
      setImportError('Código inválido o corrupto. Verifica haber copiado el texto completo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-800/90 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                Sincronización en la Nube y Seguridad
              </h3>
              <p className="text-xs text-amber-300">
                Copia de respaldo cifrada de extremo a extremo (E2E)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-300 flex items-center justify-center font-bold text-lg border border-amber-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Online/Offline Status Banner */}
          <div className="bg-amber-950/70 border border-amber-800/80 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-amber-100">
                  {isOnline ? 'Conectado a Servidores en la Nube' : 'Modo Offline Activo'}
                </h4>
                <p className="text-[11px] text-amber-300">
                  {isOnline
                    ? 'Tus datos se guardan localmente y se respaldan en la nube.'
                    : 'Puedes jugar sin internet; el progreso se guardará en tu móvil.'}
                </p>
              </div>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          </div>

          {/* Section 1: Export Backup Code */}
          <div className="bg-amber-950/80 border border-amber-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-yellow-400" />
              <h4 className="font-black text-xs sm:text-sm text-amber-100">
                Generar Clave de Copia de Seguridad
              </h4>
            </div>
            <p className="text-xs text-amber-300">
              Genera un código cifrado único para transferir tu granja a otro teléfono o navegador.
            </p>

            {!backupCode ? (
              <button
                onClick={handleGenerateBackup}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black py-2.5 rounded-xl shadow active:scale-95 transition"
              >
                Generar Código Cifrado Ahora
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={backupCode}
                  className="w-full h-20 bg-amber-950/90 border border-amber-700 rounded-xl p-2 text-[10px] font-mono text-amber-200 resize-none focus:outline-none select-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 bg-amber-700 hover:bg-amber-600 text-amber-100 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar Clave'}</span>
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="flex-1 bg-amber-800 hover:bg-amber-700 text-amber-100 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Archivo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Import Backup Code */}
          <div className="bg-amber-950/80 border border-amber-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-400" />
              <h4 className="font-black text-xs sm:text-sm text-amber-100">
                Restaurar Granja desde Otra Copia
              </h4>
            </div>
            <textarea
              placeholder="Pega aquí tu clave VD_CLOUD_..."
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              className="w-full h-16 bg-amber-950/90 border border-amber-700 rounded-xl p-2 text-xs font-mono text-amber-200 placeholder-amber-500/50 resize-none focus:outline-none"
            />

            {importError && (
              <p className="text-xs text-red-400 font-bold">{importError}</p>
            )}

            {importSuccess && (
              <p className="text-xs text-emerald-400 font-bold">
                ✓ ¡Granja restaurada con éxito! Cargando datos...
              </p>
            )}

            <button
              onClick={handleImport}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-amber-950 font-black py-2.5 rounded-xl shadow active:scale-95 transition"
            >
              Restaurar Granja en este Dispositivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
