// Playlist management
export class PlaylistManager {
  constructor() {
    this.playlists = new Map();
    this.currentPlaylist = null;
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('playlists');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach(playlist => {
          this.playlists.set(playlist.id, {
            ...playlist,
            tracks: new Set(playlist.tracks)
          });
        });
      }

      const currentId = localStorage.getItem('currentPlaylist');
      if (currentId) {
        this.currentPlaylist = this.playlists.get(currentId) || null;
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }

  saveToStorage() {
    try {
      const data = Array.from(this.playlists.values()).map(playlist => ({
        ...playlist,
        tracks: Array.from(playlist.tracks)
      }));
      localStorage.setItem('playlists', JSON.stringify(data));
      
      if (this.currentPlaylist) {
        localStorage.setItem('currentPlaylist', this.currentPlaylist.id);
      } else {
        localStorage.removeItem('currentPlaylist');
      }
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  }

  createPlaylist(name, description = '') {
    const id = crypto.randomUUID();
    const playlist = {
      id,
      name,
      description,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tracks: new Set(),
      duration: 0,
      trackCount: 0
    };
    
    this.playlists.set(id, playlist);
    this.saveToStorage();
    return playlist;
  }

  deletePlaylist(id) {
    if (this.currentPlaylist?.id === id) {
      this.currentPlaylist = null;
    }
    this.playlists.delete(id);
    this.saveToStorage();
  }

  updatePlaylist(id, updates) {
    const playlist = this.playlists.get(id);
    if (playlist) {
      Object.assign(playlist, {
        ...updates,
        modified: new Date().toISOString()
      });
      this.saveToStorage();
    }
  }

  setCurrentPlaylist(id) {
    this.currentPlaylist = this.playlists.get(id) || null;
    this.saveToStorage();
  }

  getCurrentPlaylist() {
    return this.currentPlaylist;
  }

  getPlaylists() {
    return Array.from(this.playlists.values());
  }

  addTrack(playlistId, track) {
    const playlist = this.playlists.get(playlistId);
    if (playlist) {
      playlist.tracks.add(track.id);
      playlist.duration += track.duration || 0;
      playlist.trackCount = playlist.tracks.size;
      playlist.modified = new Date().toISOString();
      this.saveToStorage();
    }
  }

  removeTrack(playlistId, trackId) {
    const playlist = this.playlists.get(playlistId);
    if (playlist) {
      const track = Array.from(playlist.tracks).find(t => t.id === trackId);
      if (track) {
        playlist.tracks.delete(track.id);
        playlist.duration -= track.duration || 0;
        playlist.trackCount = playlist.tracks.size;
        playlist.modified = new Date().toISOString();
        this.saveToStorage();
      }
    }
  }

  moveTrack(playlistId, fromIndex, toIndex) {
    const playlist = this.playlists.get(playlistId);
    if (playlist) {
      const tracks = Array.from(playlist.tracks);
      const [track] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, track);
      playlist.tracks = new Set(tracks);
      playlist.modified = new Date().toISOString();
      this.saveToStorage();
    }
  }

  getTracks(playlistId) {
    const playlist = this.playlists.get(playlistId);
    return playlist ? Array.from(playlist.tracks) : [];
  }

  searchPlaylists(query) {
    query = query.toLowerCase();
    return Array.from(this.playlists.values()).filter(playlist =>
      playlist.name.toLowerCase().includes(query) ||
      playlist.description.toLowerCase().includes(query)
    );
  }

  // Smart playlist features
  createSmartPlaylist(name, filters) {
    const playlist = this.createPlaylist(name);
    playlist.isSmartPlaylist = true;
    playlist.filters = filters;
    this.saveToStorage();
    return playlist;
  }

  updateSmartPlaylist(id, filters) {
    const playlist = this.playlists.get(id);
    if (playlist?.isSmartPlaylist) {
      playlist.filters = filters;
      playlist.modified = new Date().toISOString();
      this.saveToStorage();
    }
  }

  // Filter types for smart playlists
  static FILTER_TYPES = {
    BPM_RANGE: 'bpm_range',
    KEY_MATCH: 'key_match',
    ENERGY_LEVEL: 'energy_level',
    RECENTLY_ADDED: 'recently_added',
    MOST_PLAYED: 'most_played',
    GENRE: 'genre',
    DURATION: 'duration'
  };

  // Apply smart playlist filters
  applyFilters(tracks, filters) {
    return tracks.filter(track => {
      for (const filter of filters) {
        switch (filter.type) {
          case PlaylistManager.FILTER_TYPES.BPM_RANGE:
            if (track.bpm < filter.min || track.bpm > filter.max) {
              return false;
            }
            break;

          case PlaylistManager.FILTER_TYPES.KEY_MATCH:
            if (!filter.keys.includes(track.key)) {
              return false;
            }
            break;

          case PlaylistManager.FILTER_TYPES.ENERGY_LEVEL:
            const energy = Object.values(track.energy || {})
              .reduce((sum, band) => sum + band.energy, 0) / 6;
            if (energy < filter.min || energy > filter.max) {
              return false;
            }
            break;

          case PlaylistManager.FILTER_TYPES.RECENTLY_ADDED:
            const addedDate = new Date(track.added);
            const daysAgo = (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysAgo > filter.days) {
              return false;
            }
            break;

          case PlaylistManager.FILTER_TYPES.MOST_PLAYED:
            if (track.playCount < filter.minPlays) {
              return false;
            }
            break;

          case PlaylistManager.FILTER_TYPES.GENRE:
            if (!track.genre || !filter.genres.includes(track.genre)) {
              return false;
            }
            break;

          case PlaylistManager.FILTER_TYPES.DURATION:
            if (track.duration < filter.min || track.duration > filter.max) {
              return false;
            }
            break;

          default:
            break;
        }
      }
      return true;
    });
  }

  // Playlist analysis
  analyzePlaylist(id) {
    const playlist = this.playlists.get(id);
    if (!playlist) return null;

    const tracks = Array.from(playlist.tracks);
    
    // Calculate average BPM
    const avgBpm = tracks.reduce((sum, track) => sum + (track.bpm || 0), 0) / tracks.length;
    
    // Find key distribution
    const keyDistribution = tracks.reduce((dist, track) => {
      if (track.key) {
        dist[track.key] = (dist[track.key] || 0) + 1;
      }
      return dist;
    }, {});
    
    // Calculate total duration
    const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    
    // Find energy profile
    const energyProfile = tracks.reduce((profile, track) => {
      if (track.energy) {
        Object.entries(track.energy).forEach(([band, data]) => {
          profile[band] = (profile[band] || 0) + data.energy;
        });
      }
      return profile;
    }, {});
    
    Object.keys(energyProfile).forEach(band => {
      energyProfile[band] /= tracks.length;
    });
    
    return {
      trackCount: tracks.length,
      totalDuration,
      avgBpm,
      keyDistribution,
      energyProfile
    };
  }

  // Export playlist
  exportPlaylist(id, format = 'json') {
    const playlist = this.playlists.get(id);
    if (!playlist) return null;

    switch (format) {
      case 'json':
        return JSON.stringify({
          ...playlist,
          tracks: Array.from(playlist.tracks)
        });

      case 'm3u':
        return Array.from(playlist.tracks)
          .map(track => track.path)
          .join('\n');

      case 'csv':
        const tracks = Array.from(playlist.tracks);
        const headers = ['name', 'duration', 'bpm', 'key', 'added'];
        const csv = [headers.join(',')];
        
        tracks.forEach(track => {
          csv.push(headers.map(header => {
            const value = track[header];
            return typeof value === 'string' ? `"${value}"` : value;
          }).join(','));
        });
        
        return csv.join('\n');

      default:
        return null;
    }
  }

  // Import playlist
  importPlaylist(data, format = 'json') {
    try {
      switch (format) {
        case 'json': {
          const playlist = JSON.parse(data);
          playlist.id = crypto.randomUUID();
          playlist.tracks = new Set(playlist.tracks);
          this.playlists.set(playlist.id, playlist);
          break;
        }

        case 'm3u': {
          const name = 'Imported Playlist';
          const playlist = this.createPlaylist(name);
          const tracks = data.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(path => ({ id: crypto.randomUUID(), path }));
          
          playlist.tracks = new Set(tracks.map(t => t.id));
          break;
        }

        case 'csv': {
          const [headers, ...rows] = data.split('\n');
          const name = 'Imported Playlist';
          const playlist = this.createPlaylist(name);
          
          const tracks = rows.map(row => {
            const values = row.split(',');
            const track = {};
            
            headers.split(',').forEach((header, i) => {
              const value = values[i];
              track[header] = value.startsWith('"') ? 
                value.slice(1, -1) : 
                Number(value);
            });
            
            track.id = crypto.randomUUID();
            return track;
          });
          
          playlist.tracks = new Set(tracks.map(t => t.id));
          break;
        }

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error importing playlist:', error);
      return false;
    }
  }
}