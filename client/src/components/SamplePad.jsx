import React, { useState, useEffect } from 'react';
import { SAMPLE_BANKS, SampleBankManager, playSample } from '../utils/mixer';

const SamplePad = () => {
  const [bankManager] = useState(() => new SampleBankManager());
  const [currentBank, setCurrentBank] = useState(bankManager.getCurrentBank());
  const [samples, setSamples] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load samples for current bank
  useEffect(() => {
    const loadSamples = async () => {
      setIsLoading(true);
      const loadedSamples = {};
      
      try {
        for (const name of Object.keys(currentBank.samples)) {
          loadedSamples[name] = await bankManager.loadSample(name);
        }
        setSamples(loadedSamples);
      } catch (error) {
        console.error('Error loading samples:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSamples();
  }, [currentBank]);

  const handleBankChange = (bankId) => {
    bankManager.setCurrentBank(bankId);
    setCurrentBank(bankManager.getCurrentBank());
  };

  const handlePadTrigger = (name) => {
    const buffer = samples[name];
    if (buffer) {
      playSample(buffer);
    }
  };

  const handleKeyDown = (event, name) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handlePadTrigger(name);
    }
  };

  return (
    <div className="sample-pads">
      <div className="sample-bank-header">
        <h4>SAMPLE BANK</h4>
        <select
          value={currentBank.id}
          onChange={(e) => handleBankChange(e.target.value)}
          className="bank-selector"
        >
          {Object.entries(SAMPLE_BANKS).map(([id, bank]) => (
            <option key={id} value={id}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>
      <div className="pad-grid">
        {Object.keys(currentBank.samples).map((name) => (
          <button
            key={name}
            className={`pad-button ${isLoading ? 'loading' : ''}`}
            onClick={() => handlePadTrigger(name)}
            onKeyDown={(e) => handleKeyDown(e, name)}
            disabled={isLoading}
            tabIndex={0}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SamplePad;