import React, { useState, useEffect } from 'react';
import { RECORDING_FORMATS, RECORDING_QUALITY } from '../utils/mixer';

const RecordingControls = ({ recorder, isRecording, onRecordingStart, onRecordingStop }) => {
  const [duration, setDuration] = useState(0);
  const [recordingName, setRecordingName] = useState('Mix Recording');
  const [supportedFormats, setSupportedFormats] = useState([]);
  const [currentFormat, setCurrentFormat] = useState(null);
  const [currentQuality, setCurrentQuality] = useState(null);

  useEffect(() => {
    if (recorder) {
      setSupportedFormats(recorder.getSupportedFormats());
      setCurrentFormat(recorder.getFormat());
      setCurrentQuality(recorder.getQuality());
    }
  }, [recorder]);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecording = () => {
    setDuration(0);
    onRecordingStart();
  };

  const handleStopRecording = async () => {
    const result = await onRecordingStop();
    if (result) {
      const { blob, format } = result;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recordingName}${format.extension}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleFormatChange = (formatId) => {
    if (!isRecording && recorder) {
      recorder.setFormat(formatId);
      setCurrentFormat(recorder.getFormat());
    }
  };

  const handleQualityChange = (qualityId) => {
    if (!isRecording && recorder) {
      recorder.setQuality(qualityId);
      setCurrentQuality(recorder.getQuality());
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recording-controls">
      <h4>RECORDING</h4>
      <div className="recording-info">
        <input
          type="text"
          value={recordingName}
          onChange={(e) => setRecordingName(e.target.value)}
          placeholder="Recording Name"
          className="recording-name-input"
          disabled={isRecording}
        />
        <div className="recording-settings">
          <select
            value={currentFormat?.mimeType}
            onChange={(e) => handleFormatChange(e.target.value)}
            disabled={isRecording}
            className="format-selector"
          >
            {supportedFormats.map(format => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
          <select
            value={currentQuality?.name}
            onChange={(e) => handleQualityChange(e.target.value)}
            disabled={isRecording}
            className="quality-selector"
          >
            {Object.entries(RECORDING_QUALITY).map(([id, quality]) => (
              <option key={id} value={id}>
                {quality.name}
              </option>
            ))}
          </select>
        </div>
        <div className="recording-duration">
          {isRecording && (
            <>
              <span className="recording-indicator">●</span>
              <span>{formatDuration(duration)}</span>
            </>
          )}
        </div>
      </div>
      <div className="recording-buttons">
        <button
          className={`record-button ${isRecording ? 'active' : ''}`}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? '⏹' : '⏺'}
        </button>
      </div>
    </div>
  );
};

export default RecordingControls;