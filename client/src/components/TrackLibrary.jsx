import React, { useState, useEffect } from 'react';
import { SUPPORTED_FORMATS } from '../utils/mixer';

const TrackLibrary = ({ library, onTrackSelect, activeDeck }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    updateTracks();
  }, [library, searchQuery, sortBy, sortOrder]);

  const updateTracks = () => {
    let filteredTracks = searchQuery ? 
      library.searchTracks(searchQuery) : 
      library.getTracks();

    // Sort tracks
    filteredTracks.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      if (sortBy === 'added' || sortBy === 'lastPlayed') {
        valueA = new Date(valueA || 0);
        valueB = new Date(valueB || 0);
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setTracks(filteredTracks);
  };

  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDragStart = (e, track) => {
    e.dataTransfer.setData('text/plain', track.id);
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    
    const files = Array.from(e.dataTransfer.files)
      .filter(file => 
        SUPPORTED_FORMATS.some(format => 
          file.name.toLowerCase().endsWith(format)
        )
      );
    
    for (const file of files) {
      library.addTrack(file);
    }
    
    updateTracks();
  };

  return (
    <div 
      className="track-library"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      <div className="library-header">
        <h4>TRACK LIBRARY</h4>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tracks..."
          className="library-search"
        />
      </div>
      <div className="library-table">
        <div className="table-header">
          <div onClick={() => handleSort('name')}>Name</div>
          <div onClick={() => handleSort('bpm')}>BPM</div>
          <div onClick={() => handleSort('key')}>Key</div>
          <div onClick={() => handleSort('duration')}>Time</div>
          <div onClick={() => handleSort('added')}>Added</div>
        </div>
        <div className="table-body">
          {tracks.map(track => (
            <div
              key={track.id}
              className="table-row"
              draggable
              onDragStart={(e) => handleDragStart(e, track)}
              onDoubleClick={() => onTrackSelect(track, activeDeck)}
            >
              <div className="track-name">{track.name}</div>
              <div>{track.bpm || '-'}</div>
              <div>{track.key || '-'}</div>
              <div>{track.duration ? formatDuration(track.duration) : '-'}</div>
              <div>{new Date(track.added).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="library-footer">
        <span>{tracks.length} tracks</span>
        <span className="library-hint">Drag files here to import</span>
      </div>
    </div>
  );
};

export default TrackLibrary;