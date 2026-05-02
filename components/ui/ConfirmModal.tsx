'use client'

import * as AlertDialog from '@radix-ui/react-alert-dialog'

interface Props {
    open: boolean
    onConfirm: () => void
    onCancel: () => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
}

export default function ConfirmModal({
    open, onConfirm, onCancel, title, description,
    confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'default',
}: Props) {
    return (
        <AlertDialog.Root open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
                <AlertDialog.Content className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">
                    <AlertDialog.Title className="text-lg font-black text-foreground">
                        {title}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {description}
                    </AlertDialog.Description>
                    <div className="flex justify-end gap-3 mt-6">
                        <AlertDialog.Cancel asChild>
                            <button className="px-4 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary/80 border border-border/60 transition-all">
                                {cancelLabel}
                            </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button
                                onClick={onConfirm}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md ${variant === 'danger'
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25'
                                }`}
                            >
                                {confirmLabel}
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    )
}
