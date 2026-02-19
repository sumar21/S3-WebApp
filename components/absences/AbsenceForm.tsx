
import React, { useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Combobox } from '../ui/Combobox';

interface AbsenceFormProps {
    form: {
        dateFrom: string;
        timeRange: string;
        reason: string;
    };
    setForm: React.Dispatch<React.SetStateAction<{
        dateFrom: string;
        timeRange: string;
        reason: string;
    }>>;
    isSubmitting: boolean;
    onReport: () => void;
}

export const AbsenceForm: React.FC<AbsenceFormProps> = ({
    form,
    setForm,
    isSubmitting,
    onReport
}) => {
    const isWeekend = (dateString: string) => {
        if (!dateString) return false;
        // Date string from DatePicker is YYYY-MM-DD
        const date = new Date(dateString + 'T00:00:00');
        const day = date.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
        return day === 5 || day === 6 || day === 0;
    };

    useEffect(() => {
        if (form.dateFrom && !isWeekend(form.dateFrom)) {
            setForm(prev => ({ ...prev, timeRange: '20:00 - 08:00' }));
        }
    }, [form.dateFrom, setForm]);

    const timeOptions = [
        { value: '20:00 - 08:00', label: '20:00 - 08:00 (Noche)' },
        ...(isWeekend(form.dateFrom) ? [{ value: '08:00 - 20:00', label: '08:00 - 20:00 (Día)' }] : [])
    ];

    const handleFieldChange = (name: string, value: string) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const isFormValid = form.dateFrom && form.reason.trim().length > 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col flex-1 max-w-3xl mx-auto w-full">
            <div className="bg-white rounded-[24px] p-6 md:p-10 border border-gray-200 shadow-sm space-y-8 flex-1">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-[#135D54]">Reportar nueva inasistencia</h2>
                    <p className="text-sm text-gray-500">Selecciona el día de tu guardia para notificar la ausencia.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DatePicker
                        label="Fecha desde"
                        value={form.dateFrom}
                        onChange={(val) => handleFieldChange('dateFrom', val)}
                    />
                    <div className="space-y-2 opacity-60">
                        <label className="text-sm font-medium leading-none text-gray-700">Fecha hasta</label>
                        <div className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                            {form.dateFrom || 'Seleccionar fecha'}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Combobox
                        label="Franja horaria"
                        options={timeOptions}
                        value={form.timeRange}
                        onChange={(val) => handleFieldChange('timeRange', val)}
                        searchable={false}
                    />
                    {!isWeekend(form.dateFrom) && form.dateFrom && (
                        <p className="text-[10px] text-gray-400 mt-1 ml-1 flex items-center gap-1">
                            <AlertCircle size={10} /> La franja diurna solo está disponible los fines de semana (Vie, Sáb, Dom).
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-gray-700">Motivo de la ausencia</label>
                    <textarea
                        placeholder="Describa el motivo de su inasistencia..."
                        className="w-full bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#135D54] min-h-[120px] resize-none transition-all hover:border-gray-300"
                        value={form.reason}
                        onChange={(e) => handleFieldChange('reason', e.target.value)}
                    />
                </div>

                <div className="pt-4">
                    <Button
                        disabled={!isFormValid || isSubmitting}
                        className="w-full bg-[#135D54] hover:bg-[#0e453e] text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-[#135D54]/10 transition-all active:scale-[0.98] border-none disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400"
                        onClick={onReport}
                    >
                        {isSubmitting ? "Procesando..." : "Confirmar y Reportar Ausencia"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
