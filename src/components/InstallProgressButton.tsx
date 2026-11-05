import React from 'react';
import { Download } from 'lucide-react';
import { AppListing, AppDetails } from '../types';
import { getAppActionFileLabel } from '../services/osDetectionService';
import { extractExactPackageFileName, getDirectDownloadUrl } from '../context/InstallContext';

export type LoadingStyleVariant = 
  | 'tonal-brand'
  | 'solid-brand'
  | 'deep-contrast'
  | 'outline-minimal'
  | 'glass-glow';

interface InstallProgressButtonProps {
  app: AppListing | AppDetails;
  resolvedPlatform?: string;
  onDownload?: () => void;
  className?: string;
  [key: string]: any;
}

/**
 * Direct Download Button:
 * Directly points to the download URL with target !== '_blank' (target="_self"),
 * executing instant on-page native browser download straight from CDN without opening a blank tab.
 */
export const InstallProgressButton: React.FC<InstallProgressButtonProps> = ({
  app,
  resolvedPlatform,
  onDownload,
  className = ''
}) => {
  const label = getAppActionFileLabel(app as any, resolvedPlatform);
  const directUrl = getDirectDownloadUrl(app.downloadUrl, app.assetName, resolvedPlatform) || (app.downloadUrl && app.downloadUrl !== '#' ? app.downloadUrl : '');
  const fileName = extractExactPackageFileName(directUrl, app.assetName) || app.assetName || '';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
    }
  };

  const buttonClasses = `h-11 px-6 bg-[#0b57d0] hover:bg-[#0842a0] text-white dark:bg-[#a8c7fa] dark:hover:bg-[#d3e3fd] dark:text-[#041e49] font-medium font-google-sans rounded-full text-sm sm:text-base transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer select-none border-0 no-underline ${className}`;

  if (directUrl) {
    return (
      <a
        href={directUrl}
        download={fileName || true}
        target="_self"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={buttonClasses}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonClasses}
    >
      <Download className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
