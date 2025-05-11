import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlaylistManager as PlaylistManagerClass } from '../utils/playlist';

const PlaylistManager = ({ library }) => {
  const [manager] = useState(() => new PlaylistManagerClass());
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    setPlaylists(manager.getPlaylists());
    setCurrentPlaylist(manager.getCurrentPlaylist());
  }, []);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const playlist = manager.createPlaylist(newPlaylistName.trim());
      setPlaylists(manager.getPlaylists());
      setCurrentPlaylist(playlist);
      setIsCreating(false);
      setNewPlaylistName('');
    }
  };

  const handleDeletePlaylist = (id) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      manager.deletePlaylist(id);
      setPlaylists(manager.getPlaylists());
      if (currentPlaylist?.id === id) {
        setCurrentPlaylist(null);
      }
    }
  };

  const handleSelectPlaylist = (playlist) => {
    manager.setCurrentPlaylist(playlist.id);
    setCurrentPlaylist(playlist);
  };

  const handleAddTrack = (track) => {
    if (currentPlaylist) {
      manager.addTrack(currentPlaylist.id, track);
      setPlaylists(manager.getPlaylists());
      setCurrentPlaylist(manager.getCurrentPlaylist());
    }
  };

  const handleRemoveTrack = (trackId) => {
    if (currentPlaylist) {
      manager.removeTrack(currentPlaylist.id, trackId);
      setPlaylists(manager.getPlaylists());
      setCurrentPlaylist(manager.getCurrentPlaylist());
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination || !currentPlaylist) return;

    manager.moveTrack(
      currentPlaylist.id,
      result.source.index,
      result.destination.index
    );
    setPlaylists(manager.getPlaylists());
    setCurrentPlaylist(manager.getCurrentPlaylist());
  };

  const handleAnalyzePlaylist = () => {
    if (currentPlaylist) {
      const analysis = manager.analyzePlaylist(currentPlaylist.id);
      setAnalysis(analysis);
      setShowAnalysis(true);
    }
  };

  const handleExportPlaylist = (format) => {
    if (currentPlaylist) {
      const data = manager.exportPlaylist(currentPlaylist.id, format);
      if (data) {
        const blob = new Blob([data], { 
          type: format === 'json' ? 'application/json' :
                format === 'm3u' ? 'audio/x-mpegurl' :
                'text/csv'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentPlaylist.name}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const filteredPlaylists = searchQuery ?
    manager.searchPlaylists(searchQuery) :
    playlists;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playlist-manager">
      <div className="playlist-sidebar">
        <div className="playlist-header">
          <h4>PLAYLISTS</h4>
          <button
            className="create-button"
            onClick={() => setIsCreating(true)}
          >
            +
          </button>
        </div>
        <input
          type="text"
          className="playlist-search"
          placeholder="Search playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isCreating && (
          <div className="create-playlist">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              autoFocus
            />
            <div className="create-actions">
              <button onClick={handleCreatePlaylist}>Create</button>
              <button onClick={() => setIsCreating(false)}>Cancel</button>
            </div>
          </div>
        )}
        <div className="playlist-list">
          {filteredPlaylists.map(playlist => (
            <div
              key={playlist.id}
              className={`playlist-item ${currentPlaylist?.id === playlist.id ? 'active' : ''}`}
              onClick={() => handleSelectPlaylist(playlist)}
            >
              <div className="playlist-info">
                <span className="playlist-name">{playlist.name}</span>
                <span className="playlist-stats">
                  {playlist.trackCount} tracks · {formatDuration(playlist.duration)}
                </span>
              </div>
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="playlist-content">
        {currentPlaylist ? (
          <>
            <div className="playlist-toolbar">
              <h3>{currentPlaylist.name}</h3>
              <div className="playlist-actions">
                <button onClick={handleAnalyzePlaylist}>
                  Analyze
                </button>
                <div className="export-dropdown">
                  <button className="export-button">
                    Export
                  </button>
                  <div className="export-menu">
                    <button onClick={() => handleExportPlaylist('json')}>
                      JSON
                    </button>
                    <button onClick={() => handleExportPlaylist('m3u')}>
                      M3U
                    </button>
                    <button onClick={() => handleExportPlaylist('csv')}>
                      CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="playlist-tracks">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="playlist-tracks"
                  >
                    {manager.getTracks(currentPlaylist.id).map((track, index) => (
                      <Draggable
                        key={track.id}
                        draggableId={track.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`track-item ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <span className="track-number">{index + 1}</span>
                            <span className="track-name">{track.name}</span>
                            <span className="track-duration">
                              {formatDuration(track.duration)}
                            </span>
                            <button
                              className="remove-track"
                              onClick={() => handleRemoveTrack(track.id)}
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {showAnalysis && analysis && (
              <div className="playlist-analysis">
                <div className="analysis-header">
                  <h4>PLAYLIST ANALYSIS</h4>
                  <button
                    className="close-analysis"
                    onClick={() => setShowAnalysis(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="analysis-content">
                  <div className="analysis-stat">
                    <span className="stat-label">Average BPM</span>
                    <span className="stat-value">
                      {Math.round(analysis.avgBpm)}
                    </span>
                  </div>
                  <div className="analysis-stat">
                    <span className="stat-label">Total Duration</span>
                    <span className="stat-value">
                      {formatDuration(analysis.totalDuration)}
                    </span>
                  </div>
                  <div className="key-distribution">
                    <h5>Key Distribution</h5>
                    <div className="key-grid">
                      {Object.entries(analysis.keyDistribution).map(([key, count]) => (
                        <div key={key} className="key-item">
                          <span className="key-name">{key}</span>
                          <span className="key-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="energy-profile">
                    <h5>Energy Profile</h5>
                    <div className="energy-bars">
                      {Object.entries(analysis.energyProfile).map(([band, energy]) => (
                        <div key={band} className="energy-bar">
                          <span className="band-name">{band}</span>
                          <div className="band-meter">
                            <div
                              className="band-fill"
                              style={{ width: `${energy * 100}%` }}
                            />
                          </div>
                          <span className="band-value">
                            {Math.round(energy * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="playlist-empty">
            <h3>Select a playlist</h3>
            <p>or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistManager;