import React from 'react';

type AppDetailPageProps = {
  appId: string;
  onBack: () => void;
  onShowSimilarApps?: () => void;
  onOpenSearch?: () => void;
  onOrgClick?: (orgName: string) => void;
  onAppClick?: (appId: string) => void;
};

export default function AppDetailPage({
  appId,
  onBack,
  onShowSimilarApps,
  onOpenSearch,
  onOrgClick,
  onAppClick,
}: AppDetailPageProps) {
  const handlePrimaryAction = () => {
    if (onShowSimilarApps) {
      onShowSimilarApps();
      return;
    }
    onBack();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 bg-theme-bg text-theme-text text-center font-sans">
      <div className="max-w-md w-full rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-6 shadow-xl">
        <div className="mb-4 text-4xl" aria-hidden="true">📦</div>
        <h2 className="text-xl font-medium mb-2">App details are unavailable</h2>
        <p className="text-sm text-theme-text-muted mb-6">
          We couldn’t load the details for <span className="font-medium text-theme-text">{appId || 'this app'}</span> right now.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="px-6 py-2.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] dark:bg-[#a8c7fa] dark:hover:bg-[#d3e3fd] text-white dark:text-[#041e49] font-medium text-sm cursor-pointer shadow-xs"
          >
            {onShowSimilarApps ? 'View Similar Apps' : 'Back to Store'}
          </button>
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="px-4 py-2.5 rounded-full border border-[color:var(--theme-border)] text-theme-text hover:bg-[color:var(--theme-hover)] font-medium text-sm cursor-pointer"
            >
              Search
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
