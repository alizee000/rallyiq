import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Side, PointEventDetails } from '../../domain/types';
import { useMatchStore } from '../../store/matchStore';
import { X, ChevronLeft } from 'lucide-react';

type Props = {
  side: Side;
  onClose: () => void;
};

type Step = 'outcome' | 'shot';

export default function PointAnnotationSheet({ side, onClose }: Props) {
  const { updateLastPoint } = useMatchStore();
  const [step, setStep] = useState<Step>('outcome');
  const [tempDetails, setTempDetails] = useState<PointEventDetails>({});
  
  const handleOutcomeSelect = (outcome: 'winner' | 'unforced_error' | 'forced_error') => {
    setTempDetails({ outcomeType: outcome });
    updateLastPoint({ outcomeType: outcome });
    setStep('shot');
  };

  const handleShotSelect = (shot: string) => {
    updateLastPoint({ ...tempDetails, shotType: shot });
    onClose();
  };

  const shotTypes = ['Smash', 'Drop', 'Clear', 'Drive', 'Net shot', 'Lift', 'Serve', 'Return'];
  const outcomes = [
    { label: 'Winner', type: 'winner', color: 'bg-lime-DEFAULT/20 text-lime-DEFAULT border-lime-DEFAULT/30 hover:bg-lime-DEFAULT/30' },
    { label: 'Unforced Error', type: 'unforced_error', color: 'bg-coral-DEFAULT/20 text-coral-DEFAULT border-coral-DEFAULT/30 hover:bg-coral-DEFAULT/30' },
    { label: 'Forced Error', type: 'forced_error', color: 'bg-amber-DEFAULT/20 text-amber-DEFAULT border-amber-DEFAULT/30 hover:bg-amber-DEFAULT/30' },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="glass-panel border-t border-black/10 rounded-t-[2.5rem] p-6 pb-12 min-h-[45vh] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-black/20 rounded-full mx-auto mb-6"></div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {step === 'shot' && (
                <button onClick={() => setStep('outcome')} className="p-1.5 bg-graphite-800 rounded-full text-graphite-300 hover:text-graphite-100 transition-colors">
                  <ChevronLeft size={20} />
                </button>
              )}
              <h3 className="text-xl font-display font-bold text-graphite-100 tracking-tight">
                {step === 'outcome' ? `Point to Side ${side}` : 'Select Shot'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 bg-graphite-800 rounded-full text-graphite-300 hover:text-graphite-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {step === 'outcome' && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                <p className="text-sm text-graphite-300 mb-2">How did the point end?</p>
                <div className="flex flex-col gap-3">
                  {outcomes.map(o => (
                    <button 
                      key={o.label}
                      className={`py-4 px-5 rounded-2xl text-base font-bold transition-all border active:scale-95 text-left ${o.color}`}
                      onClick={() => handleOutcomeSelect(o.type)}
                    >
                      {o.label}
                    </button>
                  ))}
                  <button 
                    className="py-4 px-5 rounded-2xl text-base font-bold transition-all border active:scale-95 text-center bg-graphite-800 text-graphite-100 border-black/10 hover:bg-graphite-700 mt-2"
                    onClick={onClose}
                  >
                    Done (No Details)
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'shot' && (
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                <p className="text-sm text-graphite-300 mb-2">
                  {tempDetails.outcomeType === 'winner' ? 'Which shot won the point?' : 'Which shot caused the error?'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {shotTypes.map(shot => (
                    <button 
                      key={shot}
                      className="bg-graphite-800/80 hover:bg-graphite-700 py-4 px-4 rounded-2xl text-sm font-bold text-graphite-100 transition-colors text-center border border-black/5 active:scale-95"
                      onClick={() => handleShotSelect(shot)}
                    >
                      {shot}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
